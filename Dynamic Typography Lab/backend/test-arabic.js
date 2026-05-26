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

async function testArabic() {
  console.log('=== 测试阿拉伯文排版 ===\n');

  const testText = `لكتابة النصوص العربية بشكل صحيح، يجب توصيل الحروف مع بعضها البعض. هذا يظهر أهمية معالجة النصوص المعقدة في أنظمة الطباعة الحديثة.

The quick brown fox jumps over the lazy dog. This is English text with fi, fl, ffi ligatures.`;

  console.log('测试文本:', testText);
  console.log('\n--- 测试 1: 正常模式 ---');
  const result1 = await makeRequest('/api/typeset', 'POST', {
    text: testText,
    options: {
      columnWidth: 400,
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
  console.log('行数:', result1.data.lines.length);
  console.log('问题数:', result1.data.issues.length);
  result1.data.lines.forEach((line, i) => {
    console.log(`行 ${i + 1}: ${line.text}`);
  });
  if (result1.data.issues.length > 0) {
    console.log('检测到的问题:');
    result1.data.issues.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
  }

  console.log('\n--- 测试 2: 阿拉伯文断连模式 ---');
  const result2 = await makeRequest('/api/typeset', 'POST', {
    text: testText,
    options: {
      columnWidth: 400,
      wordSpacing: 1.0,
      letterSpacing: 0,
      hyphenationRules: 'normal',
      ligatureMode: 'normal',
      fontSize: 16,
      tolerance: 200,
      arabicBreakConnections: true,
      opticalMarginAlignment: true
    }
  });
  console.log('行数:', result2.data.lines.length);
  console.log('问题数:', result2.data.issues.length);
  result2.data.lines.forEach((line, i) => {
    console.log(`行 ${i + 1}: ${line.text}`);
  });
  if (result2.data.issues.length > 0) {
    console.log('检测到的问题:');
    result2.data.issues.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
  }

  console.log('\n--- 测试 3: 连字冲突模式 ---');
  const result3 = await makeRequest('/api/typeset', 'POST', {
    text: testText,
    options: {
      columnWidth: 400,
      wordSpacing: 1.0,
      letterSpacing: 0,
      hyphenationRules: 'normal',
      ligatureMode: 'conflict',
      fontSize: 16,
      tolerance: 200,
      arabicBreakConnections: false,
      opticalMarginAlignment: true
    }
  });
  console.log('行数:', result3.data.lines.length);
  console.log('问题数:', result3.data.issues.length);
  result3.data.lines.forEach((line, i) => {
    console.log(`行 ${i + 1}: ${line.text}`);
  });
  if (result3.data.issues.length > 0) {
    console.log('检测到的问题:');
    result3.data.issues.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
  }

  console.log('\n=== 测试完成 ===');
}

testArabic().catch(console.error);
