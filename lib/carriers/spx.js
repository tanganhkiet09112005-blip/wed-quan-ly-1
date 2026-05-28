import { makeMockAdapter } from './mock-utils';

export const SPX_STATUS_MAP = {
  CREATED: 'pushed_to_carrier',
  PICKING_UP: 'shipping',
  IN_TRANSIT: 'shipping',
  DELIVERED: 'delivered',
  RETURNING: 'returned',
  RETURNED: 'returned',
  LOST: 'failed',
  DAMAGED: 'failed',
  PARTIAL_DELIVERED: 'partial_delivered',
};

export const spxAdapter = makeMockAdapter({
  code: 'SPX',
  name: 'Shopee Xpress (SPX)',
  baseFee: 30000,
});

// Thêm các phương thức giao tiếp webhook & chuẩn hóa trạng thái
spxAdapter.normalizeStatus = (carrierStatus) => {
  return SPX_STATUS_MAP[String(carrierStatus).toUpperCase()] || 'shipping';
};

spxAdapter.parseWebhookEvent = (payload, headers, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'sandbox' || mode === 'production') {
    throw new Error('Production/Sandbox credentials or API documentation missing for SPX.');
  }
  return {
    success: true,
    carrierCode: 'SPX',
    trackingCode: payload?.tracking_number || 'SPX_MOCK_001',
    hshipStatus: SPX_STATUS_MAP[String(payload?.status).toUpperCase()] || 'shipping',
    rawPayload: payload,
  };
};

export function createSPXOrder(order, credentials) {
  return spxAdapter.createShipment(order, credentials);
}

export function getSPXOrderStatus(trackingCode, credentials) {
  return spxAdapter.getShipmentStatus(trackingCode, credentials);
}

export function cancelSPXShipment(trackingCode, credentials) {
  return spxAdapter.cancelShipment(trackingCode, credentials);
}
