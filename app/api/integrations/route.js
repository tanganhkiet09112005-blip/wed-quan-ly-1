import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { maskSecret, prepareSecretForUpdate } from '@/lib/server/secrets';

function maskConfig(config, shopId) {
  return {
    id: config?.id,
    shopId,
    fbPageId: config?.fbPageId || '',
    fbAccessToken: maskSecret(config?.fbAccessToken),
    pancakeToken: maskSecret(config?.pancakeToken),
    fbStatus: config?.fbStatus || 'inactive',
    misaAppId: config?.misaAppId || '',
    misaApiKey: maskSecret(config?.misaApiKey),
    misaCompanyCode: config?.misaCompanyCode || '',
    misaStatus: config?.misaStatus || 'inactive',
    createdAt: config?.createdAt,
    updatedAt: config?.updatedAt,
  };
}

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));
    if (!scopedShopId) return jsonError('Thieu shopId.', isAdmin(user) ? 400 : 403);

    const config = await prisma.shopConfig.findUnique({
      where: { shopId: scopedShopId },
    });

    return jsonSuccess(maskConfig(config, scopedShopId));
  } catch (error) {
    return serverError('[GET /api/integrations]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const scopedShopId = isAdmin(user) ? body.shopId : user.shopId;
    if (!scopedShopId) return jsonError('Thieu shopId.', 400);

    const fbAccessToken = prepareSecretForUpdate(body.fbAccessToken);
    const pancakeToken = prepareSecretForUpdate(body.pancakeToken);
    const misaApiKey = prepareSecretForUpdate(body.misaApiKey);

    const update = {
      fbPageId: body.fbPageId !== undefined ? body.fbPageId : undefined,
      fbStatus: body.fbStatus !== undefined ? body.fbStatus : undefined,
      misaAppId: body.misaAppId !== undefined ? body.misaAppId : undefined,
      misaCompanyCode: body.misaCompanyCode !== undefined ? body.misaCompanyCode : undefined,
      misaStatus: body.misaStatus !== undefined ? body.misaStatus : undefined,
    };
    if (fbAccessToken !== undefined) update.fbAccessToken = fbAccessToken;
    if (pancakeToken !== undefined) update.pancakeToken = pancakeToken;
    if (misaApiKey !== undefined) update.misaApiKey = misaApiKey;

    const updated = await prisma.shopConfig.upsert({
      where: { shopId: scopedShopId },
      update,
      create: {
        shopId: scopedShopId,
        fbPageId: body.fbPageId || '',
        fbAccessToken: fbAccessToken ?? '',
        pancakeToken: pancakeToken ?? '',
        fbStatus: body.fbStatus || 'inactive',
        misaAppId: body.misaAppId || '',
        misaApiKey: misaApiKey ?? '',
        misaCompanyCode: body.misaCompanyCode || '',
        misaStatus: body.misaStatus || 'inactive',
      },
    });

    return jsonSuccess(maskConfig(updated, scopedShopId), 'Luu cau hinh tich hop thanh cong.');
  } catch (error) {
    if (error?.message === 'ENCRYPTION_KEY is not configured') {
      return jsonError('Server chua cau hinh ENCRYPTION_KEY de luu token/API key.', 500);
    }
    return serverError('[POST /api/integrations]', error);
  }
}

export async function PUT(request) {
  return POST(request);
}
