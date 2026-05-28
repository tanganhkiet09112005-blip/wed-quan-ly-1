require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

function encryptSecret(value) {
  if (!value) return value || '';
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) return value;

  const key = crypto.createHash('sha256').update(rawKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

const carriers = [
  { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)', codFeePercent: 1.0 },
  { code: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', codFeePercent: 1.2 },
  { code: 'JT', name: 'J&T Express', codFeePercent: 1.5 },
  { code: 'SPX', name: 'Shopee Xpress (SPX)', codFeePercent: 1.1 },
];

const shopSeeds = [
  {
    code: 'SHOP001',
    name: 'GenZ Fashion',
    ownerName: 'Trần Quang Anh',
    email: 'genz@hship.vn',
    phone: '0988777666',
    pageId: 'genz-fashion-page',
    products: [
      ['Áo đỏ form rộng size M', 199000],
      ['Váy đen dáng dài size L', 329000],
      ['Quần jean xanh slimfit', 399000],
      ['Áo khoác bomber nữ', 459000],
      ['Set croptop basic', 289000],
    ],
  },
  {
    code: 'SHOP002',
    name: 'Baby Store',
    ownerName: 'Lê Thị Thảo',
    email: 'baby@hship.vn',
    phone: '0977666555',
    pageId: 'baby-store-page',
    products: [
      ['Bỉm Merries size M', 340000],
      ['Bộ body cotton cho bé', 185000],
      ['Sữa tắm gội dịu nhẹ', 159000],
      ['Xe tập đi thông minh', 520000],
      ['Khăn sữa cotton 10 cái', 99000],
    ],
  },
  {
    code: 'SHOP003',
    name: 'Smart Shop',
    ownerName: 'Phạm Hồng Nam',
    email: 'smart@hship.vn',
    phone: '0966555444',
    pageId: 'smart-shop-page',
    products: [
      ['Camera wifi trong nhà', 690000],
      ['Ổ cắm thông minh', 249000],
      ['Đèn ngủ cảm biến', 189000],
      ['Máy lọc không khí mini', 1290000],
      ['Robot hút bụi basic', 2990000],
    ],
  },
];

const customerNames = [
  'Nguyễn Thị Lan',
  'Trần Văn Minh',
  'Lê Thị Hoa',
  'Phạm Quốc Bảo',
  'Đặng Thanh Hương',
  'Vũ Quang Hùng',
  'Hoàng Thị Mai',
  'Bùi Anh Khoa',
  'Đỗ Ngọc Anh',
  'Mai Thùy Dương',
  'Lý Văn Bom',
  'Ngô Thị Hẹn',
];

const districts = [
  '12 Nguyễn Huệ, Quận 1, TP.HCM',
  '25 Lê Lợi, Quận 1, TP.HCM',
  '87 Cách Mạng Tháng 8, Quận 3, TP.HCM',
  '42 Nguyễn Trãi, Quận 5, TP.HCM',
  '16 Phan Xích Long, Phú Nhuận, TP.HCM',
  '211 Hoàng Văn Thụ, Tân Bình, TP.HCM',
  '36 Võ Văn Tần, Quận 3, TP.HCM',
  '74 Nguyễn Gia Trí, Bình Thạnh, TP.HCM',
  '19 Lũy Bán Bích, Tân Phú, TP.HCM',
  '58 Nguyễn Văn Linh, Quận 7, TP.HCM',
  '101 Tỉnh Lộ 10, Bình Tân, TP.HCM',
  '33 Phạm Văn Đồng, Thủ Đức, TP.HCM',
];

const statusCycle = [
  'draft',
  'pending',
  'ready_to_ship',
  'pushed_to_carrier',
  'shipping',
  'delivered',
  'delivered',
  'partial_delivered',
  'returned',
  'cancelled',
  'failed',
  'shipping',
  'delivered',
  'pending',
  'pushed_to_carrier',
  'returned',
  'delivered',
  'cancelled',
  'failed',
  'partial_delivered',
  'shipping',
  'ready_to_ship',
  'delivered',
  'draft',
];

const channels = ['direct', 'fanpage', 'livestream'];

function slugCode(value) {
  return String(value || 'SP')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 4).toUpperCase())
    .join('-')
    .slice(0, 20) || 'SP';
}

