export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface PrintPath {
  type: 'perimeter' | 'infill' | 'support' | 'travel' | 'error';
  points: Point3D[];
  layerIndex: number;
  isError?: boolean;
  errorType?: string;
}

export interface SliceLayer {
  layerIndex: number;
  z: number;
  contours: Point2D[][];
  infillPattern: Point2D[][];
  supportContours: Point2D[][];
  paths: PrintPath[];
}

export interface ModelData {
  type: string;
  vertices: Point3D[];
  triangles: number[][];
  bounds: {
    min: Point3D;
    max: Point3D;
  };
}

export interface PrintParameters {
  layerHeight: number;
  infillDensity: number;
  printSpeed: number;
  supportStyle: 'none' | 'grid' | 'tree' | 'line';
  infillPattern: 'line' | 'grid' | 'triangles' | 'honeycomb';
  nozzleDiameter: number;
  extrusionWidth: number;
  enableErrors: boolean;
}

export interface SliceResult {
  model: ModelData;
  parameters: PrintParameters;
  layers: SliceLayer[];
  totalGcodeLines: number;
  totalTravelDistance: number;
  errors: PrintError[];
  hasSupport: boolean;
}

export interface PrintError {
  id: string;
  type: 'path_crossing' | 'layer_misalignment' | 'long_travel' | 'overhang_collapse';
  layerIndex: number;
  severity: 'warning' | 'error';
  description: string;
  location: Point3D;
}

export interface PresetConfig {
  id: string;
  name: string;
  modelType: string;
  parameters: PrintParameters;
  description: string;
}
