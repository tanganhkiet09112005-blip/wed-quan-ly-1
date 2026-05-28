/**
 * chatbot-parser.js
 * Rule-based parser cho mock chatbot
 */

export function parseComment(comment) {
  const result = {
    phone: null,
    quantity: null,
    size: null,
    address: null,
    product: null
  };
  
  if (!comment || typeof comment !== 'string') return result;

  // 1. Phone number (VN format)
  const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
  const phoneMatch = comment.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  // 2. Quantity
  const qtyRegex = /(?:x|sl|số lượng)\s*(\d+)/i;
  const qtyMatch = comment.match(qtyRegex);
  if (qtyMatch) {
    result.quantity = parseInt(qtyMatch[1], 10);
  } else {
    const qtyRegex2 = /(\d+)\s*(?:cái|chiếc|bộ|cuốn)/i;
    const qtyMatch2 = comment.match(qtyRegex2);
    if (qtyMatch2) {
      result.quantity = parseInt(qtyMatch2[1], 10);
    }
  }

  // 3. Size
  const sizeRegex = /(?:size|sz)\s*([A-Za-z0-9]+)/i;
  const sizeMatch = comment.match(sizeRegex);
  if (sizeMatch) {
    result.size = sizeMatch[1].toUpperCase();
  }

  // 4. Address
  const addrRegex = /(?:địa chỉ|dc|đc|ship tới|gửi về)\s*([^,.\n]+)/i;
  const addrMatch = comment.match(addrRegex);
  if (addrMatch) {
    result.address = addrMatch[1].trim();
  }

  // 5. Product name simple extraction
  // Assuming comment format "Chốt áo đỏ size M" -> extract "áo đỏ"
  const productRegex = /(?:chốt|lấy|mua)\s+(.*?)(?=\s+(?:size|sz|x|sl|\d+|sdt|sđt|0[35789]|địa chỉ|dc|đc))/i;
  const productMatch = comment.match(productRegex);
  if (productMatch) {
    result.product = productMatch[1].trim();
  } else {
    // Nếu comment chỉ ngắn gọn "áo đỏ" mà không có keyword thì khó nhận diện bằng regex.
    // Lấy nguyên chuỗi nếu không dài quá và không chứa SĐT (fallback cơ bản).
    if (comment.length < 50 && !phoneMatch) {
      const parts = comment.split(/,|;/);
      result.product = parts[0].trim();
    }
  }

  return result;
}
