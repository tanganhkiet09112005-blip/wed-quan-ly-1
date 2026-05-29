import crypto from 'crypto';
import { makeMockAdapter } from './mock-utils';

export const JT_STATUS_MAP = {
  // New API standard statuses
  '103': 'confirmed',
  '106': 'picked_up',
  '112': 'shipping',
  '113': 'delivered',
  '116': 'returned',
  '118': 'failed',
  // Keep old ones just in case mock uses them
  'ITEM_RECEIVED_FROM_SENDER': 'pushed_to_carrier',
  'IN_TRANSIT': 'shipping',
  'OUT_FOR_DELIVERY': 'shipping',
  'DELIVERED': 'delivered',
  'RETURN_TO_SENDER_TRANSIT': 'returned',
  'RETURNED_TO_SENDER': 'returned',
  'DELIVERY_FAILED': 'failed',
  'PARTIAL_DELIVERED': 'partial_delivered',
  'EXCEPTION': 'failed',
};

// Base API endpoints
const JT_API_URL = {
  sandbox: 'https://testapi.jtexpress.vn/jandt_opc/api/order/command',
  production: 'https://jtapi.jtexpress.vn/jandt_opc/api/order/command',
};

export const jtAdapter = makeMockAdapter({
  code: 'JT',
  name: 'J&T Express',
  baseFee: 35000,
});

function generateDataDigest(logisticsInterfaceStr, key) {
  return crypto.createHash('md5').update(logisticsInterfaceStr + key, 'utf8').digest('base64');
}

function parseCredentials(credentials) {
  let eccompanyid = credentials.customerCode;
  let customerid = credentials.customerCode;
  let key = credentials.apiKey;
  
  if (credentials.apiKey && credentials.apiKey.startsWith('{')) {
    try {
      const parsed = JSON.parse(credentials.apiKey);
      eccompanyid = parsed.eccompanyid || eccompanyid;
      customerid = parsed.customerid || customerid;
      key = parsed.key || key;
    } catch (e) {
      // Ignore JSON parse error, use raw string
    }
  }
  
  return { eccompanyid, customerid, key };
}

