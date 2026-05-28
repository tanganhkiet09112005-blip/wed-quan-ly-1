import { normalizeCodStatus, normalizeOrderStatus } from '@/lib/order-constants';

function isCodExcluded(order) {
  const status = normalizeOrderStatus(order.status);
  return status === 'returned' || status === 'cancelled' || status === 'failed';
}

function shouldCountShippingFee(order) {
  const status = normalizeOrderStatus(order.status);
  return status !== 'cancelled' && status !== 'failed';
}

function getCarrierCode(order) {
  const value = String(order.shipperCode || order.carrierName || 'NONE').toUpperCase();
  if (value.includes('GHN') || value.includes('GIAO HANG NHANH')) return 'GHN';
  if (value.includes('GHTK') || value.includes('GIAO HANG TIET KIEM')) return 'GHTK';
  if (value.includes('SPX') || value.includes('SHOPEE')) return 'SPX';
  if (value.includes('JT') || value.includes('J&T')) return 'JT';
  return value || 'NONE';
}

export function summarizeOrders(orders = []) {
  const byStatus = {};
  const byCarrier = {};

  const summary = orders.reduce((acc, order) => {
    const status = normalizeOrderStatus(order.status);
    const codStatus = normalizeCodStatus(order.codStatus);
    const carrierCode = getCarrierCode(order);
    const shippingFee = Number(order.shippingFee || 0);
    const carrierFee = Number(order.carrierFee || shippingFee || 0);
    const codAmount = Number(order.codAmount || 0);

    byStatus[status] = (byStatus[status] || 0) + 1;
    byCarrier[carrierCode] = (byCarrier[carrierCode] || 0) + 1;

    acc.totalOrders += 1;

    if (shouldCountShippingFee(order)) {
      acc.shippingFeeTotal += shippingFee;
      acc.carrierFeeTotal += carrierFee;
    }

    if (!isCodExcluded(order)) {
      if (codStatus === 'collected' || codStatus === 'reconciled') {
        acc.codCollected += codAmount;
      } else {
        acc.codPending += codAmount;
      }
    }

    return acc;
  }, {
    totalOrders: 0,
    codPending: 0,
    codCollected: 0,
    shippingFeeTotal: 0,
    carrierFeeTotal: 0,
  });

  return {
    ...summary,
    byStatus,
    byCarrier,
  };
}
