import { prisma } from '@/lib/prisma';
import { assertShopAccess, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import {
  PRODUCT_STATUSES,
  compactText,
  generateVariantSku,
  normalizeProductForResponse,
  normalizeProductStatus,
  toNonNegativeInt,
  toNonNegativeNumber,
} from '@/lib/server/product-service';

function getProductInclude() {
  return {
    variants: { orderBy: [{ status: 'asc' }, { createdAt: 'asc' }] },
    inventoryMovements: {
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        variant: { select: { id: true, sku: true, name: true, size: true, color: true } },
      },
    },
    shop: { select: { id: true, code: true, name: true } },
    _count: { select: { variants: true } },
  };
}

async function getProductForAccess(id) {
  return prisma.product.findUnique({
    where: { id },
    select: { id: true, shopId: true, code: true },
  });
}

function validateStatus(status, label) {
  if (status && !PRODUCT_STATUSES.includes(status)) {
    return `${label} không hợp lệ.`;
  }
  return null;
}

export async function GET(_request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const accessProduct = await getProductForAccess(id);
    if (!accessProduct) return jsonError('Không tìm thấy sản phẩm.', 404);

    const accessError = await assertShopAccess(user, accessProduct.shopId);
    if (accessError) return accessError;

    const product = await prisma.product.findUnique({
      where: { id },
      include: getProductInclude(),
    });

    return jsonSuccess(normalizeProductForResponse(product));
  } catch (error) {
    return serverError('[GET /api/products/[id]]', error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const accessProduct = await getProductForAccess(id);
    if (!accessProduct) return jsonError('Không tìm thấy sản phẩm.', 404);

    const accessError = await assertShopAccess(user, accessProduct.shopId);
    if (accessError) return accessError;

    const body = await request.json();
    const statusError = validateStatus(body.status, 'Trạng thái sản phẩm');
    if (statusError) return jsonError(statusError, 400);

    const productData = {};
    if (body.name !== undefined) {
      const name = compactText(body.name);
      if (!name) return jsonError('Tên sản phẩm là bắt buộc.', 400);
      productData.name = name;
    }
    if (body.code !== undefined) {
      const code = compactText(body.code);
      if (!code) return jsonError('Mã sản phẩm là bắt buộc.', 400);
      const duplicateCode = await prisma.product.findFirst({
        where: { shopId: accessProduct.shopId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicateCode) return jsonError(`Mã sản phẩm "${code}" đã tồn tại trong shop.`, 409);
      productData.code = code;
    }
    if (body.description !== undefined) productData.description = compactText(body.description) || null;
    if (body.category !== undefined) productData.category = compactText(body.category) || null;
    if (body.imageUrl !== undefined) productData.imageUrl = compactText(body.imageUrl) || null;
    if (body.status !== undefined) productData.status = normalizeProductStatus(body.status, 'active');

    const variants = Array.isArray(body.variants) ? body.variants : [];
    for (const variant of variants) {
      if (variant.status !== undefined) {
        const err = validateStatus(variant.status, 'Trạng thái SKU');
        if (err) return jsonError(err, 400);
      }
      if (variant.price !== undefined && Number.isNaN(toNonNegativeNumber(variant.price))) {
        return jsonError('Giá SKU phải lớn hơn hoặc bằng 0.', 400);
      }
      if (variant.stockQuantity !== undefined && Number.isNaN(toNonNegativeInt(variant.stockQuantity))) {
        return jsonError('Tồn kho SKU phải lớn hơn hoặc bằng 0.', 400);
      }
      if (variant.lowStockThreshold !== undefined && Number.isNaN(toNonNegativeInt(variant.lowStockThreshold))) {
        return jsonError('Ngưỡng tồn thấp phải lớn hơn hoặc bằng 0.', 400);
      }
      if (variant.sku !== undefined) {
        const sku = compactText(variant.sku);
        if (!sku) return jsonError('SKU là bắt buộc.', 400);
        const duplicateSku = await prisma.productVariant.findFirst({
          where: {
            shopId: accessProduct.shopId,
            sku,
            ...(variant.id ? { NOT: { id: variant.id } } : {}),
          },
          select: { id: true },
        });
        if (duplicateSku) return jsonError(`SKU "${sku}" đã tồn tại trong shop.`, 409);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(productData).length > 0) {
        await tx.product.update({ where: { id }, data: productData });
      }

      for (const variant of variants) {
        const variantData = {};
        if (variant.sku !== undefined) variantData.sku = compactText(variant.sku);
        if (variant.name !== undefined) variantData.name = compactText(variant.name) || null;
        if (variant.size !== undefined) variantData.size = compactText(variant.size) || null;
        if (variant.color !== undefined) variantData.color = compactText(variant.color) || null;
        if (variant.price !== undefined) variantData.price = toNonNegativeNumber(variant.price);
        if (variant.lowStockThreshold !== undefined) variantData.lowStockThreshold = toNonNegativeInt(variant.lowStockThreshold);
        if (variant.status !== undefined) variantData.status = normalizeProductStatus(variant.status, 'active');

        if (variant.id) {
          const current = await tx.productVariant.findFirst({
            where: { id: variant.id, productId: id, shopId: accessProduct.shopId },
          });
          if (!current) throw new Error('SKU không thuộc sản phẩm hiện tại.');

          if (variant.stockQuantity !== undefined) {
            const nextStock = toNonNegativeInt(variant.stockQuantity);
            const delta = nextStock - current.stockQuantity;
            variantData.stockQuantity = nextStock;
            if (delta !== 0) {
              await tx.inventoryMovement.create({
                data: {
                  shopId: accessProduct.shopId,
                  productId: id,
                  variantId: variant.id,
                  type: 'adjustment',
                  quantity: delta,
                  note: 'Điều chỉnh tồn kho từ màn chi tiết sản phẩm.',
                },
              });
            }
          }

          if (Object.keys(variantData).length > 0) {
            await tx.productVariant.update({ where: { id: variant.id }, data: variantData });
          }
        } else {
          const sku = variantData.sku || generateVariantSku(productData.code || accessProduct.code, variant);
          const created = await tx.productVariant.create({
            data: {
              shopId: accessProduct.shopId,
              productId: id,
              sku,
              name: variantData.name || null,
              size: variantData.size || null,
              color: variantData.color || null,
              price: variantData.price ?? 0,
              stockQuantity: variant.stockQuantity !== undefined ? toNonNegativeInt(variant.stockQuantity) : 0,
              lowStockThreshold: variantData.lowStockThreshold ?? 5,
              status: variantData.status || 'active',
            },
          });

          if (created.stockQuantity > 0) {
            await tx.inventoryMovement.create({
              data: {
                shopId: accessProduct.shopId,
                productId: id,
                variantId: created.id,
                type: 'import',
                quantity: created.stockQuantity,
                note: 'Nhập kho ban đầu cho SKU mới.',
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: getProductInclude(),
      });
    });

    return jsonSuccess(normalizeProductForResponse(updated), 'Cập nhật sản phẩm thành công.');
  } catch (error) {
    if (error?.message === 'SKU không thuộc sản phẩm hiện tại.') {
      return jsonError(error.message, 403);
    }
    return serverError('[PATCH /api/products/[id]]', error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const accessProduct = await getProductForAccess(id);
    if (!accessProduct) return jsonError('Không tìm thấy sản phẩm.', 404);

    const accessError = await assertShopAccess(user, accessProduct.shopId);
    if (accessError) return accessError;

    const product = await prisma.product.update({
      where: { id },
      data: {
        status: 'inactive',
        variants: { updateMany: { where: { productId: id }, data: { status: 'inactive' } } },
      },
      include: getProductInclude(),
    });

    return jsonSuccess(normalizeProductForResponse(product), 'Đã ngừng bán sản phẩm.');
  } catch (error) {
    return serverError('[DELETE /api/products/[id]]', error);
  }
}
