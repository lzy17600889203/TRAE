import { run, queryAll, saveDatabase } from '../db/database.js';

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  color: string;
}

export const presetScenarios: PresetScenario[] = [
  {
    id: 'standard-vertebrate',
    name: '标准脊椎动物场景',
    description: '展示标准脊椎动物分类，包含鱼类、两栖类、爬行类、鸟类、哺乳类的典型演化关系',
    color: '#4CAF50',
  },
  {
    id: 'convergent-evolution',
    name: '趋同演化干扰场景',
    description: '展示趋同演化导致的分类混淆，如鲸类与鱼类、蝙蝠与鸟类的相似特征',
    color: '#FF9800',
  },
  {
    id: 'missing-fossil-data',
    name: '缺失化石数据场景',
    description: '展示缺失中间物种化石数据导致的聚类偏差和演化推断困难',
    color: '#9C27B0',
  },
  {
    id: 'polyphyletic-group',
    name: '多系群分类场景',
    description: '展示多系群分类导致的树结构交叉，如"虫"类或"鱼"类的人为归并',
    color: '#F44336',
  },
];

export const taxonomyLevels = [
  { key: 'kingdom', label: '界', color: '#E91E63' },
  { key: 'phylum', label: '门', color: '#9C27B0' },
  { key: 'class', label: '纲', color: '#3F51B5' },
  { key: 'order', label: '目', color: '#2196F3' },
  { key: 'family', label: '科', color: '#00BCD4' },
  { key: 'genus', label: '属', color: '#4CAF50' },
  { key: 'species', label: '种', color: '#8BC34A' },
];

interface SpeciesPreset {
  name: string;
  latinName: string;
  taxonomy: Record<string, string>;
  features: Array<{ name: string; value: number; category: string }>;
  parentId?: string;
}

interface ScenarioData {
  species: SpeciesPreset[];
  hasMissingData?: boolean;
  longBranchMultiplier?: number;
  polyphyleticForce?: boolean;
  circularDependency?: boolean;
  speciesGroups?: Map<string, string[]>;
}

function createStandardVertebrate(): ScenarioData {
  return {
    species: [
      {
        name: '七鳃鳗',
        latinName: 'Petromyzon marinus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '圆口纲', order: '七鳃鳗目', family: '七鳃鳗科', genus: 'Petromyzon', species: 'P. marinus' },
        features: [
          { name: '脊椎', value: 0, category: '解剖学' },
          { name: '鳞片', value: 1, category: '解剖学' },
          { name: '肺', value: 0, category: '解剖学' },
          { name: '四肢', value: 0, category: '解剖学' },
          { name: '羊膜卵', value: 0, category: '生殖' },
          { name: '体温调节', value: 0, category: '生理' },
          { name: '羽毛', value: 0, category: '解剖学' },
          { name: '毛发', value: 0, category: '解剖学' },
        ],
      },
      {
        name: '鲨鱼',
        latinName: 'Carcharodon carcharias',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '软骨鱼纲', order: '鼠鲨目', family: '鼠鲨科', genus: 'Carcharodon', species: 'C. carcharias' },
        features: [
          { name: '脊椎', value: 0.3, category: '解剖学' },
          { name: '鳞片', value: 2, category: '解剖学' },
          { name: '肺', value: 0, category: '解剖学' },
          { name: '四肢', value: 0, category: '解剖学' },
          { name: '羊膜卵', value: 0, category: '生殖' },
          { name: '体温调节', value: 0.2, category: '生理' },
          { name: '羽毛', value: 0, category: '解剖学' },
          { name: '毛发', value: 0, category: '解剖学' },
        ],
      },
      {
        name: '硬骨鱼',
        latinName: 'Osteichthyes',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '硬骨鱼纲', order: '辐鳍鱼目', family: '鳕科', genus: 'Gadus', species: 'G. morhua' },
        features: [
          { name: '脊椎', value: 0.5, category: '解剖学' },
          { name: '鳞片', value: 3, category: '解剖学' },
          { name: '肺', value: 0, category: '解剖学' },
          { name: '四肢', value: 0, category: '解剖学' },
          { name: '羊膜卵', value: 0, category: '生殖' },
          { name: '体温调节', value: 0, category: '生理' },
          { name: '羽毛', value: 0, category: '解剖学' },
          { name: '毛发', value: 0, category: '解剖学' },
        ],
      },
      {
        name: '青蛙',
        latinName: 'Rana temporaria',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '两栖纲', order: '无尾目', family: '蛙科', genus: 'Rana', species: 'R. temporaria' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 0, category: '解剖学' },
          { name: '肺', value: 1, category: '解剖学' },
          { name: '四肢', value: 1, category: '解剖学' },
          { name: '羊膜卵', value: 0, category: '生殖' },
          { name: '体温调节', value: 0, category: '生理' },
          { name: '羽毛', value: 0, category: '解剖学' },
          { name: '毛发', value: 0, category: '解剖学' },
        ],
      },
      {
        name: '蜥蜴',
        latinName: 'Lacerta agilis',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '爬行纲', order: '有鳞目', family: '蜥蜴科', genus: 'Lacerta', species: 'L. agilis' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 4, category: '解剖学' },
          { name: '肺', value: 1, category: '解剖学' },
          { name: '四肢', value: 1, category: '解剖学' },
          { name: '羊膜卵', value: 1, category: '生殖' },
          { name: '体温调节', value: 0, category: '生理' },
          { name: '羽毛', value: 0, category: '解剖学' },
          { name: '毛发', value: 0, category: '解剖学' },
        ],
      },
      {
        name: '鸽子',
        latinName: 'Columba livia',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '鸟纲', order: '鸽形目', family: '鸠鸽科', genus: 'Columba', species: 'C. livia' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 1, category: '解剖学' },
          { name: '肺', value: 1, category: '解剖学' },
          { name: '四肢', value: 1, category: '解剖学' },
          { name: '羊膜卵', value: 1, category: '生殖' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '羽毛', value: 1, category: '解剖学' },
          { name: '毛发', value: 0, category: '解剖学' },
        ],
      },
      {
        name: '小鼠',
        latinName: 'Mus musculus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '啮齿目', family: '鼠科', genus: 'Mus', species: 'M. musculus' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 0, category: '解剖学' },
          { name: '肺', value: 1, category: '解剖学' },
          { name: '四肢', value: 1, category: '解剖学' },
          { name: '羊膜卵', value: 1, category: '生殖' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '羽毛', value: 0, category: '解剖学' },
          { name: '毛发', value: 1, category: '解剖学' },
        ],
      },
    ],
  };
}

