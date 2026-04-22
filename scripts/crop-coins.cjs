const sharp = require('sharp');
const path = require('path');

const inputDir = '/opt/data/home/zhouyi_web/public/coins';
const outputDir = '/opt/data/home/zhouyi_web/public/coins';

async function processImages() {
  // 处理 coin-test2.jpg - 单枚钱币正反面
  // 尺寸是 3816x2110，左右各一半
  const img2 = path.join(inputDir, 'coin-test2.jpg');
  const meta2 = await sharp(img2).metadata();
  console.log('coin-test2.jpg:', meta2.width, 'x', meta2.height);

  const halfWidth = Math.floor(meta2.width / 2);

  // 左半部分
  await sharp(img2)
    .extract({ left: 0, top: 0, width: halfWidth, height: meta2.height })
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toFile(path.join(outputDir, 'coin-left.jpg'));
  console.log('✅ 左半部分已保存');

  // 右半部分
  await sharp(img2)
    .extract({ left: halfWidth, top: 0, width: meta2.width - halfWidth, height: meta2.height })
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toFile(path.join(outputDir, 'coin-right.jpg'));
  console.log('✅ 右半部分已保存');
}

processImages().catch(console.error);
