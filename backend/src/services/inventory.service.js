import Inventory from '../models/Inventory.model.js';
import DealerInventory from '../models/DealerInventory.model.js';

export async function upsertWarehouseStock({ warehouseId, sku, name, category, hsn, qtyDelta, unitPrice }) {
  let item = await Inventory.findOne({ sku, warehouse: warehouseId, isDeleted: false });
  if (!item) {
    item = await Inventory.create({
      sku,
      name,
      category: category || 'General',
      hsn: hsn || '',
      quantity: Math.max(0, qtyDelta),
      warehouse: warehouseId,
      unitPrice: unitPrice || 0,
    });
    return item;
  }
  item.quantity = Math.max(0, item.quantity + qtyDelta);
  if (name) item.name = name;
  if (unitPrice) item.unitPrice = unitPrice;
  await item.save();
  return item;
}

export async function upsertDealerStock({ dealerId, sku, name, qtyDelta, reorderLevel }) {
  let item = await DealerInventory.findOne({ dealer: dealerId, sku });
  if (!item) {
    item = await DealerInventory.create({
      dealer: dealerId,
      sku,
      name,
      quantity: Math.max(0, qtyDelta),
      reorderLevel: reorderLevel ?? 8,
    });
    return item;
  }
  item.quantity = Math.max(0, item.quantity + qtyDelta);
  if (name) item.name = name;
  await item.save();
  return item;
}

export async function deductWarehouseStock({ warehouseId, lineItems }) {
  for (const line of lineItems) {
    const item = await Inventory.findOne({ sku: line.sku, warehouse: warehouseId, isDeleted: false });
    if (!item || item.quantity < line.quantity) {
      throw new Error(`Insufficient stock for SKU ${line.sku}`);
    }
    item.quantity -= line.quantity;
    await item.save();
  }
}

export async function deductDealerStock({ dealerId, lineItems }) {
  for (const line of lineItems) {
    const item = await DealerInventory.findOne({ dealer: dealerId, sku: line.sku });
    if (!item || item.quantity < line.quantity) {
      throw Object.assign(new Error(`Insufficient dealer stock for SKU ${line.sku}`), { statusCode: 400 });
    }
    item.quantity -= line.quantity;
    await item.save();
  }
}
