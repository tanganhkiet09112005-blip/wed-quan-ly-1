import { NextResponse } from 'next/server';
import { logError } from '@/lib/server/logger';

export function jsonSuccess(data = null, message = 'OK', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function jsonError(message = 'Bad request', status = 400, errors = null) {
  const payload = {
    success: false,
    message,
    error: message,
  };

  if (errors) payload.errors = errors;

  return NextResponse.json(payload, { status });
}

export function serverError(context, error) {
  logError(context, 'Unhandled server error', error);
  return jsonError('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.', 500);
}
