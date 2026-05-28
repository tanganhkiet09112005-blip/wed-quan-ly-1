/**
 * Trích xuất SĐT Việt Nam từ văn bản bình luận hoặc tin nhắn
 */
export function extractPhone(text = '') {
  // Bỏ khoảng trắng trước khi regex để bắt được dạng "090 123 4567"
  const plainText = text.replace(/\s+/g, '');
  const phoneRegex = /(?:0|\+84|84)(3|5|7|8|9)\d{8}\b/;
  const match = plainText.match(phoneRegex);
  return match ? match[0] : null;
}

/**
 * Trích xuất số lượng từ văn bản
 * Các trường hợp: "x2", "2 cái", "sl 2", "số lượng: 2", "2 chiếc"
 */
export function extractQuantity(text = '') {
  const normalized = text.toLowerCase();
  
  // Trường hợp: x2, x 2, sl2, sl 2
  const qtyPattern1 = /\b(?:x|sl|số lượng|soluong)\s*:?\s*(\d+)\b/;
  const match1 = normalized.match(qtyPattern1);
  if (match1) return parseInt(match1[1], 10);

  // Trường hợp: 2 cái, 2 chiếc, 2c, 2 sp
  const qtyPattern2 = /\b(\d+)\s*(?:cái|chiếc|c|sp|cai|chiec|items?)\b/;
  const match2 = normalized.match(qtyPattern2);
  if (match2) return parseInt(match2[1], 10);

  return null;
}

/**
 * Trích xuất Size quần áo từ văn bản
 * Các trường hợp: "size S", "size M", "sz L", "L", "XL", "XXL"
 */
export function extractSize(text = '') {
  const normalized = text.toUpperCase();
  
  // Trích xuất dạng "SIZE S", "SZ M"
  const sizePattern1 = /\b(?:SIZE|SZ)\s*([SML]|[X|S|M|L]{2,3})\b/;
  const match1 = normalized.match(sizePattern1);
  if (match1) return match1[1];

  // Trích xuất trực tiếp nếu có từ khóa độc lập đứng một mình (S, M, L, XL, XXL) trong comment ngắn
  const sizePattern2 = /\b(S|M|L|XL|XXL|XXXL)\b/;
  const match2 = normalized.match(sizePattern2);
  if (match2) return match2[1];

  return null;
}

/**
 * Trích xuất địa chỉ giao hàng
 */
export function extractAddress(text = '') {
  const lower = text.toLowerCase();
  
  if (text.length < 10) return null;

  // Từ khóa nhận diện địa chỉ Việt Nam
  const addressKeywords = [
    'phường', 'phuong', 'quận', 'quan', 'huyện', 'huyen', 'tỉnh', 'tinh', 
    'đường', 'duong', 'thôn', 'thon', 'xã', 'xa', 'số nhà', 'sonha', 
    'thành phố', 'tp', 'thanh pho', 'ấp', 'ap'
  ];

  const containsKeyword = addressKeywords.some(keyword => lower.includes(keyword));
  if (containsKeyword) {
    let cleanAddress = text
      .replace(/(?:0|\+84|84)(3|5|7|8|9)\d{8}\b/g, '') // Bỏ sđt
      .replace(/\b(?:size|sz)\s*\w+\b/gi, '')           // Bỏ size
      .replace(/\b(?:x|sl)\s*\d+\b/gi, '')              // Bỏ sl
      .trim();

    cleanAddress = cleanAddress.replace(/^[,.\s-]+|[,.\s-]+$/g, '');
    return cleanAddress.length >= 8 ? cleanAddress : null;
  }

  return null;
}

/**
 * Trích xuất thông tin sản phẩm (nếu có bình luận livestream tên sản phẩm)
 * Thường có cú pháp: "tên_sp + sđt" hoặc "tên_sp size màu sđt"
 */
export function extractProduct(text = '') {
  let productText = text
    .replace(/(?:0|\+84|84)(3|5|7|8|9)\d{8}\b/g, '') // Bỏ sđt
    .replace(/\b(?:size|sz)\s*\w+\b/gi, '')           // Bỏ size
    .replace(/\b(?:x|sl)\s*\d+\b/gi, '')              // Bỏ sl
    .replace(/[,.-]/g, ' ')                           // Thay kí tự phân tách
    .replace(/\s+/g, ' ')
    .trim();

  // Nếu còn lại chuỗi text độ dài vừa phải thì coi là tên sản phẩm
  if (productText.length > 2 && productText.length < 30) {
    return productText;
  }
  return null;
}

/**
 * Bóc tách toàn bộ thông tin từ một tin nhắn/bình luận
 */
export function parseCustomerMessage(text = '') {
  return {
    phone: extractPhone(text),
    quantity: extractQuantity(text),
    size: extractSize(text),
    address: extractAddress(text),
    productName: extractProduct(text),
  };
}
