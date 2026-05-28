import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { generateOrderCode, resolveOrderCustomer } from '@/lib/server/order-service';

const MOCK_NAMES = [
  'Nguyễn Hữu Mock', 'Trần Thị Sync', 'Lê Hoàng Shopee', 'Vũ Hà Lazada',
  'Phạm Đông TikTok', 'Đặng Minh Sàn', 'Bùi Phương TMĐT', 'Ngô Khánh UPOS'
];

const MOCK_PHONES = [
  '0912345678', '0987654321', '0905556677', '0344556677',
  '0399887766', '0866554433', '0778899001', '0522334455'
];

const MOCK_ADDRESSES = [
  '123 Đường Láng, Đống Đa, Hà Nội',
  '456 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  '789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
  '101 Hùng Vương, Ninh Kiều, Cần Thơ',
  '202 Trần Hưng Đạo, Quy Nhơn, Bình Định'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = params;
    const shopId = getScopedShopId(user);

    const connection = await prisma.ecommerceChannelConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return jsonError('Không tìm thấy kết nối sàn TMĐT.', 404);
    }

    // Security multi-tenant check
    if (!isAdmin(user) && connection.shopId !== shopId) {
      return jsonError('Bạn không có quyền đồng bộ đơn hàng của shop khác.', 403);
    }

    if (connection.mode !== 'mock') {
      return jsonError('Chỉ được đồng bộ đơn hàng giả lập trong chế độ Mock (Mock Mode).', 400);
    }

    // Load active shop variants for mapping SKU
    const activeVariants = await prisma.productVariant.findMany({
      where: {
        shopId: connection.shopId,
        status: 'active',
        product: {
          status: 'active',
        },
      },
      include: {
        product: true,
      },
    });

    if (activeVariants.length === 0) {
      return jsonError(
        'Shop chưa có sản phẩm/SKU hoạt động để đồng bộ đơn mock. Vui lòng thêm sản phẩm active trong danh mục trước.',
        400
      );
    }

    // Generate 1-3 orders
    const ordersCount = Math.floor(Math.random() * 3) + 1;
    const createdOrders = [];

    await prisma.$transaction(async (tx) => {
      for (let oIdx = 0; oIdx < ordersCount; oIdx++) {
        const customerName = getRandomItem(MOCK_NAMES);
        const customerPhone = getRandomItem(MOCK_PHONES);
        const customerAddress = getRandomItem(MOCK_ADDRESSES);

        // Resolve customer in DB
        const customerPayload = {
          shippingName: customerName,
          shippingPhone: customerPhone,
          shippingAddress: customerAddress,
        };
        const customerResult = await resolveOrderCustomer(tx, connection.shopId, customerPayload);
        if (customerResult.error) {
          throw new Error(customerResult.error);
        }

        // Add 1-2 random items
        const itemsCount = Math.floor(Math.random() * 2) + 1;
        const normalizedItems = [];
        let totalValue = 0;

        // Shuffle variants or pick randomly
        const pickedVariants = [];
        for (let i = 0; i < itemsCount; i++) {
          const v = getRandomItem(activeVariants);
          // Avoid duplicate variants in same order for clean items
          if (!pickedVariants.some((pv) => pv.id === v.id)) {
            pickedVariants.push(v);
          }
        }

        pickedVariants.forEach((v) => {
          const qty = Math.floor(Math.random() * 2) + 1; // 1-2 items
          const price = Number(v.price || 0);
          const lineTotal = price * qty;
          totalValue += lineTotal;

          const variantLabel = [v.size, v.color, v.name].filter(Boolean).join(' / ') || 'Mặc định';
          const itemName = `${v.product.name} - ${variantLabel}`;

          normalizedItems.push({
            name: itemName,
            quantity: qty,
            price,
            unitPrice: price,
            lineTotal,
            sku: v.sku,
            productCode: v.product.code,
            productName: v.product.name,
            variantName: v.name || variantLabel,
            size: v.size || null,
            color: v.color || null,
            productId: v.productId,
            variantId: v.id,
          });
        });

        const shippingFee = 30000;
        const carrierFee = 30000;
        const codAmount = totalValue + shippingFee; // COD sum = items + shipping fee

        const orderCode = generateOrderCode();
        const newOrder = await tx.order.create({
          data: {
            code: orderCode,
            status: 'pending', // Synchronized new ecommerce orders are always PENDING
            codStatus: 'pending',
            channel: connection.platform, // 'shopee', 'lazada' or 'tiktok'
            shippingName: customerName,
            shippingPhone: customerPhone,
            shippingAddress: customerAddress,
            codAmount,
            shippingFee,
            carrierFee,
            totalValue,
            note: `[Mock Sync] Đồng bộ đơn tự động từ sàn ${connection.platform.toUpperCase()}`,
            customerId: customerResult.customerId,
            shopId: connection.shopId,
            items: {
              create: normalizedItems,
            },
          },
        });

        createdOrders.push(newOrder);
      }

      // Update last sync time of the connection
      await tx.ecommerceChannelConnection.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
        },
      });
    });

    return jsonSuccess(
      {
        syncedCount: createdOrders.length,
        orders: createdOrders.map((o) => ({ id: o.id, code: o.code, codAmount: o.codAmount })),
      },
      `Đã đồng bộ thành công ${createdOrders.length} đơn hàng giả lập từ sàn ${connection.platform.toUpperCase()}.`
    );
  } catch (error) {
    return serverError('[POST /api/ecommerce/channels/[id]/sync-mock]', error);
  }
}
