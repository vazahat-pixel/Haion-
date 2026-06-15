import Product from '../models/Product.model.js';
import Dealer from '../models/Dealer.model.js';
import Customer from '../models/Customer.model.js';
import Order from '../models/Order.model.js';
import Bill from '../models/Bill.model.js';
import Complaint from '../models/Complaint.model.js';
import Employee from '../models/Employee.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function searchCollection(Model, fields, q, limit = 5, extra = {}) {
  const regex = new RegExp(escapeRegex(q), 'i');
  const or = fields.map((f) => ({ [f]: regex }));
  const rows = await Model.find({ ...extra, $or: or }).limit(limit).lean();
  return rows;
}

export const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || req.query.search || '').trim();
  if (q.length < 2) {
    return sendSuccess(res, { data: { query: q, results: [] } });
  }

  const limit = Math.min(Number(req.query.limit) || 5, 10);
  const dealerFilter = req.user.dealerId ? { dealer: req.user.dealerId } : {};

  const [products, dealers, customers, orders, bills, complaints, employees] = await Promise.all([
    searchCollection(Product, ['name', 'sku', 'category'], q, limit),
    req.user.dealerId ? [] : searchCollection(Dealer, ['name', 'code', 'city'], q, limit),
    searchCollection(Customer, ['name', 'code', 'phone', 'email'], q, limit, dealerFilter),
    searchCollection(Order, ['orderNo', 'customerName'], q, limit, req.user.role === 'CUSTOMER' ? { customer: req.user._id } : dealerFilter),
    searchCollection(Bill, ['billNo', 'customerName'], q, limit, dealerFilter),
    searchCollection(Complaint, ['ticketNo', 'customer', 'product'], q, limit),
    req.user.role === 'MASTER_ADMIN' ? searchCollection(Employee, ['firstName', 'lastName', 'empId', 'email'], q, limit) : [],
  ]);

  const results = [
    ...products.map((p) => ({ type: 'product', id: String(p._id), label: p.name, sublabel: p.sku, path: `/admin/products/${p._id}` })),
    ...dealers.map((d) => ({ type: 'dealer', id: String(d._id), label: d.name, sublabel: d.code, path: `/admin/dealers/${d._id}` })),
    ...customers.map((c) => ({ type: 'customer', id: String(c._id), label: c.name, sublabel: c.code, path: `/dealer/customers/${c._id}` })),
    ...orders.map((o) => ({ type: 'order', id: String(o._id), label: o.orderNo, sublabel: o.customerName, path: `/customer/orders/${o._id}` })),
    ...bills.map((b) => ({ type: 'bill', id: String(b._id), label: b.billNo, sublabel: b.customerName, path: `/dealer/billing/${b._id}` })),
    ...complaints.map((c) => ({ type: 'complaint', id: String(c._id), label: c.ticketNo, sublabel: c.customer, path: `/service/complaints/${c._id}` })),
    ...employees.map((e) => ({ type: 'employee', id: String(e._id), label: `${e.firstName} ${e.lastName}`, sublabel: e.empId, path: `/admin/employees/${e._id}` })),
  ];

  return sendSuccess(res, { data: { query: q, results: results.slice(0, 20) } });
});
