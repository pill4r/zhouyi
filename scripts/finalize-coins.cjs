const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = '/opt/data/home/zhouyi_web/public/coins';

async function finalize() {
  // 处理字面 - 左半部分 (coin-left.jpg)
  await sharp(path.join(outputDir, 'coin-left.jpg'))
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .png({ quality: 95 })
    .toFile(path.join(outputDir, 'coin-zi.png'));
  console.log('✅ 字面 coin-zi.png 已生成');

  // 处理背面 - 右半部分 (coin-right.jpg)
  await sharp(path.join(outputDir, 'coin-right.jpg'))
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .png({ quality: 95 })
    .toFile(path.join(outputDir, 'coin-bei.png'));
  console.log('✅ 背面 coin-bei.png 已生成');

  // 清理临时文件
  const toRemove = ['coin-zi-test.jpg', 'coin-test2.jpg', 'coin-left.jpg', 'coin-right.jpg'];
  for (const f of toRemove) {
    const p = path.join(outputDir, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`🗑️ 删除临时文件: ${f}`);
    }
  }

  // 显示最终文件大小
  for (const f of ['coin-zi.png', 'coin-bei.png']) {
    const p = path.join(outputDir, f);
    const stat = fs.statSync(p);
    console.log(`${f}: ${(stat.size / 1024).toFixed(1)} KB`);
  }
}

finalize().catch(console.error);
