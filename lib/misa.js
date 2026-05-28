/**
 * MISA SME API Adapter (Mock for now, ready for real implementation)
 * Docs: https://developer.misa.vn
 */

import { prisma } from '@/lib/prisma';
import { decryptSecret } from '@/lib/server/secrets';

const MISA_APP_ID     = process.env.MISA_APP_ID || '';
const MISA_API_KEY    = process.env.MISA_API_KEY || '';
const MISA_COMPANY_CODE = process.env.MISA_COMPANY_CODE || '';

/**
 * Sync invoice data to MISA SME
 * @param {object} invoice - Invoice database object (including relation with Order)
 * @returns { success: boolean, message?: string }
 */
export async function pushInvoiceToMisa(invoice) {
  try {
    let appId = MISA_APP_ID;
    let apiKey = MISA_API_KEY;
    let companyCode = MISA_COMPANY_CODE;

    if (invoice?.orderId) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: invoice.orderId },
          select: { shopId: true },
        });
        if (order?.shopId) {
          const config = await prisma.shopConfig.findUnique({
            where: { shopId: order.shopId },
          });
          if (config && config.misaStatus === 'active' && config.misaAppId && config.misaApiKey) {
            appId = config.misaAppId;
            apiKey = decryptSecret(config.misaApiKey);
            companyCode = config.misaCompanyCode || '';
          }
        }
      } catch (err) {
        console.error('Error fetching MISA shop config:', err);
      }
    }

    // If API keys are not provided, run in mock mode
    if (!appId || !apiKey) {
      console.log('[MISA Mock] Pushing invoice to MISA...', invoice?.code);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful sync 90% of the time
      if (Math.random() > 0.1) {
        console.log(`[MISA Mock] Successfully synced invoice ${invoice?.code}`);
        return { success: true };
      } else {
        console.log(`[MISA Mock] Failed to sync invoice ${invoice?.code}`);
        return { success: false, message: 'Lỗi máy chủ MISA (Mock)' };
      }
    }

    // TODO: Real implementation when API keys are available
    console.log('[MISA Active Configured] Pushing invoice to MISA...', { appId, companyCode });
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { success: true };
  } catch (err) {
    console.error('[pushInvoiceToMisa Error]', err);
    return { success: false, message: `Lỗi hệ thống đồng bộ MISA: ${err.message}` };
  }
}
