import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Bookmark, Clock, BarChart3 as BarChart, Sparkles, Calendar as CalendarToday, ChefHat, Loader2, Check, Trash2 } from 'lucide-react';
import { Recipe, Screen } from '../types';
import { api } from '../api';
import AddToPlanModal from './AddToPlanModal';

interface MealDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

type TabType = 'Ingredients' | 'Recipe Steps' | 'Cookware';

export default function MealDetail({ recipe: initialRecipe, onBack, onNavigate, isBookmarked, onToggleBookmark }: MealDetailProps) {
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Ingredients');
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchFullRecipe = async () => {
      try {
        setLoading(true);
        const data = await api.getRecipe(initialRecipe.id);
        const mealRaw = data.meals || data.meal || {};
        const meal = Array.isArray(mealRaw) ? (mealRaw[0] || {}) : mealRaw;
        const nutrientsRaw = data.nutrient_profiles || data.nutrient_profile || meal.nutrient_profiles || meal.nutrient_profile || {};
        const nutrients = Array.isArray(nutrientsRaw) ? (nutrientsRaw[0] || {}) : nutrientsRaw;

        const mapped: Recipe = {
          id: data.id,
          meal_id: meal.id || data.meal_id,
          name: meal.title || data.title || initialRecipe.name,
          description: meal.description || data.description || initialRecipe.description,
          image: meal.image_url || initialRecipe.image,
          time: `${meal.duration_minutes || 0} min`,
          difficulty: meal.difficulty || 'Medium',
          budget: meal.budget || 'Mid-range',
          score: meal.balanced_level_score || initialRecipe.score,
          tags: Array.isArray(meal.tags) ? meal.tags : (typeof meal.tags === 'string' ? meal.tags.split(',') : (meal.tags || [])),
          nutrition: {
            protein: nutrients.protein_grams || 0,
            fat: nutrients.fat_grams || 0,
            carbs: nutrients.carb_grams || 0,
            fiber: nutrients.fiber_g || 0,
            iron: nutrients.iron_mg || 0,
            vitC: nutrients.vitamin_c_mg || 0,
          },
          ingredients: (data.recipe_ingredients || []).map((ri: any) => ({
            id: ri.ingredient_id || Math.random().toString(),
            name: ri.ingredients?.name || 'Unknown',
            quantity: ri.measurement_value || '',
            metric: ri.metric_equivalent,
            isEssential: ri.is_essential
          })),
          steps: data.steps || [],
          cookware: data.cookware || []
        };
        setRecipe(mapped);
      } catch (err) {
        console.error('Failed to fetch full recipe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullRecipe();
  }, [initialRecipe.id]);

  const n = recipe.nutrition || { protein: 0, fat: 0, carbs: 0 };

  const nutritionItems = [
    { label: 'Protein', value: `${n.protein}g`, color: 'bg-primary' },
    { label: 'Fat', value: `${n.fat}g`, color: 'bg-secondary' },
    { label: 'Carbs', value: `${n.carbs}g`, color: 'bg-tertiary' },
  ];

  const handleBookmark = async () => {
    try {
      setIsBookmarking(true);
      await onToggleBookmark();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleAddToPlan = () => {
    setShowPlanModal(true);
  };

  const handleDeleteAiRecipe = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsBookmarking(true); // Reusing this for loading state
      const id = recipe.recipe_id || recipe.id;
      if (id) {
        await api.deleteRecipe(id);
        window.dispatchEvent(new CustomEvent('bookmarks-updated')); // Trick to refresh profiles
        onBack();
      }
    } catch (err) {
      console.error(err);
      setIsBookmarking(false);
      setShowDeleteConfirm(false);
    }
  };

  const delimiter = '\n\n--- AI INSIGHTS ---\n\n';
  let mainDescription = recipe.description || '';
  let aiInsights: null | string[] = null;

  if (mainDescription.includes(delimiter)) {
    const parts = mainDescription.split(delimiter);
    mainDescription = parts[0];
    try {
      aiInsights = JSON.parse(parts[1]);
    } catch (e) {
      console.warn('Failed to parse AI insights', e);
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
          alt={recipe.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          src={recipe.image}
        />
        {/* Top Action Bar */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 pt-12 z-20">
          <button
            onClick={onBack}
            className="w-11 h-11 bg-white/50 backdrop-blur-xl rounded-full flex items-center justify-center text-primary active:scale-95 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={recipe.is_ai_generated ? undefined : handleBookmark}
            disabled={isBookmarking || recipe.is_ai_generated}
            className={`w-11 h-11 backdrop-blur-xl rounded-full flex items-center justify-center transition-all ${recipe.is_ai_generated ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed opacity-50 grayscale' : isBookmarked ? 'bg-primary text-white shadow-lg scale-105 active:scale-95' : 'bg-white/50 text-primary active:scale-95 disabled:opacity-50'}`}
          >
            {isBookmarking ? <Loader2 className="animate-spin" size={20} /> : <Bookmark size={22} fill={!recipe.is_ai_generated && isBookmarked ? "currentColor" : "none"} />}
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative px-6 -mt-20 z-10">
        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-7 mb-6 shadow-sm border border-surface-container/30"
        >
          <h1 className="font-headline text-3xl font-bold text-primary mb-1">{recipe.name}</h1>
          <p className="text-black text-sm mb-4">{mainDescription}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Clock, label: recipe.time },
              { icon: BarChart, label: recipe.difficulty },
            ].map(({ icon: Icon, label }, i) => (
              <span key={`meta-${i}`} className="px-4 py-1.5 rounded-full flex items-center gap-1.5 bg-background">
                <Icon size={14} className="text-primary/60" />
                <span className="text-sm font-semibold">{label}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {aiInsights && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 rounded-3xl p-6 mb-6 border border-primary/20 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-primary" size={20} />
              <h2 className="font-headline font-bold text-primary text-lg">AI Editor Insights</h2>
            </div>
            <ul className="space-y-3">
              {aiInsights.map((insight, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface">
                  <span className="text-primary/50 mt-1 shrink-0">•</span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Nutrition Info Card */}
        <section className="bg-white rounded-3xl p-6 mb-8 shadow-md border border-surface-container/30">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-xl font-bold text-primary">Nutrition info</h2>
            <button 
              onClick={() => onNavigate('breakdown')}
              className="text-sm font-bold text-secondary hover:underline"
            >
              View all &gt;
            </button>
          </div>
          <div className="flex items-center gap-8">
            {/* Donut Chart Mockup */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-background" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="10" />
                <circle className="text-primary" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.6" strokeDashoffset="120" strokeLinecap="round" strokeWidth="10" />
                <circle className="text-secondary" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.6" strokeDashoffset="220" strokeLinecap="round" strokeWidth="10" />
                <circle className="text-tertiary" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeDasharray="301.6" strokeDashoffset="270" strokeLinecap="round" strokeWidth="10" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-data text-2xl font-bold text-primary leading-none">{recipe.score}</span>
                <span className="font-data text-[10px] font-bold text-on-surface-variant">/100</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1 flex flex-col gap-3">
              {nutritionItems.map((item, i) => (
                <div key={`nut-${i}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="font-data text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="bg-background/80 backdrop-blur-md -mx-6 px-6 py-4 sticky top-0 z-40 border-b border-surface-container/20 mb-8 flex justify-center">
          <div className="flex gap-1 p-1 bg-surface-container/10 rounded-full w-full max-w-[calc(100vw-3rem)] md:max-w-md overflow-x-auto hide-scrollbar flex-nowrap">
            {(['Ingredients', 'Recipe Steps', 'Cookware'] as TabType[]).map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2.5 rounded-full font-bold text-[13px] transition-all relative whitespace-nowrap min-w-fit ${
                  activeTab === tab 
                    ? 'text-white' 
                    : 'text-on-surface-variant/70 hover:text-primary transition-colors'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-secondary rounded-full -z-10 shadow-lg shadow-secondary/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Animated Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'Ingredients' && (
              <motion.section
                key="ingredients"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="mb-10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline text-2xl font-bold text-primary">Ingredients</h3>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-10 gap-4">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-on-surface-variant font-bold">Loading harvest...</p>
                    </div>
                  ) : recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ing) => (
                      <div key={ing.id} className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm border border-surface-container/30">
                        <div className="flex items-center gap-4">
                          <span className="font-headline font-bold text-on-surface">{ing.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-data text-primary font-bold">{ing.quantity}</p>
                          {ing.metric && <p className="text-xs text-on-surface-variant/60 font-medium">{ing.metric}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-on-surface-variant p-10 text-center bg-white rounded-3xl border border-dashed">Ingredient list coming soon...</p>
                  )}
                </div>
              </motion.section>
            )}

            {activeTab === 'Recipe Steps' && (
              <motion.section
                key="steps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-20"
              >
                <h3 className="font-headline text-2xl font-bold text-primary mb-8">Preparation Steps</h3>
                <div className="space-y-10">
                  {recipe.steps.length > 0 ? (
                    recipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-6">
                        <span className="font-data text-surface-container-high font-bold shrink-0 text-4xl leading-none">
                          {(i + 1).toString().padStart(2, '0')}
                        </span>
                        <p className="font-sans leading-relaxed text-on-surface">
                          {step}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-on-surface-variant p-10 text-center bg-white rounded-3xl border border-dashed">Preparation steps coming soon...</p>
                  )}
                </div>
              </motion.section>
            )}

            {activeTab === 'Cookware' && (
              <motion.section
                key="cookware"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-20"
              >
                <h3 className="font-headline text-2xl font-bold text-primary mb-8">Essential Cookware</h3>
                <div className="grid grid-cols-2 gap-4">
                  {recipe.cookware && recipe.cookware.length > 0 ? (
                    recipe.cookware.map((item, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 shadow-sm border border-surface-container/30 group hover:border-primary/30 transition-colors">
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <ChefHat size={32} />
                        </div>
                        <span className="font-bold text-on-surface text-center whitespace-nowrap">{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-on-surface-variant p-10 text-center bg-white rounded-3xl border border-dashed">Cookware list coming soon...</div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        <div className="bg-white/80 backdrop-blur-xl rounded-full px-4 py-3 flex items-center gap-3 shadow-xl border border-white/20">
          <button 
            onClick={handleAddToPlan}
            className="flex-1 h-14 primary-gradient text-white rounded-full flex items-center justify-center gap-2 font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            <CalendarToday size={20} />
            Add to Plan
          </button>
          {recipe.is_ai_generated ? (
            <button 
              onClick={handleDeleteAiRecipe}
              className="w-14 h-14 bg-error-container text-error rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md border border-error/20"
            >
              <Trash2 size={24} />
            </button>
          ) : (
            <button 
              onClick={() => onNavigate('editor')}
              className="w-14 h-14 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md border border-surface-container"
            >
              <Sparkles size={24} fill="currentColor" className="text-primary" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPlanModal && (
          <AddToPlanModal
            mealId={recipe.meal_id || recipe.id}
            mealName={recipe.name}
            onClose={() => setShowPlanModal(false)}
            onSuccess={() => {}}
          />
        )}
        
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative z-50"
            >
              <h3 className="font-headline text-xl font-bold text-on-surface mb-2">Delete Recipe?</h3>
              <p className="text-on-surface-variant text-sm mb-6">Are you sure you want to delete this custom recipe? This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isBookmarking}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-error text-white hover:bg-error/90 transition-colors shadow-md flex justify-center items-center gap-2"
                >
                  {isBookmarking && <Loader2 size={16} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
