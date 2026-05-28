const PHONE_REGEX = /(?:\+?84|0)(?:\d[\s.-]?){8,10}\d/g;
const SIZE_REGEX = /\b(?:size|sz)\s*([a-z0-9]{1,4})\b/i;
const QUANTITY_PATTERNS = [
  /\bx\s*(\d{1,3})\b/i,
  /\bsl\s*(\d{1,3})\b/i,
  /\b(\d{1,3})\s*(?:cai|cái|sp|san pham|sản phẩm)\b/i,
];
const ADDRESS_REGEX = /(?:dia chi|địa chỉ|dc|đc|ship toi|ship tới|giao toi|giao tới)\s*[:,-]?\s*(.+)$/i;

function cleanPhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '').replace(/^\+84/, '0');
}

function cleanProduct(text) {
  return String(text || '')
    .replace(PHONE_REGEX, ' ')
    .replace(SIZE_REGEX, ' ')
    .replace(ADDRESS_REGEX, ' ')
    .replace(/\b(?:chot|chốt|lay|lấy|mua|cho minh|cho mình|dat|đặt)\b/gi, ' ')
    .replace(/\bx\s*\d{1,3}\b/gi, ' ')
    .replace(/\bsl\s*\d{1,3}\b/gi, ' ')
    .replace(/\b\d{1,3}\s*(?:cai|cái|sp|san pham|sản phẩm)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseMockComment(content) {
  const text = String(content || '').trim();
  const phoneMatch = text.match(PHONE_REGEX);
  const sizeMatch = text.match(SIZE_REGEX);
  const addressMatch = text.match(ADDRESS_REGEX);
  const quantityMatch = QUANTITY_PATTERNS.map((pattern) => text.match(pattern)).find(Boolean);
  const productName = cleanProduct(text);

  return {
    phone: phoneMatch?.[0] ? cleanPhone(phoneMatch[0]) : null,
    size: sizeMatch?.[1] ? sizeMatch[1].toUpperCase() : null,
    quantity: quantityMatch?.[1] ? Number(quantityMatch[1]) : null,
    address: addressMatch?.[1]?.trim() || null,
    productName: productName || null,
  };
}

export function mergeParsedSession(session = {}, parsed = {}) {
  return {
    customerPhone: parsed.phone || session.customerPhone || null,
    shippingAddress: parsed.address || session.shippingAddress || null,
    productName: parsed.productName || session.productName || null,
    size: parsed.size || session.size || null,
    quantity: parsed.quantity || session.quantity || null,
  };
}

export function getMissingFields(data = {}) {
  const missing = [];
  if (!data.customerPhone) missing.push('phone');
  if (!data.shippingAddress) missing.push('address');
  if (!data.productName) missing.push('product');
  if (!data.size) missing.push('size');
  if (!data.quantity) missing.push('quantity');
  return missing;
}

export function buildBotReply(missing = []) {
  if (!missing.length) {
    return 'Shop da nhan du thong tin. Ban co the tao don nhap tu hoi thoai nay.';
  }

  const labels = {
    phone: 'so dien thoai',
    address: 'dia chi giao hang',
    product: 'san pham can mua',
    size: 'size',
    quantity: 'so luong',
  };
  return `Shop can them ${missing.map((field) => labels[field] || field).join(', ')} de tao don.`;
}

export function buildSessionUpdateFromParsed(session, parsed) {
  const merged = mergeParsedSession(session, parsed);
  const missing = getMissingFields(merged);
  return {
    ...merged,
    missingFields: JSON.stringify(missing),
    status: missing.length === 0 ? 'ready' : 'collecting',
  };
}

export function serializeParsedData(parsed) {
  return JSON.stringify(parsed || {});
}

export function parseMissingFields(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
