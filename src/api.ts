
import { getSupabase } from './lib/supabase';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || 'https://marisela-falsifiable-ridiculously.ngrok-free.dev';

const getHeaders = async () => {
  let token = null;
  try {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    token = session?.access_token;
  } catch (err) {
    console.warn('Could not get session token (Supabase not initialized):', err);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  // User & Profile
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/users/me`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },
  updateProfile: async (data: { display_name?: string; avatar_url?: string }) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update profile');
    }
    return res.json();
  },
  getBookmarks: async () => {
    const res = await fetch(`${BASE_URL}/users/me/bookmarks`, { headers: await getHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to fetch bookmarks');
    }
    return res.json();
  },
  removeBookmark: async (recipeId: string) => {
    const res = await fetch(`${BASE_URL}/users/me/bookmarks/${recipeId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to remove bookmark');
    }
    return res.json();
  },

  // Recipes & Search
  getRecipes: async (limit = 10, offset = 0) => {
    const res = await fetch(`${BASE_URL}/recipes?limit=${limit}&offset=${offset}`, { headers: await getHeaders() });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
    }
    return res.json();
  },
  searchRecipes: async (q?: string, tags?: string, ingredients?: string) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (tags) params.append('tags', tags);
    if (ingredients) params.append('ingredients', ingredients);
    const res = await fetch(`${BASE_URL}/recipes/search?${params.toString()}`, { headers: await getHeaders() });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
    }
    return res.json();
  },
  getRecipe: async (id: string) => {
    const res = await fetch(`${BASE_URL}/recipes/${id}`, { headers: await getHeaders() });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${res.status}`);
    }
    return res.json();
  },
  createRecipe: async (data: any) => {
    const res = await fetch(`${BASE_URL}/recipes`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to create recipe');
    }
    return res.json();
  },
  bookmarkRecipe: async (recipeId: string) => {
    const res = await fetch(`${BASE_URL}/recipes/${recipeId}/bookmark`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to bookmark recipe');
    }
    return res.json();
  },

  // Meal Planning
  getMealPlan: async (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const res = await fetch(`${BASE_URL}/meal-plan?${params.toString()}`, { headers: await getHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to fetch meal plan');
    }
    return res.json();
  },
  addPlannedMeal: async (data: { meal_id: string; scheduled_date: string; scheduled_time?: string }) => {
    const res = await fetch(`${BASE_URL}/meal-plan/add`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to add to plan');
    }
    return res.json();
  },
  deletePlannedMeal: async (planId: string) => {
    const res = await fetch(`${BASE_URL}/meal-plan/${planId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete planned meal');
    }
    return res.json();
  },

  // AI & Nutrition
  editRecipeAI: async (data: { recipe_id: string; intended_change: string }) => {
    const res = await fetch(`${BASE_URL}/ai/recipe-edit`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to edit recipe with AI');
    }
    return res.json();
  },
  calculateNutritionAI: async (ingredients: any[]) => {
    const res = await fetch(`${BASE_URL}/ai/nutrition/calculate`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ ingredients }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to calculate nutrition with AI');
    }
    return res.json();
  },

  // Ingredients
  getIngredients: async (q?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('limit', limit.toString());
    const res = await fetch(`${BASE_URL}/ingredients?${params.toString()}`, { headers: await getHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to fetch ingredients');
    }
    return res.json();
  },
};
