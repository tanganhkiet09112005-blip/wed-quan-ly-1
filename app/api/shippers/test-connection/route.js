import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { decryptSecret, prepareSecretForUpdate } from '@/lib/server/secrets';
import { ghnAdapter } from '@/lib/carriers/ghn';

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const { shipperCode, apiKey, apiToken, mode } = body;

    if (!shipperCode || !mode) {
      return jsonError('Thiếu thông tin nhà vận chuyển hoặc chế độ kết nối.', 400);
    }

    // 1. Nếu ở chế độ mock, luôn thành công
    if (mode === 'mock') {
      return jsonSuccess({ connected: true, message: `Kết nối thành công tới ${shipperCode} ở chế độ giả lập.` });
    }

    // 2. Chế độ Sandbox hoặc Production cần credentials thật
    // Do token gửi lên từ client có thể là masked (bắt đầu bằng ****), ta cần lấy giá trị thật từ DB nếu nó bị masked
    let realApiKey = apiKey;
    let realApiToken = apiToken;

    const isApiKeyMasked = typeof apiKey === 'string' && apiKey.startsWith('****');
    const isApiTokenMasked = typeof apiToken === 'string' && apiToken.startsWith('****');

    if (isApiKeyMasked || isApiTokenMasked) {
      const dbConfig = await prisma.shopShipper.findUnique({
        where: {
          shopId_shipperCode: {
            shopId: user.shopId,
            shipperCode,
          },
        },
      });
      if (dbConfig) {
        if (isApiKeyMasked) realApiKey = decryptSecret(dbConfig.apiKey);
        if (isApiTokenMasked) realApiToken = decryptSecret(dbConfig.apiToken);
      }
    }

    if (!realApiToken) {
      return jsonError(`Vui lòng cung cấp API Token để test connection cho ${shipperCode}.`, 400);
    }

    // 3. Test cho từng nhà vận chuyển
    if (shipperCode === 'GHN') {
      const baseUrl = mode === 'production' 
        ? 'https://online-gateway.ghn.vn/shiip/public-api/v2' 
        : 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2';

      try {
        const res = await fetch(`${baseUrl}/shop/all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Token': realApiToken,
          },
          body: JSON.stringify({}),
        });

        const data = await res.json();
        if (res.status === 200 && data.code === 200) {
          if (realApiKey) {
            const shopList = data.data?.shops || [];
            const hasShop = shopList.some(s => String(s._id) === String(realApiKey));
            if (!hasShop) {
              return jsonError(`Token hợp lệ, nhưng không tìm thấy Shop ID ${realApiKey} trong danh sách cửa hàng GHN của bạn.`, 400);
            }
          }
          return jsonSuccess({ connected: true, message: `Kết nối thành công tới GHN (${mode}). Đã xác thực Token và Shop ID.` });
        } else {
          return jsonError(`Kết nối GHN thất bại: ${data.message || 'Sai token hoặc lỗi hệ thống GHN.'}`, 400);
        }
      } catch (err) {
        return jsonError(`Không thể kết nối tới server GHN: ${err.message}`, 500);
      }
    }

    if (shipperCode === 'JT') {
      try {
        // Build credentials format used by JT adapter
        const credentials = { apiKey: realApiKey, mode };
        // We can just use the calculateFee logic since it calls FREIGHTQUERY
        const { jtAdapter } = await import('@/lib/carriers/jt');
        const res = await jtAdapter.calculateFee({}, credentials);
        
        if (res.success) {
          return jsonSuccess({ connected: true, message: `Kết nối thành công tới J&T (${mode}). Phí check: ${res.fee}` });
        } else {
          return jsonError(`Kết nối J&T thất bại: ${res.error}`, 400);
        }
      } catch (err) {
        return jsonError(`Lỗi hệ thống khi test J&T: ${err.message}`, 500);
      }
    }

    // Với các carrier chưa hỗ trợ API thật: trả lỗi rõ
    return jsonError(`Nhà vận chuyển ${shipperCode} chưa được cấu hình đặc tả API thật. Kết nối ${mode} bị từ chối.`, 400);

  } catch (error) {
    return serverError('[POST /api/shippers/test-connection]', error);
  }
}
