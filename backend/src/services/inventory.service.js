import Inventory from '../models/Inventory.model.js';
import DealerInventory from '../models/DealerInventory.model.js';
import StockMovement from '../models/StockMovement.model.js';

/**
 * Log a stock movement event. Safe — never throws, only warns.
 */
async function logMovement(data, session) {
  try {
    if (session) {
      await StockMovement.create([data], { session });
    } else {
      await StockMovement.create(data);
    }
  } catch (err) {
    console.warn('[inventory.service] Failed to log StockMovement:', err.message);
  }
}

export async function upsertWarehouseStock({
  warehouseId, sku, name, category, hsn, qtyDelta, unitPrice,
  reference, referenceType, referenceId, performedBy, performedByUser,
  session,
}) {
  let item = await Inventory.findOne({ sku, warehouse: warehouseId, isDeleted: false }).session(session || null);
  let qtyBefore = 0;
  if (!item) {
    const [created] = await Inventory.create([{
      sku,
      name,
      category: category || 'General',
      hsn: hsn || '',
      quantity: Math.max(0, qtyDelta),
      warehouse: warehouseId,
      unitPrice: unitPrice || 0,
    }], session ? { session } : undefined);
    item = created;
    qtyBefore = 0;
  } else {
    qtyBefore = item.quantity;
    item.quantity = Math.max(0, item.quantity + qtyDelta);
    if (name) item.name = name;
    if (unitPrice) item.unitPrice = unitPrice;
    await item.save(session ? { session } : undefined);
  }

  let action = 'ADJUSTMENT';
  if (qtyDelta >= 0) {
    if (referenceType === 'Purchase') action = 'PURCHASE';
    else if (referenceType === 'Manufacture') action = 'MANUFACTURE_IN';
    else action = 'GRN';
  }

  await logMovement({
    sku,
    name: name || item.name,
    action,
    qtyBefore,
    qtyDelta,
    qtyAfter: item.quantity,
    warehouse: warehouseId,
    reference,
    referenceId,
    referenceType,
    performedBy,
    performedByUser,
  }, session);

  return item;
}

export async function upsertDealerStock({
  dealerId, sku, name, qtyDelta, reorderLevel,
  reference, referenceType, referenceId, performedBy, performedByUser,
  session,
}) {
  let item = await DealerInventory.findOne({ dealer: dealerId, sku }).session(session || null);
  let qtyBefore = 0;
  if (!item) {
    const [created] = await DealerInventory.create([{
      dealer: dealerId,
      sku,
      name,
      quantity: Math.max(0, qtyDelta),
      reorderLevel: reorderLevel ?? 8,
    }], session ? { session } : undefined);
    item = created;
    qtyBefore = 0;
  } else {
    qtyBefore = item.quantity;
    item.quantity = Math.max(0, item.quantity + qtyDelta);
    if (name) item.name = name;
    await item.save(session ? { session } : undefined);
  }

  await logMovement({
    sku,
    name: name || item.name,
    action: 'DEALER_CONFIRM',
    qtyBefore,
    qtyDelta,
    qtyAfter: item.quantity,
    dealer: dealerId,
    reference,
    referenceId,
    referenceType,
    performedBy,
    performedByUser,
  }, session);

  return item;
}

export async function deductWarehouseStock({
  warehouseId, lineItems,
  reference, referenceType, referenceId, performedBy, performedByUser,
  session,
  action = 'DISPATCH',
}) {
  for (const line of lineItems) {
    // eslint-disable-next-line no-await-in-loop
    const item = await Inventory.findOne({ sku: line.sku, warehouse: warehouseId, isDeleted: false }).session(session || null);
    if (!item || item.quantity < line.quantity) {
      throw Object.assign(
        new Error(`Insufficient stock for SKU ${line.sku} (available: ${item?.quantity ?? 0})`),
        { statusCode: 400 }
      );
    }
    const qtyBefore = item.quantity;
    item.quantity -= line.quantity;
    // eslint-disable-next-line no-await-in-loop
    await item.save(session ? { session } : undefined);

    // eslint-disable-next-line no-await-in-loop
    await logMovement({
      sku: line.sku,
      name: line.name || item.name,
      action,
      qtyBefore,
      qtyDelta: -line.quantity,
      qtyAfter: item.quantity,
      warehouse: warehouseId,
      reference,
      referenceId,
      referenceType,
      performedBy,
      performedByUser,
    }, session);
  }
}

