import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getScoreColor, openRecipeDetail } from '../utils';
import { api } from '../api';

interface YourRecipesListProps {
  onBack: () => void;
}

let cachedBookmarksData: any[] | null = null;
let cachedEditedData: any[] | null = null;
let lastRecipesFetchTime = 0;

export default function YourRecipesList({ onBack }: YourRecipesListProps) {
  const [bookmarks, setBookmarks] = useState<any[]>(cachedBookmarksData || []);
  const [editedRecipes, setEditedRecipes] = useState<any[]>(cachedEditedData || []);
  const [loading, setLoading] = useState(!cachedBookmarksData);

  const fetchData = async (force = false) => {
    try {
      if (force || !cachedBookmarksData || Date.now() - lastRecipesFetchTime > 60000) {
        if (!cachedBookmarksData) setLoading(true);
        const [bookmarksData, editedData] = await Promise.all([
          api.getBookmarks().catch(() => []),
          api.getUserRecipes().catch(() => [])
        ]);
        cachedBookmarksData = bookmarksData;
        cachedEditedData = editedData;
        lastRecipesFetchTime = Date.now();
        setBookmarks(bookmarksData);
        setEditedRecipes(editedData);
      }
    } catch (err) {
      console.error('Failed to fetch recipes lists', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      lastRecipesFetchTime = 0; // force refetch next time
      fetchData(true);
    };

    window.addEventListener('recipes-updated', handleUpdate);
    window.addEventListener('bookmarks-updated', handleUpdate);
    return () => {
      window.removeEventListener('recipes-updated', handleUpdate);
      window.removeEventListener('bookmarks-updated', handleUpdate);
    };
  }, []);

  const renderRecipeCards = (recipes: any[]) => {
    if (!recipes || recipes.length === 0) {
      return <p className="text-on-surface-variant italic py-6 text-sm">No recipes found.</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {recipes.map((item: any, i: number) => {
          const recipeRaw = item.recipes || item.recipe || item;
          const recipe = Array.isArray(recipeRaw) ? (recipeRaw[0] || {}) : recipeRaw;
          const mealRaw = recipe.meals || recipe.meal || item.meals || item.meal || recipe;
          const meal = Array.isArray(mealRaw) ? (mealRaw[0] || {}) : mealRaw;

          return (
            <div 
              key={`${recipe.id || meal.id}-${i}`} 
              className="space-y-3 cursor-pointer group"
              onClick={() => openRecipeDetail(item)}
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-surface-container relative shadow-lg">
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  referrerPolicy="no-referrer" 
                  src={meal?.image_url || recipe?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'} 
                  alt={meal?.title || recipe?.name} 
                />
                <div className={`absolute bottom-4 left-4 ${getScoreColor(meal?.balanced_level_score || recipe?.score || 0)} px-3 py-1.5 rounded-xl text-xs font-data font-bold text-white shadow-md border border-white/10`}>
                  {meal?.balanced_level_score || recipe?.score || 0}/100
                </div>
                {/* AI Badge inside the image */}
                {recipe?.is_ai_generated && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md uppercase tracking-widest border border-white/20">
                    AI
                  </div>
                )}
              </div>
              <p className="font-headline text-lg text-on-surface font-bold truncate group-hover:text-primary transition-colors">{meal?.title || recipe?.name || 'Untitled'}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 w-full z-50 flex items-center px-6 h-20 border-b border-surface-container/30 shadow-sm gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-headline text-2xl text-secondary font-bold">Your Recipes</h1>
      </header>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <main className="px-6 mt-8 space-y-12">
          <section>
            <h2 className="font-headline text-2xl font-bold text-primary mb-6">Edited Recipes</h2>
            {renderRecipeCards(editedRecipes)}
          </section>

          <section>
            <h2 className="font-headline text-2xl font-bold text-primary mb-6">Saved Recipes</h2>
            {renderRecipeCards(bookmarks)}
          </section>
        </main>
      )}
    </div>
  );
}
