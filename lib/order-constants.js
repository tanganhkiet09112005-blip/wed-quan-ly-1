export const ORDER_STATUSES = [
  'draft',
  'pending',
  'ready_to_ship',
  'pushed_to_carrier',
  'shipping',
  'delivered',
  'partial_delivered',
  'returned',
  'failed',
  'cancelled',
];

export const COD_STATUSES = [
  'pending',
  'collecting',
  'collected',
  'reconciled',
  'returned',
  'cancelled',
];

const LEGACY_ORDER_STATUS_MAP = {
  issue: 'failed',
  partial: 'partial_delivered',
  confirmed: 'pending',
  creating_order: 'draft',
};

const LEGACY_COD_STATUS_MAP = {
  transferred: 'reconciled',
  issue: 'returned',
};

export const ORDER_STATUS_LABELS = {
  all: 'Tất cả',
  draft: 'Nháp',
  pending: 'Chờ xử lý',
  ready_to_ship: 'Sẵn sàng giao',
  pushed_to_carrier: 'Đã đẩy vận chuyển',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  partial_delivered: 'Giao một phần',
  returned: 'Hoàn hàng',
  failed: 'Giao thất bại',
  cancelled: 'Đã hủy',
};

export const ORDER_SOURCE_LABELS = {
  direct: 'Web / tạo trực tiếp',
  web: 'Web',
  chatbot: 'Chatbot',
  fanpage: 'Fanpage',
  livestream: 'Livestream',
};

export const TERMINAL_ORDER_STATUSES = ['delivered', 'returned', 'failed', 'cancelled'];

export const ORDER_STATUS_BADGE_CLASS = {
  draft: 'status-pending',
  pending: 'status-pending',
  ready_to_ship: 'status-shipping',
  pushed_to_carrier: 'status-shipping',
  shipping: 'status-shipping',
  delivered: 'status-delivered',
  partial_delivered: 'status-partial',
  returned: 'status-returned',
  failed: 'status-issue',
  cancelled: 'status-cancelled',
};

export const COD_STATUS_LABELS = {
  pending: 'Chờ thu',
  collecting: 'Đang thu',
  collected: 'Đã thu',
  reconciled: 'Đã đối soát',
  returned: 'Hoàn COD',
  cancelled: 'Đã hủy',
};

export const COD_STATUS_BADGE_CLASS = {
  pending: 'status-pending',
  collecting: 'status-shipping',
  collected: 'status-delivered',
  reconciled: 'status-delivered',
  returned: 'status-returned',
  cancelled: 'status-cancelled',
};

export function normalizeOrderStatus(status) {
  const value = String(status || 'pending');
  const normalized = LEGACY_ORDER_STATUS_MAP[value] || value;
  return ORDER_STATUSES.includes(normalized) ? normalized : 'pending';
}

export function normalizeCodStatus(status) {
  const value = String(status || 'pending');
  const normalized = LEGACY_COD_STATUS_MAP[value] || value;
  return COD_STATUSES.includes(normalized) ? normalized : 'pending';
}

export function getStatusLabel(status) {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(status)] || status;
}

export function getStatusColor(status) {
  return ORDER_STATUS_BADGE_CLASS[normalizeOrderStatus(status)] || 'status-pending';
}

export function getCodStatusLabel(status) {
  return COD_STATUS_LABELS[normalizeCodStatus(status)] || status;
}

export function getCodStatusColor(status) {
  return COD_STATUS_BADGE_CLASS[normalizeCodStatus(status)] || 'status-pending';
}

export function getOrderSourceLabel(channel, hasChatSession = false) {
  if (hasChatSession) return `Chatbot ${ORDER_SOURCE_LABELS[channel] || channel || ''}`.trim();
  return ORDER_SOURCE_LABELS[channel] || channel || 'Web / tạo trực tiếp';
}

export function getCodStatusForOrderStatus(status, currentCodStatus = 'pending') {
  const normalizedStatus = normalizeOrderStatus(status);
  const normalizedCod = normalizeCodStatus(currentCodStatus);

  if (normalizedStatus === 'delivered') return 'collected';
  if (normalizedStatus === 'returned' || normalizedStatus === 'failed') return 'returned';
  if (normalizedStatus === 'cancelled') return 'cancelled';
  if (normalizedStatus === 'shipping' || normalizedStatus === 'pushed_to_carrier') return 'collecting';
  if (normalizedStatus === 'partial_delivered') return normalizedCod === 'pending' ? 'collecting' : normalizedCod;
  return normalizedCod;
}

export function normalizeOrderForResponse(order) {
  if (!order) return order;
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    codStatus: normalizeCodStatus(order.codStatus),
    carrierFee: order.carrierFee ?? order.shippingFee ?? 0,
    carrierName: order.carrierName || order.shipper?.name || null,
  };
}
