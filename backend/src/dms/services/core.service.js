/**
 * DMS core services: document numbering, tax computation, stock + serial
 * movements and party ledger postings.
 *
 * MongoDB multi-document transactions are not used because the local/dev
 * database is not guaranteed to be a replica set. Instead every flow validates
 * fully first (stock availability, serial ownership) and only then mutates, and
 * stock decrements are conditional atomic updates that cannot go negative.
 */
import { DmsCounter, DmsStock, DmsStockLedger, DmsSerial, DmsLedger } from '../models/txn.models.js';
import { DmsHsn, DmsProduct, LOCATION_TYPES } from '../models/master.models.js';

export class DmsError extends Error {
  constructor(message, statusCode = 422, errors) {
    super(message);
    this.name = 'DmsError';
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
  }
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export { round2 };

/* ───────────────────────── numbering ───────────────────────── */

/** Business timezone for calendar dates (attendance day, financial year). Default India. */
export const DMS_TZ = process.env.DMS_TIMEZONE || 'Asia/Kolkata';
/** YYYY-MM-DD of an instant in the business timezone (not UTC). */
export function localDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DMS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

/** Indian financial year label, e.g. 2026-11-19 → "26-27"; 2027-02-01 → "26-27". Uses the business timezone. */
export function fyLabel(date = new Date()) {
  const [y, m] = localDay(date).split('-').map(Number);
  const startYear = m >= 4 ? y : y - 1;
  const a = String(startYear % 100).padStart(2, '0');
  const b = String((startYear + 1) % 100).padStart(2, '0');
  return `${a}-${b}`;
}

export async function nextSeq(key) {
  const c = await DmsCounter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}

const pad = (n, w = 4) => String(n).padStart(w, '0');
const docPrefixOf = (loc) => (loc?.docPrefix || loc?.code || 'GEN').toUpperCase();

/** Location code: {IN|DE}{typeCode}{stateCode}{seq3}, e.g. INBRUP001. */
export async function nextLocationCode(locationType, stateCode) {
  const t = LOCATION_TYPES[locationType];
  const country = ['HO', 'BR'].includes(t) ? 'IN' : 'DE';
  const prefix = `${country}${t}${String(stateCode).toUpperCase()}`;
  return `${prefix}${pad(await nextSeq(`LOC:${prefix}`), 3)}`;
}

export async function nextPoNo(fromLocation, poType = 'LOCATION') {
  const tag = poType === 'VENDOR' ? 'VPO' : 'PO';
  return `${fromLocation.code}${tag}${await nextSeq(`${tag}:${fromLocation.code}`)}`;
}

const INVOICE_SERIES = {
  CORPORATE: 'INV',
  UPLOAD_BILLING: 'INV',
  RETAIL_LOCATION: 'INV',
  RETAIL_CUSTOMER: 'INV',
  STN: 'STN',
  JOBWORK: 'STN',
  PRN: 'PRN',
  CUSTOMER_RETURN: 'CRN',
  LOCAL_PURCHASE: 'LPR',
  VENDOR_RETURN: 'VRN',
  OPENING: 'OPN',
};

/** Invoice-type document number. INV series → AGR/26-27/0001; others → STN/26-27/AGR/0001. */
export async function nextInvoiceNo(kind, issuingLocation, date = new Date()) {
  const series = INVOICE_SERIES[kind];
  const p = docPrefixOf(issuingLocation);
  const fy = fyLabel(date);
  const seq = await nextSeq(`${series}:${p}:${fy}`);
  return series === 'INV' ? `${p}/${fy}/${pad(seq)}` : `${series}/${fy}/${p}/${pad(seq)}`;
}

export async function nextReceiptNo(kind, location, date = new Date()) {
  const series = kind === 'ADJUSTMENT' ? 'ADJ' : 'RECP';
  const p = docPrefixOf(location);
  const fy = fyLabel(date);
  return `${series}/${fy}/${p}/${pad(await nextSeq(`${series}:${p}:${fy}`))}`;
}

/* ───────────────────────── tax / totals ───────────────────────── */

/**
 * Compute line values and document totals server-side (client values are never trusted).
 * @param rawLines [{product, qty, price, discountPerUnit, reqQty, okQty, …}]
 * @param opts { interState: bool, applyTax: bool, roundOff: bool }
 */
export async function computeDocument(rawLines, { interState = false, applyTax = true, roundOff = false } = {}) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) throw new DmsError('At least one item is required');
  const ids = rawLines.map((l) => l.product);
  const products = await DmsProduct.find({ _id: { $in: ids } }).lean();
  const pmap = new Map(products.map((p) => [String(p._id), p]));
  const hsnCodes = [...new Set(products.map((p) => p.hsnCode).filter(Boolean))];
  const hsns = await DmsHsn.find({ hsnCode: { $in: hsnCodes } }).lean();
  const hmap = new Map(hsns.map((h) => [h.hsnCode, h]));

  const totals = { subTotal: 0, totalQty: 0, totalDiscount: 0, totalSgst: 0, totalCgst: 0, totalIgst: 0 };
  const lines = rawLines.map((l, i) => {
    const p = pmap.get(String(l.product));
    if (!p) throw new DmsError(`Item ${i + 1}: product not found`);
    const qty = Number(l.qty);
    const price = Number(l.price);
    const disc = Number(l.discountPerUnit || 0);
    if (!(qty > 0)) throw new DmsError(`Item ${i + 1}: quantity must be greater than 0`);
    if (!(price >= 0)) throw new DmsError(`Item ${i + 1}: invalid price`);
    if (disc < 0 || disc > price) throw new DmsError(`Item ${i + 1}: discount cannot exceed price`);
    const value = round2(qty * price);
    const afterDiscount = round2(qty * (price - disc));
    const h = applyTax ? hmap.get(p.hsnCode) : null;
    const sgstPer = h && !interState ? h.sgst : 0;
    const cgstPer = h && !interState ? h.cgst : 0;
    const igstPer = h && interState ? h.igst : 0;
    const sgstAmt = round2((afterDiscount * sgstPer) / 100);
    const cgstAmt = round2((afterDiscount * cgstPer) / 100);
    const igstAmt = round2((afterDiscount * igstPer) / 100);
    const total = round2(afterDiscount + sgstAmt + cgstAmt + igstAmt);
    totals.subTotal += value;
    totals.totalQty += qty;
    totals.totalDiscount += qty * disc;
    totals.totalSgst += sgstAmt;
    totals.totalCgst += cgstAmt;
    totals.totalIgst += igstAmt;
    return {
      ...l,
      product: p._id,
      productCode: p.productCode,
      productName: p.name,
      color: p.color,
      hsnCode: p.hsnCode,
      qty,
      price,
      value,
      discountPerUnit: disc,
      afterDiscount,
      sgstPer, sgstAmt, cgstPer, cgstAmt, igstPer, igstAmt,
      total,
      serials: (l.serials || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean),
      _isSerialized: p.isSerialized,
    };
  });
  for (const k of Object.keys(totals)) totals[k] = round2(totals[k]);
  totals.taxAmount = round2(totals.totalSgst + totals.totalCgst + totals.totalIgst);
  const raw = round2(totals.subTotal - totals.totalDiscount + totals.taxAmount);
  totals.roundOff = roundOff ? round2(Math.round(raw) - raw) : 0;
  totals.grandTotal = round2(raw + totals.roundOff);
  return { lines, totals };
}

