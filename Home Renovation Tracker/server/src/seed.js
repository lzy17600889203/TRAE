'use strict';

const { getDb } = require('./db');

const SCENARIOS = [
  {
    key: 'luxury',
    name: '预算充足土豪装修',
    description: '不差钱，想要的都买下，预算不紧张，一切以品质为先。',
    stages: [
      {
        name: '水电',
        planned: 30000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '电线套餐（品牌）', category: '材料', planned: 8000, actual: 8500, paid: 1, unit: '套', supplier: '某名牌旗舰店' },
          { item_name: '水管配件', category: '材料', planned: 4000, actual: 4200, paid: 1, unit: '套' },
          { item_name: '开关插座豪华版', category: '材料', planned: 3500, actual: 3800, paid: 1, unit: '套' },
          { item_name: '水电工人工', category: '人工', planned: 12000, actual: 12000, paid: 1, unit: '次' },
          { item_name: '智能布线预留', category: '升级项', planned: 2500, actual: 2800, paid: 1, unit: '次' }
        ]
      },
      {
        name: '泥瓦',
        planned: 60000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '进口瓷砖（客厅）', category: '材料', planned: 25000, actual: 26500, paid: 1, unit: 'm²', quantity: 60 },
          { item_name: '进口瓷砖（卫生间）', category: '材料', planned: 12000, actual: 12800, paid: 1, unit: 'm²', quantity: 18 },
          { item_name: '水泥沙子', category: '材料', planned: 3000, actual: 3200, paid: 1, unit: '袋' },
          { item_name: '泥瓦工人工', category: '人工', planned: 18000, actual: 19000, paid: 1, unit: '次' },
          { item_name: '防水处理加强版', category: '材料', planned: 2000, actual: 2200, paid: 1, unit: '次' }
        ]
      },
      {
        name: '木工',
        planned: 80000,
        progress: 80,
        status: 'active',
        expenses: [
          { item_name: '定制整体衣柜（实木）', category: '定制家具', planned: 35000, actual: 36000, paid: 1, unit: '套' },
          { item_name: '定制书柜', category: '定制家具', planned: 15000, actual: 16500, paid: 1, unit: '套' },
          { item_name: '吊顶造型', category: '吊顶', planned: 8000, actual: 8500, paid: 1, unit: 'm²' },
          { item_name: '木门（三扇）', category: '门窗', planned: 12000, actual: 13000, paid: 1, unit: '扇', quantity: 3 },
          { item_name: '电视背景墙', category: '造型', planned: 10000, actual: 0, paid: 0, unit: '项' }
        ]
      },
      {
        name: '油漆',
        planned: 20000,
        progress: 60,
        status: 'active',
        expenses: [
          { item_name: '进口环保漆', category: '材料', planned: 10000, actual: 10500, paid: 1, unit: '桶', quantity: 5 },
          { item_name: '油漆工人工', category: '人工', planned: 8000, actual: 5000, paid: 0, unit: '次' },
          { item_name: '辅料', category: '材料', planned: 2000, actual: 1500, paid: 1, unit: '套' }
        ]
      },
      {
        name: '软装',
        planned: 100000,
        progress: 20,
        status: 'active',
        expenses: [
          { item_name: '三人位沙发（进口皮）', category: '家具', planned: 30000, actual: 32000, paid: 1, unit: '件' },
          { item_name: '茶几', category: '家具', planned: 8000, actual: 0, paid: 0, unit: '件' },
          { item_name: '餐桌椅套装', category: '家具', planned: 15000, actual: 0, paid: 0, unit: '套' },
          { item_name: '主卧床', category: '家具', planned: 12000, actual: 13000, paid: 1, unit: '件' },
          { item_name: '窗帘定制', category: '布艺', planned: 8000, actual: 0, paid: 0, unit: '套' },
          { item_name: '吊灯（客厅+餐厅）', category: '灯具', planned: 6000, actual: 6500, paid: 1, unit: '盏', quantity: 2 },
          { item_name: '装饰画及摆件', category: '装饰', planned: 5000, actual: 0, paid: 0, unit: '件' },
          { item_name: '预留机动预算', category: '其他', planned: 16000, actual: 0, paid: 0, unit: '项' }
        ]
      }
    ]
  },
  {
    key: 'overbudget',
    name: '边装边改严重超支',
    description: '计划赶不上变化，看啥都想要，预算一超再超。',
    stages: [
      {
        name: '水电',
        planned: 20000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '基础水电材料', category: '材料', planned: 6000, actual: 6500, paid: 1, unit: '套' },
          { item_name: '临时增加的回路', category: '变更', planned: 0, actual: 3500, paid: 1, unit: '项' },
          { item_name: '开关插座升级', category: '升级项', planned: 2000, actual: 4500, paid: 1, unit: '套' },
          { item_name: '水电工人工', category: '人工', planned: 10000, actual: 13000, paid: 1, unit: '次' },
          { item_name: '智能系统预留（临时增加）', category: '变更', planned: 0, actual: 4000, paid: 1, unit: '项' }
        ]
      },
      {
        name: '泥瓦',
        planned: 40000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '客厅地砖（品牌升级）', category: '材料', planned: 15000, actual: 22000, paid: 1, unit: 'm²', quantity: 50 },
          { item_name: '卫生间瓷砖', category: '材料', planned: 6000, actual: 8500, paid: 1, unit: 'm²', quantity: 16 },
          { item_name: '厨房瓷砖临时改花样', category: '变更', planned: 0, actual: 3800, paid: 1, unit: 'm²', quantity: 8 },
          { item_name: '水泥沙子辅料', category: '材料', planned: 2500, actual: 3200, paid: 1, unit: '套' },
          { item_name: '泥瓦工人工', category: '人工', planned: 15000, actual: 18000, paid: 1, unit: '次' },
          { item_name: '额外防水加强', category: '变更', planned: 0, actual: 2200, paid: 1, unit: '次' }
        ]
      },
      {
        name: '木工',
        planned: 50000,
        progress: 90,
        status: 'active',
        expenses: [
          { item_name: '衣柜（设计临时改大）', category: '定制家具', planned: 18000, actual: 25000, paid: 1, unit: '套' },
          { item_name: '增加衣帽间柜体', category: '变更', planned: 0, actual: 12000, paid: 1, unit: '套' },
          { item_name: '吊顶造型加灯带', category: '升级项', planned: 5000, actual: 8500, paid: 1, unit: 'm²' },
          { item_name: '木门升级实木', category: '升级项', planned: 6000, actual: 10500, paid: 1, unit: '扇', quantity: 3 },
          { item_name: '电视柜背景墙（临时增加）', category: '变更', planned: 0, actual: 6800, paid: 0, unit: '项' },
          { item_name: '木工人工', category: '人工', planned: 12000, actual: 15000, paid: 1, unit: '次' },
          { item_name: '增加入户鞋柜', category: '变更', planned: 0, actual: 4200, paid: 1, unit: '套' }
        ]
      },
      {
        name: '油漆',
        planned: 15000,
        progress: 70,
        status: 'active',
        expenses: [
          { item_name: '乳胶漆（换成更贵的）', category: '材料', planned: 6000, actual: 8500, paid: 1, unit: '桶', quantity: 4 },
          { item_name: '背景墙颜色改三次', category: '变更', planned: 0, actual: 2500, paid: 1, unit: '次' },
          { item_name: '油漆工人工', category: '人工', planned: 7000, actual: 9000, paid: 0, unit: '次' },
          { item_name: '增加艺术漆（临时决定）', category: '变更', planned: 0, actual: 4800, paid: 1, unit: 'm²', quantity: 6 }
        ]
      },
      {
        name: '软装',
        planned: 60000,
        progress: 40,
        status: 'active',
        expenses: [
          { item_name: '沙发（一眼相中贵的）', category: '家具', planned: 12000, actual: 22000, paid: 1, unit: '件' },
          { item_name: '茶几边几套装', category: '家具', planned: 4000, actual: 0, paid: 0, unit: '套' },
          { item_name: '餐桌椅（进口品牌）', category: '升级项', planned: 8000, actual: 15000, paid: 1, unit: '套' },
          { item_name: '床和床垫', category: '家具', planned: 10000, actual: 14000, paid: 1, unit: '套' },
          { item_name: '窗帘（临时看上更贵的）', category: '升级项', planned: 5000, actual: 9500, paid: 0, unit: '套' },
          { item_name: '灯具', category: '灯具', planned: 5000, actual: 0, paid: 0, unit: '套' },
          { item_name: '装饰', category: '装饰', planned: 3000, actual: 0, paid: 0, unit: '套' },
          { item_name: '地毯（种草新购买）', category: '变更', planned: 0, actual: 3200, paid: 1, unit: '件' }
        ]
      }
    ]
  },
  {
    key: 'refund',
    name: '买错材料疯狂退货',
    description: '选材料眼睛瞎，买回来才发现错了，疯狂退货中。',
    stages: [
      {
        name: '水电',
        planned: 25000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '电线（买错型号，已退）', category: '材料', planned: 7000, actual: 7000, paid: 1, refunded: 1, unit: '卷' },
          { item_name: '电线（重新下单正确型号）', category: '材料', planned: 0, actual: 7500, paid: 1, unit: '卷' },
          { item_name: '水管（买错品牌退货）', category: '材料', planned: 3000, actual: 3000, paid: 1, refunded: 1, unit: '套' },
          { item_name: '水管（正确品牌重新下单）', category: '材料', planned: 0, actual: 3200, paid: 1, unit: '套' },
          { item_name: '开关插座', category: '材料', planned: 3000, actual: 3000, paid: 1, unit: '套' },
          { item_name: '水电工人工', category: '人工', planned: 11000, actual: 11000, paid: 1, unit: '次' }
        ]
      },
      {
        name: '泥瓦',
        planned: 45000,
        progress: 95,
        status: 'active',
        expenses: [
          { item_name: '客厅瓷砖（颜色买错，退货）', category: '材料', planned: 15000, actual: 15000, paid: 1, refunded: 1, unit: 'm²', quantity: 50 },
          { item_name: '客厅瓷砖（重新选购）', category: '材料', planned: 0, actual: 16500, paid: 1, unit: 'm²', quantity: 50 },
          { item_name: '卫生间瓷砖（尺寸不对，部分退）', category: '材料', planned: 6000, actual: 2000, paid: 1, refunded: 1, unit: 'm²', quantity: 5 },
          { item_name: '卫生间瓷砖（剩余补货）', category: '材料', planned: 0, actual: 5500, paid: 1, unit: 'm²', quantity: 15 },
          { item_name: '水泥沙子', category: '材料', planned: 3000, actual: 3200, paid: 1, unit: '套' },
          { item_name: '泥瓦工人工', category: '人工', planned: 15000, actual: 16500, paid: 1, unit: '次' },
          { item_name: '防水涂料（买错型号退货）', category: '材料', planned: 1500, actual: 1500, paid: 1, refunded: 1, unit: '桶' },
          { item_name: '防水涂料（正确型号）', category: '材料', planned: 0, actual: 1600, paid: 1, unit: '桶' }
        ]
      },
      {
        name: '木工',
        planned: 55000,
        progress: 50,
        status: 'active',
        expenses: [
          { item_name: '衣柜板材（颜色选错，换货中）', category: '材料', planned: 20000, actual: 20000, paid: 1, refunded: 1, unit: '套' },
          { item_name: '衣柜板材（重新下单）', category: '材料', planned: 0, actual: 21500, paid: 1, unit: '套' },
          { item_name: '木门（尺寸测量错误，退货）', category: '门窗', planned: 8000, actual: 8000, paid: 1, refunded: 1, unit: '扇', quantity: 3 },
          { item_name: '木门（重新测量下单）', category: '门窗', planned: 0, actual: 9200, paid: 0, unit: '扇', quantity: 3 },
          { item_name: '吊顶材料', category: '吊顶', planned: 6000, actual: 6500, paid: 1, unit: 'm²' },
          { item_name: '木工人工', category: '人工', planned: 12000, actual: 7000, paid: 0, unit: '次' }
        ]
      },
      {
        name: '油漆',
        planned: 18000,
        progress: 30,
        status: 'active',
        expenses: [
          { item_name: '乳胶漆（色号选错，退货）', category: '材料', planned: 8000, actual: 8000, paid: 1, refunded: 1, unit: '桶', quantity: 4 },
          { item_name: '乳胶漆（新色号）', category: '材料', planned: 0, actual: 8500, paid: 1, unit: '桶', quantity: 4 },
          { item_name: '油漆工人工', category: '人工', planned: 8000, actual: 2000, paid: 0, unit: '次' },
          { item_name: '辅料', category: '材料', planned: 2000, actual: 1800, paid: 1, unit: '套' }
        ]
      },
      {
        name: '软装',
        planned: 70000,
        progress: 10,
        status: 'active',
        expenses: [
          { item_name: '沙发（颜色和预期不符，退货申请中）', category: '家具', planned: 15000, actual: 15000, paid: 1, refunded: 1, unit: '件' },
          { item_name: '沙发（重新选款预算增加）', category: '家具', planned: 0, actual: 18000, paid: 0, unit: '件' },
          { item_name: '茶几（尺寸太大，已退）', category: '家具', planned: 4000, actual: 4000, paid: 1, refunded: 1, unit: '件' },
          { item_name: '餐桌椅', category: '家具', planned: 10000, actual: 0, paid: 0, unit: '套' },
          { item_name: '床', category: '家具', planned: 12000, actual: 0, paid: 0, unit: '件' },
          { item_name: '窗帘', category: '布艺', planned: 8000, actual: 0, paid: 0, unit: '套' },
          { item_name: '灯具', category: '灯具', planned: 6000, actual: 0, paid: 0, unit: '套' },
          { item_name: '装饰', category: '装饰', planned: 4000, actual: 0, paid: 0, unit: '套' }
        ]
      }
    ]
  },
  {
    key: 'paused',
    name: '停工半个月没动静',
    description: '工人临时有事/材料没到，整个工地停摆中。',
    stages: [
      {
        name: '水电',
        planned: 22000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '电线材料', category: '材料', planned: 6000, actual: 6200, paid: 1, unit: '套' },
          { item_name: '水管材料', category: '材料', planned: 3000, actual: 3100, paid: 1, unit: '套' },
          { item_name: '开关插座', category: '材料', planned: 2500, actual: 2500, paid: 1, unit: '套' },
          { item_name: '水电工人工', category: '人工', planned: 10500, actual: 10500, paid: 1, unit: '次' }
        ]
      },
      {
        name: '泥瓦',
        planned: 42000,
        progress: 30,
        status: 'paused',
        expenses: [
          { item_name: '客厅地砖（只到货一半）', category: '材料', planned: 14000, actual: 7000, paid: 1, unit: 'm²', quantity: 25 },
          { item_name: '卫生间瓷砖（未到货）', category: '材料', planned: 5500, actual: 0, paid: 0, unit: 'm²' },
          { item_name: '水泥沙子', category: '材料', planned: 2500, actual: 2500, paid: 1, unit: '套' },
          { item_name: '泥瓦工人工（停工中）', category: '人工', planned: 15000, actual: 4500, paid: 0, unit: '次' },
          { item_name: '防水', category: '材料', planned: 2000, actual: 2000, paid: 1, unit: '次' },
          { item_name: '停工损失（延期补偿费）', category: '其他', planned: 0, actual: 0, paid: 0, unit: '项' }
        ]
      },
      {
        name: '木工',
        planned: 50000,
        progress: 0,
        status: 'pending',
        expenses: [
          { item_name: '衣柜（未开始）', category: '定制家具', planned: 18000, actual: 0, paid: 0, unit: '套' },
          { item_name: '木门（未开始）', category: '门窗', planned: 6000, actual: 0, paid: 0, unit: '扇' },
          { item_name: '吊顶（未开始）', category: '吊顶', planned: 5000, actual: 0, paid: 0, unit: 'm²' },
          { item_name: '木工人工（未开始）', category: '人工', planned: 15000, actual: 0, paid: 0, unit: '次' },
          { item_name: '其他（未开始）', category: '其他', planned: 6000, actual: 0, paid: 0, unit: '项' }
        ]
      },
      {
        name: '油漆',
        planned: 15000,
        progress: 0,
        status: 'pending',
        expenses: [
          { item_name: '乳胶漆（未开始）', category: '材料', planned: 6000, actual: 0, paid: 0, unit: '桶' },
          { item_name: '油漆工人工（未开始）', category: '人工', planned: 7000, actual: 0, paid: 0, unit: '次' },
          { item_name: '辅料（未开始）', category: '材料', planned: 2000, actual: 0, paid: 0, unit: '套' }
        ]
      },
      {
        name: '软装',
        planned: 60000,
        progress: 0,
        status: 'pending',
        expenses: [
          { item_name: '沙发（未开始）', category: '家具', planned: 12000, actual: 0, paid: 0, unit: '件' },
          { item_name: '餐桌椅（未开始）', category: '家具', planned: 8000, actual: 0, paid: 0, unit: '套' },
          { item_name: '床（未开始）', category: '家具', planned: 10000, actual: 0, paid: 0, unit: '件' },
          { item_name: '窗帘（未开始）', category: '布艺', planned: 5000, actual: 0, paid: 0, unit: '套' },
          { item_name: '灯具（未开始）', category: '灯具', planned: 5000, actual: 0, paid: 0, unit: '套' },
          { item_name: '装饰（未开始）', category: '装饰', planned: 20000, actual: 0, paid: 0, unit: '套' }
        ]
      }
    ]
  },
  {
    key: 'hardware_done',
    name: '硬装结束软装还没买',
    description: '硬装已经搞定，但软装一件没动，等着慢慢挑。',
    stages: [
      {
        name: '水电',
        planned: 22000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '电线材料', category: '材料', planned: 6500, actual: 6800, paid: 1, unit: '套' },
          { item_name: '水管材料', category: '材料', planned: 3200, actual: 3200, paid: 1, unit: '套' },
          { item_name: '开关插座', category: '材料', planned: 2800, actual: 2800, paid: 1, unit: '套' },
          { item_name: '水电工人工', category: '人工', planned: 9500, actual: 9500, paid: 1, unit: '次' }
        ]
      },
      {
        name: '泥瓦',
        planned: 40000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '客厅地砖', category: '材料', planned: 13000, actual: 13500, paid: 1, unit: 'm²', quantity: 50 },
          { item_name: '卫生间瓷砖', category: '材料', planned: 5000, actual: 5200, paid: 1, unit: 'm²', quantity: 16 },
          { item_name: '厨房瓷砖', category: '材料', planned: 3000, actual: 3000, paid: 1, unit: 'm²', quantity: 8 },
          { item_name: '水泥沙子辅料', category: '材料', planned: 2500, actual: 2700, paid: 1, unit: '套' },
          { item_name: '泥瓦工人工', category: '人工', planned: 14000, actual: 14500, paid: 1, unit: '次' },
          { item_name: '防水', category: '材料', planned: 2500, actual: 2500, paid: 1, unit: '次' }
        ]
      },
      {
        name: '木工',
        planned: 52000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '定制衣柜', category: '定制家具', planned: 18000, actual: 18500, paid: 1, unit: '套' },
          { item_name: '定制橱柜', category: '定制家具', planned: 15000, actual: 16000, paid: 1, unit: '套' },
          { item_name: '吊顶', category: '吊顶', planned: 5000, actual: 5200, paid: 1, unit: 'm²' },
          { item_name: '木门', category: '门窗', planned: 7000, actual: 7200, paid: 1, unit: '扇', quantity: 3 },
          { item_name: '电视柜背景墙', category: '造型', planned: 3000, actual: 3200, paid: 1, unit: '项' },
          { item_name: '木工人工', category: '人工', planned: 4000, actual: 4000, paid: 1, unit: '次' }
        ]
      },
      {
        name: '油漆',
        planned: 16000,
        progress: 100,
        status: 'done',
        expenses: [
          { item_name: '乳胶漆', category: '材料', planned: 7000, actual: 7200, paid: 1, unit: '桶', quantity: 4 },
          { item_name: '油漆工人工', category: '人工', planned: 7000, actual: 7200, paid: 1, unit: '次' },
          { item_name: '辅料', category: '材料', planned: 2000, actual: 1800, paid: 1, unit: '套' }
        ]
      },
      {
        name: '软装',
        planned: 80000,
        progress: 0,
        status: 'active',
        expenses: [
          { item_name: '客厅沙发', category: '家具', planned: 15000, actual: 0, paid: 0, unit: '件' },
          { item_name: '茶几', category: '家具', planned: 3000, actual: 0, paid: 0, unit: '件' },
          { item_name: '边几', category: '家具', planned: 2000, actual: 0, paid: 0, unit: '件' },
          { item_name: '餐桌椅套装', category: '家具', planned: 8000, actual: 0, paid: 0, unit: '套' },
          { item_name: '主卧大床+床垫', category: '家具', planned: 12000, actual: 0, paid: 0, unit: '套' },
          { item_name: '次卧床', category: '家具', planned: 4000, actual: 0, paid: 0, unit: '件' },
          { item_name: '全屋窗帘', category: '布艺', planned: 6000, actual: 0, paid: 0, unit: '套' },
          { item_name: '客厅吊灯+餐厅灯', category: '灯具', planned: 5000, actual: 0, paid: 0, unit: '套' },
          { item_name: '装饰画及摆件', category: '装饰', planned: 5000, actual: 0, paid: 0, unit: '套' },
          { item_name: '地毯', category: '装饰', planned: 3000, actual: 0, paid: 0, unit: '件' },
          { item_name: '家电预留（空调冰箱洗衣机）', category: '家电', planned: 17000, actual: 0, paid: 0, unit: '套' }
        ]
      }
    ]
  }
];