async function requestJT(msgType, payloadObj, credentials) {
  const mode = credentials.mode || 'mock';
  const { eccompanyid, key } = parseCredentials(credentials);

  if (!eccompanyid || !key) {
    throw new Error('J&T integration requires eccompanyid and key credentials.');
  }

  const url = mode === 'production' ? JT_API_URL.production : JT_API_URL.sandbox;
  const logistics_interface = JSON.stringify(payloadObj);
  const data_digest = generateDataDigest(logistics_interface, key);

  const formData = new FormData();
  formData.append('logistics_interface', logistics_interface);
  formData.append('data_digest', data_digest);
  formData.append('msg_type', msgType);
  formData.append('eccompanyid', eccompanyid);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`J&T API responded with status: ${response.status}`);
  }

  const responseText = await response.text();
  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid JSON response from J&T API: ${responseText}`);
  }
}

jtAdapter.normalizeStatus = (carrierStatus) => {
  return JT_STATUS_MAP[String(carrierStatus)] || 'shipping';
};

jtAdapter.calculateFee = async (order, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'mock') return { success: true, fee: jtAdapter.baseFee };

  try {
    const { customerid } = parseCredentials(credentials);
    const payload = {
      customerid,
      sender: { provice: 'HCM', city: 'HCM', area: 'Q1' },
      receiver: { provice: 'HN', city: 'HN', area: 'BĐ' },
      weight: 1,
    };
    const res = await requestJT('FREIGHTQUERY', payload, credentials);
    return { success: true, fee: res.freight || jtAdapter.baseFee };
  } catch (error) {
    console.error('[J&T calculateFee]', error);
    return { success: false, error: error.message };
  }
};

jtAdapter.createShipment = async (order, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'mock') {
    return {
      success: true,
      trackingCode: `JT_MOCK_${Date.now()}`,
      fee: jtAdapter.baseFee,
      rawResponse: { mode: 'mock' },
    };
  }

  if (mode === 'production') {
    if (!credentials.apiKey) throw new Error('Production missing real credentials');
  }

  try {
    const { customerid } = parseCredentials(credentials);
    const payload = {
      txlogisticid: `HSHIP_${order.id}`,
      customerid,
      ordertype: '1',
      sender: {
        name: 'Hship Shop',
        mobile: '0909090909',
        provice: 'Hồ Chí Minh',
        city: 'Hồ Chí Minh',
        area: 'Quận 1',
        address: '123 Đường A',
      },
      receiver: {
        name: order.shippingName || 'Guest',
        mobile: order.shippingPhone || '0000000000',
        provice: 'Hồ Chí Minh',
        city: 'Hồ Chí Minh',
        area: 'Quận 1',
        address: order.shippingAddress || 'Địa chỉ nhận',
      },
      createordertime: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
      itemsvalue: order.codAmount || 0,
      weight: 1,
      items: [{ itemName: 'Sản phẩm', itemValue: order.codAmount || 0, itemQuantity: 1 }],
      paytype: '1',
    };

    const res = await requestJT('ORDERCREATE', payload, credentials);
    
    if (res.responseitems && res.responseitems[0] && res.responseitems[0].success === 'true') {
      return {
        success: true,
        trackingCode: res.responseitems[0].billcode,
        fee: jtAdapter.baseFee,
        rawResponse: res,
      };
    }

    return { success: false, error: res.reason || 'Failed to create shipment at J&T.' };
  } catch (error) {
    console.error('[J&T createShipment]', error);
    return { success: false, error: error.message };
  }
};

jtAdapter.getShipmentStatus = async (trackingCode, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'mock') {
    return { success: true, hshipStatus: 'shipping', trackingCode, rawResponse: { mode: 'mock' } };
  }

  try {
    const { customerid } = parseCredentials(credentials);
    const payload = {
      customerid,
      billcode: trackingCode,
    };
    const res = await requestJT('TRACKQUERY', payload, credentials);
    const status_code = res.responseitems?.[0]?.details?.[0]?.scantype || res.status_code || '112';
    return {
      success: true,
      hshipStatus: jtAdapter.normalizeStatus(status_code),
      trackingCode,
      rawResponse: res,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

jtAdapter.cancelShipment = async (trackingCode, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'mock') {
    return { success: true, trackingCode, rawResponse: { mode: 'mock' } };
  }

  try {
    const { customerid } = parseCredentials(credentials);
    const payload = {
      customerid,
      txlogisticid: trackingCode,
      reason: 'User cancelled',
      status: '2',
    };
    const res = await requestJT('UPDATE', payload, credentials);
    
    if (res.responseitems && res.responseitems[0] && res.responseitems[0].success === 'true') {
      return { success: true, trackingCode, rawResponse: res };
    }
    return { success: false, error: res.reason || 'Failed to cancel shipment.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

jtAdapter.parseWebhookEvent = (payload, headers, credentials = {}) => {
  const mode = credentials.mode || 'mock';
  if (mode === 'sandbox' || mode === 'production') {
    // If real mode, status normalization happens here or directly in webhook route
  }
  
  return {
    success: true,
    carrierCode: 'JT',
    trackingCode: payload?.billcode || 'JT_MOCK_001',
    hshipStatus: jtAdapter.normalizeStatus(payload?.status_code || payload?.scantype),
    rawPayload: payload,
  };
};

export function createJTOrder(order, credentials) {
  return jtAdapter.createShipment(order, credentials);
}

export function getJTOrderStatus(trackingCode, credentials) {
  return jtAdapter.getShipmentStatus(trackingCode, credentials);
}

export function cancelJTShipment(trackingCode, credentials) {
  return jtAdapter.cancelShipment(trackingCode, credentials);
}