function buildProductCatalog(shopSeed, shopIndex) {
  const extraCatalogs = [
    [
      ['Áo sơ mi linen nữ', 279000, 'Áo'],
      ['Quần short kaki basic', 249000, 'Quần'],
      ['Chân váy chữ A', 299000, 'Váy'],
      ['Túi tote canvas', 159000, 'Phụ kiện'],
      ['Mũ bucket streetwear', 129000, 'Phụ kiện'],
      ['Set đồ ngủ cotton', 319000, 'Set'],
    ],
    [
      ['Bình sữa chống sặc', 225000, 'Đồ dùng bé'],
      ['Bộ đồ sơ sinh cotton', 149000, 'Quần áo bé'],
      ['Khăn tắm xô mềm', 135000, 'Đồ dùng bé'],
      ['Đồ chơi gỗ xếp hình', 189000, 'Đồ chơi'],
      ['Ghế ăn dặm gấp gọn', 790000, 'Đồ dùng bé'],
      ['Gối chống trào ngược', 265000, 'Đồ ngủ bé'],
    ],
    [
      ['Tai nghe bluetooth mini', 390000, 'Phụ kiện điện tử'],
      ['Sạc nhanh USB-C 30W', 299000, 'Phụ kiện điện tử'],
      ['Chuột không dây silent', 259000, 'Thiết bị văn phòng'],
      ['Bàn phím cơ compact', 890000, 'Thiết bị văn phòng'],
      ['Webcam full HD', 720000, 'Camera'],
      ['Đồng hồ thông minh basic', 990000, 'Thiết bị đeo'],
    ],
  ];

  const base = shopSeed.products.map(([name, price], index) => [
    name,
    price,
    index % 2 === 0 ? 'Sản phẩm chủ lực' : 'Sản phẩm bán chạy',
  ]);

  return [...base, ...extraCatalogs[shopIndex]].slice(0, 11);
}

function variantDraftsForProduct(shopSeed, productIndex, productName, basePrice) {
  const sizes = ['S', 'M', 'L'];
  const colors = ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Be'];
  const variantCount = (productIndex % 3) + 1;
  return Array.from({ length: variantCount }).map((_, variantIndex) => {
    const threshold = 5 + variantIndex * 2;
    const lowStock = (productIndex + variantIndex) % 4 === 0;
    const stockQuantity = lowStock ? Math.max(0, threshold - 2) : 18 + productIndex * 3 + variantIndex * 7;
    const size = sizes[(productIndex + variantIndex) % sizes.length];
    const color = colors[(productIndex * 2 + variantIndex) % colors.length];
    return {
      sku: `${shopSeed.code}-${String(productIndex + 1).padStart(2, '0')}-${String(variantIndex + 1).padStart(2, '0')}-${slugCode(productName).slice(0, 8)}`,
      name: `${size} / ${color}`,
      size,
      color,
      price: basePrice + variantIndex * 20000,
      stockQuantity,
      lowStockThreshold: threshold,
      status: 'active',
    };
  });
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function codStatusForOrder(status) {
  if (status === 'delivered') return 'collected';
  if (status === 'returned' || status === 'failed') return 'returned';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'shipping' || status === 'pushed_to_carrier' || status === 'partial_delivered') return 'collecting';
  return 'pending';
}

function carrierEventForStatus(status) {
  if (status === 'pushed_to_carrier') return 'accepted';
  if (status === 'shipping') return 'shipping';
  if (status === 'delivered') return 'delivered';
  if (status === 'partial_delivered') return 'partial_delivered';
  if (status === 'returned') return 'returned';
  if (status === 'failed') return 'failed';
  if (status === 'cancelled') return 'cancelled';
  return null;
}

function shouldHaveTracking(status) {
  return ['pushed_to_carrier', 'shipping', 'delivered', 'partial_delivered', 'returned', 'failed'].includes(status);
}