function createConvergentEvolution(): ScenarioData {
  return {
    species: [
      {
        name: '金枪鱼',
        latinName: 'Thunnus thynnus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '硬骨鱼纲', order: '鲭形目', family: '鲭科', genus: 'Thunnus', species: 'T. thynnus' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 3, category: '解剖学' },
          { name: '鳍', value: 1, category: '运动器官' },
          { name: '鳃呼吸', value: 1, category: '呼吸' },
          { name: '体温调节', value: 0.3, category: '生理' },
          { name: '毛发', value: 0, category: '解剖学' },
          { name: '乳汁', value: 0, category: '生殖' },
          { name: '流线型身体', value: 1, category: '形态' },
          { name: '超声定位', value: 0, category: '感知' },
        ],
      },
      {
        name: '鲸',
        latinName: 'Balaenoptera musculus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '鲸目', family: '须鲸科', genus: 'Balaenoptera', species: 'B. musculus' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 0, category: '解剖学' },
          { name: '鳍', value: 0.8, category: '运动器官' },
          { name: '鳃呼吸', value: 0, category: '呼吸' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '毛发', value: 0.1, category: '解剖学' },
          { name: '乳汁', value: 1, category: '生殖' },
          { name: '流线型身体', value: 1, category: '形态' },
          { name: '超声定位', value: 1, category: '感知' },
        ],
      },
      {
        name: '海豚',
        latinName: 'Tursiops truncatus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '鲸目', family: '海豚科', genus: 'Tursiops', species: 'T. truncatus' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 0, category: '解剖学' },
          { name: '鳍', value: 0.7, category: '运动器官' },
          { name: '鳃呼吸', value: 0, category: '呼吸' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '毛发', value: 0, category: '解剖学' },
          { name: '乳汁', value: 1, category: '生殖' },
          { name: '流线型身体', value: 1, category: '形态' },
          { name: '超声定位', value: 1, category: '感知' },
        ],
      },
      {
        name: '蝙蝠',
        latinName: 'Chiroptera',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '翼手目', family: '蝙蝠科', genus: 'Myotis', species: 'M. myotis' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 0, category: '解剖学' },
          { name: '鳍', value: 0, category: '运动器官' },
          { name: '鳃呼吸', value: 0, category: '呼吸' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '毛发', value: 1, category: '解剖学' },
          { name: '乳汁', value: 1, category: '生殖' },
          { name: '流线型身体', value: 0.5, category: '形态' },
          { name: '超声定位', value: 1, category: '感知' },
        ],
      },
      {
        name: '老鹰',
        latinName: 'Aquila chrysaetos',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '鸟纲', order: '鹰形目', family: '鹰科', genus: 'Aquila', species: 'A. chrysaetos' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 1, category: '解剖学' },
          { name: '鳍', value: 0, category: '运动器官' },
          { name: '鳃呼吸', value: 0, category: '呼吸' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '毛发', value: 0, category: '解剖学' },
          { name: '乳汁', value: 0, category: '生殖' },
          { name: '流线型身体', value: 0.7, category: '形态' },
          { name: '超声定位', value: 0, category: '感知' },
        ],
      },
      {
        name: '老鼠',
        latinName: 'Rattus norvegicus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '啮齿目', family: '鼠科', genus: 'Rattus', species: 'R. norvegicus' },
        features: [
          { name: '脊椎', value: 1, category: '解剖学' },
          { name: '鳞片', value: 0, category: '解剖学' },
          { name: '鳍', value: 0, category: '运动器官' },
          { name: '鳃呼吸', value: 0, category: '呼吸' },
          { name: '体温调节', value: 1, category: '生理' },
          { name: '毛发', value: 1, category: '解剖学' },
          { name: '乳汁', value: 1, category: '生殖' },
          { name: '流线型身体', value: 0.3, category: '形态' },
          { name: '超声定位', value: 0, category: '感知' },
        ],
      },
    ],
    polyphyleticForce: true,
  };
}

