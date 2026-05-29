import { prisma } from '@/lib/prisma';
import { assertAdminShopAccess, requireAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

function findOverlappingTier(existingTiers, minWeight, maxWeight, excludeTierId = null) {
  return existingTiers.find((tier) => {
    if (excludeTierId && tier.id === excludeTierId) return false;
    return minWeight <= tier.maxWeight && maxWeight >= tier.minWeight;
  });
}

// PATCH /api/shops/[id]/pricing/[tierId] — Update a tier
export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { id: shopId, tierId } = await params;

    const err = await assertAdminShopAccess(user, shopId);
    if (err) return err;

    // Verify tier belongs to this shop
    const tier = await prisma.shopShippingRateTier.findUnique({
      where: { id: tierId },
      include: { rate: { include: { tiers: true } } },
    });

    if (!tier) return jsonError('Mốc cân không tồn tại.', 404);
    if (tier.rate.shopId !== shopId) return jsonError('Mốc cân không thuộc shop này.', 403);

    const body = await request.json();
    const updateData = {};
    const errors = {};

    const minWeight = body.minWeight !== undefined ? parseFloat(body.minWeight) : tier.minWeight;
    const maxWeight = body.maxWeight !== undefined ? parseFloat(body.maxWeight) : tier.maxWeight;
    const price = body.price !== undefined ? parseFloat(body.price) : tier.price;

    if (body.minWeight !== undefined) {
      if (isNaN(minWeight) || minWeight < 0) errors.minWeight = 'Từ kg phải >= 0.';
      else updateData.minWeight = minWeight;
    }
    if (body.maxWeight !== undefined) {
      if (isNaN(maxWeight) || maxWeight <= 0) errors.maxWeight = 'Đến kg phải > 0.';
      else updateData.maxWeight = maxWeight;
    }
    if (minWeight >= maxWeight) errors.maxWeight = 'Đến kg phải lớn hơn Từ kg.';
    if (body.price !== undefined) {
      if (isNaN(price) || price <= 0) errors.price = 'Giá cước phải > 0.';
      else updateData.price = price;
    }
    if (body.note !== undefined) updateData.note = body.note?.trim() || null;

    if (Object.keys(errors).length > 0) return jsonError('Dữ liệu không hợp lệ.', 400, errors);

    // Check for overlap (exclude current tier)
    if (body.minWeight !== undefined || body.maxWeight !== undefined) {
      const overlap = findOverlappingTier(tier.rate.tiers, minWeight, maxWeight, tierId);
      if (overlap) {
        return jsonError(
          `Mốc cân bị trùng với mốc hiện có: ${overlap.minWeight}kg - ${overlap.maxWeight}kg.`,
          400
        );
      }
    }

    if (Object.keys(updateData).length === 0) return jsonError('Không có dữ liệu để cập nhật.', 400);

    const updated = await prisma.shopShippingRateTier.update({
      where: { id: tierId },
      data: updateData,
    });

    return jsonSuccess(updated, 'Cập nhật mốc cân thành công.');
  } catch (error) {
    return serverError('[PATCH /api/shops/[id]/pricing/[tierId]]', error);
  }
}

// DELETE /api/shops/[id]/pricing/[tierId] — Remove a tier
export async function DELETE(request, { params }) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { id: shopId, tierId } = await params;

    const err = await assertAdminShopAccess(user, shopId);
    if (err) return err;

    const tier = await prisma.shopShippingRateTier.findUnique({
      where: { id: tierId },
      include: { rate: { select: { shopId: true } } },
    });

    if (!tier) return jsonError('Mốc cân không tồn tại.', 404);
    if (tier.rate.shopId !== shopId) return jsonError('Mốc cân không thuộc shop này.', 403);

    await prisma.shopShippingRateTier.delete({ where: { id: tierId } });

    return jsonSuccess(null, 'Đã xóa mốc cân.');
  } catch (error) {
    return serverError('[DELETE /api/shops/[id]/pricing/[tierId]]', error);
  }
}