function shouldSeedDeductStock(status) {
  return ['pending', 'ready_to_ship', 'pushed_to_carrier', 'shipping', 'delivered', 'partial_delivered', 'returned', 'failed'].includes(status);
}

function shouldSeedRestoreStock(status) {
  return ['returned', 'failed'].includes(status);
}

function orderItemFromVariant(variant, quantity) {
  const unitPrice = Number(variant.price || 0);
  const variantName = variant.name || [variant.size, variant.color].filter(Boolean).join(' / ') || null;

  return {
    name: [variant.product.name, variantName].filter(Boolean).join(' - '),
    quantity,
    price: unitPrice,
    unitPrice,
    lineTotal: unitPrice * quantity,
    sku: variant.sku,
    productCode: variant.product.code,
    productName: variant.product.name,
    variantName,
    size: variant.size,
    color: variant.color,
    productId: variant.productId,
    variantId: variant.id,
  };
}

async function applySeedInventoryForOrder(shop, order, items, status) {
  const linkedItems = items.filter((item) => item.variantId);
  if (!linkedItems.length || !shouldSeedDeductStock(status)) return;

  for (const item of linkedItems) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stockQuantity: { decrement: item.quantity } },
    });
    await prisma.inventoryMovement.create({
      data: {
        shopId: shop.id,
        productId: item.productId,
        variantId: item.variantId,
        orderId: order.id,
        type: 'order',
        quantity: -item.quantity,
        note: `Seed demo X3: trừ tồn cho đơn ${order.code}.`,
      },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stockDeductedAt: addDays(order.createdAt, 1) },
  });

  if (!shouldSeedRestoreStock(status)) return;

  for (const item of linkedItems) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stockQuantity: { increment: item.quantity } },
    });
    await prisma.inventoryMovement.create({
      data: {
        shopId: shop.id,
        productId: item.productId,
        variantId: item.variantId,
        orderId: order.id,
        type: 'adjustment',
        quantity: item.quantity,
        note: `Seed demo X3: hoàn tồn cho đơn ${order.code}.`,
      },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stockRestoredAt: addDays(order.createdAt, 4) },
  });
}

async function cleanDemoData() {
  await prisma.carrierEvent.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.pancakeLog.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.shopShipper.deleteMany({});
  await prisma.shopConfig.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.shipperPartner.deleteMany({});
  await prisma.shop.deleteMany({});
}

async function seedCarrierPartners() {
  await prisma.shipperPartner.createMany({
    data: carriers.map((carrier) => ({
      ...carrier,
      status: 'active',
      apiKey: '',
      apiToken: '',
    })),
  });
}

