import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Search, Plus, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Recipe, Screen } from '../types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import AddToPlanModal from './AddToPlanModal';
import { openRecipeDetail } from '../utils';

interface DiscoveryFeedProps {
  onNavigate: (screen: Screen) => void;
}

const PAGE_SIZE = 10;

const RecipeSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-container animate-pulse" />
    <div className="h-6 w-3/4 bg-surface-container rounded animate-pulse" />
  </div>
);

export default function DiscoveryFeed({ onNavigate }: DiscoveryFeedProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [planMeal, setPlanMeal] = useState<{ id: string, name: string } | null>(null);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapApiData = useCallback((data: any[]) => {
    return data.map((item: any) => {
      const mealRaw = item.meals || item.meal || {};
      const meal = Array.isArray(mealRaw) ? (mealRaw[0] || {}) : mealRaw;
      const nutrientsRaw = item.nutrient_profiles || item.nutrient_profile || {};
      const nutrients = Array.isArray(nutrientsRaw) ? (nutrientsRaw[0] || {}) : nutrientsRaw;
      
      return {
        id: item.id,
        meal_id: meal.id || item.meal_id,
        name: meal.title || item.title || 'Untitled',
        description: meal.description || item.description || '',
        image: meal.image_url || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
        time: `${meal.duration_minutes || 0} min`,
        difficulty: meal.difficulty || 'Medium',
        budget: meal.budget || 'Mid-range',
        score: meal.balanced_level_score || 0,
        tags: Array.isArray(meal.tags) ? meal.tags : (typeof meal.tags === 'string' ? meal.tags.split(',') : (meal.tags || [])),
        nutrition: {
          protein: nutrients.protein_grams || 0,
          fat: nutrients.fat_grams || 0,
          carbs: nutrients.carb_grams || 0,
          fiber: nutrients.fiber_g || 0,
          iron: nutrients.iron_mg || 0,
          vitC: nutrients.vitamin_c_mg || 0,
        },
        ingredients: (item.recipe_ingredients || []).map((ri: any) => ({
          id: ri.ingredient_id || Math.random().toString(),
          name: ri.ingredients?.name || 'Unknown',
          quantity: ri.measurement_value || `${ri.quantity || ''} ${ri.unit || ''}`.trim(),
          metric: ri.metric_equivalent,
          isEssential: ri.is_essential
        })),
        steps: item.steps || []
      } as Recipe;
    });
  }, []);

  const fetchRecipes = async (currentOffset: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (currentOffset === 0) setLoading(true);
      else setLoadingMore(true);

      const data = await api.getRecipes(PAGE_SIZE, currentOffset);
      const mapped = mapApiData(data);

      if (isRefresh) {
        setRecipes(mapped);
        setOffset(PAGE_SIZE);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setRecipes(prev => {
          const combined = currentOffset === 0 ? mapped : [...prev, ...mapped];
          // Prevent duplicates by ID
          const unique = Array.from(new Map(combined.map(r => [r.id, r])).values());
          return unique;
        });
        setOffset(currentOffset + PAGE_SIZE);
        setHasMore(data.length === PAGE_SIZE);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes(0);
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchRecipes(offset);
      }
    }, { threshold: 0.1 });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, offset]);

  // Pull to refresh logic - check parent scrollable container
  const handleDragEnd = (_: any, info: any) => {
    const parent = containerRef.current?.parentElement;
    const isAtTop = parent ? parent.scrollTop <= 0 : true;
    
    if (isAtTop && info.offset.y > 80 && !refreshing) {
      fetchRecipes(0, true);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen relative pb-32">
      {/* Pull to refresh indicator */}
      <motion.div 
        style={{ top: refreshing ? 90 : -50 }}
        className="fixed left-1/2 -translate-x-1/2 z-[60] bg-white shadow-xl rounded-full p-2 flex items-center justify-center text-primary"
        animate={{ rotate: refreshing ? 360 : 0 }}
        transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: "linear" }}
      >
        <RefreshCw size={24} />
      </motion.div>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl fixed top-0 w-full max-w-md left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-6 h-20 border-b border-surface-container/30">
        <h1 className="text-2xl font-headline font-bold text-secondary">Discovery Feed</h1>
        <button 
          onClick={() => onNavigate('search')}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/50 hover:bg-surface-container-high transition-colors text-primary"
        >
          <Search size={22} />
        </button>
      </header>

      {/* Main Content */}
      <main 
        className="px-6 pt-24 pb-8 max-w-7xl mx-auto"
      >
        {/* Pull trigger area */}
        <motion.div 
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDragEnd={handleDragEnd}
          className="h-10 -mt-10 mb-4 flex justify-center items-center overflow-visible"
        >
          {!refreshing && <RefreshCw size={16} className="text-primary/20" />}
        </motion.div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center">
            <p>{error}</p>
            <button 
              onClick={() => fetchRecipes(0)}
              className="mt-2 text-sm font-bold underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-gutter">
              {recipes.map((recipe, index) => (
                <motion.article
                  key={`${recipe.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % PAGE_SIZE) * 0.05 }}
                  onClick={() => openRecipeDetail(recipe)}
                  className="flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-container-high shadow-sm group-hover:shadow-md transition-shadow">
                    <img
                      alt={recipe.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      src={recipe.image}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    
                    <div className="absolute bottom-3 left-3 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-on-surface flex items-center gap-1.5 shadow-sm">
                      <Clock size={14} className="text-on-surface-variant" />
                      <span className="text-xs font-data font-bold">{recipe.time}</span>
                    </div>

                    {recipe.is_ai_generated && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md uppercase tracking-widest border border-white/20">
                        AI
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanMeal({ id: recipe.meal_id || recipe.id, name: recipe.name });
                      }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm bg-white/70 text-primary hover:bg-primary hover:text-white"
                    >
                      <Plus size={22} />
                    </button>
                  </div>
                  <h2 className="text-xl font-headline font-semibold text-on-surface leading-tight pr-4 group-hover:text-primary transition-colors line-clamp-2">
                    {recipe.name}
                  </h2>
                </motion.article>
              ))}
            </div>

            {/* Skeletons for Loading More */}
            {loadingMore && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 mt-10">
                {Array.from({ length: 4 }).map((_, i) => (
                  <RecipeSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}

            {/* Pagination Sentinel */}
            {hasMore && !loadingMore && (
              <div ref={loaderRef} className="h-20 flex items-center justify-center mt-8">
                <Loader2 className="animate-spin text-primary/40" size={24} />
              </div>
            )}

            {!hasMore && recipes.length > 0 && (
              <p className="text-center text-on-surface-variant/40 font-medium py-10 mt-10 border-t border-surface-container/30 italic">
                You've reached the end of the harvest.
              </p>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {planMeal && (
          <AddToPlanModal
            mealId={planMeal.id}
            mealName={planMeal.name}
            onClose={() => setPlanMeal(null)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
