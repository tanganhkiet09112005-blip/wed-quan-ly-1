import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { maskSecret, prepareSecretForUpdate } from '@/lib/server/secrets';

function safeMaskJSON(secretStr) {
  if (!secretStr) return '';
  const str = String(secretStr);
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      for (const k in parsed) {
        if (typeof parsed[k] === 'string' && parsed[k].length > 0) {
          parsed[k] = parsed[k].length > 4 ? `****${parsed[k].slice(-4)}` : '****';
        }
      }
      return JSON.stringify(parsed);
    } catch {
      // fallback
    }
  }
  return maskSecret(str);
}

function maskShipperConfig(shipper, config = null) {
  const source = config || shipper;
  return {
    ...shipper,
    apiKey: safeMaskJSON(source.apiKey),
    apiToken: safeMaskJSON(source.apiToken),
    apiKeyMasked: safeMaskJSON(source.apiKey),
    apiTokenMasked: safeMaskJSON(source.apiToken),
    codFeePercent: config ? config.codFeePercent : shipper.codFeePercent,
    status: config ? config.status : shipper.status,
    mode: config ? config.mode : 'mock',
    isConfigured: Boolean(config),
  };
}

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));

    const globalShippers = await prisma.shipperPartner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });

    if (!scopedShopId) {
      if (!isAdmin(user)) return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
      return jsonSuccess(globalShippers.map((shipper) => maskShipperConfig(shipper)));
    }

    const shopConfigs = await prisma.shopShipper.findMany({
      where: { shopId: scopedShopId },
    });
    const configMap = new Map(shopConfigs.map((config) => [config.shipperCode, config]));
    const merged = globalShippers.map((shipper) => maskShipperConfig(shipper, configMap.get(shipper.code)));

    return jsonSuccess(merged);
  } catch (error) {
    return serverError('[GET /api/shippers]', error);
  }
}

export async function PUT(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const { shipperCode, codFeePercent, status, mode } = body;
    const scopedShopId = isAdmin(user) ? body.shopId : user.shopId;

    if (!scopedShopId || !shipperCode) {
      return jsonError('Thieu shopId hoac ma nha van chuyen.', 400);
    }

    const existing = await prisma.shopShipper.findUnique({
      where: {
        shopId_shipperCode: {
          shopId: scopedShopId,
          shipperCode,
        },
      },
    });

    const apiKey = prepareSecretForUpdate(body.apiKey);
    const apiToken = prepareSecretForUpdate(body.apiToken);

    const updateData = {
      codFeePercent: codFeePercent !== undefined ? Number(codFeePercent) : undefined,
      status: status !== undefined ? status : undefined,
      mode: mode !== undefined ? mode : undefined,
    };
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiToken !== undefined) updateData.apiToken = apiToken;

    const createData = {
      shopId: scopedShopId,
      shipperCode,
      apiKey: apiKey ?? '',
      apiToken: apiToken ?? '',
      codFeePercent: codFeePercent !== undefined ? Number(codFeePercent) : 0,
      status: status || 'inactive',
      mode: mode || 'mock',
    };

    const updated = await prisma.shopShipper.upsert({
      where: {
        shopId_shipperCode: {
          shopId: scopedShopId,
          shipperCode,
        },
      },
      update: updateData,
      create: createData,
    });

    return jsonSuccess({
      ...updated,
      apiKey: maskSecret(updated.apiKey),
      apiToken: maskSecret(updated.apiToken),
      apiKeyMasked: maskSecret(updated.apiKey),
      apiTokenMasked: maskSecret(updated.apiToken),
      isConfigured: Boolean(existing || updated),
    }, 'Luu cau hinh van chuyen thanh cong.');
  } catch (error) {
    if (error?.message === 'ENCRYPTION_KEY is not configured') {
      return jsonError('Server chua cau hinh ENCRYPTION_KEY de luu API key/token.', 500);
    }
    return serverError('[PUT /api/shippers]', error);
  }
}
