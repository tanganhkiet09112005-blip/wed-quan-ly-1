import { makeMockAdapter } from './mock-utils';

export const GHTK_STATUS_MAP = {
  '-1': 'pending',
  1: 'pushed_to_carrier',
  2: 'shipping',
  3: 'shipping',
  4: 'shipping',
  5: 'delivered',
  6: 'returned',
  7: 'returned',
  8: 'returned',
  9: 'failed',
  10: 'cancelled',
  11: 'partial_delivered',
  12: 'shipping',
};

export const ghtkAdapter = makeMockAdapter({
  code: 'GHTK',
  name: 'Giao Hang Tiet Kiem (GHTK)',
  baseFee: 28000,
});

// Thêm các phương thức giao tiếp webhook & chuẩn hóa trạng thái
ghtkAdapter.normalizeStatus = (carrierStatus) => {
  return GHTK_STATUS_MAP[String(carrierStatus)] || 'shipping';
};

ghtkAdapter.parseWebhookEvent = (payload, headers, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'sandbox' || mode === 'production') {
    throw new Error('Production/Sandbox credentials or API documentation missing for GHTK.');
  }
  return {
    success: true,
    carrierCode: 'GHTK',
    trackingCode: payload?.label_id || 'GHTK_MOCK_001',
    hshipStatus: GHTK_STATUS_MAP[String(payload?.status_id)] || 'shipping',
    rawPayload: payload,
  };
};

export function createGHTKOrder(order, credentials) {
  return ghtkAdapter.createShipment(order, credentials);
}

export function getGHTKOrderStatus(trackingCode, credentials) {
  return ghtkAdapter.getShipmentStatus(trackingCode, credentials);
}

export function cancelGHTKShipment(trackingCode, credentials) {
  return ghtkAdapter.cancelShipment(trackingCode, credentials);
}
