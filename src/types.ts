export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  metric?: string;
  isEssential?: boolean;
}

export interface Recipe {
  id: string;
  meal_id?: string;
  name: string;
  description: string;
  image: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  budget: 'Budget-friendly' | 'Mid-range' | 'Premium';
  score: number;
  tags: string[];
  is_ai_generated?: boolean;
  nutrition: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    iron: number;
    vitC: number;
  };
  ingredients: Ingredient[];
  steps: string[];
  cookware?: string[];
}

export type Screen = 'onboarding' | 'discovery' | 'search' | 'detail' | 'plan' | 'profile' | 'editor' | 'breakdown' | 'add-ingredients' | 'your-recipes';
