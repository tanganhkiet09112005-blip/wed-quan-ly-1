import { prisma } from '@/lib/prisma';
import { assertShopAccess, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { INVENTORY_MOVEMENT_TYPES, compactText } from '@/lib/server/product-service';

function normalizeMovementQuantity(type, quantity) {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed === 0) return null;

  if (type === 'import') return Math.abs(parsed);
  if (type === 'export' || type === 'order') return -Math.abs(parsed);
  return parsed;
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const variantId = compactText(body.variantId);
    if (!variantId) return jsonError('Vui lòng chọn SKU cần điều chỉnh.', 400);

    const type = compactText(body.type) || 'adjustment';
    if (!INVENTORY_MOVEMENT_TYPES.includes(type)) {
      return jsonError('Loại điều chỉnh tồn kho không hợp lệ.', 400);
    }

    const delta = normalizeMovementQuantity(type, body.quantity);
    if (delta === null) return jsonError('Số lượng điều chỉnh phải là số nguyên khác 0.', 400);

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, name: true, code: true } } },
    });
    if (!variant) return jsonError('Không tìm thấy SKU cần điều chỉnh.', 404);

    const accessError = assertShopAccess(user, variant.shopId);
    if (accessError) return accessError;

    const nextStock = variant.stockQuantity + delta;
    if (nextStock < 0) {
      return jsonError('Tồn kho sau điều chỉnh không được âm.', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: nextStock },
      });
      const movement = await tx.inventoryMovement.create({
        data: {
          shopId: variant.shopId,
          productId: variant.productId,
          variantId,
          type,
          quantity: delta,
          note: compactText(body.note) || null,
        },
      });

      return { movement, variant: updatedVariant, product: variant.product };
    });

    return jsonSuccess(result, 'Điều chỉnh tồn kho thành công.', 201);
  } catch (error) {
    return serverError('[POST /api/inventory/movements]', error);
  }
}
