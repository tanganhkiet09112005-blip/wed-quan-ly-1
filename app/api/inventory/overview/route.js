import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { normalizeProductForResponse } from '@/lib/server/product-service';

function variantLabel(variant) {
  return [variant.size, variant.color, variant.name].filter(Boolean).join(' / ') || 'Mặc định';
}

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));
    if (!isAdmin(user) && !scopedShopId) return jsonError('Tài khoản shop chưa được gán shopId.', 403);

    const where = scopedShopId ? { shopId: scopedShopId } : {};
    const products = await prisma.product.findMany({
      where,
      include: {
        variants: { orderBy: [{ stockQuantity: 'asc' }, { sku: 'asc' }] },
      },
      orderBy: { name: 'asc' },
    });

    const normalizedProducts = products.map(normalizeProductForResponse);
    const variants = products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        category: product.category,
        sku: variant.sku,
        name: variant.name,
        size: variant.size,
        color: variant.color,
        label: variantLabel(variant),
        price: variant.price,
        stockQuantity: variant.stockQuantity,
        lowStockThreshold: variant.lowStockThreshold,
        status: variant.status,
        isLowStock: variant.status !== 'inactive' && variant.stockQuantity <= variant.lowStockThreshold,
        isOutOfStock: variant.status !== 'inactive' && variant.stockQuantity === 0,
      }))
    );

    const activeVariants = variants.filter((variant) => variant.status !== 'inactive');
    const lowStockItems = activeVariants
      .filter((variant) => variant.isLowStock)
      .sort((a, b) => (a.stockQuantity - a.lowStockThreshold) - (b.stockQuantity - b.lowStockThreshold));

    const totalStockQuantity = activeVariants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
    const totalInventoryValue = activeVariants.reduce(
      (sum, variant) => sum + variant.stockQuantity * Number(variant.price || 0),
      0
    );

    return jsonSuccess({
      products: normalizedProducts,
      variants,
      lowStockItems,
      summary: {
        totalProducts: products.length,
        totalVariants: variants.length,
        activeVariants: activeVariants.length,
        totalStockQuantity,
        lowStockSkuCount: lowStockItems.length,
        outOfStockSkuCount: activeVariants.filter((variant) => variant.isOutOfStock).length,
        totalInventoryValue,
      },
    });
  } catch (error) {
    return serverError('[GET /api/inventory/overview]', error);
  }
}