function createMissingFossilData(): ScenarioData {
  return {
    species: [
      {
        name: '现代马',
        latinName: 'Equus caballus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '奇蹄目', family: '马科', genus: 'Equus', species: 'E. caballus' },
        features: [
          { name: '脚趾数', value: 1, category: '解剖学' },
          { name: '体型', value: 5, category: '形态' },
          { name: '牙齿复杂度', value: 4, category: '解剖学' },
          { name: '腿长', value: 5, category: '形态' },
          { name: '奔跑速度', value: 5, category: '运动能力' },
          { name: '毛色多样性', value: 3, category: '形态' },
        ],
      },
      {
        name: '始祖马',
        latinName: 'Eohippus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '奇蹄目', family: '马科', genus: 'Eohippus', species: 'E. angustidens' },
        features: [
          { name: '脚趾数', value: 4, category: '解剖学' },
          { name: '体型', value: 1, category: '形态' },
          { name: '牙齿复杂度', value: 1, category: '解剖学' },
          { name: '腿长', value: 1, category: '形态' },
          { name: '奔跑速度', value: 1, category: '运动能力' },
          { name: '毛色多样性', value: 1, category: '形态' },
        ],
      },
      {
        name: '渐新马',
        latinName: 'Mesohippus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '奇蹄目', family: '马科', genus: 'Mesohippus', species: 'M. bairdi' },
        features: [
          { name: '脚趾数', value: 3, category: '解剖学' },
          { name: '体型', value: 0, category: '形态' },
          { name: '牙齿复杂度', value: 0, category: '解剖学' },
          { name: '腿长', value: 0, category: '形态' },
          { name: '奔跑速度', value: 0, category: '运动能力' },
          { name: '毛色多样性', value: 0, category: '形态' },
        ],
      },
      {
        name: '草原古马',
        latinName: 'Merychippus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '奇蹄目', family: '马科', genus: 'Merychippus', species: 'M. insignis' },
        features: [
          { name: '脚趾数', value: 3, category: '解剖学' },
          { name: '体型', value: 0, category: '形态' },
          { name: '牙齿复杂度', value: 3, category: '解剖学' },
          { name: '腿长', value: 3, category: '形态' },
          { name: '奔跑速度', value: 0, category: '运动能力' },
          { name: '毛色多样性', value: 0, category: '形态' },
        ],
      },
      {
        name: '上新马',
        latinName: 'Pliohippus',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '奇蹄目', family: '马科', genus: 'Pliohippus', species: 'P. pernix' },
        features: [
          { name: '脚趾数', value: 1, category: '解剖学' },
          { name: '体型', value: 4, category: '形态' },
          { name: '牙齿复杂度', value: 0, category: '解剖学' },
          { name: '腿长', value: 4, category: '形态' },
          { name: '奔跑速度', value: 4, category: '运动能力' },
          { name: '毛色多样性', value: 0, category: '形态' },
        ],
      },
      {
        name: '斑马',
        latinName: 'Equus quagga',
        taxonomy: { kingdom: '动物界', phylum: '脊索动物门', class: '哺乳纲', order: '奇蹄目', family: '马科', genus: 'Equus', species: 'E. quagga' },
        features: [
          { name: '脚趾数', value: 1, category: '解剖学' },
          { name: '体型', value: 4, category: '形态' },
          { name: '牙齿复杂度', value: 4, category: '解剖学' },
          { name: '腿长', value: 5, category: '形态' },
          { name: '奔跑速度', value: 4, category: '运动能力' },
          { name: '毛色多样性', value: 5, category: '形态' },
        ],
      },
    ],
    hasMissingData: true,
    longBranchMultiplier: 1.5,
  };
}

