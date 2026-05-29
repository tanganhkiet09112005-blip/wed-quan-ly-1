import { prisma } from '@/lib/prisma';
import { assertAdminShopAccess, requireAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

/**
 * Check if a new tier overlaps with existing tiers in a rate plan.
 * Returns the overlapping tier if found, null otherwise.
 */
function findOverlappingTier(existingTiers, minWeight, maxWeight, excludeTierId = null) {
  return existingTiers.find((tier) => {
    if (excludeTierId && tier.id === excludeTierId) return false;
    // Overlap: new range intersects existing range
    return minWeight <= tier.maxWeight && maxWeight >= tier.minWeight;
  });
}

// GET /api/shops/[id]/pricing — Get pricing plan for a shop
export async function GET(request, { params }) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { id: shopId } = await params;

    // Verify access
    const err = await assertAdminShopAccess(user, shopId);
    if (err) return err;

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, code: true, name: true, ownerName: true, phone: true, adminId: true, admin: { select: { name: true } } },
    });
    if (!shop) return jsonError('Shop không tồn tại.', 404);

    const rate = await prisma.shopShippingRate.findFirst({
      where: { shopId, isActive: true },
      include: {
        tiers: { orderBy: { minWeight: 'asc' } },
        createdBy: { select: { name: true } },
      },
    });

    return jsonSuccess({ shop, rate: rate || null }, 'OK');
  } catch (error) {
    return serverError('[GET /api/shops/[id]/pricing]', error);
  }
}

// POST /api/shops/[id]/pricing — Add a tier (creates rate plan if none exists)
export async function POST(request, { params }) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { id: shopId } = await params;

    const err = await assertAdminShopAccess(user, shopId);
    if (err) return err;

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) return jsonError('Shop không tồn tại.', 404);

    const body = await request.json();
    const minWeight = parseFloat(body.minWeight);
    const maxWeight = parseFloat(body.maxWeight);
    const price = parseFloat(body.price);

    const errors = {};
    if (isNaN(minWeight) || minWeight < 0) errors.minWeight = 'Từ kg phải >= 0.';
    if (isNaN(maxWeight) || maxWeight <= 0) errors.maxWeight = 'Đến kg phải > 0.';
    if (!isNaN(minWeight) && !isNaN(maxWeight) && minWeight >= maxWeight) {
      errors.maxWeight = 'Đến kg phải lớn hơn Từ kg.';
    }
    if (isNaN(price) || price <= 0) errors.price = 'Giá cước phải > 0.';
    if (Object.keys(errors).length > 0) return jsonError('Dữ liệu không hợp lệ.', 400, errors);

    // Get or create the active rate plan
    let rate = await prisma.shopShippingRate.findFirst({
      where: { shopId, isActive: true },
      include: { tiers: true },
    });

    if (!rate) {
      rate = await prisma.shopShippingRate.create({
        data: {
          shopId,
          name: 'Bảng giá mặc định',
          isActive: true,
          createdByAdminId: user.id,
          tiers: [],
        },
        include: { tiers: true },
      });
    }

    // Check for overlap
    const overlap = findOverlappingTier(rate.tiers, minWeight, maxWeight);
    if (overlap) {
      return jsonError(
        `Mốc cân bị trùng với mốc hiện có: ${overlap.minWeight}kg - ${overlap.maxWeight}kg. Vui lòng điều chỉnh.`,
        400
      );
    }

    const tier = await prisma.shopShippingRateTier.create({
      data: {
        rateId: rate.id,
        minWeight,
        maxWeight,
        price,
        note: body.note?.trim() || null,
      },
    });

    return jsonSuccess(tier, 'Thêm mốc cân thành công.', 201);
  } catch (error) {
    return serverError('[POST /api/shops/[id]/pricing]', error);
  }
}
