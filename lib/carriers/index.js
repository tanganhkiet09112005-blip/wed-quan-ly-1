import { prisma } from '@/lib/prisma';
import { decryptSecret } from '@/lib/server/secrets';
import { ghnAdapter } from './ghn';
import { ghtkAdapter } from './ghtk';
import { jtAdapter } from './jt';
import { spxAdapter } from './spx';

export const CARRIER_ADAPTERS = {
  GHN: ghnAdapter,
  JT: jtAdapter,
  JT_EXPRESS: jtAdapter,
  SPX: spxAdapter,
  GHTK: ghtkAdapter,
};

export const CARRIER_NAMES = {
  GHN: 'Giao Hang Nhanh (GHN)',
  SPX: 'Shopee Xpress (SPX)',
  GHTK: 'Giao Hang Tiet Kiem (GHTK)',
  JT: 'J&T Express',
};

export function getCarrierAdapter(carrierCode) {
  return CARRIER_ADAPTERS[String(carrierCode || '').toUpperCase()] || null;
}

export async function getShopCarrierCredentials(shopId, carrierCode) {
  const code = String(carrierCode || '').toUpperCase() === 'JT_EXPRESS' ? 'JT' : String(carrierCode || '').toUpperCase();
  if (!shopId || !code) {
    return { success: false, error: 'Thieu shopId hoac ma don vi van chuyen.' };
  }

  const config = await prisma.shopShipper.findUnique({
    where: {
      shopId_shipperCode: {
        shopId,
        shipperCode: code,
      },
    },
  });

  if (!config || config.status !== 'active') {
    return { success: false, error: `Shop chua bat don vi van chuyen ${code}.` };
  }

  const apiKey = decryptSecret(config.apiKey);
  const apiToken = decryptSecret(config.apiToken);
  if (!apiKey && !apiToken) {
    return { success: false, error: `Shop chua cau hinh credential cho ${code}.` };
  }

  return {
    success: true,
    credentials: {
      apiKey,
      apiToken,
      codFeePercent: config.codFeePercent,
      mode: config.mode || 'mock',
    },
  };
}

export async function calculateCarrierFee(carrierCode, order) {
  const adapter = getCarrierAdapter(carrierCode);
  if (!adapter) return { success: false, error: `Don vi van chuyen "${carrierCode}" chua duoc tich hop.` };

  const credentialResult = await getShopCarrierCredentials(order.shopId, carrierCode);
  if (!credentialResult.success) return credentialResult;

  return adapter.calculateFee(order, credentialResult.credentials);
}

export async function createShipment(carrierCode, order) {
  const adapter = getCarrierAdapter(carrierCode);
  if (!adapter) return { success: false, error: `Don vi van chuyen "${carrierCode}" chua duoc tich hop.` };

  const credentialResult = await getShopCarrierCredentials(order.shopId, carrierCode);
  if (!credentialResult.success) return credentialResult;

  return adapter.createShipment(order, credentialResult.credentials);
}

export async function getShipmentStatus(carrierCode, trackingCode, order = {}) {
  const adapter = getCarrierAdapter(carrierCode);
  if (!adapter) return { success: false, error: `Don vi van chuyen "${carrierCode}" chua duoc tich hop.` };

  const credentialResult = order.shopId
    ? await getShopCarrierCredentials(order.shopId, carrierCode)
    : { success: true, credentials: {} };
  if (!credentialResult.success) return credentialResult;

  return adapter.getShipmentStatus(trackingCode, credentialResult.credentials);
}

export async function cancelShipment(carrierCode, trackingCode, order = {}) {
  const adapter = getCarrierAdapter(carrierCode);
  if (!adapter) return { success: false, error: `Don vi van chuyen "${carrierCode}" chua duoc tich hop.` };

  const credentialResult = order.shopId
    ? await getShopCarrierCredentials(order.shopId, carrierCode)
    : { success: true, credentials: {} };
  if (!credentialResult.success) return credentialResult;

  return adapter.cancelShipment(trackingCode, credentialResult.credentials);
}

export async function pushOrderToCarrier(carrierCode, order) {
  return createShipment(carrierCode, order);
}
