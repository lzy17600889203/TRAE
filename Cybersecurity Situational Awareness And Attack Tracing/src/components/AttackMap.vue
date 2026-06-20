<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as echarts from 'echarts/core';
import { MapChart, LinesChart, EffectScatterChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { AttackLine, DDoSEvent } from '@/composables/useMockData';

echarts.use([
  MapChart,
  LinesChart,
  EffectScatterChart,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  CanvasRenderer
]);

const props = defineProps<{
  attackLines: AttackLine[];
  ddosEvent: DDoSEvent;
  targets: { name: string; coord: [number, number] }[];
}>();

const mapRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref(true);
const loadError = ref(false);
let chartInstance: echarts.ECharts | null = null;
let resizeObs: ResizeObserver | null = null;

// 粒子爆炸覆盖层
// 粒子始终保存经纬度坐标，每帧通过 echarts.convertToPixel 重新换算为屏幕像素
// —— 彻底解决"鼠标滚轮缩放 / 拖动后，粒子漂移到海洋"的问题
interface Particle {
  lng: number;
  lat: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  // 每帧经纬度增量（会被衰减）—— 在生成时依据当时的地图缩放把 "像素速度" 换算为 "经纬度速度"
  // 由于已经转换为经纬度，后续粒子在地理坐标上扩散，不依赖地图缩放状态
  dLng: number;
  dLat: number;
}
let particles: Particle[] = [];
let rafId: number;

const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json';

// 将经纬度转换为屏幕像素坐标（基于 echarts geo 组件）
function coordToPixel(coord: [number, number]): [number, number] | null {
  if (!chartInstance) return null;
  try {
    const pixel = chartInstance.convertToPixel('geo', coord);
    if (Array.isArray(pixel)) return [pixel[0], pixel[1]];
    return null;
  } catch {
    return null;
  }
}

// 计算当前地图缩放状态下，1 像素约等于多少"度"
// 用于在 spawnExplosion 时把"像素级扩散速度"换算为"经纬度级扩散速度"
function pixelDeltaToLngLat(dx: number, dy: number, baseLat: number): [number, number] {
  if (!chartInstance) return [0, 0];
  const p0 = chartInstance.convertToPixel('geo', [0, baseLat] as any);
  const pLng = chartInstance.convertToPixel('geo', [1, baseLat] as any);
  const pLat = chartInstance.convertToPixel('geo', [0, baseLat + 1] as any);
  if (!Array.isArray(p0) || !Array.isArray(pLng) || !Array.isArray(pLat)) {
    return [0, 0];
  }
  const pxPerDegLng = Math.max(1, Math.abs(pLng[0] - p0[0]));
  const pxPerDegLat = Math.max(1, Math.abs(pLat[1] - p0[1]));
  // 屏幕 y 向下为正，纬度向北为正 → dLat 取反
  return [dx / pxPerDegLng, -dy / pxPerDegLat];
}

function spawnExplosion(targetCoord: [number, number]) {
  if (!canvasRef.value) return;
  const [lng, lat] = targetCoord;
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
    const speedPx = 2 + Math.random() * 4;
    const [dLng, dLat] = pixelDeltaToLngLat(
      Math.cos(angle) * speedPx,
      Math.sin(angle) * speedPx,
      lat
    );
    particles.push({
      lng,
      lat,
      dLng,
      dLat,
      life: 0,
      maxLife: 60 + Math.random() * 30,
      size: 2 + Math.random() * 3,
      color: `rgba(255, ${Math.floor(80 + Math.random() * 100)}, ${Math.floor(Math.random() * 60)}, 1)`
    });
  }
}

function drawParticles() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const next: Particle[] = [];
  particles.forEach((p) => {
    // 按经纬度扩散
    p.lng += p.dLng;
    p.lat += p.dLat;
    p.dLng *= 0.96;
    p.dLat *= 0.96;
    p.life += 1;
    // 每帧重新把 (lng,lat) 换算成屏幕像素 —— 缩放/拖动后依然贴地
    const px = coordToPixel([p.lng, p.lat]);
    if (!px) return;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(px[0], px[1], p.size, 0, Math.PI * 2);
    // 把 rgba(... , 1) 动态替换 alpha
    ctx.fillStyle = p.color.replace(/,\s*1\)$/, `, ${alpha.toFixed(3)})`);
    ctx.fill();
    if (p.life < p.maxLife) next.push(p);
  });
  particles = next;
  rafId = requestAnimationFrame(drawParticles);
}

