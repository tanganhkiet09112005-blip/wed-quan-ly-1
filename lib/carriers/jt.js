import { makeMockAdapter } from './mock-utils';

export const JT_STATUS_MAP = {
  ITEM_RECEIVED_FROM_SENDER: 'pushed_to_carrier',
  IN_TRANSIT: 'shipping',
  OUT_FOR_DELIVERY: 'shipping',
  DELIVERED: 'delivered',
  RETURN_TO_SENDER_TRANSIT: 'returned',
  RETURNED_TO_SENDER: 'returned',
  DELIVERY_FAILED: 'failed',
  PARTIAL_DELIVERED: 'partial_delivered',
  EXCEPTION: 'failed',
};

export const jtAdapter = makeMockAdapter({
  code: 'JT',
  name: 'J&T Express',
  baseFee: 35000,
});

// Thêm các phương thức giao tiếp webhook & chuẩn hóa trạng thái
jtAdapter.normalizeStatus = (carrierStatus) => {
  return JT_STATUS_MAP[String(carrierStatus)] || 'shipping';
};

jtAdapter.parseWebhookEvent = (payload, headers, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'sandbox' || mode === 'production') {
    throw new Error('Production/Sandbox credentials or API documentation missing for J&T.');
  }
  return {
    success: true,
    carrierCode: 'JT',
    trackingCode: payload?.billCode || 'JT_MOCK_001',
    hshipStatus: JT_STATUS_MAP[String(payload?.scanType)] || 'shipping',
    rawPayload: payload,
  };
};

export function createJTOrder(order, credentials) {
  return jtAdapter.createShipment(order, credentials);
}

export function getJTOrderStatus(trackingCode, credentials) {
  return jtAdapter.getShipmentStatus(trackingCode, credentials);
}

export function cancelJTShipment(trackingCode, credentials) {
  return jtAdapter.cancelShipment(trackingCode, credentials);
}
