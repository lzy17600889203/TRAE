// 综合端到端测试脚本：模拟客户端调用所有关键接口
import http from 'node:http';

const BASE = 'http://localhost:4000/api';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body !== undefined) r.write(JSON.stringify(body));
    r.end();
  });
}

let passed = 0, failed = 0;
const failedAssertions = [];
function assert(label, cond, detail) {
  if (cond) {
    console.log('  OK  ' + label);
    passed++;
  } else {
    console.log('  FAIL ' + label + '  detail=' + (detail || ''));
    failed++;
    failedAssertions.push(label);
  }
}

async function suite() {
  console.log('\n=== 全局重置并加载默认场景 ===');
  const reset = await req('POST', '/reset');
  assert('reset 200', reset.status === 200, 'status=' + reset.status);

  console.log('\n=== 客户/项目接口 ===');
  const clients = await req('GET', '/clients');
  assert('客户列表非空', Array.isArray(clients.body) && clients.body.length > 0, 'got ' + JSON.stringify(clients.body));

  const projects = await req('GET', '/projects/detail');
  assert('项目列表非空', Array.isArray(projects.body) && projects.body.length > 0);

  const newClient = await req('POST', '/clients', { name: '__测试客户__', contact: 'test@test.com' });
  assert('新增客户成功', newClient.status === 200 && newClient.body && newClient.body.id, 'status=' + newClient.status);

  const newProject = await req('POST', '/projects', {
    client_id: newClient.body.id,
    name: '__测试项目__',
    rate: 500,
    billing_mode: 'hourly'
  });
  assert('新增项目成功', newProject.status === 200 && newProject.body.id);

  console.log('\n=== 工时记录（鲁棒性：25h / 负数）===');
  const e1 = await req('POST', '/time-entries', { project_id: newProject.body.id, work_date: '2025-06-01', hours: 25, description: '故意输入 25h' });
  assert('25h 被钳制到 24h 且成功', e1.status === 200 && e1.body.entry && e1.body.entry.hours === 24, 'got hours=' + (e1.body.entry && e1.body.entry.hours));

  const e2 = await req('POST', '/time-entries', { project_id: newProject.body.id, work_date: '2025-06-02', hours: -5, description: '故意输入负数' });
  assert('负数工时被钳制到 0', e2.status === 200 && e2.body.entry.hours === 0, 'got hours=' + (e2.body.entry && e2.body.entry.hours));

  const e3 = await req('POST', '/time-entries', { project_id: newProject.body.id, work_date: '2025-06-03', hours: 8.5, description: '正常工时' });
  assert('正常工时成功', e3.status === 200 && e3.body.entry.hours === 8.5);

  console.log('\n=== 按件计费项目验证 ===');
  const flatProject = await req('POST', '/projects', { client_id: newClient.body.id, name: '__按件__', rate: 9999, billing_mode: 'flat' });
  assert('按件项目创建成功', flatProject.body && flatProject.body.id);
  await req('POST', '/time-entries', { project_id: flatProject.body.id, work_date: '2025-06-10', hours: 5, description: '按件开发' });
  const genFlat = await req('POST', '/invoices/generate', { project_id: flatProject.body.id, year: 2025, month: 6 });
  assert('按件账单金额=固定rate', genFlat.body.invoice && genFlat.body.invoice.total_amount === 9999, 'amount=' + (genFlat.body.invoice && genFlat.body.invoice.total_amount));

  console.log('\n=== 按时计费项目 + 负数时薪 ===');
  const badRateProj = await req('POST', '/projects', { client_id: newClient.body.id, name: '__负数时薪__', rate: -100, billing_mode: 'hourly' });
  assert('负数时薪修正为 0', badRateProj.body.rate === 0, 'rate=' + badRateProj.body.rate);
  await req('POST', '/time-entries', { project_id: badRateProj.body.id, work_date: '2025-06-01', hours: 10, description: '负数时薪场景' });
  const genBad = await req('POST', '/invoices/generate', { project_id: badRateProj.body.id, year: 2025, month: 6 });
  assert('负数时薪的账单金额=0', genBad.body.invoice && genBad.body.invoice.total_amount === 0);

  // 之前对同一项目添加了 25h(钳制到24) + -5h(钳制到0) + 8.5h，总计 32.5h
  const gen = await req('POST', '/invoices/generate', { project_id: newProject.body.id, year: 2025, month: 6 });
  assert('按时账单生成成功（考虑前两条钳制工时）',
    gen.status === 200 && gen.body.invoice.total_amount === 32.5 * 500,
    'amount=' + (gen.body.invoice && gen.body.invoice.total_amount) + ' hours=' + (gen.body.invoice && gen.body.invoice.total_hours));

  console.log('\n=== 账单状态变更 ===');
  const upd = await req('PATCH', '/invoices/' + gen.body.invoice.id, { status: 'paid' });
  assert('标记已付款成功', upd.body.status === 'paid');

  console.log('\n=== 汇总 ===');
  const sum = await req('GET', '/summary');
  assert('汇总返回正确字段', sum.body && typeof sum.body.totalHours === 'number' && typeof sum.body.totalAmount === 'number');

  console.log('\n=== 5 个测试场景 ===');
  const scenarios = ['big-monthly', 'small-flat', 'overtime-crazy', 'overdue-half-year', 'timezone-mistake'];
  for (const key of scenarios) {
    console.log('\n--- 场景: ' + key + ' ---');
    const r = await req('POST', '/scenarios/load', { key });
    assert(key + ' 切换成功', r.status === 200);
    const invoices = await req('GET', '/invoices');
    assert(key + ' 存在账单', Array.isArray(invoices.body) && invoices.body.length > 0, 'count=' + invoices.body.length);
    if (key === 'overtime-crazy') {
      const has12Plus = invoices.body.some((inv) => inv.total_hours >= 50);
      assert('加班场景包含大量工时', has12Plus);
    }
    if (key === 'overdue-half-year') {
      const allUnpaid = invoices.body.every((inv) => inv.status === 'unpaid');
      assert('拖欠场景全为未付款', allUnpaid);
    }
    if (key === 'timezone-mistake') {
      const hasNote = invoices.body.some((inv) => inv.note && inv.note.length > 0);
      assert('跨时区场景带有备注', hasNote);
    }
  }

  console.log('\n=== Summary: ' + passed + ' passed / ' + failed + ' failed ===');
  if (failedAssertions.length) console.log('FAILED: ' + JSON.stringify(failedAssertions));
  process.exit(failed ? 1 : 0);
}

suite().catch((e) => { console.error(e); process.exit(1); });
