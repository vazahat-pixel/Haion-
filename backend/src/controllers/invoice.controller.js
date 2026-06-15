import Invoice from '../models/Invoice.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapInvoice } from '../utils/docMapper.util.js';
import { buildInvoiceHtml } from '../utils/invoiceHtml.util.js';
import { streamInvoicePdf } from '../utils/invoicePdf.util.js';

function dealerFilter(req) {
  if (req.user.dealerId) return { dealer: req.user.dealerId };
  if (req.query.dealerId) return { dealer: req.query.dealerId };
  return {};
}

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...dealerFilter(req),
    ...buildSearchFilter(req.query.search, ['invoiceNo', 'billNo', 'customerName']),
  };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Invoice.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Invoice.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapInvoice), total, page, perPage });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const invoice = await Invoice.findOne(filter).lean();
  if (!invoice) return sendError(res, { message: 'Invoice not found', statusCode: 404 });
  return sendSuccess(res, { data: mapInvoice(invoice) });
});

export const getInvoicePdf = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const invoice = await Invoice.findOne(filter).lean();
  if (!invoice) return sendError(res, { message: 'Invoice not found', statusCode: 404 });

  const mapped = mapInvoice(invoice);
  const html = buildInvoiceHtml(mapped);
  const download = req.query.download === 'true';
  const format = req.query.format || 'html';

  if (download && format === 'pdf') {
    return streamInvoicePdf(mapped, res);
  }

  if (download) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo}.html"`);
    return res.send(html);
  }

  return sendSuccess(res, {
    data: {
      ...mapInvoice(invoice),
      html,
      downloadUrl: `/api/invoices/${req.params.id}/pdf?download=true`,
    },
  });
});
