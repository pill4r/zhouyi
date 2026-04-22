const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const outputDir = '/opt/data/home/zhouyi_web/public/coins';

// SOCKS5 proxy
const proxyHost = 'host.docker.internal';
const proxyPort = 7891;

function socks5Connect(targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(10000);
    
    socket.connect(proxyPort, proxyHost, () => {
      // SOCKS5 handshake
      socket.write(Buffer.from([0x05, 0x01, 0x00]));
    });
    
    let state = 'handshake';
    
    socket.on('data', (data) => {
      if (state === 'handshake') {
        if (data.length >= 2 && data[0] === 0x05 && data[1] === 0x00) {
          state = 'connect';
          const addr = Buffer.from(targetHost);
          const req = Buffer.concat([
            Buffer.from([0x05, 0x01, 0x00, 0x03]),
            Buffer.from([addr.length]),
            addr,
            Buffer.from([(targetPort >> 8) & 0xff, targetPort & 0xff])
          ]);
          socket.write(req);
        } else {
          reject(new Error('SOCKS5 auth failed'));
        }
      } else if (state === 'connect') {
        if (data.length >= 2 && data[1] === 0x00) {
          resolve(socket);
        } else {
          reject(new Error(`SOCKS5 connect failed: ${data[1]}`));
        }
      }
    });
    
    socket.on('error', reject);
    socket.on('timeout', () => reject(new Error('timeout')));
  });
}

const net = require('net');

async function downloadImage(urlPath, target, filename) {
  console.log(`Downloading ${filename}...`);
  
  try {
    const socket = await socks5Connect(target, 443);
    
    const tls = require('tls');
    const tlsSocket = tls.connect({
      socket: socket,
      servername: target,
      rejectUnauthorized: false
    }, () => {
      const req = `GET ${urlPath} HTTP/1.1\r\nHost: ${target}\r\nUser-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n`;
      tlsSocket.write(req);
    });
    
    const chunks = [];
    let headerParsed = false;
    let contentLength = 0;
    
    tlsSocket.on('data', (data) => {
      if (!headerParsed) {
        const str = data.toString('utf8');
        const headerEnd = str.indexOf('\r\n\r\n');
        if (headerEnd >= 0) {
          headerParsed = true;
          const headers = str.substring(0, headerEnd);
          console.log('  Status:', headers.split('\r\n')[0]);
          const match = headers.match(/content-length:\s*(\d+)/i);
          if (match) contentLength = parseInt(match[1]);
          
          const bodyStart = headerEnd + 4;
          const bodyChunk = data.slice(bodyStart);
          chunks.push(bodyChunk);
        }
      } else {
        chunks.push(data);
      }
    });
    
    await new Promise((resolve, reject) => {
      tlsSocket.on('end', resolve);
      tlsSocket.on('error', reject);
    });
    
    const buffer = Buffer.concat(chunks);
    console.log(`  Received: ${buffer.length} bytes`);
    
    if (buffer.length > 1000) {
      const savePath = path.join(outputDir, filename);
      fs.writeFileSync(savePath, buffer);
      console.log(`  ✅ Saved: ${savePath}`);
      return true;
    }
    return false;
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    return false;
  }
}

(async () => {
  const s1 = await downloadImage(
    '/wikipedia/commons/thumb/e/e1/Tang_Dynasty_Kaiyuan_Tongbao_Obv.jpg/640px-Tang_Dynasty_Kaiyuan_Tongbao_Obv.jpg',
    'upload.wikimedia.org',
    'coin-zi.jpg'
  );
  
  const s2 = await downloadImage(
    '/wikipedia/commons/thumb/0/06/Tang_Dynasty_Kaiyuan_Tongbao_Rev.jpg/640px-Tang_Dynasty_Kaiyuan_Tongbao_Rev.jpg',
    'upload.wikimedia.org',
    'coin-bei.jpg'
  );
  
  console.log('\nDone.');
})();
