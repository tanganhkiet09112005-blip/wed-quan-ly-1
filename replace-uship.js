const fs = require('fs');
const glob = require('glob');

const files = glob.sync('docs/**/*.md');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/Hship\/Uship/gi, 'Hship');
  content = content.replace(/Uship Layout/gi, 'giao diện mẫu khách gửi');
  content = content.replace(/chuẩn Uship/gi, 'chuẩn mẫu khách gửi');
  content = content.replace(/Uship Orders Layout/gi, 'Hship Orders Layout');
  content = content.replace(/Uship/gi, 'Hship');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
