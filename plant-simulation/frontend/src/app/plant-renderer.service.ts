import { Injectable, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  PlantStructure,
  BranchGeometry,
  LeafData,
  FlowerData,
  DiseaseSpot,
  AnimationConfig,
} from './types';

@Injectable({
  providedIn: 'root',
})
export class PlantRendererService {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private plantGroup: THREE.Group;
  private animationId: number | null = null;
  private container: HTMLElement | null = null;

  private structure: PlantStructure | null = null;
  private animationConfig: AnimationConfig | null = null;
  private currentTime: number = 0;
  private isPlaying: boolean = false;

  private branchMeshes: Map<string, THREE.Mesh> = new Map();
  private leafMeshes: Map<string, THREE.Mesh> = new Map();
  private flowerGroups: Map<string, THREE.Group> = new Map();
  private diseaseMeshes: Map<string, THREE.Mesh> = new Map();

  private particles: THREE.Points | null = null;
  private particlePositions: Float32Array = new Float32Array();
  private particleVelocities: number[] = [];
  private particleLives: number[] = [];
  private particleTimer: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.set(8, 6, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.plantGroup = new THREE.Group();
    this.scene.add(this.plantGroup);

    this.setupLights();
    this.setupGround();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sunLight.position.set(5, 10, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffccaa, 0.2);
    rimLight.position.set(0, 3, -8);
    this.scene.add(rimLight);
  }

  private setupGround(): void {
    const groundGeo = new THREE.CircleGeometry(20, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d4a2d,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.3;
    this.scene.add(gridHelper);
  }

  public init(containerRef: ElementRef<HTMLDivElement>): void {
    this.container = containerRef.nativeElement;
    this.container.appendChild(this.renderer.domElement);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.startAnimationLoop();
  }

  private resize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update(1 / 60);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.container && this.renderer.domElement.parentNode) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  public setStructure(
    structure: PlantStructure,
    animationConfig: AnimationConfig
  ): void {
    this.structure = structure;
    this.animationConfig = animationConfig;
    this.currentTime = 0;
    this.clearPlant();
    this.createPlant(structure);
  }

