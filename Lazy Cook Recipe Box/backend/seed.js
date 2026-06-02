'use strict';

const { addRecipe, isEmpty } = require('./database');

const seed = [
  {
    name: '蛋炒饭',
    emoji: '🍚',
    scene: 'bachelor',
    base_servings: 1,
    description: '十分钟搞定的单身汉灵魂料理',
    steps: '1. 隔夜饭打散；2. 热锅冷油下蛋液；3. 倒入米饭翻炒；4. 加盐出锅。',
    ingredients: [
      { name: '隔夜米饭', base_quantity: 200, unit: 'g', is_fuzzy: 0 },
      { name: '鸡蛋', base_quantity: 2, unit: '个', is_fuzzy: 0 },
      { name: '葱花', base_quantity: 10, unit: 'g', is_fuzzy: 0 },
      { name: '盐', base_quantity: 2, unit: 'g', is_fuzzy: 0 },
      { name: '食用油', base_quantity: 10, unit: 'ml', is_fuzzy: 0 },
    ],
  },
  {
    name: '番茄鸡蛋面',
    emoji: '🍜',
    scene: 'bachelor',
    base_servings: 1,
    description: '冰箱里总会有的东西',
    steps: '1. 番茄切块炒出汁；2. 加水煮沸；3. 下面条；4. 淋蛋液搅匀。',
    ingredients: [
      { name: '番茄', base_quantity: 1, unit: '个', is_fuzzy: 0 },
      { name: '鸡蛋', base_quantity: 2, unit: '个', is_fuzzy: 0 },
      { name: '面条', base_quantity: 100, unit: 'g', is_fuzzy: 0 },
      { name: '盐', base_quantity: 2, unit: 'g', is_fuzzy: 0 },
      { name: '糖', base_quantity: 1, unit: 'g', is_fuzzy: 0 },
      { name: '胡椒', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '少许' },
    ],
  },
  {
    name: '速冻水饺',
    emoji: '🥟',
    scene: 'bachelor',
    base_servings: 1,
    description: '最真实的一人食',
    steps: '1. 水烧开；2. 下饺子；3. 点两次凉水；4. 捞起蘸醋。',
    ingredients: [
      { name: '速冻饺子', base_quantity: 15, unit: '个', is_fuzzy: 0 },
      { name: '水', base_quantity: 1, unit: 'L', is_fuzzy: 0 },
      { name: '醋', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
    ],
  },

  {
    name: '香煎牛排配时蔬',
    emoji: '🥩',
    scene: 'couple',
    base_servings: 2,
    description: '周末小资一下',
    steps: '1. 牛排抹盐黑椒腌10分钟；2. 热锅煎两面；3. 黄油浇香；4. 配菜炒一下。',
    ingredients: [
      { name: '牛排', base_quantity: 400, unit: 'g', is_fuzzy: 0 },
      { name: '西兰花', base_quantity: 200, unit: 'g', is_fuzzy: 0 },
      { name: '小番茄', base_quantity: 10, unit: '颗', is_fuzzy: 0 },
      { name: '黄油', base_quantity: 20, unit: 'g', is_fuzzy: 0 },
      { name: '海盐', base_quantity: 3, unit: 'g', is_fuzzy: 0 },
      { name: '黑胡椒', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '现磨少许' },
      { name: '迷迭香', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
    ],
  },
  {
    name: '奶油蘑菇意面',
    emoji: '🍝',
    scene: 'couple',
    base_servings: 2,
    description: '氛围感拉满',
    steps: '1. 意面煮8分钟；2. 蘑菇蒜末炒香；3. 加奶油慢炖；4. 拌入意面撒帕玛森。',
    ingredients: [
      { name: '意面', base_quantity: 200, unit: 'g', is_fuzzy: 0 },
      { name: '口蘑', base_quantity: 150, unit: 'g', is_fuzzy: 0 },
      { name: '淡奶油', base_quantity: 150, unit: 'ml', is_fuzzy: 0 },
      { name: '帕玛森奶酪', base_quantity: 30, unit: 'g', is_fuzzy: 0 },
      { name: '大蒜', base_quantity: 4, unit: '瓣', is_fuzzy: 0 },
      { name: '盐', base_quantity: 3, unit: 'g', is_fuzzy: 0 },
      { name: '黑胡椒', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '少许' },
    ],
  },
  {
    name: '水果沙拉',
    emoji: '🥗',
    scene: 'couple',
    base_servings: 2,
    description: '清爽健康',
    steps: '1. 水果切小块；2. 拌酸奶和蜂蜜；3. 冰箱冷藏10分钟。',
    ingredients: [
      { name: '草莓', base_quantity: 10, unit: '颗', is_fuzzy: 0 },
      { name: '蓝莓', base_quantity: 50, unit: 'g', is_fuzzy: 0 },
      { name: '香蕉', base_quantity: 1, unit: '根', is_fuzzy: 0 },
      { name: '苹果', base_quantity: 1, unit: '个', is_fuzzy: 0 },
      { name: '希腊酸奶', base_quantity: 200, unit: 'g', is_fuzzy: 0 },
      { name: '蜂蜜', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
    ],
  },

  {
    name: '土豆炖牛腩',
    emoji: '🍲',
    scene: 'team',
    base_servings: 10,
    description: '团建硬菜，管饱',
    steps: '1. 牛腩焯水；2. 爆香葱姜；3. 加酱炒糖色；4. 加水炖1.5小时；5. 下土豆再炖30分钟。',
    ingredients: [
      { name: '牛腩', base_quantity: 3000, unit: 'g', is_fuzzy: 0 },
      { name: '土豆', base_quantity: 1500, unit: 'g', is_fuzzy: 0 },
      { name: '胡萝卜', base_quantity: 500, unit: 'g', is_fuzzy: 0 },
      { name: '洋葱', base_quantity: 2, unit: '个', is_fuzzy: 0 },
      { name: '大葱', base_quantity: 3, unit: '根', is_fuzzy: 0 },
      { name: '生姜', base_quantity: 30, unit: 'g', is_fuzzy: 0 },
      { name: '生抽', base_quantity: 60, unit: 'ml', is_fuzzy: 0 },
      { name: '老抽', base_quantity: 20, unit: 'ml', is_fuzzy: 0 },
      { name: '盐', base_quantity: 15, unit: 'g', is_fuzzy: 0 },
      { name: '糖', base_quantity: 20, unit: 'g', is_fuzzy: 0 },
      { name: '料酒', base_quantity: 50, unit: 'ml', is_fuzzy: 0 },
      { name: '八角', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '少许' },
    ],
  },
  {
    name: '蒜蓉粉丝蒸扇贝',
    emoji: '🦪',
    scene: 'team',
    base_servings: 10,
    description: '硬菜配海鲜',
    steps: '1. 扇贝清理干净；2. 粉丝泡软铺底；3. 蒜蓉炒香铺扇贝；4. 蒸8分钟淋热油。',
    ingredients: [
      { name: '扇贝', base_quantity: 20, unit: '只', is_fuzzy: 0 },
      { name: '粉丝', base_quantity: 100, unit: 'g', is_fuzzy: 0 },
      { name: '大蒜', base_quantity: 30, unit: '瓣', is_fuzzy: 0 },
      { name: '小米椒', base_quantity: 5, unit: '个', is_fuzzy: 0 },
      { name: '生抽', base_quantity: 40, unit: 'ml', is_fuzzy: 0 },
      { name: '蒸鱼豉油', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
      { name: '食用油', base_quantity: 30, unit: 'ml', is_fuzzy: 0 },
    ],
  },
  {
    name: '可乐鸡翅',
    emoji: '🍗',
    scene: 'team',
    base_servings: 10,
    description: '老少咸宜',
    steps: '1. 鸡翅焯水划刀；2. 煎两面金黄；3. 倒可乐没过；4. 收汁装盘。',
    ingredients: [
      { name: '鸡翅中', base_quantity: 2500, unit: 'g', is_fuzzy: 0 },
      { name: '可乐', base_quantity: 1.5, unit: 'L', is_fuzzy: 0 },
      { name: '生抽', base_quantity: 80, unit: 'ml', is_fuzzy: 0 },
      { name: '老抽', base_quantity: 20, unit: 'ml', is_fuzzy: 0 },
      { name: '姜', base_quantity: 20, unit: 'g', is_fuzzy: 0 },
      { name: '葱', base_quantity: 2, unit: '根', is_fuzzy: 0 },
      { name: '料酒', base_quantity: 30, unit: 'ml', is_fuzzy: 0 },
      { name: '盐', base_quantity: 8, unit: 'g', is_fuzzy: 0 },
    ],
  },
  {
    name: '大拌菜',
    emoji: '🥬',
    scene: 'team',
    base_servings: 10,
    description: '解腻神器',
    steps: '1. 蔬菜切丝；2. 调碗汁；3. 拌匀冷藏。',
    ingredients: [
      { name: '紫甘蓝', base_quantity: 300, unit: 'g', is_fuzzy: 0 },
      { name: '生菜', base_quantity: 400, unit: 'g', is_fuzzy: 0 },
      { name: '黄瓜', base_quantity: 3, unit: '根', is_fuzzy: 0 },
      { name: '胡萝卜', base_quantity: 1, unit: '根', is_fuzzy: 0 },
      { name: '花生米', base_quantity: 100, unit: 'g', is_fuzzy: 0 },
      { name: '醋', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
      { name: '糖', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '少许' },
      { name: '香油', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '几滴' },
    ],
  },

  {
    name: '放了三次盐的红烧肉',
    emoji: '🧂',
    scene: 'fail',
    base_servings: 2,
    description: '你看这锅红烧肉，它越炒越咸……',
    steps: '1. 忘了解冻；2. 下锅发现没油；3. 放了一次盐觉得淡，再放一次；4. 又放了一次……',
    ingredients: [
      { name: '五花肉', base_quantity: 500, unit: 'g', is_fuzzy: 0 },
      { name: '酱油', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '倒了三勺' },
      { name: '盐', base_quantity: 12, unit: 'g', is_fuzzy: 0 },
      { name: '糖', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '随手一把' },
      { name: '料酒', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '凭感觉' },
    ],
  },
  {
    name: '糖醋排骨——做成了甜的',
    emoji: '🍯',
    scene: 'fail',
    base_servings: 2,
    description: '糖：醋 = 10:1 的比例',
    steps: '1. 以为糖醋1:1是体积比；2. 又加了一勺糖；3. 再加一勺；4. 还是不够甜！',
    ingredients: [
      { name: '排骨', base_quantity: 600, unit: 'g', is_fuzzy: 0 },
      { name: '白糖', base_quantity: 200, unit: 'g', is_fuzzy: 0 },
      { name: '醋', base_quantity: 20, unit: 'ml', is_fuzzy: 0 },
      { name: '生抽', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
      { name: '番茄酱', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '挤一下' },
    ],
  },
  {
    name: '水煮蛋煮成了蛋花汤',
    emoji: '🥣',
    scene: 'fail',
    base_servings: 1,
    description: '谁说开水下蛋的？',
    steps: '1. 水烧开；2. 扑通扔进鸡蛋；3. 10分钟后打开锅……变成蛋花汤了。',
    ingredients: [
      { name: '鸡蛋', base_quantity: 2, unit: '个', is_fuzzy: 0 },
      { name: '水', base_quantity: 500, unit: 'ml', is_fuzzy: 0 },
      { name: '盐', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '一点点' },
      { name: '酱油', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '几滴' },
    ],
  },
  {
    name: '辣椒炒肉——辣到冒烟',
    emoji: '🌶️',
    scene: 'fail',
    base_servings: 3,
    description: '小米椒的威力你想象不到',
    steps: '1. 切小米椒没戴手套；2. 往锅里一股脑倒；3. 尝了一口，厨房响起警报。',
    ingredients: [
      { name: '猪肉', base_quantity: 300, unit: 'g', is_fuzzy: 0 },
      { name: '小米椒', base_quantity: 30, unit: '个', is_fuzzy: 0 },
      { name: '青椒', base_quantity: 2, unit: '个', is_fuzzy: 0 },
      { name: '大蒜', base_quantity: 5, unit: '瓣', is_fuzzy: 0 },
      { name: '生抽', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '适量' },
      { name: '盐', base_quantity: null, unit: '', is_fuzzy: 1, fuzzy_label: '少许' },
    ],
  },
];

(async () => {
  if (await isEmpty()) {
    console.log('🌱 数据库为空，开始播种菜谱……');
    for (const r of seed) {
      const id = await addRecipe(r);
      console.log(`  ✔ 已插入 [${r.scene}] ${r.emoji} ${r.name} -> id=${id}`);
    }
    console.log(`✅ 共植入 ${seed.length} 道菜谱`);
  } else {
    console.log('ℹ 数据库已有数据，跳过播种。如需重置，请删除 recipes.db 后重新运行。');
  }
})().catch((err) => {
  console.error('❌ 种子初始化失败:', err);
  process.exit(1);
});
