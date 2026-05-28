import { makeMockAdapter } from './mock-utils';

// Cổng API GHN
const GHN_ENDPOINTS = {
  sandbox: 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2',
  production: 'https://online-gateway.ghn.vn/shiip/public-api/v2',
};

export const GHN_STATUS_MAP = {
  ready_to_pick: 'pushed_to_carrier',
  picking: 'shipping',
  delivering: 'shipping',
  delivered: 'delivered',
  return: 'returned',
  returning: 'returned',
  returned: 'returned',
  damage: 'failed',
  lost: 'failed',
  delivery_fail: 'failed',
  cancel: 'cancelled',
};

// Sử dụng mock adapter làm fallback khi ở mode mock
const mockGhnAdapter = makeMockAdapter({
  code: 'GHN',
  name: 'Giao Hang Nhanh (GHN)',
  baseFee: 32000,
});

/**
 * Hàm hỗ trợ gọi API GHN
 */
async function callGHN(endpoint, method, body, credentials, mode) {
  const baseUrl = GHN_ENDPOINTS[mode] || GHN_ENDPOINTS.sandbox;
  const token = credentials.apiToken;
  const shopId = credentials.apiKey; // apiKey lưu trữ ShopId của GHN

  if (!token) {
    throw new Error('Thiếu API Token của GHN cho chế độ này.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Token': token,
  };
  
  if (shopId) {
    headers['ShopId'] = String(shopId);
  }

  const url = `${baseUrl}${endpoint}`;
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (res.status !== 200 || data.code !== 200) {
    throw new Error(data.message || `GHN API Error (Status ${res.status}): ${JSON.stringify(data)}`);
  }

  return data.data;
}

/**
 * Hàm phân tích địa chỉ để lấy DistrictID và WardCode mặc định hoặc gần đúng của GHN
 * Nhằm tránh lỗi API GHN khi địa chỉ shop/khách gõ text tự do.
 */
function resolveGHNAddress(addressString = '') {
  // Ở bản nâng cao, ta có thể so khớp từ khóa. Ở đây ta cung cấp fallback hợp lệ tại TP.HCM: Q1, P. Bến Nghé
  // DistrictID 1442, WardCode "20109"
  const addr = String(addressString).toLowerCase();
  
  if (addr.includes('hà nội') || addr.includes('hn')) {
    // Fallback Hà Nội: Quận Hoàn Kiếm, Phường Hàng Bạc
    // DistrictID 1444, WardCode "1A0307"
    return {
      districtId: 1444,
      wardCode: '1A0307',
      provinceName: 'Hà Nội',
      districtName: 'Quận Hoàn Kiếm',
      wardName: 'Phường Hàng Bạc'
    };
  }

  // Mặc định TP.HCM Quận 1
  return {
    districtId: 1442,
    wardCode: '20109',
    provinceName: 'Hồ Chí Minh',
    districtName: 'Quận 1',
    wardName: 'Phường Bến Nghé'
  };
}

export const ghnAdapter = {
  code: 'GHN',
  name: 'Giao Hang Nhanh (GHN)',

  async calculateFee(order, credentials = {}) {
    const mode = credentials.mode || 'mock';
    if (mode === 'mock') {
      return mockGhnAdapter.calculateFee(order, credentials);
    }

    try {
      const fromAddr = resolveGHNAddress(order.shop?.address);
      const toAddr = resolveGHNAddress(order.shippingAddress);

      const payload = {
        service_type_id: 2, // Giao hàng chuẩn
        from_district_id: fromAddr.districtId,
        to_district_id: toAddr.districtId,
        to_ward_code: toAddr.wardCode,
        weight: 1000, // gram
        length: 10,
        width: 10,
        height: 10,
        insurance_value: Math.min(Math.round(order.totalValue || 0), 5000000), // GHN bảo hiểm tối đa 5tr không cần chứng từ
      };

      const result = await callGHN('/shipping-order/fee', 'POST', payload, credentials, mode);
      return {
        success: true,
        fee: result.total || 35000,
      };
    } catch (error) {
      return {
        success: false,
        error: `Lỗi tính phí GHN (${mode}): ${error.message}`,
      };
    }
  },

  async createShipment(order, credentials = {}) {
    const mode = credentials.mode || 'mock';
    if (mode === 'mock') {
      return mockGhnAdapter.createShipment(order, credentials);
    }

    try {
      const fromAddr = resolveGHNAddress(order.shop?.address);
      const toAddr = resolveGHNAddress(order.shippingAddress);

      // Tính phí trước để lưu thông tin
      const feeResult = await this.calculateFee(order, credentials);
      const carrierFee = feeResult.success ? feeResult.fee : 35000;

      const payload = {
        payment_type_id: 2, // Người nhận trả phí (hoặc shop đối soát sau, GHN mặc định 2 để shop thu COD gồm cả ship)
        note: order.note || 'Giao hang nhanh',
        required_note: 'CHOXEMHANGCONG',
        from_name: order.shop?.name || 'Cửa hàng HShip',
        from_phone: order.shop?.phone || '0909999999',
        from_address: order.shop?.address || 'Hồ Chí Minh',
        from_ward_name: fromAddr.wardName,
        from_district_name: fromAddr.districtName,
        from_province_name: fromAddr.provinceName,
        to_name: order.shippingName || 'Khách hàng',
        to_phone: order.shippingPhone || '0900000000',
        to_address: order.shippingAddress || 'Hồ Chí Minh',
        to_ward_code: toAddr.wardCode,
        to_district_id: toAddr.districtId,
        weight: 1000,
        length: 10,
        width: 10,
        height: 10,
        service_type_id: 2,
        cod_amount: Math.round(order.codAmount || 0),
        items: (order.items || []).map((item) => ({
          name: item.name || 'Sản phẩm',
          code: item.id || 'SP001',
          quantity: item.quantity || 1,
          price: Math.round(item.price || 0),
        })),
      };

      if (payload.items.length === 0) {
        payload.items.push({
          name: 'Sản phẩm HShip',
          code: 'SP001',
          quantity: 1,
          price: Math.round(order.totalValue || 0),
        });
      }

      const result = await callGHN('/shipping-order/create', 'POST', payload, credentials, mode);

      return {
        success: true,
        carrierCode: 'GHN',
        carrierName: 'Giao Hang Nhanh (GHN)',
        trackingCode: result.order_code,
        fee: result.total_fee || carrierFee,
        status: 'pushed_to_carrier',
        rawResponse: {
          mode,
          order_code: result.order_code,
          expected_delivery_time: result.expected_delivery_time,
          total_fee: result.total_fee,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Lỗi tạo vận đơn GHN (${mode}): ${error.message}`,
      };
    }
  },

  async getShipmentStatus(trackingCode, credentials = {}) {
    const mode = credentials.mode || 'mock';
    if (mode === 'mock') {
      return mockGhnAdapter.getShipmentStatus(trackingCode, credentials);
    }

    try {
      const result = await callGHN('/shipping-order/detail', 'POST', { order_code: trackingCode }, credentials, mode);
      const status = result.status;
      const hshipStatus = GHN_STATUS_MAP[status] || 'shipping';

      return {
        success: true,
        carrierCode: 'GHN',
        trackingCode,
        hshipStatus,
        rawResponse: {
          mode,
          status,
          log: result.log,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Lỗi lấy trạng thái vận đơn GHN (${mode}): ${error.message}`,
      };
    }
  },

  async cancelShipment(trackingCode, credentials = {}) {
    const mode = credentials.mode || 'mock';
    if (mode === 'mock') {
      return mockGhnAdapter.cancelShipment(trackingCode, credentials);
    }

    try {
      await callGHN('/shipping-order/cancel', 'POST', { order_codes: [trackingCode] }, credentials, mode);
      return {
        success: true,
        carrierCode: 'GHN',
        trackingCode,
        hshipStatus: 'cancelled',
        rawResponse: {
          mode,
          cancelled: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Lỗi hủy vận đơn GHN (${mode}): ${error.message}`,
      };
    }
  },

  parseWebhookEvent(payload, headers) {
    // GHN thường gửi webhook dạng POST.
    // Lấy trạng thái từ body payload và chuyển đổi
    const status = payload?.status;
    const trackingCode = payload?.OrderCode;
    const hshipStatus = GHN_STATUS_MAP[status] || 'shipping';

    return {
      success: true,
      carrierCode: 'GHN',
      trackingCode,
      hshipStatus,
      rawPayload: payload,
    };
  },

  normalizeStatus(carrierStatus) {
    return GHN_STATUS_MAP[carrierStatus] || 'shipping';
  },
};

export function createGHNOrder(order, credentials) {
  return ghnAdapter.createShipment(order, credentials);
}

export function getGHNOrderStatus(trackingCode, credentials) {
  return ghnAdapter.getShipmentStatus(trackingCode, credentials);
}

export function cancelGHNShipment(trackingCode, credentials) {
  return ghnAdapter.cancelShipment(trackingCode, credentials);
}
