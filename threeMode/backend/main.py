from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import json
import os
import uuid
from pathlib import Path
from enum import Enum

app = FastAPI(title="3D 切片模拟 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
SLICE_FILE = DATA_DIR / "slice_data.json"
PRESETS_FILE = DATA_DIR / "presets.json"


class Point3D(BaseModel):
    x: float
    y: float
    z: float


class Point2D(BaseModel):
    x: float
    y: float


class PrintPath(BaseModel):
    type: str
    points: List[Point3D]
    layerIndex: int
    isError: Optional[bool] = False
    errorType: Optional[str] = None


class SliceLayer(BaseModel):
    layerIndex: int
    z: float
    contours: List[List[Point2D]]
    infillPattern: List[List[Point2D]]
    supportContours: List[List[Point2D]]
    paths: List[PrintPath]


class PrintParameters(BaseModel):
    layerHeight: float = 0.2
    infillDensity: float = 20
    printSpeed: float = 80
    supportStyle: str = "none"
    infillPattern: str = "line"
    nozzleDiameter: float = 0.4
    extrusionWidth: float = 0.44
    enableErrors: bool = True


class PrintError(BaseModel):
    id: str
    type: str
    layerIndex: int
    severity: str
    description: str
    location: Point3D


class SliceResult(BaseModel):
    model: Any
    parameters: PrintParameters
    layers: List[SliceLayer]
    totalGcodeLines: int
    totalTravelDistance: float
    errors: List[PrintError]
    hasSupport: bool


class PresetConfig(BaseModel):
    id: str
    name: str
    modelType: str
    parameters: PrintParameters
    description: str


PRESETS = [
    PresetConfig(
        id="standard",
        name="标准填充预设",
        modelType="cube",
        description="标准配置，展示正常的打印过程",
        parameters=PrintParameters(
            layerHeight=0.2,
            infillDensity=20,
            printSpeed=80,
            supportStyle="none",
            enableErrors=False
        )
    ),
    PresetConfig(
        id="hollow",
        name="空心外壳预设",
        modelType="sphere",
        description="空心打印，只有外壳没有填充",
        parameters=PrintParameters(
            layerHeight=0.15,
            infillDensity=0,
            printSpeed=60,
            supportStyle="grid",
            enableErrors=False
        )
    ),
    PresetConfig(
        id="missing_support",
        name="支撑缺失预设",
        modelType="overhang",
        description="大角度悬臂但无支撑，展示塌陷效果",
        parameters=PrintParameters(
            layerHeight=0.2,
            infillDensity=15,
            printSpeed=100,
            supportStyle="none",
            enableErrors=True
        )
    ),
    PresetConfig(
        id="fast_jitter",
        name="高速抖动预设",
        modelType="torus",
        description="高速打印导致路径混乱和抖动",
        parameters=PrintParameters(
            layerHeight=0.3,
            infillDensity=50,
            printSpeed=200,
            supportStyle="none",
            enableErrors=True
        )
    )
]


def save_slice_data(data: dict):
    with open(SLICE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_slice_data() -> Optional[dict]:
    if SLICE_FILE.exists():
        with open(SLICE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def save_presets():
    with open(PRESETS_FILE, 'w', encoding='utf-8') as f:
        json.dump([p.model_dump() for p in PRESETS], f, ensure_ascii=False, indent=2)


save_presets()


@app.get("/")
async def root():
    return {
        "name": "3D 切片与打印路径生成模拟 API",
        "version": "1.0.0",
        "endpoints": {
            "GET /presets": "获取所有预设配置",
            "GET /presets/{preset_id}": "获取指定预设",
            "POST /slice": "执行模型切片",
            "GET /slices": "获取已保存的切片数据",
            "GET /slices/latest": "获取最新切片数据",
            "DELETE /slices": "清除切片数据"
        }
    }


@app.get("/presets", response_model=List[PresetConfig])
async def get_presets():
    return PRESETS


@app.get("/presets/{preset_id}", response_model=PresetConfig)
async def get_preset(preset_id: str):
    for preset in PRESETS:
        if preset.id == preset_id:
            return preset
    raise HTTPException(status_code=404, detail="预设不存在")


@app.post("/slice", response_model=SliceResult)
async def create_slice(slice_request: SliceResult):
    save_slice_data(slice_request.model_dump())
    return slice_request


@app.get("/slices")
async def get_slices():
    data = load_slice_data()
    if data is None:
        return {"message": "没有保存的切片数据"}
    return data


@app.get("/slices/latest")
async def get_latest_slice():
    data = load_slice_data()
    if data is None:
        raise HTTPException(status_code=404, detail="没有保存的切片数据")
    return data


@app.delete("/slices")
async def clear_slices():
    if SLICE_FILE.exists():
        SLICE_FILE.unlink()
        return {"message": "切片数据已清除"}
    return {"message": "没有切片数据需要清除"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": uuid.uuid1().node}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
