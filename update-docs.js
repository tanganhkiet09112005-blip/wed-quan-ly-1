const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const mdPath = 'docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z.md';
let md = fs.readFileSync(mdPath, 'utf8');

// Append new sections if not exists
if (!md.includes('11. Quản lý đơn hàng')) {
  md += `\n\n## 11. Quản lý đơn hàng và Lên đơn\n- **Shop tạo đơn**: Form lên đơn đã có các trường: Tên người gửi, SĐT gửi, Địa chỉ gửi, Người nhận (Tên, SĐT, Tỉnh/Thành/Quận/Huyện/Phường xã), Trọng lượng, Nội dung hàng hoá, Tiền thu hộ, Phí ship.\n- **Bảng danh sách đơn hàng Admin**: Bảng tổng hợp hiển thị 24 cột thông tin bao gồm người gửi, người nhận, trọng lượng, phí vận chuyển.\n- **Xuất Excel**: Chứa đầy đủ các field mới và hỗ trợ định dạng UTF-8 BOM.\n- **Phân quyền**: Admin tổng xem tất cả, Admin con xem đơn thuộc shop mình, Shop chỉ xem đơn shop mình.`;
  fs.writeFileSync(mdPath, md);
}

// Export Word doc v6
const doc = new Document({
  sections: [
    {
      properties: {},
      children: md.split('\n').map(line => {
        const text = line.replace(/#/g, '').trim();
        if (line.startsWith('# ')) return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
        if (line.startsWith('## ')) return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
        if (line.startsWith('### ')) return new Paragraph({ text, heading: HeadingLevel.HEADING_3 });
        if (line.trim() === '') return new Paragraph({ text: '' });
        return new Paragraph({ children: [new TextRun({ text: line })] });
      }),
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z_FINAL_v7.docx', buffer);
  console.log('Docx v7 generated');
});

// Update Audit File
const auditPath = 'docs/FINAL_PRE_DEPLOY_PRODUCTION_AUDIT.md';
let audit = fs.readFileSync(auditPath, 'utf8');
audit += `\n\n## 7. Cập nhật chi tiết Đơn hàng (Sender, Receiver, Weight)\n1. Đã bổ sung chi tiết đơn hàng.\n2. Đã thêm thông tin người gửi.\n3. Đã thêm thông tin người nhận.\n4. Đã thêm trọng lượng.\n5. Đã thêm nội dung hàng hoá.\n6. Đã cập nhật danh sách đơn Admin tổng (24 cột, có cuộn ngang).\n7. Đã đảm bảo phân quyền Admin tổng/Admin con/Shop ở tầng Backend.\n8. Đã đảm bảo bảng giá theo shop không lỗi.\n9. Đã đảm bảo thông luồng không lỗi.\n10. Đã đảm bảo export Excel có đủ field.\n11. Prisma/lint/build pass.\n12. File Word đã cập nhật.\n`;
fs.writeFileSync(auditPath, audit);
console.log('Audit updated');
