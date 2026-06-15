export const getScoreColor = (score: number) => {
  if (score <= 40) return 'bg-[#78350f]'; // Brown
  if (score <= 69) return 'bg-tertiary'; // Orange
  return 'bg-primary'; // Green
};

export const openRecipeDetail = (item: any) => {
  const recipeRaw = item.recipes || item.recipe || item;
  const recipe = Array.isArray(recipeRaw) ? (recipeRaw[0] || {}) : recipeRaw;
  const mealRaw = recipe.meals || recipe.meal || item.meals || item.meal || recipe;
  const meal = Array.isArray(mealRaw) ? (mealRaw[0] || {}) : mealRaw;

  // Bookmarks, planned meals, raw recipes might have different id fields
  const recipeId = recipe.id || item.recipe_id || meal.recipe_id || meal.id;
  
  if (!recipeId) return;

  const normalizedRecipe = {
    id: recipeId,
    meal_id: meal.id,
    name: meal.title || recipe.name || recipe.title || 'Untitled',
    description: meal.description || recipe.description || '',
    time: meal.preparation_time ? `${meal.preparation_time} min` : recipe.time || '',
    difficulty: meal.difficulty || recipe.difficulty || 'Medium',
    budget: meal.budget || recipe.budget || 'Mid-range',
    score: meal.balanced_level_score || recipe.score || 0,
    is_ai_generated: recipe.is_ai_generated || false,
    image: meal.image_url || recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    tags: Array.isArray(meal.tags) ? meal.tags : (typeof meal.tags === 'string' ? meal.tags.split(',') : (meal.tags || recipe.tags || [])),
    nutrition: recipe.nutrition || { protein: 0, fat: 0, carbs: 0, fiber: 0, iron: 0, vitC: 0 },
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    cookware: recipe.cookware || []
  };

  window.dispatchEvent(new CustomEvent('select-recipe', { detail: normalizedRecipe }));
};