  private clearPlant(): void {
    this.branchMeshes.forEach((mesh) => {
      this.plantGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.branchMeshes.clear();

    this.leafMeshes.forEach((mesh) => {
      this.plantGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.leafMeshes.clear();

    this.flowerGroups.forEach((group) => {
      this.plantGroup.remove(group);
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    });
    this.flowerGroups.clear();

    this.diseaseMeshes.forEach((mesh) => {
      this.plantGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.diseaseMeshes.clear();

    if (this.particles) {
      this.plantGroup.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
      this.particles = null;
    }
    this.particlePositions = new Float32Array();
    this.particleVelocities = [];
    this.particleLives = [];
  }

  private createPlant(structure: PlantStructure): void {
    structure.branches.forEach((branch) => {
      const mesh = this.createBranch(branch);
      this.plantGroup.add(mesh);
      this.branchMeshes.set(branch.id, mesh);
    });

    structure.leaves.forEach((leaf) => {
      const mesh = this.createLeaf(leaf);
      this.plantGroup.add(mesh);
      this.leafMeshes.set(leaf.id, mesh);
    });

    structure.flowers.forEach((flower) => {
      const group = this.createFlower(flower);
      this.plantGroup.add(group);
      this.flowerGroups.set(flower.id, group);
    });

    structure.diseaseSpots.forEach((spot) => {
      const mesh = this.createDiseaseSpot(spot);
      this.plantGroup.add(mesh);
      this.diseaseMeshes.set(spot.id, mesh);
    });
  }

  private createBranch(branch: BranchGeometry): THREE.Mesh {
    const start = new THREE.Vector3(branch.start.x, branch.start.y, branch.start.z);
    const end = new THREE.Vector3(branch.end.x, branch.end.y, branch.end.z);
    const dir = end.clone().sub(start).normalize();
    const length = end.distanceTo(start);
    const mid = start.clone().add(end).multiplyScalar(0.5);

    const geo = new THREE.CylinderGeometry(
      branch.radius * 0.8,
      branch.radius,
      length,
      8
    );

    const hue = 0.08 + Math.random() * 0.05;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.35, 0.28 + branch.level * 0.02),
      roughness: 0.9,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(mid);

    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, dir);

    mesh.scale.set(0.001, 0.001, 0.001);
    (mesh as any).userData = { level: branch.level, priority: branch.priority };

    return mesh;
  }

  private createLeaf(leaf: LeafData): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.15, 0.4, 0, 0.8);
    shape.quadraticCurveTo(-0.15, 0.4, 0, 0);

    const geo = new THREE.ShapeGeometry(shape);

    const hue = 0.28 + leaf.level * 0.015;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.6, 0.42),
      side: THREE.DoubleSide,
      roughness: 0.7,
      transparent: true,
      opacity: 0.95,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(leaf.position.x, leaf.position.y, leaf.position.z);

    const normal = new THREE.Vector3(leaf.normal.x, leaf.normal.y, leaf.normal.z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, normal);
    mesh.rotation.z = (leaf.rotation * Math.PI) / 180;

    mesh.scale.set(0.001, 0.001, 0.001);
    (mesh as any).userData = { level: leaf.level };

    return mesh;
  }

  private createFlower(flower: FlowerData): THREE.Group {
    const group = new THREE.Group();

    const petalGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const hues = [0.9, 0.0, 0.15, 0.33];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const petalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.65),
      roughness: 0.6,
    });

    for (let i = 0; i < flower.petals; i++) {
      const petal = new THREE.Mesh(petalGeo.clone(), petalMat);
      petal.castShadow = true;
      const angle = (i / flower.petals) * Math.PI * 2;
      petal.position.set(
        Math.cos(angle) * 0.2,
        0,
        Math.sin(angle) * 0.2
      );
      petal.scale.set(1, 0.3, 1);
      petal.rotation.y = -angle;
      group.add(petal);
    }

    const centerGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.castShadow = true;
    group.add(center);

    group.position.set(flower.position.x, flower.position.y, flower.position.z);
    group.scale.set(0.001, 0.001, 0.001);

    return group;
  }

  private createDiseaseSpot(spot: DiseaseSpot): THREE.Mesh {
    const geo = new THREE.SphereGeometry(spot.radius, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      transparent: true,
      opacity: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(spot.position.x, spot.position.y, spot.position.z);
    mesh.scale.set(0.001, 0.001, 0.001);

    return mesh;
  }

  public play(): void {
    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public reset(): void {
    this.currentTime = 0;
    this.isPlaying = false;

    this.branchMeshes.forEach((m) => m.scale.set(0.001, 0.001, 0.001));
    this.leafMeshes.forEach((m) => m.scale.set(0.001, 0.001, 0.001));
    this.flowerGroups.forEach((g) => g.scale.set(0.001, 0.001, 0.001));
    this.diseaseMeshes.forEach((m) => m.scale.set(0.001, 0.001, 0.001));
  }

  private update(dt: number): void {
    if (!this.isPlaying || !this.animationConfig) return;

    const anim = this.animationConfig;
    this.currentTime += dt * anim.branchGrowthSpeed;

    this.branchMeshes.forEach((mesh, id) => {
      const userData = (mesh as any).userData;
      const level = userData.level || 0;
      const delay = level * 0.8;
      const duration = 1.5 / anim.branchGrowthSpeed;

      if (this.currentTime > delay) {
        const t = Math.min(1, (this.currentTime - delay) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        mesh.scale.set(eased, eased, eased);
      }
    });

    this.leafMeshes.forEach((mesh) => {
      const pos = mesh.position;
      const delay = 2.0 + pos.y * 0.3;
      const duration = 2.0 / anim.leafUnfurlSpeed;

      if (this.currentTime > delay) {
        const t = Math.min(1, (this.currentTime - delay) / duration);
        const eased = 1 - Math.pow(1 - t, 2);
        mesh.scale.set(eased, eased, eased);

        const flip = Math.sin(this.currentTime * 2 + pos.x) * 0.1;
        mesh.rotation.x = flip * (1 - eased * 0.5);
      }
    });

    this.flowerGroups.forEach((group) => {
      const pos = group.position;
      const delay = 6.4 + pos.y * 0.2;
      const duration = 1.5 / anim.flowerBloomSpeed;

      if (this.currentTime > delay) {
        const t = Math.min(1, (this.currentTime - delay) / duration);
        const eased = 1 - Math.pow(1 - t, 2);
        group.scale.set(eased, eased, eased);
        group.rotation.y += dt * 0.5 * anim.flowerBloomSpeed;
      }
    });

    if (anim.diseaseSpreadSpeed > 0) {
      this.diseaseMeshes.forEach((mesh) => {
        const delay = 1.0;
        const duration = 3.0 / anim.diseaseSpreadSpeed;

        if (this.currentTime > delay) {
          const t = Math.min(1, (this.currentTime - delay) / duration);
          mesh.scale.set(t, t, t);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.1 + t * 0.7;
        }
      });
    }

    if (anim.photosynthesisSpeed > 0) {
      this.updateParticles(dt, anim.photosynthesisSpeed);
    }
  }

  private updateParticles(dt: number, speed: number): void {
    this.particleTimer += dt;
    const emitInterval = 0.1 / speed;

    if (this.particleTimer > emitInterval) {
      this.particleTimer = 0;
      this.emitParticle();
    }

    const activeCount = this.particleLives.length;
    if (activeCount === 0) {
      if (this.particles) {
        this.plantGroup.remove(this.particles);
        this.particles.geometry.dispose();
        (this.particles.material as THREE.Material).dispose();
        this.particles = null;
      }
      return;
    }

    for (let i = this.particleLives.length - 1; i >= 0; i--) {
      this.particleLives[i] -= dt * speed;
      if (this.particleLives[i] <= 0) {
        this.particleLives.splice(i, 1);
        this.particleVelocities.splice(i * 3, 3);
        const posArray = Array.from(this.particlePositions);
        posArray.splice(i * 3, 3);
        this.particlePositions = new Float32Array(posArray);
      } else {
        this.particlePositions[i * 3] += this.particleVelocities[i * 3] * dt;
        this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * dt;
        this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * dt;
      }
    }

    if (this.particlePositions.length === 0) return;

    const colors = new Float32Array(this.particlePositions.length);
    for (let i = 0; i < this.particleLives.length; i++) {
      const life = this.particleLives[i] / 2.0;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9 + life * 0.1;
      colors[i * 3 + 2] = 0.4 + life * 0.2;
    }

    if (this.particles) {
      const geo = this.particles.geometry as THREE.BufferGeometry;
      const posAttr = geo.attributes['position'] as THREE.BufferAttribute;
      if (posAttr) {
        posAttr.array = this.particlePositions;
        posAttr.needsUpdate = true;
      }
      return;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.plantGroup.add(this.particles);
  }

  private emitParticle(): void {
    const activeLeaves: string[] = [];
    this.leafMeshes.forEach((mesh, id) => {
      if (mesh.scale.x > 0.5) activeLeaves.push(id);
    });

    if (activeLeaves.length === 0) return;

    const randomId = activeLeaves[Math.floor(Math.random() * activeLeaves.length)];
    const leaf = this.leafMeshes.get(randomId);
    if (!leaf) return;

    const pos = leaf.position.clone();
    const newPosArray = new Float32Array(this.particlePositions.length + 3);
    newPosArray.set(this.particlePositions);
    newPosArray[this.particlePositions.length] = pos.x;
    newPosArray[this.particlePositions.length + 1] = pos.y;
    newPosArray[this.particlePositions.length + 2] = pos.z;
    this.particlePositions = newPosArray;

    this.particleVelocities.push(
      (Math.random() - 0.5) * 0.2,
      1.5 + Math.random(),
      (Math.random() - 0.5) * 0.2
    );

    this.particleLives.push(2.0);
  }
}
