export interface Recipe {
  id: number;
  name: string;
  emoji: string;
  scene: string;
  description?: string;
  base_servings: number;
  steps?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  quantity: number | null;
  display_quantity: string;
  unit: string;
  is_fuzzy: boolean;
}

export interface RecipeDetail {
  id: number;
  name: string;
  emoji: string;
  scene: string;
  description?: string;
  steps?: string;
  base_servings: number;
  target_servings: number;
  ratio: number;
  ingredients: Ingredient[];
}