export async function deductDealerStock({
  dealerId, lineItems,
  reference, referenceType, referenceId, performedBy, performedByUser,
  session,
}) {
  for (const line of lineItems) {
    // eslint-disable-next-line no-await-in-loop
    const item = await DealerInventory.findOne({ dealer: dealerId, sku: line.sku }).session(session || null);
    if (!item || item.quantity < line.quantity) {
      throw Object.assign(new Error(`Insufficient dealer stock for SKU ${line.sku}`), { statusCode: 400 });
    }
    const qtyBefore = item.quantity;
    item.quantity -= line.quantity;
    // eslint-disable-next-line no-await-in-loop
    await item.save(session ? { session } : undefined);

    // eslint-disable-next-line no-await-in-loop
    await logMovement({
      sku: line.sku,
      name: line.name || item.name,
      action: 'BILLING_DEDUCTION',
      qtyBefore,
      qtyDelta: -line.quantity,
      qtyAfter: item.quantity,
      dealer: dealerId,
      reference,
      referenceId,
      referenceType,
      performedBy,
      performedByUser,
    }, session);
  }
}

export async function transferWarehouseStock({
  fromWarehouseId,
  toWarehouseId,
  sku,
  quantity,
  performedBy,
  performedByUser,
  notes,
}) {
  if (String(fromWarehouseId) === String(toWarehouseId)) {
    throw Object.assign(new Error('Source and destination warehouses must differ'), { statusCode: 400 });
  }
  if (!quantity || quantity <= 0) {
    throw Object.assign(new Error('Quantity must be greater than zero'), { statusCode: 400 });
  }

  const normalizedSku = sku.toUpperCase().trim();
  const fromItem = await Inventory.findOne({
    sku: normalizedSku,
    warehouse: fromWarehouseId,
    isDeleted: false,
  });
  if (!fromItem || fromItem.quantity < quantity) {
    throw Object.assign(
      new Error(`Insufficient stock for ${normalizedSku} at source warehouse (available: ${fromItem?.quantity ?? 0})`),
      { statusCode: 400 }
    );
  }

  const reference = `XFER-${Date.now()}`;
  const fromBefore = fromItem.quantity;
  fromItem.quantity -= quantity;
  await fromItem.save();
  await logMovement({
    sku: normalizedSku,
    name: fromItem.name,
    action: 'WAREHOUSE_TRANSFER',
    qtyBefore: fromBefore,
    qtyDelta: -quantity,
    qtyAfter: fromItem.quantity,
    warehouse: fromWarehouseId,
    reference,
    referenceType: 'Manual',
    performedBy,
    performedByUser,
    notes: notes || `Transfer out to warehouse ${toWarehouseId}`,
  });

  let toItem = await Inventory.findOne({
    sku: normalizedSku,
    warehouse: toWarehouseId,
    isDeleted: false,
  });
  const toBefore = toItem?.quantity ?? 0;
  if (!toItem) {
    toItem = await Inventory.create({
      sku: normalizedSku,
      name: fromItem.name,
      category: fromItem.category,
      hsn: fromItem.hsn,
      quantity,
      warehouse: toWarehouseId,
      unitPrice: fromItem.unitPrice,
    });
  } else {
    toItem.quantity += quantity;
    await toItem.save();
  }

  await logMovement({
    sku: normalizedSku,
    name: fromItem.name,
    action: 'WAREHOUSE_TRANSFER',
    qtyBefore: toBefore,
    qtyDelta: quantity,
    qtyAfter: toItem.quantity,
    warehouse: toWarehouseId,
    reference,
    referenceType: 'Manual',
    performedBy,
    performedByUser,
    notes: notes || `Transfer in from warehouse ${fromWarehouseId}`,
  });

  return { fromItem, toItem, reference };
}
