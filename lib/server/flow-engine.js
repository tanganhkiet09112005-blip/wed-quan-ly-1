import { prisma } from '@/lib/prisma';

/**
 * checkRuleCondition evaluates a single rule against the order and customer data.
 */
function checkRuleCondition(rule, orderInput, customer) {
  const value = rule.conditionValue;
  switch (rule.conditionType) {
    case 'COD_GREATER_THAN':
      return Number(orderInput.codAmount || 0) > Number(value || 0);
    case 'WEIGHT_GREATER_THAN':
      return Number(orderInput.weight || 0) > Number(value || 0);
    case 'PROVINCE_EQUALS':
      if (!value) return false;
      return orderInput.shippingAddress?.toLowerCase().includes(String(value).toLowerCase());
    case 'CUSTOMER_BLACKLISTED':
      return customer?.status === 'blacklist';
    // MISSING_CREDENTIALS and PRICING_MISSING are handled intrinsically before custom rules,
    // but if a user specifies them, we can safely ignore or process if we had specific triggers.
    default:
      return false;
  }
}

/**
 * determineOrderFlow
 * Xác định luồng xử lý của đơn hàng ngay lúc tạo.
 * 
 * @param {Object} params
 * @param {Object} params.orderInput (Data truyền vào tạo đơn)
 * @param {Object} params.shop (Thông tin shop, cần autoPushCarrierEnabled)
 * @param {Object} params.customer (Thông tin khách hàng)
 * @param {Object} params.pricingResult ({ hasRate, fee, tierId } từ engine tính giá)
 * @param {Array} params.carrierCredentials (Danh sách ShopShipper active của shop)
 * @param {Array} params.rules (Danh sách OrderFlowRule đã sort theo priority)
 * @returns {Object} { flowStatus, flowMessage, flowRuleId, carrierCode }
 */
export function determineOrderFlow({
  orderInput,
  shop,
  customer,
  pricingResult,
  carrierCredentials,
  rules = []
}) {
  // 1. Blacklist customer
  if (customer && customer.status === 'blacklist') {
    return {
      flowStatus: 'BLOCKED',
      flowMessage: `Khách hàng nằm trong danh sách đen: ${customer.blacklistReason || 'Không rõ lý do'}`,
      flowRuleId: null,
      carrierCode: orderInput.shipperCode || null,
    };
  }

  // 2. Pricing missing
  // Đơn hàng phải có giá cước mới được phép đẩy
  if (!pricingResult || pricingResult.hasRate === false) {
    return {
      flowStatus: 'PRICING_MISSING',
      flowMessage: 'Shop chưa được cấu hình bảng giá cước hoặc chưa có mốc cân phù hợp. Vui lòng liên hệ Admin.',
      flowRuleId: null,
      carrierCode: orderInput.shipperCode || null,
    };
  }

  // 3. Missing carrier credential
  let hasValidCredential = false;
  if (orderInput.shipperCode) {
    // Nếu đơn có chỉ định shipperCode, kiểm tra xem shop có credential cho shipper đó không
    const targetShipper = carrierCredentials?.find(c => 
      c.shipperCode === orderInput.shipperCode && c.status === 'active' && c.apiToken
    );
    if (targetShipper) hasValidCredential = true;
  } else {
    // Nếu không chỉ định shipperCode, kiểm tra xem shop có BẤT KỲ credential nào không
    hasValidCredential = carrierCredentials?.some(c => c.status === 'active' && c.apiToken);
  }

  if (!hasValidCredential) {
    return {
      flowStatus: 'MISSING_CREDENTIALS',
      flowMessage: 'Shop chưa được cấu hình API vận chuyển. Vui lòng liên hệ Admin.',
      flowRuleId: null,
      carrierCode: orderInput.shipperCode || null,
    };
  }

  // 4. Validate dữ liệu cơ bản
  if (!orderInput.shippingPhone || !orderInput.shippingAddress) {
    return {
      flowStatus: 'MANUAL_PROCESSING',
      flowMessage: 'Thiếu thông tin người nhận (SĐT/Địa chỉ). Cần xử lý thủ công.',
      flowRuleId: null,
      carrierCode: orderInput.shipperCode || null,
    };
  }

  if (!orderInput.weight || Number(orderInput.weight) <= 0) {
    return {
      flowStatus: 'MANUAL_PROCESSING',
      flowMessage: 'Thiếu trọng lượng đơn hàng. Cần xử lý thủ công.',
      flowRuleId: null,
      carrierCode: orderInput.shipperCode || null,
    };
  }

  // 5. Custom Rules
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      if (checkRuleCondition(rule, orderInput, customer)) {
        return {
          flowStatus: rule.action, // e.g. WAITING_APPROVAL, MANUAL_PROCESSING, BLOCKED
          flowMessage: `Phân luồng theo quy tắc: ${rule.name}`,
          flowRuleId: rule.id,
          carrierCode: rule.carrierCode || orderInput.shipperCode || null,
        };
      }
    }
  }

  // 6. Default if all good
  return {
    flowStatus: 'READY_TO_PUSH',
    flowMessage: 'Đơn đủ điều kiện xử lý.',
    flowRuleId: null,
    carrierCode: orderInput.shipperCode || null,
  };
}
