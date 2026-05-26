const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('=== 测试预设 API ===');
  const presets = await makeRequest('/api/presets');
  console.log('预设列表:', JSON.stringify(presets, null, 2));

  console.log('\n=== 测试排版 API ===');
  const testText = 'The quick brown fox jumps over the lazy dog. This is a test of the Knuth-Plass algorithm.';
  const typesetResult = await makeRequest('/api/typeset', 'POST', {
    text: testText,
    options: {
      columnWidth: 300,
      wordSpacing: 1.0,
      letterSpacing: 0,
      hyphenationRules: 'normal',
      ligatureMode: 'normal',
      fontSize: 16,
      tolerance: 200,
      arabicBreakConnections: false,
      opticalMarginAlignment: true
    }
  });
  console.log('排版结果:', JSON.stringify(typesetResult, null, 2));

  console.log('\n=== 测试文本测量 API ===');
  const measureResult = await makeRequest('/api/measure', 'POST', {
    text: 'Hello World',
    fontSize: 16,
    letterSpacing: 0
  });
  console.log('测量结果:', JSON.stringify(measureResult, null, 2));
}

test().catch(console.error);
