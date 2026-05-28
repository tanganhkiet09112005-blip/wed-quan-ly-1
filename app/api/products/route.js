import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import {
  PRODUCT_STATUSES,
  buildProductSearchWhere,
  compactText,
  generateProductCode,
  generateVariantSku,
  normalizeProductForResponse,
  normalizeProductStatus,
  parsePositivePage,
  toNonNegativeInt,
  toNonNegativeNumber,
} from '@/lib/server/product-service';

function getProductInclude() {
  return {
    variants: { orderBy: [{ status: 'asc' }, { createdAt: 'asc' }] },
    _count: { select: { variants: true } },
  };
}

async function ensureUniqueProductCode(tx, shopId, preferredCode) {
  let code = preferredCode;
  let suffix = 1;
  while (await tx.product.findFirst({ where: { shopId, code }, select: { id: true } })) {
    suffix += 1;
    code = `${preferredCode}-${suffix}`;
  }
  return code;
}

async function ensureUniqueSku(tx, shopId, preferredSku) {
  let sku = preferredSku;
  let suffix = 1;
  while (await tx.productVariant.findFirst({ where: { shopId, sku }, select: { id: true } })) {
    suffix += 1;
    sku = `${preferredSku}-${suffix}`;
  }
  return sku;
}

function normalizeVariantPayloads(body, productCode) {
  const incoming = Array.isArray(body.variants) && body.variants.length > 0
    ? body.variants
    : [body.variant || {}];

  return incoming.map((variant, index) => {
    const price = toNonNegativeNumber(variant.price ?? body.price, 0);
    const stockQuantity = toNonNegativeInt(
      variant.stockQuantity ?? variant.stock ?? body.stockQuantity ?? body.stock,
      0
    );
    const lowStockThreshold = toNonNegativeInt(variant.lowStockThreshold ?? body.lowStockThreshold, 5);

    return {
      sku: compactText(variant.sku) || (index === 0 && compactText(body.sku)) || generateVariantSku(productCode, variant),
      name: compactText(variant.name) || null,
      size: compactText(variant.size) || null,
      color: compactText(variant.color) || null,
      price,
      stockQuantity,
      lowStockThreshold,
      status: normalizeProductStatus(variant.status, 'active'),
    };
  });
}

function validateVariantPayloads(variants) {
  const errors = {};
  variants.forEach((variant, index) => {
    if (!variant.sku) errors[`variants.${index}.sku`] = 'SKU là bắt buộc.';
    if (Number.isNaN(variant.price)) errors[`variants.${index}.price`] = 'Giá bán phải lớn hơn hoặc bằng 0.';
    if (Number.isNaN(variant.stockQuantity)) errors[`variants.${index}.stockQuantity`] = 'Tồn kho phải lớn hơn hoặc bằng 0.';
    if (Number.isNaN(variant.lowStockThreshold)) errors[`variants.${index}.lowStockThreshold`] = 'Ngưỡng tồn thấp phải lớn hơn hoặc bằng 0.';
  });
  return errors;
}

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const requestedShopId = searchParams.get('shopId');
    const scopedShopId = getScopedShopId(user, requestedShopId);
    if (!isAdmin(user) && !scopedShopId) return jsonError('Tài khoản shop chưa được gán shopId.', 403);

    const { page, limit, skip } = parsePositivePage(searchParams);
    const search = compactText(searchParams.get('search'));
    const status = compactText(searchParams.get('status'));
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const where = {
      ...buildProductSearchWhere(search, status),
      ...(scopedShopId ? { shopId: scopedShopId } : {}),
    };

    if (lowStockOnly) {
      const allProducts = await prisma.product.findMany({
        where,
        include: getProductInclude(),
        orderBy: { createdAt: 'desc' },
      });
      const filtered = allProducts
        .map(normalizeProductForResponse)
        .filter((product) => product.lowStockCount > 0);

      return jsonSuccess({
        items: filtered.slice(skip, skip + limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(Math.ceil(filtered.length / limit), 1),
      });
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: getProductInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return jsonSuccess({
      items: products.map(normalizeProductForResponse),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    return serverError('[GET /api/products]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const shopId = isAdmin(user) ? compactText(body.shopId) : user.shopId;
    if (!shopId) return jsonError(isAdmin(user) ? 'Thiếu shopId để tạo sản phẩm.' : 'Tài khoản shop chưa được gán shopId.', isAdmin(user) ? 400 : 403);

    const name = compactText(body.name);
    if (!name) return jsonError('Tên sản phẩm là bắt buộc.', 400);

    const status = normalizeProductStatus(body.status, 'active');
    if (body.status && !PRODUCT_STATUSES.includes(body.status)) {
      return jsonError('Trạng thái sản phẩm không hợp lệ.', 400);
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, code: true } });
    if (!shop) return jsonError('Không tìm thấy shop để tạo sản phẩm.', 404);

    const preferredCode = compactText(body.code) || generateProductCode(name, shop.code);
    const variantDrafts = normalizeVariantPayloads(body, preferredCode);
    const variantErrors = validateVariantPayloads(variantDrafts);
    if (Object.keys(variantErrors).length > 0) {
      return jsonError('Dữ liệu SKU không hợp lệ.', 400, variantErrors);
    }

    if (compactText(body.code)) {
      const duplicateCode = await prisma.product.findFirst({ where: { shopId, code: preferredCode }, select: { id: true } });
      if (duplicateCode) return jsonError(`Mã sản phẩm "${preferredCode}" đã tồn tại trong shop.`, 409);
    }

    const duplicateSkuInPayload = variantDrafts.find((variant, index) =>
      variantDrafts.findIndex((other) => other.sku === variant.sku) !== index
    );
    if (duplicateSkuInPayload) return jsonError(`SKU "${duplicateSkuInPayload.sku}" bị trùng trong form.`, 400);

    for (const variant of variantDrafts) {
      const existingSku = await prisma.productVariant.findFirst({ where: { shopId, sku: variant.sku }, select: { id: true } });
      if (existingSku) return jsonError(`SKU "${variant.sku}" đã tồn tại trong shop.`, 409);
    }

    const created = await prisma.$transaction(async (tx) => {
      const code = await ensureUniqueProductCode(tx, shopId, preferredCode);
      const product = await tx.product.create({
        data: {
          shopId,
          code,
          name,
          description: compactText(body.description) || null,
          category: compactText(body.category) || null,
          imageUrl: compactText(body.imageUrl) || null,
          status,
        },
      });

      for (const draft of variantDrafts) {
        const sku = await ensureUniqueSku(tx, shopId, draft.sku);
        const variant = await tx.productVariant.create({
          data: {
            ...draft,
            sku,
            shopId,
            productId: product.id,
          },
        });

        if (variant.stockQuantity > 0) {
          await tx.inventoryMovement.create({
            data: {
              shopId,
              productId: product.id,
              variantId: variant.id,
              type: 'import',
              quantity: variant.stockQuantity,
              note: 'Nhập kho ban đầu khi tạo sản phẩm.',
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: getProductInclude(),
      });
    });

    return jsonSuccess(normalizeProductForResponse(created), 'Tạo sản phẩm thành công.', 201);
  } catch (error) {
    return serverError('[POST /api/products]', error);
  }
}
