
import { getSupabase } from './lib/supabase';
import { logger } from './lib/logger';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || 'https://swello-backend.onrender.com';

const getHeaders = async () => {
  let token = null;
  try {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    token = session?.access_token;
  } catch (err) {
    logger.warn('Could not get session token (Supabase not initialized):', err);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    'Accept-Language': localStorage.getItem('i18nextLng') || 'en',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async (res: Response, defaultError: string) => {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || defaultError);
  }
  return res.json();
};
export const api = {
  // User & Profile
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/users/me`, { headers: await getHeaders() });
    return handleResponse(res, 'Failed to fetch profile');
  },
  getUserRecipes: async () => {
    const res = await fetch(`${BASE_URL}/users/me/recipes`, { headers: await getHeaders() });
    return handleResponse(res, 'Failed to fetch user recipes');
  },
  updateProfile: async (data: { display_name?: string; avatar_url?: string }) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to update profile');
  },
  getBookmarks: async () => {
    const res = await fetch(`${BASE_URL}/users/me/bookmarks`, { headers: await getHeaders() });
    return handleResponse(res, 'Failed to fetch bookmarks');
  },
  removeBookmark: async (recipeId: string) => {
    const res = await fetch(`${BASE_URL}/users/me/bookmarks/${recipeId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(res, 'Failed to remove bookmark');
  },

  // Recipes & Search
  getRecipes: async (limit = 10, offset = 0) => {
    const res = await fetch(`${BASE_URL}/recipes?limit=${limit}&offset=${offset}`, { headers: await getHeaders() });
    return handleResponse(res, `API Error: ${res.status}`);
  },
  searchRecipes: async (q?: string, tags?: string, ingredients?: string) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (tags) params.append('tags', tags);
    if (ingredients) params.append('ingredients', ingredients);
    const res = await fetch(`${BASE_URL}/recipes/search?${params.toString()}`, { headers: await getHeaders() });
    return handleResponse(res, `API Error: ${res.status}`);
  },
  getRecipe: async (id: string) => {
    const res = await fetch(`${BASE_URL}/recipes/${id}`, { headers: await getHeaders() });
    return handleResponse(res, `API Error: ${res.status}`);
  },
  deleteRecipe: async (id: string) => {
    const res = await fetch(`${BASE_URL}/recipes/${id}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(res, 'Failed to delete recipe');
  },
  createRecipe: async (data: any) => {
    const res = await fetch(`${BASE_URL}/recipes`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to create recipe');
  },
  bookmarkRecipe: async (recipeId: string) => {
    const res = await fetch(`${BASE_URL}/recipes/${recipeId}/bookmark`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(res, 'Failed to bookmark recipe');
  },

  // Meal Planning
  getMealPlan: async (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const res = await fetch(`${BASE_URL}/meal-plan?${params.toString()}`, { headers: await getHeaders() });
    return handleResponse(res, 'Failed to fetch meal plan');
  },
  addPlannedMeal: async (data: { meal_id: string; scheduled_date: string; scheduled_time?: string }) => {
    const res = await fetch(`${BASE_URL}/meal-plan/add`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Failed to add to plan');
  },
  deletePlannedMeal: async (planId: string) => {
    const res = await fetch(`${BASE_URL}/meal-plan/${planId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(res, 'Failed to delete planned meal');
  },
  updatePlannedMealStatus: async (planId: string, status: string) => {
    const res = await fetch(`${BASE_URL}/meal-plan/${planId}/status`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res, 'Failed to update planned meal status');
  },

  // AI & Nutrition
  editRecipeAI: async (data: { recipe_id: string; intended_change: string }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch(`${BASE_URL}/ai/recipe-edit`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal
      });
      return handleResponse(res, 'Failed to edit recipe with AI');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('The AI chef took too long to analyze. Please try again.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  calculateNutritionAI: async (ingredients: any[]) => {
    const res = await fetch(`${BASE_URL}/ai/nutrition/calculate`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ ingredients }),
    });
    return handleResponse(res, 'Failed to calculate nutrition with AI');
  },

  // Ingredients
  getIngredients: async (q?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('limit', limit.toString());
    const res = await fetch(`${BASE_URL}/ingredients?${params.toString()}`, { headers: await getHeaders() });
    return handleResponse(res, 'Failed to fetch ingredients');
  },
};