export const isInterState = (a, b) => Boolean(a && b && String(a).toUpperCase() !== String(b).toUpperCase());

/* ───────────────────────── stock ───────────────────────── */

const BUCKET_FIELD = { OK: 'okQty', DAMAGE: 'damageQty', MISSING: 'missingQty' };

/** Throws if `location` lacks OK stock for any line (aggregated per product). */
export async function assertStockAvailable(locationId, lines) {
  const need = new Map();
  for (const l of lines) need.set(String(l.product), (need.get(String(l.product)) || 0) + Number(l.qty));
  const rows = await DmsStock.find({ location: locationId, product: { $in: [...need.keys()] } }).lean();
  const have = new Map(rows.map((r) => [String(r.product), r.okQty]));
  const errors = {};
  for (const [pid, q] of need) {
    const avl = have.get(pid) || 0;
    if (avl < q) {
      const l = lines.find((x) => String(x.product) === pid);
      errors[pid] = [`${l?.productCode || pid}: available ${avl}, required ${q}`];
    }
  }
  if (Object.keys(errors).length) throw new DmsError('Insufficient stock', 422, errors);
}

/** Atomic stock change + stock-ledger row. delta < 0 is refused if it would go negative. */
export async function moveStock({ location, product, bucket = 'OK', delta, docNo, docKind, transferType, counterparty }) {
  if (!delta) return;
  const f = BUCKET_FIELD[bucket];
  const filter = { location, product };
  if (delta < 0) filter[f] = { $gte: -delta };
  const updated = await DmsStock.findOneAndUpdate(
    filter,
    { $inc: { [f]: delta }, ...(delta > 0 ? { $set: { lastInAt: new Date() } } : {}) },
    { new: true, upsert: delta > 0 },
  );
  if (!updated) throw new DmsError(`Insufficient ${bucket} stock for a product`, 422);
  const closing = updated[f];
  await DmsStockLedger.create({
    location, product, bucket,
    opening: closing - delta,
    inQty: delta > 0 ? delta : 0,
    outQty: delta < 0 ? -delta : 0,
    closing, docNo, docKind, transferType, counterparty,
  });
}

