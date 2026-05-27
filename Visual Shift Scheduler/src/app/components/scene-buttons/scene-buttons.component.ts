import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'scene-buttons',
  templateUrl: './scene-buttons.component.html',
  styleUrls: ['./scene-buttons.component.scss']
})
export class SceneButtonsComponent {
  @Output() load = new EventEmitter<string>();

  scenes = [
    { id: 'standard', name: '标准轮班场景', icon: 'work' },
    { id: 'shortage', name: '人员短缺场景', icon: 'users' },
    { id: 'overtime', name: '连续加班违规场景', icon: 'alert' },
    { id: 'conflict', name: '临时调班冲突场景', icon: 'conflict' }
  ];

  loadScene(sceneId: string): void {
    this.load.emit(sceneId);
  }
}