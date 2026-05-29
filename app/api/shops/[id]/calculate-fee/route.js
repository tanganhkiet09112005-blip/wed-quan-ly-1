import { prisma } from '@/lib/prisma';
import { isAdmin, isSuperAdmin, isSubAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

// GET /api/shops/[id]/calculate-fee?weight=X
// Calculates shipping fee for a given weight using the shop's active rate plan.
// Permission:
//   - SUPER_ADMIN: any shop
//   - Sub-admin: only shops they manage
//   - SHOP user: only their own shop
export async function GET(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id: shopId } = await params;
    const { searchParams } = new URL(request.url);
    const weightStr = searchParams.get('weight');

    // Permission check
    if (!isAdmin(user)) {
      // Shop user - can only calculate for their own shop
      if (user.shopId !== shopId) {
        return jsonError('Ban khong co quyen tinh cuoc cho shop khac.', 403);
      }
    } else if (isSubAdmin(user)) {
      // Sub-admin: verify shop belongs to them
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { adminId: true },
      });
      if (!shop) return jsonError('Shop không tồn tại.', 404);
      if (shop.adminId !== user.id) {
        return jsonError('Ban khong co quyen tinh cuoc cho shop nay.', 403);
      }
    }
    // SUPER_ADMIN: no extra check needed

    // Validate weight
    const weight = parseFloat(weightStr);
    if (isNaN(weight) || weight < 0) {
      return jsonError('Trọng lượng không hợp lệ. Vui lòng nhập số >= 0.', 400);
    }

    // Get active rate plan for this shop
    const rate = await prisma.shopShippingRate.findFirst({
      where: { shopId, isActive: true },
      include: {
        tiers: { orderBy: { minWeight: 'asc' } },
      },
    });

    if (!rate || rate.tiers.length === 0) {
      return jsonSuccess(
        { hasRate: false, fee: null, tier: null },
        'Shop chưa được cấu hình bảng giá cước. Vui lòng liên hệ Admin.'
      );
    }

    // Find matching tier: minWeight <= weight <= maxWeight
    const matchedTier = rate.tiers.find(
      (tier) => weight >= tier.minWeight && weight <= tier.maxWeight
    );

    if (!matchedTier) {
      return jsonSuccess(
        {
          hasRate: true,
          fee: null,
          tier: null,
          message: `Trọng lượng ${weight}kg không nằm trong bất kỳ mốc cân nào đã cấu hình. Vui lòng liên hệ Admin để cập nhật bảng giá.`,
        },
        'Không tìm thấy mốc cân phù hợp.'
      );
    }

    return jsonSuccess({
      hasRate: true,
      fee: matchedTier.price,
      tierId: matchedTier.id,
      tier: {
        id: matchedTier.id,
        minWeight: matchedTier.minWeight,
        maxWeight: matchedTier.maxWeight,
        price: matchedTier.price,
        note: matchedTier.note,
      },
    }, 'OK');
  } catch (error) {
    return serverError('[GET /api/shops/[id]/calculate-fee]', error);
  }
}