/* ───────────────────────── serials ───────────────────────── */

/** Validate serials for an outward movement from `locationId`. */
export async function assertSerialsOut(locationId, lines) {
  const errors = {};
  for (const l of lines) {
    if (!l.serials?.length) {
      if (l._isSerialized) errors[l.productCode] = ['Serial numbers are required for this product'];
      continue;
    }
    if (l.serials.length !== l.qty) errors[l.productCode] = [`Serial count (${l.serials.length}) must equal qty (${l.qty})`];
    if (new Set(l.serials).size !== l.serials.length) errors[l.productCode] = ['Duplicate serial numbers'];
    const found = await DmsSerial.find({ serialNo: { $in: l.serials } }).lean();
    const fmap = new Map(found.map((s) => [s.serialNo, s]));
    const bad = l.serials.filter((s) => {
      const r = fmap.get(s);
      return !r || r.status !== 'IN_STOCK' || String(r.location) !== String(locationId) || String(r.product) !== String(l.product);
    });
    if (bad.length) errors[l.productCode] = [`Serial(s) not in stock at source: ${bad.slice(0, 10).join(', ')}`];
  }
  if (Object.keys(errors).length) throw new DmsError('Serial validation failed', 422, errors);
}

/** Validate serials for an inward movement that creates them (opening / vendor purchase). */
export async function assertSerialsNew(lines) {
  const all = lines.flatMap((l) => l.serials || []);
  if (new Set(all).size !== all.length) throw new DmsError('Duplicate serial numbers in document');
  for (const l of lines) {
    if (l.serials?.length && l.serials.length !== l.qty) {
      throw new DmsError(`${l.productCode}: serial count (${l.serials.length}) must equal qty (${l.qty})`);
    }
  }
  if (!all.length) return;
  const exist = await DmsSerial.find({ serialNo: { $in: all }, status: { $ne: 'RETURNED_TO_VENDOR' } }).select('serialNo').lean();
  if (exist.length) throw new DmsError(`Serial(s) already exist: ${exist.slice(0, 10).map((s) => s.serialNo).join(', ')}`);
}

export async function setSerials(serials, { status, location = null, product, docNo, docKind, from, to, upsert = false }) {
  if (!serials?.length) return;
  const hist = { at: new Date(), docNo, docKind, from, to, status };
  if (upsert) {
    await DmsSerial.bulkWrite(
      serials.map((s) => ({
        updateOne: {
          filter: { serialNo: s },
          update: { $set: { status, location, product }, $push: { history: hist } },
          upsert: true,
        },
      })),
    );
  } else {
    await DmsSerial.updateMany({ serialNo: { $in: serials } }, { $set: { status, location }, $push: { history: hist } });
  }
}

/* ───────────────────────── ledger ───────────────────────── */

export async function postLedger({ party, counterparty, counterpartyName, docNo, docType, dr = 0, cr = 0, txnDate, paymentRemark, approvalRemark }) {
  if (!party || (!dr && !cr)) return;
  await DmsLedger.create({ party, counterparty, counterpartyName, docNo, docType, dr: round2(dr), cr: round2(cr), txnDate, paymentRemark, approvalRemark });
}

/** Receivable of a location: what others owe it (DR − CR on its own ledger). */
export async function outstandingOf(locationId) {
  const [r] = await DmsLedger.aggregate([
    { $match: { party: locationId } },
    { $group: { _id: null, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } },
  ]);
  return round2((r?.dr || 0) - (r?.cr || 0));
}

/** Payable of a location: what it owes to sellers (their ledger rows where it is the counterparty). */
export async function payableOf(locationId) {
  const [r] = await DmsLedger.aggregate([
    { $match: { counterparty: locationId } },
    { $group: { _id: null, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } },
  ]);
  return round2((r?.dr || 0) - (r?.cr || 0));
}
