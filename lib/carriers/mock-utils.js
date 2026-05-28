export function makeTrackingCode(prefix) {
  return `${prefix}${String(Date.now()).slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
}

export function makeMockAdapter({ code, name, baseFee, transitStatus = 'shipping', deliveredStatus = 'delivered' }) {
  return {
    code,
    name,
    calculateFee(order, credentials = {}) {
      const mode = credentials.mode || 'mock';
      if (mode === 'sandbox' || mode === 'production') {
        throw new Error(`Production/Sandbox credentials or API documentation missing for ${code}.`);
      }
      const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const codFee = Math.round(Number(order.codAmount || 0) * 0.005);
      return {
        success: true,
        fee: baseFee + Math.max(itemCount - 1, 0) * 3000 + codFee,
      };
    },
    createShipment(order, credentials = {}) {
      const mode = credentials.mode || 'mock';
      if (mode === 'sandbox' || mode === 'production') {
        throw new Error(`Production/Sandbox credentials or API documentation missing for ${code}.`);
      }
      const feeResult = this.calculateFee(order, credentials);
      return {
        success: true,
        carrierCode: code,
        carrierName: name,
        trackingCode: makeTrackingCode(code),
        fee: feeResult.fee,
        status: 'pushed_to_carrier',
        rawResponse: {
          mock: true,
          sandbox: false,
          production: false,
          carrier: code,
          configured: Boolean(credentials.apiKey || credentials.apiToken),
        },
      };
    },
    getShipmentStatus(trackingCode, credentials = {}) {
      const mode = credentials.mode || 'mock';
      if (mode === 'sandbox' || mode === 'production') {
        throw new Error(`Production/Sandbox credentials or API documentation missing for ${code}.`);
      }
      return {
        success: true,
        carrierCode: code,
        trackingCode,
        hshipStatus: transitStatus,
        rawResponse: { mock: true, trackingCode, carrier: code },
      };
    },
    cancelShipment(trackingCode, credentials = {}) {
      const mode = credentials.mode || 'mock';
      if (mode === 'sandbox' || mode === 'production') {
        throw new Error(`Production/Sandbox credentials or API documentation missing for ${code}.`);
      }
      return {
        success: true,
        carrierCode: code,
        trackingCode,
        hshipStatus: 'cancelled',
        rawResponse: { mock: true, cancelled: true, carrier: code },
      };
    },
    parseWebhookEvent(payload, headers, credentials = {}) {
      const mode = credentials.mode || 'mock';
      if (mode === 'sandbox' || mode === 'production') {
        throw new Error(`Production/Sandbox credentials or API documentation missing for ${code}.`);
      }
      return {
        success: true,
        carrierCode: code,
        trackingCode: payload?.trackingCode || 'MOCK001',
        hshipStatus: 'delivered',
        rawPayload: payload,
      };
    },
    normalizeStatus(carrierStatus) {
      return transitStatus;
    },
    deliveredStatus,
  };
}
