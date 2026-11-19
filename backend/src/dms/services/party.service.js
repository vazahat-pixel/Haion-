import mongoose from 'mongoose';
import { DmsLocation, DmsVendor, DmsCustomer } from '../models/master.models.js';
import { DmsError } from './core.service.js';

/** Build a party snapshot ({kind, location|vendor|customer, name, city, …}) from an id. */
export async function buildParty(kind, id) {
  if (!mongoose.isValidObjectId(id)) throw new DmsError(`Invalid ${kind.toLowerCase()} id`, 422);
  if (kind === 'LOCATION') {
    const l = await DmsLocation.findById(id).lean();
    if (!l) throw new DmsError('Location not found', 422);
    if (l.status !== 'Active') throw new DmsError(`Location ${l.name} is deactivated`, 422);
    return {
      party: { kind, location: l._id, name: l.name, city: l.city, state: l.state, stateCode: l.stateCode, address: l.billingAddress, gstNo: l.gstNo },
      doc: l,
    };
  }
  if (kind === 'VENDOR') {
    const v = await DmsVendor.findById(id).lean();
    if (!v) throw new DmsError('Vendor not found', 422);
    return {
      party: { kind, vendor: v._id, name: v.name, city: v.city, state: v.state, stateCode: v.stateCode, address: v.address, gstNo: v.gstNo },
      doc: v,
    };
  }
  const c = await DmsCustomer.findById(id).lean();
  if (!c) throw new DmsError('Customer not found', 422);
  return {
    party: { kind: 'CUSTOMER', customer: c._id, name: c.name, city: c.city, state: c.state, stateCode: c.stateCode, address: c.address, gstNo: c.gstin },
    doc: c,
  };
}

export const partyLabel = (p) => (p ? [p.name, p.city].filter(Boolean).join(',') : '');
