const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');

const outputDir = '/opt/data/home/zhouyi_web/public/coins';

// 尝试不同代理地址
const proxies = [
  'http://host.docker.internal:7890',
  'http://host.docker.internal:7891',
  'socks5://host.docker.internal:7891',
];

const images = [
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tang_Dynasty_Kaiyuan_Tongbao_Obv.jpg/640px-Tang_Dynasty_Kaiyuan_Tongbao_Obv.jpg',
    name: 'coin-zi.jpg'
  },
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Tang_Dynasty_Kaiyuan_Tongbao_Rev.jpg/640px-Tang_Dynasty_Kaiyuan_Tongbao_Rev.jpg',
    name: 'coin-bei.jpg'
  }
];

async function download(url, savePath, proxyUrl) {
  return new Promise((resolve) => {
    const agent = new HttpsProxyAgent(proxyUrl);
    
    const req = https.get(url, { agent }, (res) => {
      console.log(`  Status: ${res.statusCode}, Length: ${res.headers['content-length'] || 'unknown'}`);
      
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`  Downloaded: ${buffer.length} bytes`);
        if (buffer.length > 1000) {
          fs.writeFileSync(savePath, buffer);
          console.log(`  ✅ Saved: ${savePath}`);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`  ❌ Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

(async () => {
  for (const img of images) {
    const savePath = path.join(outputDir, img.name);
    console.log(`\nDownloading ${img.name}...`);
    
    let success = false;
    for (const proxy of proxies) {
      console.log(`  Trying proxy: ${proxy}`);
      success = await download(img.url, savePath, proxy);
      if (success) break;
    }
    
    if (!success) {
      console.log(`  ❌ All proxies failed for ${img.name}`);
    }
  }
})();
