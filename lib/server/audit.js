import { prisma } from '@/lib/prisma';

// Danh sách các từ khóa nhạy cảm cần lọc sạch khỏi payload
const SENSITIVE_KEYS = [
  'password', 'apiKey', 'apiToken', 'accessToken', 'fbAccessToken', 
  'pancakeToken', 'misaApiKey', 'secret', 'token', 'credentials'
];

/**
 * Lọc bỏ thông tin nhạy cảm trước khi ghi log
 */
export function censorPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(censorObject(parsed));
    } catch {
      return payload; // Trả về dạng thô nếu không phải JSON
    }
  }
  if (typeof payload === 'object') {
    return JSON.stringify(censorObject(payload));
  }
  return String(payload);
}

function censorObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(censorObject);
  }
  
  const censored = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
      censored[key] = '[CENSORED]';
    } else if (typeof value === 'object' && value !== null) {
      censored[key] = censorObject(value);
    } else {
      censored[key] = value;
    }
  }
  return censored;
}

/**
 * Ghi Audit Log vào Database
 */
export async function createAuditLog({
  userId = null,
  shopId = null,
  action,
  entityType = null,
  entityId = null,
  ipAddress = null,
  userAgent = null,
  payload = null
}) {
  try {
    const censoredPayload = censorPayload(payload);
    
    return await prisma.auditLog.create({
      data: {
        userId,
        shopId,
        action,
        entityType,
        entityId,
        ipAddress,
        userAgent,
        payload: censoredPayload
      }
    });
  } catch (error) {
    // Không ném lỗi ra ngoài để tránh làm gián đoạn luồng nghiệp vụ chính
    console.error('[AuditLog Error]', error);
    return null;
  }
}
