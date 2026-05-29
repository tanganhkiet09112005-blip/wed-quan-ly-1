import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const APP_VERSION = process.env.npm_package_version || '1.0.0';

export async function GET() {
  const startTime = Date.now();

  // Database connectivity check
  let dbStatus = 'connected';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'error';
    // Do NOT expose connection string or full error in response
    dbError = process.env.NODE_ENV === 'production'
      ? 'Database connection failed.'
      : err.message?.split('\n')[0] || 'Unknown DB error';
  }

  const isHealthy = dbStatus === 'connected';
  const latencyMs = Date.now() - startTime;

  const body = {
    status: isHealthy ? 'ok' : 'error',
    database: dbStatus,
    time: new Date().toISOString(),
    version: APP_VERSION,
    latencyMs,
    env: process.env.NODE_ENV || 'development',
  };

  if (dbError) {
    body.databaseError = dbError;
  }

  return NextResponse.json(body, { status: isHealthy ? 200 : 500 });
}
