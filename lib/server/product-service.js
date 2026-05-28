export const PRODUCT_STATUSES = ['active', 'inactive'];
export const INVENTORY_MOVEMENT_TYPES = ['import', 'export', 'adjustment', 'order'];

export function normalizeProductStatus(value, fallback = 'active') {
  return PRODUCT_STATUSES.includes(value) ? value : fallback;
}

export function parsePositivePage(searchParams) {
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
  return { page, limit, skip: (page - 1) * limit };
}

export function toNonNegativeNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return parsed < 0 ? NaN : parsed;
}

export function toNonNegativeInt(value, fallback = 0) {
  const parsed = toNonNegativeNumber(value, fallback);
  if (Number.isNaN(parsed)) return NaN;
  return Math.floor(parsed);
}

export function compactText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function codeBase(value) {
  const cleaned = compactText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 4).toUpperCase())
    .join('-')
    .slice(0, 18);
  return cleaned || 'SP';
}

export function generateProductCode(name, shopCode = 'SHOP') {
  const rand = Math.random().toString(36).slice(-4).toUpperCase();
  return `${shopCode}-${codeBase(name)}-${rand}`;
}

export function generateVariantSku(productCode, variant = {}) {
  const suffix = codeBase([variant.size, variant.color, variant.name].filter(Boolean).join(' ') || 'SKU');
  const rand = Math.random().toString(36).slice(-3).toUpperCase();
  return `${productCode}-${suffix}-${rand}`;
}

export function getProductStockSummary(product) {
  const variants = product?.variants || [];
  const activeVariants = variants.filter((variant) => variant.status !== 'inactive');
  const stockVariants = activeVariants.length > 0 ? activeVariants : variants;
  const prices = stockVariants.map((variant) => Number(variant.price || 0));
  const totalStock = stockVariants.reduce((sum, variant) => sum + Number(variant.stockQuantity || 0), 0);
  const lowStockItems = stockVariants.filter(
    (variant) => Number(variant.stockQuantity || 0) <= Number(variant.lowStockThreshold ?? 5)
  );
  const outOfStockItems = stockVariants.filter((variant) => Number(variant.stockQuantity || 0) === 0);

  return {
    variantCount: variants.length,
    activeVariantCount: activeVariants.length,
    totalStock,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  };
}

export function normalizeProductForResponse(product) {
  if (!product) return null;
  const variants = product.variants || [];
  const defaultVariant = variants.find((variant) => variant.status === 'active') || variants[0] || null;
  const stockSummary = getProductStockSummary(product);

  return {
    ...product,
    variantCount: stockSummary.variantCount,
    totalStock: stockSummary.totalStock,
    lowStockCount: stockSummary.lowStockCount,
    outOfStockCount: stockSummary.outOfStockCount,
    priceMin: stockSummary.priceMin,
    priceMax: stockSummary.priceMax,
    defaultVariant,
    stockSummary,
    // Backward-compatible aliases for POS and older product UI code.
    sku: defaultVariant?.sku || product.code,
    price: defaultVariant?.price ?? stockSummary.priceMin ?? 0,
    stock: stockSummary.totalStock,
    stockQuantity: stockSummary.totalStock,
    lowStockThreshold: defaultVariant?.lowStockThreshold ?? 5,
    _count: {
      ...(product._count || {}),
      variants: product._count?.variants ?? stockSummary.variantCount,
    },
  };
}

export function buildProductSearchWhere(search, status) {
  const where = {};
  if (PRODUCT_STATUSES.includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } },
      { category: { contains: search } },
      {
        variants: {
          some: {
            OR: [
              { sku: { contains: search } },
              { name: { contains: search } },
              { size: { contains: search } },
              { color: { contains: search } },
            ],
          },
        },
      },
    ];
  }
  return where;
}

