import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { Scene } from '../../models/scene.model';

@Component({
  selector: 'app-scene-preset',
  templateUrl: './scene-preset.component.html',
  styleUrls: ['./scene-preset.component.css']
})
export class ScenePresetComponent implements OnInit {
  scenes: Scene[] = [];
  loadingScene: string | null = null;
  showExportProgress = false;
  exportProgress = 0;
  exportMessage = '';
  Math = Math;

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.loadScenes();
  }

  loadScenes(): void {
    this.inventoryService.getScenes().subscribe(data => {
      this.scenes = data;
    });
  }

  loadScene(sceneId: string): void {
    this.loadingScene = sceneId;
    this.inventoryService.loadScene(sceneId).subscribe({
      next: () => {
        this.loadingScene = null;
        window.location.reload();
      },
      error: () => {
        this.loadingScene = null;
      }
    });
  }

  exportReport(): void {
    this.showExportProgress = true;
    this.exportProgress = 0;
    this.exportMessage = '正在准备数据...';

    const progressInterval = setInterval(() => {
      this.exportProgress += Math.random() * 20;
      if (this.exportProgress > 80) {
        this.exportProgress = 80;
      }
    }, 200);

    setTimeout(() => {
      this.inventoryService.exportReport().subscribe({
        next: (blob) => {
          clearInterval(progressInterval);
          this.exportProgress = 100;
          this.exportMessage = '导出完成';

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'inventory_report.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          setTimeout(() => {
            this.showExportProgress = false;
            this.exportProgress = 0;
            this.exportMessage = '';
          }, 1500);
        },
        error: () => {
          clearInterval(progressInterval);
          this.exportMessage = '导出失败';
          setTimeout(() => {
            this.showExportProgress = false;
            this.exportProgress = 0;
            this.exportMessage = '';
          }, 2000);
        }
      });
    }, 1000);
  }

  resetDatabase(): void {
    if (confirm('确定要重置数据库吗？所有数据将被清空。')) {
      this.inventoryService.resetDatabase().subscribe(() => {
        window.location.reload();
      });
    }
  }
}