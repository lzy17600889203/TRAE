<template>
  <div class="app-container">
    <header class="header">
      <h1>🎵 三维声学共振腔体仿真系统</h1>
      <div class="header-info">
        <span>当前频率: {{ currentFrequency }} Hz</span>
        <span>λ = {{ wavelength.toFixed(3) }} m</span>
      </div>
    </header>

    <div class="main-content">
      <aside class="sidebar">
        <div class="section">
          <h3>🎨 预设场景</h3>
          <div class="preset-buttons">
            <button 
              v-for="preset in presets" 
              :key="preset.id"
              @click="loadPreset(preset.id)"
              class="preset-btn"
              :class="{ active: activePreset === preset.id }"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <div class="section">
          <h3>🔧 场景编辑</h3>
          <div class="edit-controls">
            <div class="control-row">
              <label>编辑模式:</label>
              <select v-model="editMode">
                <option value="wall">绘制壁面</option>
                <option value="absorber">放置吸音材料</option>
                <option value="source">放置声源</option>
                <option value="view">查看模式</option>
              </select>
            </div>
            
            <div v-if="editMode !== 'view'" class="control-row">
              <label>声阻抗:</label>
              <input type="number" v-model.number="wallImpedance" step="0.1" min="0.01">
            </div>
            
            <div v-if="editMode !== 'view'" class="control-row">
              <label>吸音系数:</label>
              <input type="range" v-model.number="wallAbsorption" min="0" max="1.5" step="0.01">
              <span>{{ wallAbsorption.toFixed(2) }}</span>
            </div>

            <div class="control-row">
              <label>全局吸音:</label>
              <input type="range" v-model.number="globalAbsorption" min="0" max="1" step="0.01">
              <span>{{ globalAbsorption.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>📊 仿真参数</h3>
          <div class="simulation-controls">
            <div class="control-row">
              <label>频率 (Hz):</label>
              <input type="number" v-model.number="currentFrequency" min="20" max="20000">
            </div>
            
            <div class="control-row">
              <label>频域范围:</label>
              <div class="range-inputs">
                <input type="number" v-model.number="freqMin" placeholder="最小">
                <span>-</span>
                <input type="number" v-model.number="freqMax" placeholder="最大">
              </div>
            </div>

            <button @click="runSimulation" class="btn btn-primary">开始仿真</button>
            <button @click="findResonances" class="btn btn-secondary">计算共振频率</button>
            <button @click="getFrequencyResponse" class="btn btn-secondary">获取频响曲线</button>
          </div>
        </div>

        <div class="section">
          <h3>🎬 动画效果</h3>
          <div class="animation-controls">
            <div class="animation-option" :class="{ active: animations.waveFront }">
              <label class="checkbox-label">
                <input type="checkbox" v-model="animations.waveFront">
                <span class="anim-title">🔵 波前球面扩散</span>
              </label>
              <p class="anim-desc">从声源位置向四周扩散的蓝色同心圆环，模拟声波在空间中的传播过程</p>
            </div>
            
            <div class="animation-option" :class="{ active: animations.heatmap }">
              <label class="checkbox-label">
                <input type="checkbox" v-model="animations.heatmap">
                <span class="anim-title">🔥 共振频域热力图闪烁</span>
              </label>
              <p class="anim-desc">点击"开始仿真"后，腔体内显示彩色粒子云，高压区域(红/橙)闪烁更强烈</p>
            </div>
            
            <div class="animation-option" :class="{ active: animations.phaseInterference }">
              <label class="checkbox-label">
                <input type="checkbox" v-model="animations.phaseInterference">
                <span class="anim-title">🔄 吸音面相位反转干涉</span>
              </label>
              <p class="anim-desc">绿色吸音材料表面在青绿色与红橙色之间交替闪烁，展示相位反转现象</p>
            </div>
            
            <div class="animation-option" :class="{ active: animations.standingWaves }">
              <label class="checkbox-label">
                <input type="checkbox" v-model="animations.standingWaves">
                <span class="anim-title">💫 驻波节点位置漂移</span>
              </label>
              <p class="anim-desc">腔体内随机出现青色节点(声压最小)和黄色点，随时间漂浮移动</p>
            </div>
            
            <div class="animation-option" :class="{ active: animations.decay }">
              <label class="checkbox-label">
                <input type="checkbox" v-model="animations.decay">
                <span class="anim-title">🌑 声压级衰减拖尾</span>
              </label>
              <p class="anim-desc">声源红色光晕随时间指数衰减，可观察能量耗散过程</p>
            </div>
          </div>
        </div>

        <div v-if="anomalies.length > 0" class="section anomalies-section">
          <h3>⚠️ 异常检测</h3>
          <div class="anomaly-list">
            <div 
              v-for="(anom, idx) in anomalies" 
              :key="idx" 
              class="anomaly-item"
              :class="anom.severity"
            >
              <strong>[{{ anom.type }}]</strong> {{ anom.message }}
            </div>
          </div>
        </div>

        <div v-if="resonances.length > 0" class="section">
          <h3>🎼 共振频率</h3>
          <div class="resonance-list">
            <div 
              v-for="(res, idx) in resonances" 
              :key="idx" 
              class="resonance-item"
              @click="setFrequency(res.frequency)"
            >
              <span class="freq">{{ res.frequency.toFixed(1) }} Hz</span>
              <span class="quality">Q={{ res.quality.toFixed(1) }}</span>
              <span v-if="res.anomalies" class="anomaly-flag">⚠️</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="scene-area">
        <div ref="sceneContainer" class="scene-container"></div>
        <div class="scene-overlay">
          <div class="info-panel">
            <div v-if="currentPreset">
              <h4>{{ currentPreset.name }}</h4>
              <p>{{ currentPreset.description }}</p>
              <div v-if="currentPreset.anomalies" class="preset-warnings">
                <div v-for="(warning, idx) in currentPreset.anomalies" :key="idx">
                  ⚠️ {{ warning }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="right-panel">
        <div class="section">
          <h3>📈 频响曲线</h3>
          <div class="chart-container">
            <canvas ref="frequencyChart"></canvas>
          </div>
        </div>

        <div class="section">
          <h3>📋 场景元素</h3>
          <div class="elements-list">
            <div class="element-type">
              <h4>壁面 ({{ walls.length }})</h4>
              <div v-for="wall in walls" :key="wall.id" class="element-item">
                壁面 #{{ wall.id }}
                <span class="element-stats">
                  Z={{ wall.impedance }} | α={{ wall.absorption }}
                </span>
              </div>
            </div>
            <div class="element-type">
              <h4>声源 ({{ sources.length }})</h4>
              <div v-for="src in sources" :key="src.id" class="element-item">
                声源 #{{ src.id }}
                <span class="element-stats">
                  f={{ src.frequency }}Hz
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>🪨 材料库</h3>
          <div class="materials-list">
            <div 
              v-for="mat in materials" 
              :key="mat.id" 
              class="material-item"
              @click="applyMaterial(mat)"
            >
              <div class="material-name">{{ mat.name }}</div>
              <div class="material-stats">
                Z={{ mat.impedance }} | α={{ mat.absorption }}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';

export default {
  name: 'App',
  setup() {
    const sceneContainer = ref(null);
    const frequencyChart = ref(null);
    
    const presets = ref([]);
    const activePreset = ref(null);
    const currentPreset = ref(null);
    
    const editMode = ref('view');
    const wallImpedance = ref(1.0);
    const wallAbsorption = ref(0.05);
    const globalAbsorption = ref(0.05);
    
    const currentFrequency = ref(440);
    const freqMin = ref(20);
    const freqMax = ref(2000);
    
    const walls = ref([]);
    const sources = ref([]);
    const materials = ref([]);
    const domain = ref({ x: 5, y: 5, z: 5 });
    
    const resonances = ref([]);
    const frequencyResponse = ref([]);
    const anomalies = ref([]);
    
    const animations = ref({
      waveFront: true,
      heatmap: true,
      phaseInterference: false,
      standingWaves: true,
      decay: false
    });

    let scene, camera, renderer, controls;
    let wallMeshes = [], sourceMeshes = [], waveFrontMeshes = [];
    let pressureParticles = [];
    let animationId = null;
    let time = 0;
    let isDrawing = false;
    let drawingPoints = [];

    const wavelength = computed(() => 343 / currentFrequency.value);

    const initThreeJS = () => {
      if (!sceneContainer.value) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);

      const aspect = sceneContainer.value.clientWidth / sceneContainer.value.clientHeight;
      camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
      camera.position.set(10, 8, 10);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(sceneContainer.value.clientWidth, sceneContainer.value.clientHeight);
      sceneContainer.value.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 10);
      scene.add(directionalLight);

      const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
      scene.add(gridHelper);

      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      renderer.domElement.addEventListener('click', onCanvasClick);

      animate();
    };

    const onCanvasClick = (event) => {
      if (editMode.value === 'view') return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);

      if (intersectPoint) {
        if (editMode.value === 'wall' || editMode.value === 'absorber') {
          if (!isDrawing) {
            isDrawing = true;
            drawingPoints = [intersectPoint];
          } else {
            drawingPoints.push(intersectPoint);
            if (drawingPoints.length >= 3) {
              createWallFromPoints();
              isDrawing = false;
              drawingPoints = [];
            }
          }
        } else if (editMode.value === 'source') {
          createSource(intersectPoint);
        }
      }
    };

    const createWallFromPoints = () => {
      if (drawingPoints.length < 3) return;

      const vertices = drawingPoints.map(p => [p.x, p.y, p.z]);
      const isAbsorber = editMode.value === 'absorber';
      const reflection = 1 - wallAbsorption.value;

      const wallData = {
        vertices: JSON.stringify(vertices),
        impedance: wallImpedance.value,
        reflection: Math.max(0, Math.min(1, reflection)),
        absorption: wallAbsorption.value,
        is_absorber: isAbsorber ? 1 : 0
      };

      walls.value.push(wallData);
      createWallMesh(wallData);
    };

    const createSource = (position) => {
      const srcData = {
        position_x: position.x,
        position_y: position.y,
        position_z: position.z,
        frequency: currentFrequency.value,
        amplitude: 1.0
      };

      sources.value.push(srcData);
      createSourceMesh(srcData);
    };

    const createWallMesh = (wallData) => {
      const vertices = JSON.parse(wallData.vertices);
      const geometry = new THREE.BufferGeometry();
      
      const positions = [];
      for (const v of vertices) {
        positions.push(v[0], v[1], v[2]);
      }

      if (vertices.length >= 3) {
        const indices = [];
        for (let i = 1; i < vertices.length - 1; i++) {
          indices.push(0, i, i + 1);
        }
        geometry.setIndex(indices);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();

      const color = wallData.is_absorber === 1 ? 0x00ff88 : 0x4488ff;
      const material = new THREE.MeshPhongMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        shininess: wallData.is_absorber === 1 ? 10 : 100
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.wallData = wallData;
      scene.add(mesh);
      wallMeshes.push(mesh);
    };

    const createSourceMesh = (sourceData) => {
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff4444,
        emissive: 0xff2222,
        emissiveIntensity: 0.5
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        sourceData.position_x,
        sourceData.position_y,
        sourceData.position_z
      );
      mesh.userData.sourceData = sourceData;
      scene.add(mesh);
      sourceMeshes.push(mesh);
    };

    const createDomainBox = () => {
      const oldBox = scene.getObjectByName('domainBox');
      if (oldBox) scene.remove(oldBox);

      const geometry = new THREE.BoxGeometry(domain.value.x, domain.value.y, domain.value.z);
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x8888ff,
        transparent: true,
        opacity: 0.5
      });
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      wireframe.name = 'domainBox';
      scene.add(wireframe);
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      updateAnimations();

      controls.update();
      renderer.render(scene, camera);
    };

    const updateAnimations = () => {
      if (animations.value.waveFront && sourceMeshes.length > 0) {
        updateWaveFrontAnimation();
      }

      if (animations.value.heatmap) {
        updateHeatmapAnimation();
      }

      if (animations.value.phaseInterference && wallMeshes.length > 0) {
        updatePhaseInterferenceAnimation();
      }

      if (animations.value.standingWaves) {
        updateStandingWavesAnimation();
      }

      if (animations.value.decay) {
        updateDecayAnimation();
      }

      sourceMeshes.forEach(mesh => {
        const pulse = 1 + 0.1 * Math.sin(time * 5);
        mesh.scale.set(pulse, pulse, pulse);
      });
    };

    const updateWaveFrontAnimation = () => {
      while (waveFrontMeshes.length > 40) {
        const mesh = waveFrontMeshes.shift();
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }

      if (Math.random() < 0.2) {
        sourceMeshes.forEach(srcMesh => {
          const colors = [0x44aaff, 0x66ccff, 0x88ddff, 0xaaffff];
          const colorIdx = Math.floor(Math.random() * colors.length);
          
          const geometry = new THREE.RingGeometry(0.3, 0.4, 64);
          const material = new THREE.MeshBasicMaterial({
            color: colors[colorIdx],
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(geometry, material);
          ring.position.copy(srcMesh.position);
          ring.lookAt(camera.position);
          ring.userData.radius = 0.3;
          ring.userData.maxRadius = 25;
          ring.userData.startTime = time;
          ring.userData.speed = 0.4 + Math.random() * 0.2;
          scene.add(ring);
          waveFrontMeshes.push(ring);
        });
      }

      waveFrontMeshes.forEach(ring => {
        ring.userData.radius += ring.userData.speed;
        
        const age = time - ring.userData.startTime;
        const glowIntensity = 0.5 + 0.5 * Math.sin(age * 8);
        
        ring.geometry.dispose();
        ring.geometry = new THREE.RingGeometry(
          ring.userData.radius,
          ring.userData.radius + 0.3,
          64
        );
        
        const fadeFactor = 1 - ring.userData.radius / ring.userData.maxRadius;
        ring.material.opacity = Math.max(0, fadeFactor * (0.7 + glowIntensity * 0.3));
        ring.material.color.setHSL(0.5 + fadeFactor * 0.15, 1.0, 0.45 + glowIntensity * 0.15);
        
        ring.lookAt(camera.position);
      });
    };

    const updateHeatmapAnimation = () => {
      pressureParticles.forEach(particle => {
        if (particle.userData.intensity !== undefined) {
          const intensity = particle.userData.intensity;
          const fastPulse = 0.4 + 0.6 * Math.sin(time * 5 + particle.userData.phase);
          const slowPulse = 0.7 + 0.3 * Math.sin(time * 1.5 + particle.userData.phase * 0.5);
          const combinedPulse = fastPulse * slowPulse;
          
          const animatedIntensity = intensity * combinedPulse;
          
          const color = new THREE.Color();
          const hue = 0.66 - animatedIntensity * 0.66;
          const lightness = 0.25 + animatedIntensity * 0.5;
          const saturation = 0.8 + animatedIntensity * 0.2;
          color.setHSL(hue, saturation, lightness);
          particle.material.color = color;
          
          const baseScale = 0.12 + intensity * 0.3;
          const pulseScale = baseScale * (0.8 + 0.4 * combinedPulse);
          particle.scale.set(pulseScale, pulseScale, pulseScale);
          
          particle.material.opacity = 0.5 + animatedIntensity * 0.5;
        }
      });
    };

    const updatePhaseInterferenceAnimation = () => {
      wallMeshes.forEach((mesh, idx) => {
        if (mesh.userData.wallData && mesh.userData.wallData.is_absorber === 1) {
          const absorption = mesh.userData.wallData.absorption || 0.5;
          
          const baseColor = new THREE.Color(0x00ffaa);
          const midColor = new THREE.Color(0xffaa00);
          const invertedColor = new THREE.Color(0xff3333);
          
          const phase1 = Math.sin(time * 2 + idx * 1.5);
          const phase2 = Math.sin(time * 3 + idx * 2.3);
          const combinedPhase = (phase1 + phase2) / 2;
          const blend = 0.5 + 0.5 * combinedPhase;
          
          if (blend < 0.5) {
            const subBlend = blend * 2;
            mesh.material.color.lerpColors(baseColor, midColor, subBlend * absorption);
          } else {
            const subBlend = (blend - 0.5) * 2;
            mesh.material.color.lerpColors(midColor, invertedColor, subBlend * absorption);
          }
          
          const opacityBase = 0.5 + absorption * 0.2;
          const opacityPulse = 0.2 * Math.sin(time * 2.5 + idx);
          mesh.material.opacity = Math.max(0.3, opacityBase + opacityPulse);
          
          const emissionIntensity = 0.1 + 0.2 * Math.abs(Math.sin(time * 4 + idx));
          mesh.material.emissive = mesh.material.color.clone().multiplyScalar(emissionIntensity);
          mesh.material.emissiveIntensity = emissionIntensity;
        }
      });
    };

    let standingWaveParticles = [];
    
    const updateStandingWavesAnimation = () => {
      const k = (2 * Math.PI * currentFrequency.value) / 343;
      
      if (Math.random() < 0.15) {
        const x = (Math.random() - 0.5) * domain.value.x;
        const y = (Math.random() - 0.5) * domain.value.y;
        const z = (Math.random() - 0.5) * domain.value.z;
        
        const pressure = Math.sin(k * x) * Math.sin(k * y) * Math.sin(k * z);
        const isNode = Math.abs(pressure) < 0.15;
        const isAntinode = Math.abs(pressure) > 0.85;
        
        const size = isNode ? 0.15 : isAntinode ? 0.2 : 0.08;
        const geometry = new THREE.SphereGeometry(size, 12, 12);
        
        let color;
        if (isNode) {
          color = 0x00ffff;
        } else if (isAntinode) {
          color = 0xff4444;
        } else {
          color = 0xffcc00;
        }
        
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.9
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(x, y, z);
        marker.userData.life = 3 + Math.random() * 2;
        marker.userData.maxLife = marker.userData.life;
        marker.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        );
        marker.userData.isNode = isNode;
        marker.userData.isAntinode = isAntinode;
        
        scene.add(marker);
        standingWaveParticles.push(marker);
      }

      standingWaveParticles = standingWaveParticles.filter(p => {
        p.userData.life -= 0.016;
        
        p.position.add(p.userData.velocity);
        p.userData.velocity.multiplyScalar(0.98);
        if (Math.random() < 0.05) {
          p.userData.velocity.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
          ));
        }
        
        const lifeRatio = p.userData.life / p.userData.maxLife;
        p.material.opacity = Math.max(0, lifeRatio * 0.9);
        
        const pulseScale = 1 + 0.3 * Math.sin(time * 4 + p.position.x + p.position.y);
        const baseScale = p.userData.isNode ? 1 : p.userData.isAntinode ? 1.2 : 0.8;
        p.scale.set(pulseScale * baseScale, pulseScale * baseScale, pulseScale * baseScale);
        
        if (p.userData.life <= 0) {
          scene.remove(p);
          p.geometry.dispose();
          p.material.dispose();
          return false;
        }
        return true;
      });
    };

    let decayTrailParticles = [];
    
    const updateDecayAnimation = () => {
      sourceMeshes.forEach(mesh => {
        const baseIntensity = 0.3;
        const pulseIntensity = 0.7 * Math.sin(time * 2);
        const totalIntensity = baseIntensity + pulseIntensity;
        mesh.material.emissiveIntensity = totalIntensity;
        
        mesh.material.emissive = new THREE.Color(0xff2222).multiplyScalar(0.5 + 0.5 * pulseIntensity);
      });
      
      if (Math.random() < 0.3) {
        sourceMeshes.forEach(srcMesh => {
          const angle1 = Math.random() * Math.PI * 2;
          const angle2 = Math.random() * Math.PI * 2;
          const speed = 0.05 + Math.random() * 0.1;
          
          const direction = new THREE.Vector3(
            Math.sin(angle1) * Math.cos(angle2),
            Math.sin(angle1) * Math.sin(angle2),
            Math.cos(angle1)
          ).multiplyScalar(speed);
          
          const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8);
          const material = new THREE.MeshBasicMaterial({
            color: 0xff6644,
            transparent: true,
            opacity: 0.9
          });
          
          const particle = new THREE.Mesh(geometry, material);
          particle.position.copy(srcMesh.position);
          particle.userData.direction = direction;
          particle.userData.life = 2 + Math.random() * 2;
          particle.userData.maxLife = particle.userData.life;
          
          scene.add(particle);
          decayTrailParticles.push(particle);
        });
      }
      
      decayTrailParticles = decayTrailParticles.filter(p => {
        p.userData.life -= 0.016;
        p.position.add(p.userData.direction);
        p.userData.direction.multiplyScalar(0.97);
        
        const lifeRatio = p.userData.life / p.userData.maxLife;
        p.material.opacity = Math.max(0, lifeRatio * 0.9);
        
        const scale = 0.5 + lifeRatio * 1.5;
        p.scale.set(scale, scale, scale);
        
        const hue = 0.05 + (1 - lifeRatio) * 0.15;
        p.material.color.setHSL(hue, 1.0, 0.4 + lifeRatio * 0.3);
        
        if (p.userData.life <= 0) {
          scene.remove(p);
          p.geometry.dispose();
          p.material.dispose();
          return false;
        }
        return true;
      });
    };

    const createPressureField = (pressureField) => {
      pressureParticles.forEach(p => {
        scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
      });
      pressureParticles = [];

      if (!pressureField || pressureField.length === 0) return;

      const N = pressureField.length;
      const dx = domain.value.x / (N - 1);
      const dy = domain.value.y / (N - 1);
      const dz = domain.value.z / (N - 1);

      let maxPressure = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          for (let k = 0; k < N; k++) {
            const val = pressureField[i][j][k];
            const mag = typeof val === 'object' ? (val.mag || Math.abs(val.re || 0)) : Math.abs(val);
            maxPressure = Math.max(maxPressure, mag);
          }
        }
      }

      if (maxPressure === 0) maxPressure = 1;

      for (let i = 0; i < N; i += 2) {
        for (let j = 0; j < N; j += 2) {
          for (let k = 0; k < N; k += 2) {
            const val = pressureField[i][j][k];
            const mag = typeof val === 'object' ? (val.mag || 0) : Math.abs(val || 0);
            const normalized = mag / maxPressure;
            
            if (normalized > 0.1) {
              const geometry = new THREE.SphereGeometry(0.1, 8, 8);
              const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: normalized * 0.8
              });
              
              const particle = new THREE.Mesh(geometry, material);
              particle.position.set(
                i * dx - domain.value.x / 2,
                j * dy - domain.value.y / 2,
                k * dz - domain.value.z / 2
              );
              particle.userData.intensity = normalized;
              particle.userData.phase = Math.random() * Math.PI * 2;
              
              const color = new THREE.Color();
              color.setHSL(0.7 - normalized * 0.7, 1, 0.5);
              particle.material.color = color;
              
              scene.add(particle);
              pressureParticles.push(particle);
            }
          }
        }
      }
    };

    const loadPresets = async () => {
      try {
        const response = await axios.get('/api/presets');
        presets.value = response.data;
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    };

    const loadMaterials = async () => {
      try {
        const response = await axios.get('/api/materials');
        materials.value = response.data;
      } catch (e) {
        console.error('Failed to load materials:', e);
      }
    };

    const loadPreset = async (presetId) => {
      activePreset.value = presetId;
      
      try {
        const response = await axios.get(`/api/presets/${presetId}`);
        const preset = response.data;
        currentPreset.value = preset;
        
        domain.value = preset.domain;
        walls.value = preset.walls.map(w => ({
          ...w,
          vertices: w.vertices
        }));
        sources.value = preset.sources;

        wallMeshes.forEach(m => {
          scene.remove(m);
          m.geometry.dispose();
          m.material.dispose();
        });
        wallMeshes = [];
        sourceMeshes.forEach(m => {
          scene.remove(m);
          m.geometry.dispose();
          m.material.dispose();
        });
        sourceMeshes = [];

        createDomainBox();
        
        walls.value.forEach(w => createWallMesh(w));
        sources.value.forEach(s => createSourceMesh(s));

        await analyzeAnomalies();
      } catch (e) {
        console.error('Failed to load preset:', e);
      }
    };

    const runSimulation = async () => {
      try {
        const response = await axios.post('/api/solve', {
          frequency: currentFrequency.value,
          walls: walls.value,
          sources: sources.value,
          absorption_coefficient: globalAbsorption.value,
          domain: domain.value
        });

        const { pressureField, aliasingInfo, energyCheck, modeCheck } = response.data;
        
        createPressureField(pressureField);

        anomalies.value = [];
        aliasingInfo.forEach(a => {
          if (a.isAliased) {
            anomalies.value.push({
              type: 'aliasing',
              severity: a.severity.includes('严重') ? 'critical' : a.severity.includes('中度') ? 'warning' : 'info',
              message: `网格混叠: kh=${a.kh.toFixed(2)}, ${a.severity}`
            });
          }
        });

        energyCheck.anomalies.forEach(msg => {
          anomalies.value.push({
            type: 'energy',
            severity: 'critical',
            message: msg
          });
        });

        modeCheck.forEach(msg => {
          anomalies.value.push({
            type: 'mode',
            severity: 'warning',
            message: msg
          });
        });
      } catch (e) {
        console.error('Simulation failed:', e);
      }
    };

    const findResonances = async () => {
      try {
        const response = await axios.post('/api/resonances', {
          walls: walls.value,
          sources: sources.value,
          absorption_coefficient: globalAbsorption.value,
          domain: domain.value
        });
        resonances.value = response.data.resonances;
      } catch (e) {
        console.error('Failed to find resonances:', e);
      }
    };

    const getFrequencyResponse = async () => {
      try {
        const response = await axios.post('/api/frequency-response', {
          walls: walls.value,
          sources: sources.value,
          absorption_coefficient: globalAbsorption.value,
          freq_range: [freqMin.value, freqMax.value],
          steps: 50,
          domain: domain.value
        });
        frequencyResponse.value = response.data.frequencyResponse;
        drawFrequencyChart();
      } catch (e) {
        console.error('Failed to get frequency response:', e);
      }
    };

    const analyzeAnomalies = async () => {
      try {
        const response = await axios.post('/api/analyze-anomalies', {
          walls: walls.value,
          sources: sources.value,
          frequency: currentFrequency.value,
          domain: domain.value
        });
        anomalies.value = response.data.anomalies.map(a => ({
          ...a,
          severity: a.severity === '严重' ? 'critical' : a.severity === '高' ? 'warning' : 'info'
        }));
      } catch (e) {
        console.error('Failed to analyze anomalies:', e);
      }
    };

    const drawFrequencyChart = () => {
      if (!frequencyChart.value) return;
      
      const canvas = frequencyChart.value;
      const ctx = canvas.getContext('2d');
      const width = canvas.width = canvas.clientWidth;
      const height = canvas.height = 200;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      if (frequencyResponse.value.length === 0) return;

      const freqs = frequencyResponse.value.map(d => d.frequency);
      const dbs = frequencyResponse.value.map(d => d.db);
      const aliased = frequencyResponse.value.map(d => d.aliased);

      const minFreq = Math.min(...freqs);
      const maxFreq = Math.max(...freqs);
      const minDb = Math.min(...dbs);
      const maxDb = Math.max(...dbs);

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const x = (i / 5) * (width - 40) + 20;
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, height - 30);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(20, 10);
      for (let i = 0; i < dbs.length; i++) {
        const x = 20 + ((freqs[i] - minFreq) / (maxFreq - minFreq)) * (width - 40);
        const y = height - 30 - ((dbs[i] - minDb) / (maxDb - minDb)) * (height - 40);
        
        if (aliased[i]) {
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#44aaff';
          ctx.lineWidth = 2;
        }
        
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${minFreq.toFixed(0)}Hz`, 20, height - 10);
      ctx.fillText(`${maxFreq.toFixed(0)}Hz`, width - 60, height - 10);
      ctx.fillText(`${maxDb.toFixed(1)}dB`, 5, 15);
      ctx.fillText(`${minDb.toFixed(1)}dB`, 5, height - 30);
    };

    const applyMaterial = (mat) => {
      wallImpedance.value = mat.impedance;
      wallAbsorption.value = mat.absorption;
    };

    const setFrequency = (freq) => {
      currentFrequency.value = freq;
    };

    const handleResize = () => {
      if (!sceneContainer.value) return;
      const width = sceneContainer.value.clientWidth;
      const height = sceneContainer.value.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    watch(currentFrequency, () => {
      if (sources.value.length > 0) {
        sources.value[0].frequency = currentFrequency.value;
      }
    });

    onMounted(async () => {
      await nextTick();
      initThreeJS();
      createDomainBox();
      await loadPresets();
      await loadMaterials();
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
        sceneContainer.value?.removeChild(renderer.domElement);
      }
    });

    return {
      sceneContainer,
      frequencyChart,
      presets,
      activePreset,
      currentPreset,
      editMode,
      wallImpedance,
      wallAbsorption,
      globalAbsorption,
      currentFrequency,
      freqMin,
      freqMax,
      walls,
      sources,
      materials,
      resonances,
      frequencyResponse,
      anomalies,
      animations,
      wavelength,
      loadPreset,
      runSimulation,
      findResonances,
      getFrequencyResponse,
      applyMaterial,
      setFrequency
    };
  }
};
</script>

<style>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
  color: #fff;
  overflow: hidden;
}

.header {
  height: 60px;
  background: linear-gradient(90deg, #1a1a2e, #16213e);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #333;
}

.header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.header-info {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #aaa;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar, .right-panel {
  width: 280px;
  background: #12121f;
  overflow-y: auto;
  padding: 16px;
  border-right: 1px solid #333;
}

.right-panel {
  border-right: none;
  border-left: 1px solid #333;
}

.scene-area {
  flex: 1;
  position: relative;
}

.scene-container {
  width: 100%;
  height: 100%;
}

.scene-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.info-panel {
  background: rgba(26, 26, 46, 0.9);
  margin: 16px;
  padding: 16px;
  border-radius: 8px;
  max-width: 400px;
  border: 1px solid #333;
}

.info-panel h4 {
  margin-bottom: 8px;
  color: #44aaff;
}

.info-panel p {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 8px;
}

.preset-warnings {
  font-size: 0.8rem;
  color: #ffaa44;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 0.95rem;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
  color: #44aaff;
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-btn {
  padding: 10px 12px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.preset-btn:hover {
  background: #2a2a4e;
  border-color: #44aaff;
}

.preset-btn.active {
  background: #1e3a5f;
  border-color: #44aaff;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.85rem;
}

.control-row label {
  min-width: 80px;
  color: #aaa;
}

.control-row select,
.control-row input[type="number"],
.range-inputs input {
  flex: 1;
  padding: 6px 10px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 0.85rem;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.control-row input[type="range"] {
  flex: 1;
}

.btn {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #44aaff, #3388dd);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(68, 170, 255, 0.3);
}

.btn-secondary {
  background: #2a2a4e;
  color: #aaa;
  border: 1px solid #333;
}

.btn-secondary:hover {
  background: #3a3a5e;
  color: #fff;
}

.animation-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #ccc;
}

.checkbox-label input {
  accent-color: #44aaff;
}

.anomalies-section {
  background: rgba(255, 68, 68, 0.1);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #442222;
}

.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anomaly-item {
  font-size: 0.8rem;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.anomaly-item.critical {
  border-left: 3px solid #ff4444;
  color: #ff6666;
}

.anomaly-item.warning {
  border-left: 3px solid #ffaa44;
  color: #ffbb55;
}

.anomaly-item.info {
  border-left: 3px solid #44aaff;
  color: #88ccff;
}

.resonance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.resonance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #1a1a2e;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.resonance-item:hover {
  background: #2a2a4e;
}

.resonance-item .freq {
  font-weight: 500;
  color: #44aaff;
}

.resonance-item .quality {
  font-size: 0.75rem;
  color: #88ff88;
}

.anomaly-flag {
  margin-left: 4px;
}

.chart-container {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 8px;
}

.elements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.element-type h4 {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 8px;
}

.element-item {
  font-size: 0.8rem;
  padding: 8px;
  background: #1a1a2e;
  border-radius: 4px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.element-stats {
  font-size: 0.75rem;
  color: #666;
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-item {
  padding: 10px 12px;
  background: linear-gradient(135deg, #1a1a2e, #222244);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #333;
}

.material-item:hover {
  border-color: #44aaff;
  transform: translateX(4px);
}

.material-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.material-stats {
  font-size: 0.75rem;
  color: #888;
}

.animation-option {
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.animation-option:hover {
  background: #222244;
  border-color: #444;
}

.animation-option.active {
  background: linear-gradient(135deg, #1e3a5f, #16213e);
  border-color: #44aaff;
  box-shadow: 0 0 12px rgba(68, 170, 255, 0.2);
}

.animation-option .checkbox-label {
  margin-bottom: 4px;
}

.animation-option .anim-title {
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
}

.animation-option.active .anim-title {
  color: #88ccff;
}

.animation-option .anim-desc {
  font-size: 0.78rem;
  color: #888;
  margin: 0;
  padding-left: 24px;
  line-height: 1.4;
}

.animation-option.active .anim-desc {
  color: #aaa;
}

.preset-btn {
  position: relative;
  overflow: hidden;
}

.preset-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(68, 170, 255, 0.1), transparent);
  transition: left 0.5s;
}

.preset-btn:hover::before {
  left: 100%;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a2e;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
