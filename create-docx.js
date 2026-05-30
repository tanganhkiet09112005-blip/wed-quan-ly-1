const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const mdContent = fs.readFileSync('docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z.md', 'utf8');

const doc = new Document({
  sections: [
    {
      properties: {},
      children: mdContent.split('\n').map(line => {
        const text = line.replace(/#/g, '').trim();
        if (line.startsWith('# ')) {
          return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
        } else if (line.startsWith('## ')) {
          return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
        } else if (line.startsWith('### ')) {
          return new Paragraph({ text, heading: HeadingLevel.HEADING_3 });
        } else if (line.trim() === '') {
          return new Paragraph({ text: '' });
        } else {
          return new Paragraph({
            children: [new TextRun({ text: line })]
          });
        }
      }),
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z_FINAL_v5.docx', buffer);
  console.log('Document created successfully');
});