async function seedShop(shopSeed, shopIndex) {
  const shop = await prisma.shop.create({
    data: {
      code: shopSeed.code,
      name: shopSeed.name,
      ownerName: shopSeed.ownerName,
      email: shopSeed.email,
      phone: shopSeed.phone,
      status: 'active',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: shopSeed.email,
      name: shopSeed.ownerName,
      password: hashPassword('shop123'),
      role: 'customer',
      shopId: shop.id,
    },
  });

  await prisma.shopConfig.create({
    data: {
      shopId: shop.id,
      fbPageId: shopSeed.pageId,
      fbAccessToken: encryptSecret(`${shopSeed.code}_FB_ACCESS_TOKEN_MOCK`),
      pancakeToken: encryptSecret(`${shopSeed.code}_PANCAKE_TOKEN_MOCK`),
      fbStatus: 'active',
      misaAppId: `${shopSeed.code}_MISA_APP`,
      misaApiKey: encryptSecret(`${shopSeed.code}_MISA_KEY_MOCK`),
      misaCompanyCode: `${shopSeed.code}_COMPANY`,
      misaStatus: 'inactive',
    },
  });

  await prisma.shopShipper.createMany({
    data: carriers.map((carrier) => ({
      shopId: shop.id,
      shipperCode: carrier.code,
      status: 'active',
      apiKey: encryptSecret(`${shopSeed.code}_${carrier.code}_SHOP_ID`),
      apiToken: encryptSecret(`${shopSeed.code}_${carrier.code}_TOKEN`),
      codFeePercent: carrier.codFeePercent,
    })),
  });

  const seededCatalog = await seedProducts(shop, shopSeed, shopIndex);
  const orderVariants = seededCatalog.variants.filter((variant) => variant.stockQuantity >= 12);

  const customers = [];
  for (let i = 0; i < customerNames.length; i += 1) {
    const blacklist = i >= 10;
    const customer = await prisma.customer.create({
      data: {
        code: `${shopSeed.code}-KH${String(i + 1).padStart(3, '0')}`,
        name: customerNames[i],
        phone: `09${shopIndex + 1}${String(1000000 + i * 137 + shopIndex * 19).slice(-7)}`,
        email: i < 4 ? `khach${i + 1}.${shopSeed.code.toLowerCase()}@demo.vn` : null,
        address: districts[i],
        status: blacklist ? 'blacklist' : 'active',
        blacklistReason: blacklist ? (i === 10 ? 'Bom hàng 2 lần trong tháng' : 'Không nghe máy khi giao nhiều lần') : null,
        shopId: shop.id,
      },
    });
    customers.push(customer);
  }

  const orders = [];
  const baseDate = new Date('2026-05-01T08:00:00+07:00');

  for (let i = 0; i < statusCycle.length; i += 1) {
    const status = statusCycle[i];
    const customer = customers[i % customers.length];
    const carrier = carriers[i % carriers.length];
    const quantity = (i % 3) + 1;
    const [productName, price] = shopSeed.products[i % shopSeed.products.length];
    const secondItem = i % 5 === 0 ? shopSeed.products[(i + 1) % shopSeed.products.length] : null;
    const primaryVariant = orderVariants[(i + shopIndex) % orderVariants.length];
    const secondaryVariant = orderVariants[(i + shopIndex + 5) % orderVariants.length];
    const useLinkedItems = i % 3 !== 0 && primaryVariant;
    const items = useLinkedItems
      ? [
        orderItemFromVariant(primaryVariant, quantity),
        ...(secondItem && secondaryVariant ? [orderItemFromVariant(secondaryVariant, 1)] : []),
      ]
      : [
        { name: productName, quantity, price, unitPrice: price, lineTotal: price * quantity, productName },
        ...(secondItem ? [{ name: secondItem[0], quantity: 1, price: secondItem[1], unitPrice: secondItem[1], lineTotal: secondItem[1], productName: secondItem[0] }] : []),
      ];
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = 22000 + (i % 6) * 5000 + shopIndex * 2000;
    const trackingCode = shouldHaveTracking(status)
      ? `${carrier.code}MOCK${shopIndex + 1}${String(i + 1).padStart(4, '0')}`
      : null;
    const createdAt = addDays(baseDate, i - statusCycle.length);
    const codStatus = codStatusForOrder(status);
    const orderCode = `DH-${shopSeed.code}-${String(i + 1).padStart(4, '0')}`;

    const order = await prisma.order.create({
      data: {
        code: orderCode,
        status,
        totalValue,
        codAmount: status === 'partial_delivered' ? Math.round(totalValue * 0.65) : totalValue,
        shippingFee,
        carrierFee: shippingFee,
        codStatus,
        codCollectedAt: codStatus === 'collected' ? addDays(createdAt, 3) : null,
        trackingCode,
        carrierName: trackingCode ? carrier.name : null,
        channel: channels[i % channels.length],
        note: status === 'failed'
          ? 'Carrier báo giao lỗi, cần shop xử lý'
          : status === 'returned'
            ? 'Khách không nhận hàng, hoàn về shop'
            : status === 'partial_delivered'
              ? 'Khách ký nhận một phần, cần đối soát COD'
              : null,
        shippingAddress: customer.address,
        shippingPhone: customer.phone,
        shippingName: customer.name,
        createdAt,
        deliveredAt: status === 'delivered' ? addDays(createdAt, 3) : null,
        returnedAt: ['returned', 'failed'].includes(status) ? addDays(createdAt, 4) : null,
        userId: user.id,
        customerId: customer.id,
        shipperCode: carrier.code,
        shopId: shop.id,
        items: { create: items },
      },
    });

    await applySeedInventoryForOrder(shop, order, items, status);
    orders.push(order);

    const carrierEvent = carrierEventForStatus(status);
    if (trackingCode && carrierEvent) {
      await prisma.carrierEvent.create({
        data: {
          shopId: shop.id,
          orderId: order.id,
          carrierCode: carrier.code,
          trackingCode,
          eventStatus: carrierEvent,
          mappedOrderStatus: status,
          rawPayload: JSON.stringify({ carrierCode: carrier.code, trackingCode, eventStatus: carrierEvent, mock: true }),
          note: `Seed demo carrier event: ${carrierEvent}`,
          createdAt: addDays(createdAt, 2),
        },
      });
    }

    if (status === 'delivered' || status === 'returned' || status === 'partial_delivered') {
      const isIssued = i % 2 === 0;
      const isCancelled = status === 'returned';
      await prisma.invoice.create({
        data: {
          shopId: shop.id,
          code: `HD-${shopSeed.code}-${String(i + 1).padStart(4, '0')}`,
          type: 'sale',
          status: isCancelled ? 'cancelled' : (isIssued ? 'issued' : 'draft'),
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          subtotal: totalValue,
          tax: Math.round(totalValue * 0.1),
          total: Math.round(totalValue * 1.1),
          issuedAt: isIssued || isCancelled ? addDays(createdAt, 3) : null,
          cancelledAt: isCancelled ? addDays(createdAt, 4) : null,
          provider: isIssued || isCancelled ? 'MockSandbox' : null,
          providerInvoiceId: isIssued || isCancelled ? `MOCK-${shopSeed.code}-${i}` : null,
          orderId: order.id,
          items: {
            create: items.map(item => ({
              shopId: shop.id,
              productId: item.productId,
              variantId: item.variantId,
              sku: item.sku,
              name: item.name || item.productName || 'Sản phẩm',
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.price,
              taxRate: 10,
              lineTotal: item.lineTotal || (item.price * item.quantity)
            }))
          }
        },
      });
    }
  }

  await seedChatDemo(shop, orders, customers, shopSeed);
  await seedPancakeLogs(shop, shopSeed);

  return { shop, user };
}