function createPolyphyleticGroup(): ScenarioData {
  return {
    species: [
      {
        name: '蚯蚓',
        latinName: 'Lumbricus terrestris',
        taxonomy: { kingdom: '动物界', phylum: '环节动物门', class: '寡毛纲', order: '后孔寡毛目', family: '正蚓科', genus: 'Lumbricus', species: 'L. terrestris' },
        features: [
          { name: '分节', value: 1, category: '解剖学' },
          { name: '外骨骼', value: 0, category: '解剖学' },
          { name: '触角', value: 0, category: '感知' },
          { name: '复眼', value: 0, category: '感知' },
          { name: '附肢', value: 0, category: '运动器官' },
          { name: '软体', value: 1, category: '形态' },
          { name: '消化系统', value: 2, category: '解剖学' },
        ],
      },
      {
        name: '蛔虫',
        latinName: 'Ascaris lumbricoides',
        taxonomy: { kingdom: '动物界', phylum: '线虫动物门', class: '色矛纲', order: '小杆目', family: '蛔虫科', genus: 'Ascaris', species: 'A. lumbricoides' },
        features: [
          { name: '分节', value: 0, category: '解剖学' },
          { name: '外骨骼', value: 0, category: '解剖学' },
          { name: '触角', value: 0, category: '感知' },
          { name: '复眼', value: 0, category: '感知' },
          { name: '附肢', value: 0, category: '运动器官' },
          { name: '软体', value: 1, category: '形态' },
          { name: '消化系统', value: 1, category: '解剖学' },
        ],
      },
      {
        name: '蝗虫',
        latinName: 'Schistocerca gregaria',
        taxonomy: { kingdom: '动物界', phylum: '节肢动物门', class: '昆虫纲', order: '直翅目', family: '蝗科', genus: 'Schistocerca', species: 'S. gregaria' },
        features: [
          { name: '分节', value: 1, category: '解剖学' },
          { name: '外骨骼', value: 1, category: '解剖学' },
          { name: '触角', value: 1, category: '感知' },
          { name: '复眼', value: 1, category: '感知' },
          { name: '附肢', value: 1, category: '运动器官' },
          { name: '软体', value: 0, category: '形态' },
          { name: '消化系统', value: 3, category: '解剖学' },
        ],
      },
      {
        name: '蜘蛛',
        latinName: 'Araneae',
        taxonomy: { kingdom: '动物界', phylum: '节肢动物门', class: '蛛形纲', order: '蜘蛛目', family: '园蛛科', genus: 'Araneus', species: 'A. diadematus' },
        features: [
          { name: '分节', value: 1, category: '解剖学' },
          { name: '外骨骼', value: 1, category: '解剖学' },
          { name: '触角', value: 0, category: '感知' },
          { name: '复眼', value: 0, category: '感知' },
          { name: '附肢', value: 1, category: '运动器官' },
          { name: '软体', value: 0, category: '形态' },
          { name: '消化系统', value: 2, category: '解剖学' },
        ],
      },
      {
        name: '蜗牛',
        latinName: 'Helix pomatia',
        taxonomy: { kingdom: '动物界', phylum: '软体动物门', class: '腹足纲', order: '柄眼目', family: '蜗牛科', genus: 'Helix', species: 'H. pomatia' },
        features: [
          { name: '分节', value: 0, category: '解剖学' },
          { name: '外骨骼', value: 0, category: '解剖学' },
          { name: '触角', value: 1, category: '感知' },
          { name: '复眼', value: 0, category: '感知' },
          { name: '附肢', value: 0, category: '运动器官' },
          { name: '软体', value: 1, category: '形态' },
          { name: '消化系统', value: 2, category: '解剖学' },
        ],
      },
      {
        name: '海星',
        latinName: 'Asterias rubens',
        taxonomy: { kingdom: '动物界', phylum: '棘皮动物门', class: '海星纲', order: '瓣棘海星目', family: '海星科', genus: 'Asterias', species: 'A. rubens' },
        features: [
          { name: '分节', value: 0, category: '解剖学' },
          { name: '外骨骼', value: 0, category: '解剖学' },
          { name: '触角', value: 0, category: '感知' },
          { name: '复眼', value: 0, category: '感知' },
          { name: '附肢', value: 1, category: '运动器官' },
          { name: '软体', value: 0, category: '形态' },
          { name: '消化系统', value: 1, category: '解剖学' },
        ],
      },
    ],
    polyphyleticForce: true,
    circularDependency: true,
    speciesGroups: new Map<string, string[]>([
      ['蠕虫类', ['蚯蚓', '蛔虫', '蜗牛']],
      ['节肢类', ['蝗虫', '蜘蛛']],
    ]),
  };
}