function resizeCanvas() {
  if (!canvasRef.value || !mapRef.value) return;
  canvasRef.value.width = mapRef.value.clientWidth;
  canvasRef.value.height = mapRef.value.clientHeight;
}

async function initMap() {
  if (!mapRef.value) return;
  try {
    const res = await fetch(WORLD_GEO_URL);
    if (!res.ok) throw new Error('fetch failed');
    const geoJson = await res.json();
    echarts.registerMap('world', geoJson);

    chartInstance = echarts.init(mapRef.value, undefined, { renderer: 'canvas' });
    renderChart();
    loading.value = false;
    resizeCanvas();

    // 地图缩放/平移后，canvas 层自动同步尺寸与 DPR（echarts resize 不直接触发 canvas resize）
    // 监听 georoam 确保 canvas 层与地图容器保持完全对齐
    chartInstance.on('georoam', () => {
      resizeCanvas();
    });

    resizeObs = new ResizeObserver(() => {
      chartInstance?.resize();
      resizeCanvas();
    });
    resizeObs.observe(mapRef.value);
  } catch (e) {
    loading.value = false;
    loadError.value = true;
    console.error('地图加载失败', e);
  }
}

const lineData = computed(() =>
  props.attackLines.map((l) => ({
    coords: [l.from, l.to],
    fromName: l.fromName,
    toName: l.toName,
    isDDoS: l.isDDoS || false
  }))
);

const scatterData = computed(() => {
  const map = new Map<string, { name: string; coord: [number, number]; count: number }>();
  props.attackLines.forEach((l) => {
    const key = `${l.to[0]},${l.to[1]}`;
    const entry = map.get(key) || { name: l.toName, coord: l.to, count: 0 };
    entry.count += 1;
    map.set(key, entry);
  });
  props.targets.forEach((t) => {
    const key = `${t.coord[0]},${t.coord[1]}`;
    if (!map.has(key)) map.set(key, { name: t.name, coord: t.coord, count: 1 });
  });
  return Array.from(map.values()).map((m) => ({
    name: m.name,
    value: [...m.coord, m.count]
  }));
});

function renderChart() {
  if (!chartInstance) return;
  const ddosActive = props.ddosEvent.active;

  // 普通连线 + DDoS 连线分开两个 series
  const normalLines = lineData.value.filter((l) => !l.isDDoS);
  const ddosLines = lineData.value.filter((l) => l.isDDoS);

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,25,49,0.92)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#e6f1ff' },
      formatter: (params: any) => {
        if (params.seriesType === 'effectScatter') {
          return `<b>${params.name}</b><br/>攻击命中: ${params.value[2]} 次`;
        }
        if (params.seriesType === 'lines') {
          return `${params.data.fromName} → ${params.data.toName}<br/>${params.data.isDDoS ? '<span style="color:#ff3b3b">⚠ DDoS 攻击流</span>' : '攻击流'}`;
        }
        return params.name;
      }
    },
    geo: {
      map: 'world',
      roam: true,
      zoom: 1.2,
      itemStyle: {
        areaColor: '#0f2744',
        borderColor: '#1e4d80',
        borderWidth: 0.6
      },
      emphasis: {
        label: { color: '#ffffff' },
        itemStyle: { areaColor: '#163a63' }
      },
      select: {
        label: { color: '#fff' },
        itemStyle: { areaColor: '#163a63' }
      }
    },
    series: [
      {
        name: '常规攻击',
        type: 'lines',
        coordinateSystem: 'geo',
        effect: {
          show: true,
          period: 5,
          trailLength: 0.2,
          symbol: 'arrow',
          symbolSize: 6,
          color: '#00d4ff'
        },
        lineStyle: {
          color: '#00d4ff',
          width: 1,
          opacity: 0.7,
          curveness: 0.25
        },
        data: normalLines,
        zlevel: 1
      },
      {
        name: 'DDoS 攻击',
        type: 'lines',
        coordinateSystem: 'geo',
        effect: {
          show: ddosActive,
          period: 3,
          trailLength: 0.4,
          symbol: 'arrow',
          symbolSize: 10,
          color: '#ff3b3b'
        },
        lineStyle: {
          color: '#ff3b3b',
          width: ddosActive ? 3.2 : 1.8,
          opacity: 0.95,
          curveness: 0.3,
          shadowColor: '#ff3b3b',
          shadowBlur: ddosActive ? 14 : 0
        },
        data: ddosLines,
        zlevel: 2
      },
      {
        name: '目标节点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        rippleEffect: {
          brushType: 'stroke',
          scale: ddosActive ? 5 : 3.5
        },
        symbolSize: (val: number[]) => Math.min(22, 6 + val[2] * 1.4),
        itemStyle: {
          color: ddosActive ? '#ff3b3b' : '#ffb347',
          shadowColor: ddosActive ? '#ff3b3b' : '#ffb347',
          shadowBlur: ddosActive ? 20 : 10
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          color: '#e6f1ff',
          fontSize: 11
        },
        data: scatterData.value,
        zlevel: 3
      }
    ]
  });
}

