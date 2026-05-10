import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  SliceResult,
  PrintPath,
  Point3D,
  SliceLayer,
} from './types';

const COLORS = {
  model: 0x4a69bd,
  modelWireframe: 0x74b9ff,
  perimeter: 0x00b894,
  infill: 0x6c5ce7,
  support: 0xfdcb6e,
  travel: 0x636e72,
  error: 0xe74c3c,
  errorGlow: 0xff0000,
  deposited: 0x55efc4,
  nozzle: 0xff6b6b,
  bed: 0x2d3436,
  grid: 0x4a5568,
};

export class PrintRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  private modelMesh: THREE.Mesh | null = null;
  private modelWireframe: THREE.LineSegments | null = null;
  private slicePlanes: THREE.Mesh[] = [];
  private pathLines: THREE.Line[] = [];
  private printedMesh: THREE.Group | null = null;
  private depositedLines: THREE.Line[] = [];
  private nozzle: THREE.Mesh | null = null;
  private nozzleTrail: THREE.Line[] = [];
  private errorLines: THREE.Line[] = [];
  private supportLines: THREE.Line[] = [];
  private infillLines: THREE.Line[] = [];
  private bed: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  private currentSliceResult: SliceResult | null = null;
  private animationProgress: number = 0;
  private totalPaths: number = 0;
  private currentPathIndex: number = 0;
  private animationSpeed: number = 1;

  public onProgressUpdate?: (layer: number, progress: number) => void;
  public onErrorDetected?: (errorInfo: { type: string; message: string }) => void;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a15);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(5, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.createBed();
    this.createNozzle();

    window.addEventListener('resize', () => this.onResize());

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x74b9ff, 0.5);
    pointLight1.position.set(-5, 5, -5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x55efc4, 0.3);
    pointLight2.position.set(5, 3, 5);
    this.scene.add(pointLight2);
  }

  private createBed(): void {
    const bedGeometry = new THREE.PlaneGeometry(10, 10);
    const bedMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.bed,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.bed = new THREE.Mesh(bedGeometry, bedMaterial);
    this.bed.rotation.x = -Math.PI / 2;
    this.bed.position.y = -1.5;
    this.bed.receiveShadow = true;
    this.scene.add(this.bed);

    this.gridHelper = new THREE.GridHelper(10, 20, COLORS.grid, COLORS.grid);
    this.gridHelper.position.y = -1.49;
    this.scene.add(this.gridHelper);
  }

  private createNozzle(): void {
    const nozzleGroup = new THREE.Group();

    const coneGeometry = new THREE.ConeGeometry(0.1, 0.3, 16);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.x = Math.PI;
    cone.position.y = -0.15;
    nozzleGroup.add(cone);

    const tipGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.y = -0.3;
    nozzleGroup.add(tip);

    const pointLight = new THREE.PointLight(0xff6b6b, 1, 2);
    pointLight.position.y = -0.3;
    nozzleGroup.add(pointLight);

    this.nozzle = nozzleGroup as unknown as THREE.Mesh;
    this.nozzle.position.set(0, 1, 0);
    this.scene.add(this.nozzle);
  }

  private createLineGeometry(points: Point3D[]): THREE.BufferGeometry {
    const positions: number[] = [];
    for (const p of points) {
      positions.push(p.x, p.y, p.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    return geometry;
  }

  private createLineMaterial(color: number, opacity: number = 1, isError: boolean = false): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      linewidth: isError ? 3 : 1,
    });
  }

  public clearScene(): void {
    if (this.modelMesh) {
      this.scene.remove(this.modelMesh);
      this.modelMesh.geometry.dispose();
      (this.modelMesh.material as THREE.Material).dispose();
      this.modelMesh = null;
    }

    if (this.modelWireframe) {
      this.scene.remove(this.modelWireframe);
      this.modelWireframe.geometry.dispose();
      this.modelWireframe = null;
    }

    this.clearSliceVisualization();

    if (this.printedMesh) {
      this.scene.remove(this.printedMesh);
      this.printedMesh = null;
    }

    this.depositedLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.depositedLines = [];

    this.nozzleTrail.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.nozzleTrail = [];
  }

  private clearSliceVisualization(): void {
    this.slicePlanes.forEach((plane) => {
      this.scene.remove(plane);
      plane.geometry.dispose();
      (plane.material as THREE.Material).dispose();
    });
    this.slicePlanes = [];

    this.pathLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.pathLines = [];

    this.errorLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.errorLines = [];

    this.supportLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.supportLines = [];

    this.infillLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.infillLines = [];
  }

  public loadModel(vertices: Point3D[], triangles: number[][]): void {
    this.clearScene();

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];

    for (const tri of triangles) {
      const v0 = vertices[tri[0]];
      const v1 = vertices[tri[1]];
      const v2 = vertices[tri[2]];

      positions.push(v0.x, v0.y, v0.z);
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);

      const ax = v1.x - v0.x;
      const ay = v1.y - v0.y;
      const az = v1.z - v0.z;
      const bx = v2.x - v0.x;
      const by = v2.y - v0.y;
      const bz = v2.z - v0.z;

      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

      for (let i = 0; i < 3; i++) {
        normals.push(nx / len, ny / len, nz / len);
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3)
    );
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: COLORS.model,
      transparent: true,
      opacity: 0.7,
      roughness: 0.5,
      metalness: 0.3,
    });

    this.modelMesh = new THREE.Mesh(geometry, material);
    this.modelMesh.castShadow = true;
    this.scene.add(this.modelMesh);

    const wireframe = new THREE.WireframeGeometry(geometry);
    this.modelWireframe = new THREE.LineSegments(
      wireframe,
      new THREE.LineBasicMaterial({ color: COLORS.modelWireframe, opacity: 0.3, transparent: true })
    );
    this.scene.add(this.modelWireframe);
  }

  public showSlicePlanes(sliceResult: SliceResult): void {
    this.clearSliceVisualization();
    this.currentSliceResult = sliceResult;

    for (const layer of sliceResult.layers) {
      const planeGeometry = new THREE.PlaneGeometry(8, 8);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a69bd,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = layer.z;
      this.scene.add(plane);
      this.slicePlanes.push(plane);
    }
  }

  public showAllPaths(sliceResult: SliceResult, options: {
    showPerimeter?: boolean;
    showInfill?: boolean;
    showSupport?: boolean;
    showTravel?: boolean;
    showErrors?: boolean;
  } = {}): void {
    this.clearSliceVisualization();
    this.currentSliceResult = sliceResult;

    const opt = {
      showPerimeter: true,
      showInfill: true,
      showSupport: true,
      showTravel: false,
      showErrors: true,
      ...options,
    };

    this.totalPaths = 0;

    for (const layer of sliceResult.layers) {
      for (const path of layer.paths) {
        this.totalPaths++;

        if (path.points.length < 2) continue;

        const geometry = this.createLineGeometry(path.points);
        let color = COLORS.perimeter;
        let isError = path.isError || false;
        let targetArray = this.pathLines;

        if (isError && opt.showErrors) {
          color = COLORS.error;
          targetArray = this.errorLines;

          if (this.onErrorDetected && path.errorType) {
            this.onErrorDetected({
              type: path.errorType,
              message: `第 ${path.layerIndex} 层: ${this.getErrorMessage(path.errorType)}`,
            });
          }
        } else if (path.type === 'perimeter' && opt.showPerimeter) {
          color = COLORS.perimeter;
        } else if (path.type === 'infill' && opt.showInfill) {
          color = COLORS.infill;
          targetArray = this.infillLines;
        } else if (path.type === 'support' && opt.showSupport) {
          color = COLORS.support;
          targetArray = this.supportLines;
        } else if (path.type === 'travel' && opt.showTravel) {
          color = COLORS.travel;
        } else {
          geometry.dispose();
          continue;
        }

        const material = this.createLineMaterial(color, isError ? 1 : 0.7, isError);
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        targetArray.push(line);
      }
    }
  }

  private getErrorMessage(errorType: string): string {
    const messages: Record<string, string> = {
      path_crossing: '路径交叉/抖动',
      layer_misalignment: '层间错位',
      overhang_collapse: '悬臂塌陷风险',
      long_travel: '长距离空驶',
    };
    return messages[errorType] || '未知错误';
  }

  public resetAnimation(): void {
    this.animationProgress = 0;
    this.currentPathIndex = 0;

    this.depositedLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.depositedLines = [];

    this.nozzleTrail.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.nozzleTrail = [];

    if (this.nozzle) {
      this.nozzle.position.set(0, 1, 0);
    }

    this.clearSliceVisualization();

    if (this.printedMesh) {
      this.scene.remove(this.printedMesh);
      this.printedMesh = null;
    }
    this.printedMesh = new THREE.Group();
    this.scene.add(this.printedMesh);
  }

  public animatePrintStep(deltaTime: number): boolean {
    if (!this.currentSliceResult) return false;

    const allLayers = this.currentSliceResult.layers;
    if (allLayers.length === 0) return false;

    const speed = this.animationSpeed * 20;
    this.animationProgress += deltaTime * speed;

    let pathCount = 0;
    let targetLayer = 0;
    let targetPath: PrintPath | null = null;

    outer: for (let li = 0; li < allLayers.length; li++) {
      const layer = allLayers[li];
      targetLayer = li;

      for (const path of layer.paths) {
        if (path.points.length < 2) {
          pathCount++;
          continue;
        }

        if (pathCount >= Math.floor(this.animationProgress)) {
          targetPath = path;
          break outer;
        }
        pathCount++;
      }
    }

    const totalLayerPaths = allLayers.reduce(
      (s, l) => s + l.paths.length,
      0
    );

    if (targetPath && this.nozzle) {
      const points = targetPath.points;
      const segmentIndex = Math.floor(
        (this.animationProgress - Math.floor(this.animationProgress)) * (points.length - 1)
      );
      const actualIndex = Math.min(segmentIndex, points.length - 1);
      const p = points[actualIndex];

      this.nozzle.position.set(p.x, p.y + 0.5, p.z);

      if (
        targetPath.type !== 'travel' &&
        actualIndex > 0 &&
        this.currentPathIndex !== Math.floor(this.animationProgress)
      ) {
        const color = targetPath.isError
          ? COLORS.error
          : targetPath.type === 'support'
          ? COLORS.support
          : COLORS.deposited;

        const geometry = this.createLineGeometry([
          points[actualIndex - 1],
          p,
        ]);
        const material = this.createLineMaterial(color, 1, targetPath.isError || false);
        material.linewidth = 2;
        const line = new THREE.Line(geometry, material);
        if (this.printedMesh) {
          this.printedMesh.add(line);
        }
        this.depositedLines.push(line);

        if (targetPath.isError && this.onErrorDetected && targetPath.errorType) {
          this.onErrorDetected({
            type: targetPath.errorType,
            message: `第 ${targetLayer} 层: ${this.getErrorMessage(targetPath.errorType)}`,
          });
        }

        if (targetPath.type === 'infill' || targetPath.type === 'perimeter') {
          const tubeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.001, 8);
          const tubeMaterial = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: targetPath.isError ? 0.5 : 0.2,
          });
          const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
          tube.position.set(
            (points[actualIndex - 1].x + p.x) / 2,
            (points[actualIndex - 1].y + p.y) / 2,
            (points[actualIndex - 1].z + p.z) / 2
          );
          if (this.printedMesh) {
            this.printedMesh.add(tube);
          }
        }
      }
    }

    this.currentPathIndex = Math.floor(this.animationProgress);

    const progress = Math.min(100, (this.animationProgress / totalLayerPaths) * 100);
    if (this.onProgressUpdate) {
      this.onProgressUpdate(targetLayer, progress);
    }

    return this.animationProgress < totalLayerPaths;
  }

  public setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  public setVisibility(options: {
    model?: boolean;
    wireframe?: boolean;
    paths?: boolean;
    slices?: boolean;
    nozzle?: boolean;
    supports?: boolean;
    infill?: boolean;
    errors?: boolean;
  }): void {
    if (options.model !== undefined && this.modelMesh) {
      this.modelMesh.visible = options.model;
    }
    if (options.wireframe !== undefined && this.modelWireframe) {
      this.modelWireframe.visible = options.wireframe;
    }
    if (options.nozzle !== undefined && this.nozzle) {
      this.nozzle.visible = options.nozzle;
    }
    if (options.paths !== undefined) {
      this.pathLines.forEach((l) => (l.visible = options.paths!));
    }
    if (options.slices !== undefined) {
      this.slicePlanes.forEach((p) => (p.visible = options.slices!));
    }
    if (options.supports !== undefined) {
      this.supportLines.forEach((l) => (l.visible = options.supports!));
    }
    if (options.infill !== undefined) {
      this.infillLines.forEach((l) => (l.visible = options.infill!));
    }
    if (options.errors !== undefined) {
      this.errorLines.forEach((l) => (l.visible = options.errors!));
    }
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.clearScene();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