async function seedProducts(shop, shopSeed, shopIndex) {
  const catalog = buildProductCatalog(shopSeed, shopIndex);
  const products = [];
  const variantsForOrders = [];

  for (let productIndex = 0; productIndex < catalog.length; productIndex += 1) {
    const [name, basePrice, category] = catalog[productIndex];
    const productCode = `${shopSeed.code}-SP${String(productIndex + 1).padStart(3, '0')}`;

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        code: productCode,
        name,
        category,
        description: `Sản phẩm demo X2 cho ${shopSeed.name}. Dùng để kiểm thử SKU, tồn kho và cảnh báo dưới định mức.`,
        status: 'active',
      },
    });
    products.push(product);

    const variants = variantDraftsForProduct(shopSeed, productIndex, name, basePrice);
    for (const variantDraft of variants) {
      const variant = await prisma.productVariant.create({
        data: {
          ...variantDraft,
          shopId: shop.id,
          productId: product.id,
        },
      });
      variantsForOrders.push({
        ...variant,
        product,
      });

      if (variant.stockQuantity > 0) {
        await prisma.inventoryMovement.create({
          data: {
            shopId: shop.id,
            productId: product.id,
            variantId: variant.id,
            type: 'import',
            quantity: variant.stockQuantity,
            note: 'Seed demo X2: nhập tồn đầu kỳ.',
          },
        });
      }
    }
  }

  return { products, variants: variantsForOrders };
}