export function getScenarioData(scenarioId: string): ScenarioData {
  switch (scenarioId) {
    case 'standard-vertebrate':
      return createStandardVertebrate();
    case 'convergent-evolution':
      return createConvergentEvolution();
    case 'missing-fossil-data':
      return createMissingFossilData();
    case 'polyphyletic-group':
      return createPolyphyleticGroup();
    default:
      return createStandardVertebrate();
  }
}

export function loadScenarioToDatabase(scenarioId: string): {
  species: Array<{ id: number; name: string; latinName: string; taxonomy: Record<string, string> }>;
  characteristics: Array<{ species_id: number; feature_name: string; feature_value: number }>;
  hasMissingData: boolean;
  longBranchMultiplier: number;
  polyphyleticForce: boolean;
  circularDependency: boolean;
  speciesGroups: Map<string, string[]>;
} {
  const scenarioData = getScenarioData(scenarioId);

  run('DELETE FROM characteristic_matrix');
  run('DELETE FROM distance_matrix');
  run('DELETE FROM features');
  run('DELETE FROM species');
  run('DELETE FROM phylogeny_results');

  const speciesResult: Array<{ id: number; name: string; latinName: string; taxonomy: Record<string, string> }> = [];
  const characteristicsResult: Array<{ species_id: number; feature_name: string; feature_value: number }> = [];

  for (const sp of scenarioData.species) {
    const result = run(
      `INSERT INTO species (name, latin_name, kingdom, phylum, class, "order", family, genus, species)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sp.name,
        sp.latinName,
        sp.taxonomy.kingdom || '',
        sp.taxonomy.phylum || '',
        sp.taxonomy.class || '',
        sp.taxonomy.order || '',
        sp.taxonomy.family || '',
        sp.taxonomy.genus || '',
        sp.taxonomy.species || '',
      ]
    );

    const speciesId = result.lastInsertRowid;
    speciesResult.push({
      id: speciesId,
      name: sp.name,
      latinName: sp.latinName,
      taxonomy: sp.taxonomy,
    });

    for (const f of sp.features) {
      run(
        'INSERT INTO features (species_id, feature_name, feature_value, category) VALUES (?, ?, ?, ?)',
        [speciesId, f.name, String(f.value), f.category]
      );
      run(
        'INSERT INTO characteristic_matrix (species_id, feature_name, feature_value) VALUES (?, ?, ?)',
        [speciesId, f.name, f.value]
      );
      characteristicsResult.push({
        species_id: speciesId,
        feature_name: f.name,
        feature_value: f.value,
      });
    }
  }

  saveDatabase();

  return {
    species: speciesResult,
    characteristics: characteristicsResult,
    hasMissingData: scenarioData.hasMissingData || false,
    longBranchMultiplier: scenarioData.longBranchMultiplier || 1,
    polyphyleticForce: scenarioData.polyphyleticForce || false,
    circularDependency: scenarioData.circularDependency || false,
    speciesGroups: scenarioData.speciesGroups || new Map(),
  };
}
