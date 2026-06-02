import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RecipeService } from './recipe.service';
import { Recipe, RecipeDetail, Ingredient } from './recipe.model';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  stagger,
  query,
} from '@angular/animations';

interface SceneConfig {
  key: string;
  label: string;
  emoji: string;
  defaultServings: number;
  color: string;
  tip: string;
}

const SCENES: SceneConfig[] = [
  { key: 'bachelor', label: '单身汉一人食', emoji: '🧑‍🍳', defaultServings: 1, color: '#4dabf7', tip: '一个人也要好好吃饭' },
  { key: 'couple', label: '周末情侣双人餐', emoji: '👩‍❤️‍👨', defaultServings: 2, color: '#f783ac', tip: '烛光晚餐预定中' },
  { key: 'team', label: '公司团建十人饭', emoji: '🎉', defaultServings: 10, color: '#74c0fc', tip: '大锅饭，硬菜必须上' },
  { key: 'fail', label: '调料放错的翻车现场', emoji: '💥', defaultServings: 2, color: '#ff922b', tip: '前车之鉴，请引以为戒' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('bookFlip', [
      transition('* => *', [
        query('.recipe-card', [
          style({
            transform: 'perspective(1200px) rotateY(-120deg) translateY(30px)',
            opacity: 0,
            transformOrigin: 'left center',
          }),
          stagger(80, [
            animate(
              '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              style({ transform: 'perspective(1200px) rotateY(0deg) translateY(0)', opacity: 1 })
            ),
          ]),
        ], { optional: true }),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('bounce', [
      state('*', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.08)' })),
      transition('* => active', animate('200ms cubic-bezier(0.34, 1.56, 0.64, 1)')),
      transition('active => *', animate('200ms ease-out')),
    ]),
  ],
})
export class AppComponent implements OnInit {
  scenes = SCENES;
  currentScene = 'bachelor';
  recipes: Recipe[] = [];
  selectedRecipe: RecipeDetail | null = null;
  servings = 1;
  defaultServingsForScene = 1;
  loadingRecipes = false;
  loadingDetail = false;
  error: string | null = null;
  @ViewChildren('qtyText') qtyTexts!: QueryList<ElementRef<HTMLSpanElement>>;

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.selectScene(this.currentScene);
  }

  selectScene(scene: string): void {
    this.currentScene = scene;
    const conf = this.scenes.find((s) => s.key === scene);
    this.defaultServingsForScene = conf?.defaultServings ?? 1;
    this.servings = this.defaultServingsForScene;
    this.selectedRecipe = null;
    this.recipes = [];
    this.loadingRecipes = true;
    this.error = null;
    this.recipeService.listRecipes(scene).subscribe({
      next: (data) => {
        this.recipes = data;
        this.loadingRecipes = false;
      },
      error: () => {
        this.error = '连不上后端啦，请确认 node server.js 已启动';
        this.loadingRecipes = false;
      },
    });
  }

  pickRecipe(recipe: Recipe): void {
    this.loadingDetail = true;
    this.selectedRecipe = null;
    this.recipeService.getRecipe(recipe.id, this.servings).subscribe({
      next: (detail) => {
        this.selectedRecipe = detail;
        this.loadingDetail = false;
        this.animateQuantity();
      },
      error: () => {
        this.error = '获取菜谱详情失败';
        this.loadingDetail = false;
      },
    });
  }

  onServingsChange(): void {
    if (this.selectedRecipe) {
      this.recipeService.getRecipe(this.selectedRecipe.id, this.servings).subscribe({
        next: (detail) => {
          this.selectedRecipe = detail;
          this.animateQuantity();
        },
      });
    }
  }

  private animateQuantity(): void {
    setTimeout(() => {
      this.qtyTexts.forEach((el) => {
        const node = el.nativeElement;
        node.classList.remove('rolling');
        void node.offsetWidth;
        node.classList.add('rolling');
      });
    }, 20);
  }

  quantityText(ing: Ingredient): string {
    return ing.display_quantity || '?';
  }

  sceneTip(): string {
    const conf = this.scenes.find((s) => s.key === this.currentScene);
    return conf?.tip ?? '';
  }
}
