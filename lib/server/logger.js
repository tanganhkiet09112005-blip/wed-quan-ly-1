/**
 * Production-safe logger.
 * - Sanitizes sensitive fields (token, password, secret, key, DATABASE_URL) before logging.
 * - In production, does NOT output stack traces on errors.
 * - Log level controlled by LOG_LEVEL env variable.
 */

const LEVEL_ORDER = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'apiKey', 'apiToken',
  'accessToken', 'refreshToken', 'DATABASE_URL', 'SESSION_SECRET',
  'ENCRYPTION_KEY', 'WEBHOOK_SECRET', 'FACEBOOK_APP_SECRET',
];

function sanitize(obj, depth = 0) {
  if (depth > 5) return '[deep]';
  if (typeof obj === 'string') {
    // Mask anything that looks like a connection string or bearer token
    if (/mysql:\/\/|postgres:\/\/|mongodb:\/\//.test(obj)) return '***DB_URL***';
    if (obj.length > 80 && /^[A-Za-z0-9+/=._-]{40,}$/.test(obj)) return '***TOKEN***';
    return obj;
  }
  if (Array.isArray(obj)) return obj.map((item) => sanitize(item, depth + 1));
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      const keyLower = k.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((s) => keyLower.includes(s.toLowerCase()));
      result[k] = isSensitive ? '***' : sanitize(v, depth + 1);
    }
    return result;
  }
  return obj;
}

function shouldLog(level) {
  return (LEVEL_ORDER[level] ?? 1) >= (LEVEL_ORDER[LOG_LEVEL] ?? 1);
}

function formatMessage(level, context, message, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(sanitize(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}${metaStr}`;
}

export function logInfo(context, message, meta) {
  if (!shouldLog('info')) return;
  console.info(formatMessage('info', context, message, meta));
}

export function logWarn(context, message, meta) {
  if (!shouldLog('warn')) return;
  console.warn(formatMessage('warn', context, message, meta));
}

export function logError(context, message, error, meta) {
  if (!shouldLog('error')) return;
  const sanitizedMeta = meta ? sanitize(meta) : undefined;
  if (IS_PRODUCTION) {
    // In production: log message and error code, NOT full stack trace
    const errSummary = error
      ? { name: error.name, message: error.message?.split('\n')[0] }
      : undefined;
    console.error(formatMessage('error', context, message, { ...sanitizedMeta, error: errSummary }));
  } else {
    console.error(formatMessage('error', context, message, sanitizedMeta));
    if (error) console.error(error);
  }
}

export function logDebug(context, message, meta) {
  if (!shouldLog('debug')) return;
  console.debug(formatMessage('debug', context, message, meta));
}
