import fs from 'fs';
import { md2docx } from '@m2d/md2docx';

async function main() {
    try {
        console.log('Đang đọc file Markdown...');
        const mdContent = fs.readFileSync('docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z.md', 'utf8');
        
        console.log('Đang chuyển đổi sang DOCX...');
        const blob = await md2docx(mdContent);
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Đang lưu file DOCX...');
        fs.writeFileSync('docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z_FINAL.docx', buffer);
        
        console.log('Chuyển đổi thành công! Đã lưu tại docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z_FINAL.docx');
    } catch (error) {
        console.error('Lỗi khi chuyển đổi:', error);
        process.exit(1);
    }
}

main();
