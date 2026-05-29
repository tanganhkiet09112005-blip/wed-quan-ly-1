import crypto from 'crypto';
import { makeMockAdapter } from './mock-utils';

export const JT_STATUS_MAP = {
  // New API standard statuses
  '103': 'confirmed',
  '104': 'pickup_failed',
  '105': 'cancelled',
  '106': 'picked_up',
  '107': 'warehousing',
  '109': 'shipped',
  '110': 'in_transit',
  '111': 'in_transit',
  '112': 'shipping',
  '113': 'delivered',
  'Sign': 'delivered',
  '116': 'returned',
  'Return': 'returned',
  '117': 'returned',
  'Return sign': 'returned',
  '118': 'failed',
  'Delivery fail': 'failed',
  '120': 'return_failed',
  'Return fail': 'return_failed',

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

const JT_DEFAULT_URLS = {
  createOrderUrl: 'https://demo-ylstandard.jtexpress.vn/yuenan-interface-web/order/orderAction!createOrder.action',
  updateUrl: 'https://demo-ylstandard.jtexpress.vn/yuenan-interface-web/order/orderAction!createOrder.action',
  trackUrl: 'https://demo-ylstandard.jtexpress.vn/yuenan-interface-web/standart/trackAction!trackForJson.action',
  freightUrl: 'https://demo-ylstandard.jtexpress.vn/yuenan-interface-web/jtpos/inquiry!freight.action',
};

export const jtAdapter = makeMockAdapter({
  code: 'JT',
  name: 'J&T Express',
  baseFee: 35000,
});

export function generateDataDigest(logisticsInterfaceStr, key) {
  // Bước 1: md5 ra HEX string
  const hexString = crypto.createHash('md5').update(logisticsInterfaceStr + key, 'utf8').digest('hex');
  // Bước 2: base64 encode HEX string đó
  return Buffer.from(hexString, 'utf8').toString('base64');
}

function parseCredentials(credentials) {
  let eccompanyid = credentials.customerCode;
  let customerid = credentials.customerCode;
  let key = credentials.apiKey;
  let customUrls = {};
  
  if (credentials.apiKey && credentials.apiKey.startsWith('{')) {
    try {
      const parsed = JSON.parse(credentials.apiKey);
      eccompanyid = parsed.eccompanyid || eccompanyid;
      customerid = parsed.customerid || customerid;
      key = parsed.key || key;
      customUrls = {
        createOrderUrl: parsed.createOrderUrl,
        updateUrl: parsed.updateUrl,
        trackUrl: parsed.trackUrl,
        freightUrl: parsed.freightUrl,
      };
    } catch (e) {
      // Ignore JSON parse error, use raw string
    }
  }
  
  return { eccompanyid, customerid, key, customUrls };
}

async function requestJT(msgType, urlType, payloadObj, credentials) {
  const mode = credentials.mode || 'mock';
  const { eccompanyid, key, customUrls } = parseCredentials(credentials);

  if (!eccompanyid || !key) {
    throw new Error('J&T integration requires eccompanyid and key credentials.');
  }

  // Determine endpoint
  const targetUrl = customUrls[urlType] || JT_DEFAULT_URLS[urlType];
  if (!targetUrl) {
    throw new Error(`Endpoint URL not found for action ${urlType}`);
  }

  const logistics_interface = JSON.stringify(payloadObj);
  const data_digest = generateDataDigest(logistics_interface, key);

  const formData = new FormData();
  formData.append('logistics_interface', logistics_interface);
  formData.append('data_digest', data_digest);
  formData.append('msg_type', msgType);
  formData.append('eccompanyid', eccompanyid);

  const response = await fetch(targetUrl, {
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
    const res = await requestJT('FREIGHTQUERY', 'freightUrl', payload, credentials);
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
      logisticproviderid: 'JNT',
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

    const res = await requestJT('ORDERCREATE', 'createOrderUrl', payload, credentials);
    
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
    const res = await requestJT('TRACKQUERY', 'trackUrl', payload, credentials);
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
    const { eccompanyid, customerid } = parseCredentials(credentials);
    const payload = {
      eccompanyid,
      customerid,
      logisticproviderid: 'JNT',
      txlogisticid: trackingCode,
      fieldlist: [
        {
          txlogisticid: trackingCode,
          fieldname: 'status',
          fieldvalue: 'WITHDRAW',
          remark: 'Hship cancel'
        }
      ]
    };
    const res = await requestJT('UPDATE', 'updateUrl', payload, credentials);
    
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
    //
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