function seedScenarios() {
  const db = getDb();
  const insertScenario = db.prepare(
    'INSERT OR IGNORE INTO scenarios (key, name, description) VALUES (?, ?, ?)'
  );
  const getScenarioId = db.prepare('SELECT id FROM scenarios WHERE key = ?');
  const insertStage = db.prepare(
    'INSERT INTO stages (scenario_id, name, planned_amount, actual_amount, progress, status, order_index, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertExpense = db.prepare(
    'INSERT INTO expenses (stage_id, item_name, category, planned_amount, actual_amount, quantity, unit, paid, refunded, supplier, notes, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    SCENARIOS.forEach((scenario, idx) => {
      const existing = getScenarioId.get(scenario.key);
      let scenarioId;
      if (existing) {
        scenarioId = existing.id;
        db.prepare('DELETE FROM expenses WHERE stage_id IN (SELECT id FROM stages WHERE scenario_id = ?)').run(scenarioId);
        db.prepare('DELETE FROM stages WHERE scenario_id = ?').run(scenarioId);
        db.prepare('UPDATE scenarios SET name = ?, description = ? WHERE id = ?').run(scenario.name, scenario.description, scenarioId);
      } else {
        insertScenario.run(scenario.key, scenario.name, scenario.description);
        scenarioId = db.lastInsertRowid;
      }

      scenario.stages.forEach((stage, stageIdx) => {
        const stageActual = stage.expenses.reduce(
          (sum, e) => sum + (e.actual || 0),
          0
        );
        const result = insertStage.run(
          scenarioId,
          stage.name,
          stage.planned,
          stageActual,
          stage.progress,
          stage.status,
          stageIdx,
          null
        );
        const stageId = result.lastInsertRowid;

        stage.expenses.forEach((expense) => {
          insertExpense.run(
            stageId,
            expense.item_name,
            expense.category || '其他',
            expense.planned || 0,
            expense.actual || 0,
            expense.quantity || 1,
            expense.unit || '项',
            expense.paid ? 1 : 0,
            expense.refunded ? 1 : 0,
            expense.supplier || '',
            expense.notes || '',
            null
          );
        });
      });
    });
  });

  tx();
  return { ok: true, scenarios: SCENARIOS.length };
}

function clearAll() {
  const db = getDb();
  db.exec('DELETE FROM expenses; DELETE FROM stages; DELETE FROM scenarios;');
  return { ok: true };
}

module.exports = { SCENARIOS, seedScenarios, clearAll };
