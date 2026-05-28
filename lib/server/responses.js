import { NextResponse } from 'next/server';

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
  console.error(context, error);
  return jsonError('Da xay ra loi he thong. Vui long thu lai sau.', 500);
}