watch(
  () => [props.attackLines, props.ddosEvent.active, props.ddosEvent.targetCoord],
  () => {
    renderChart();
    if (props.ddosEvent.active && props.ddosEvent.timestamp) {
      spawnExplosion(props.ddosEvent.targetCoord);
    }
  },
  { deep: true }
);

onMounted(() => {
  initMap();
  rafId = requestAnimationFrame(drawParticles);
});

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  chartInstance?.dispose();
  cancelAnimationFrame(rafId);
});
</script>

<template>
  <div class="attack-map">
    <div class="map-header">
      <span class="title">全球攻击态势</span>
      <span class="subtitle">GLOBAL ATTACK SURFACE</span>
    </div>
    <div ref="mapRef" class="map-canvas"></div>
    <canvas ref="canvasRef" class="explosion-canvas"></canvas>
    <div v-if="loading" class="overlay-msg">地图数据加载中…</div>
    <div v-if="loadError" class="overlay-msg error">地图数据加载失败，请检查网络</div>

    <div class="legend">
      <div class="legend-item"><span class="dot cyan"></span>常规攻击流</div>
      <div class="legend-item"><span class="dot red"></span>DDoS 攻击流</div>
      <div class="legend-item"><span class="dot orange"></span>目标节点</div>
    </div>
  </div>
</template>

<style scoped>
.attack-map {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #0c1e3a 0%, #061225 70%, #040a16 100%);
  border: 1px solid #1e4d80;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 80px rgba(0, 212, 255, 0.06), 0 0 40px rgba(0, 0, 0, 0.45);
}
.map-header {
  position: absolute;
  top: 16px;
  left: 20px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.title {
  font-size: 18px;
  font-weight: 700;
  color: #e6f1ff;
  letter-spacing: 2px;
  text-shadow: 0 0 12px rgba(0, 212, 255, 0.55);
}
.subtitle {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  color: #00d4ff;
  letter-spacing: 3px;
  opacity: 0.8;
}
.map-canvas {
  width: 100%;
  height: 100%;
}
.explosion-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}
.overlay-msg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d4ff;
  font-size: 16px;
  letter-spacing: 2px;
  z-index: 6;
  background: rgba(6, 18, 37, 0.6);
}
.overlay-msg.error {
  color: #ff3b3b;
}
.legend {
  position: absolute;
  bottom: 16px;
  right: 20px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #9fc2e8;
  background: rgba(6, 18, 37, 0.55);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(30, 77, 128, 0.5);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.dot.cyan {
  background: #00d4ff;
  box-shadow: 0 0 8px #00d4ff;
}
.dot.red {
  background: #ff3b3b;
  box-shadow: 0 0 8px #ff3b3b;
}
.dot.orange {
  background: #ffb347;
  box-shadow: 0 0 8px #ffb347;
}
</style>