async function seedChatDemo(shop, orders, customers, shopSeed) {
  const draftOrder = orders.find((order) => order.status === 'draft');
  const pendingOrder = orders.find((order) => order.status === 'pending');
  const productA = shopSeed.products[0][0];
  const productB = shopSeed.products[1][0];

  const sessions = [
    {
      channel: 'livestream',
      customer: customers[0],
      status: 'ready',
      rawComment: `Chốt ${productA} size M x2 ${customers[0].phone} dc ${customers[0].address}`,
      productName: productA,
      size: 'M',
      quantity: 2,
      missingFields: [],
      draftOrderId: null,
    },
    {
      channel: 'fanpage',
      customer: customers[1],
      status: 'collecting',
      rawComment: 'Ib giá',
      productName: null,
      size: null,
      quantity: null,
      shippingAddress: null,
      missingFields: ['phone', 'address', 'product', 'quantity'],
      draftOrderId: null,
    },
    {
      channel: 'livestream',
      customer: customers[2],
      status: 'draft_created',
      rawComment: `Lấy ${productB} size L 1 cái sdt ${customers[2].phone} địa chỉ ${customers[2].address}`,
      productName: productB,
      size: 'L',
      quantity: 1,
      missingFields: [],
      draftOrderId: draftOrder?.id || null,
    },
    {
      channel: 'fanpage',
      customer: customers[3],
      status: 'confirmed',
      rawComment: `Mua 2 cái ${productA} ${customers[3].phone} dc ${customers[3].address}`,
      productName: productA,
      size: null,
      quantity: 2,
      missingFields: [],
      draftOrderId: pendingOrder?.id || null,
    },
  ];

  for (const session of sessions) {
    await prisma.chatSession.create({
      data: {
        channel: session.channel,
        customerName: session.customer.name,
        customerPhone: session.customer.phone,
        shippingAddress: session.shippingAddress === undefined ? session.customer.address : session.shippingAddress,
        productName: session.productName,
        size: session.size,
        quantity: session.quantity,
        status: session.status,
        missingFields: JSON.stringify(session.missingFields),
        rawComment: session.rawComment,
        shopId: shop.id,
        draftOrderId: session.draftOrderId,
        messages: {
          create: [
            { sender: 'customer', content: session.rawComment, parsedData: JSON.stringify({ mock: true }) },
            {
              sender: 'bot',
              content: session.missingFields.length
                ? 'Shop cần xin thêm SĐT, địa chỉ, sản phẩm hoặc số lượng để tạo đơn.'
                : 'Bot đã nhận đủ thông tin, shop có thể tạo đơn nháp.',
              parsedData: JSON.stringify({ missing: session.missingFields }),
            },
          ],
        },
      },
    });
  }
}

async function seedPancakeLogs(shop, shopSeed) {
  const samples = [
    ['Khách Facebook Demo', `Chốt ${shopSeed.products[0][0]} size M`, shopSeed.products[0][0], shopSeed.products[0][1], 'pending'],
    ['Minh Anh', `Lấy ${shopSeed.products[1][0]} 1 cái`, shopSeed.products[1][0], shopSeed.products[1][1], 'confirmed'],
    ['Thu Trang', 'Mua 2 cái, ib giá', shopSeed.products[2][0], shopSeed.products[2][1] * 2, 'creating_order'],
  ];

  await prisma.pancakeLog.createMany({
    data: samples.map(([customerName, comment, product, price, status], index) => ({
      postId: `post-${shop.code}-${index + 1}`,
      streamId: index === 2 ? `live-${shop.code}` : null,
      customerName,
      comment,
      product,
      price,
      status,
      channel: index === 2 ? 'livestream' : 'fanpage',
      shopId: shop.id,
    })),
  });
}

async function main() {
  console.log('Cleaning demo database. This seed resets local demo shops, orders, chatbot data, carriers, COD, products, SKUs and inventory movements.');
  await cleanDemoData();

  console.log('Seeding platform admin and carrier partners...');
  await prisma.user.create({
    data: {
      email: 'admin@hship.vn',
      name: 'Admin Hship',
      password: hashPassword('admin123'),
      role: 'admin',
    },
  });

  await seedCarrierPartners();

  for (let index = 0; index < shopSeeds.length; index += 1) {
    console.log(`Seeding ${shopSeeds[index].name}...`);
    await seedShop(shopSeeds[index], index);
  }

  console.log('Demo seed finished.');
  console.log('Admin: admin@hship.vn / admin123');
  console.log('Shop: genz@hship.vn, baby@hship.vn, smart@hship.vn / shop123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
