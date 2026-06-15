import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Lock, Info, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Recipe } from '../types';
import { useState, useEffect } from 'react';
import { api } from '../api';

interface AIEditorProps {
  recipe: Recipe;
  onBack: () => void;
}

export default function AIEditor({ recipe: initialRecipe, onBack }: AIEditorProps) {
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFullIfNeeded = async () => {
      // If we already have ingredients, skip
      if (initialRecipe.ingredients && initialRecipe.ingredients.length > 0) {
        setRecipe(initialRecipe);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getRecipe(initialRecipe.id);
        const meal = data.meals || {};
        const nutrients = data.nutrient_profiles || {};

        const mapped: Recipe = {
          ...initialRecipe,
          id: data.id,
          name: meal.title || initialRecipe.name,
          score: meal.balanced_level_score || initialRecipe.score,
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
        console.error('Failed to fetch ingredients for editor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullIfNeeded();
  }, [initialRecipe.id]);

  const handleToggleIngredient = (ingredientName: string) => {
    if (loading || isSaving || isAnalyzing) return;

    const isRemoving = !removedIngredients.includes(ingredientName);
    const newRemoved = isRemoving 
      ? [...removedIngredients, ingredientName]
      : removedIngredients.filter(name => name !== ingredientName);
    
    setRemovedIngredients(newRemoved);
    setHasAnalyzed(false); // Selection changed, needs re-analysis
  };

  const handleAnalyze = async () => {
    if (removedIngredients.length === 0) {
      setAiResponse(null);
      setHasAnalyzed(true);
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      const data = await api.editRecipeAI({
        recipe_id: recipe.id,
        intended_change: `remove ${removedIngredients.join(', ')}`
      });

      if (data.is_valid === false) {
        setError(data.validation_error || 'Fundamentally changing this dish is not allowed.');
        setAiResponse(null);
      } else {
        setAiResponse(data);
        setHasAnalyzed(true);
      }
    } catch (err) {
      console.error(err);
      setError('The AI chef is busy. Please try again in a moment.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRevision = async () => {
    if (!aiResponse) return;
    try {
      setIsSaving(true);
      setError(null);
      
      const payload = {
        title: `${recipe.name} (AI Modified)`,
        description: `An AI-optimized version of ${recipe.name}.\n\n--- AI INSIGHTS ---\n\n${JSON.stringify(aiResponse.insights || [])}`,
        image_url: recipe.image,
        parent_recipe_id: recipe.id,
        tags: recipe.tags, // Array of strings is expected by backend now
        duration_minutes: aiResponse.new_time || parseInt(recipe.time),
        ingredients: recipe.ingredients
          .filter(ing => !removedIngredients.includes(ing.name))
          .map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            is_essential: ing.isEssential
          })),
        steps: aiResponse.adjusted_steps || recipe.steps,
        cookware: aiResponse.adjusted_cookware || recipe.cookware || [],
        is_custom: true,
        balanced_level_score: aiResponse.new_score,
        protein_grams: aiResponse.macro_shift?.new_protein_g,
        carb_grams: aiResponse.macro_shift?.new_carb_g,
        fat_grams: aiResponse.macro_shift?.new_fat_g,
      };

      const result = await api.createRecipe(payload);
      if (result.meal_id && result.recipe_id) {
        setIsSaved(true);
        setTimeout(() => {
          onBack(); 
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save your revision. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl h-20 flex items-center justify-center px-6 border-b border-surface-container/30">
        {/* Floating Context Pill (Centered) */}
        <div className="bg-surface-container/60 backdrop-blur-md px-7 py-3 rounded-full flex items-center gap-3 border border-surface-container/50 shadow-md transition-all">
          <span className="text-xs md:text-base font-medium text-on-surface-variant line-clamp-1 whitespace-nowrap">Editing: <span className="font-bold text-primary">{recipe.name}</span> 🍳</span>
        </div>
      </header>

      <main className="mt-28 px-6 flex flex-col gap-10 max-w-lg mx-auto relative">
        {/* Focused Analysis Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-0 bottom-[40%] bg-surface/80 backdrop-blur-[2px] z-40 rounded-3xl pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Status/Error Banner */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-error-container text-on-error-container p-5 rounded-2xl flex gap-4 items-start border border-error shadow-sm"
            >
              <AlertTriangle className="text-error shrink-0" size={20} />
              <p className="text-sm font-medium leading-relaxed italic">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ingredients Section */}
        <section className="flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-headline text-3xl font-bold text-primary">Current Ingredients</h2>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant/40 mb-4 px-1">
             <Lock size={12} />
             <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Essential ingredients cannot be removed</span>
          </div>

          <div className="flex flex-col gap-3">
            {recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ing, i) => {
                const isRemoved = removedIngredients.includes(ing.name);
                return (
                  <motion.div 
                    key={ing.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white p-5 rounded-2xl flex items-center justify-between border shadow-sm ${isRemoved ? 'border-primary/20 opacity-80' : 'border-surface-container/30'}`}
                  >
                    <div className={`flex flex-col ${isRemoved ? 'opacity-40' : ''}`}>
                      <span className={`font-semibold ${isRemoved ? 'line-through' : ''}`}>{ing.name}</span>
                      <span className="text-xs text-on-surface-variant opacity-60 font-data font-bold uppercase tracking-wider">{ing.quantity}</span>
                    </div>
                    
                    {ing.isEssential ? (
                      <div className="bg-surface-container/50 p-2 rounded-lg">
                        <Lock size={18} className="text-on-surface-variant/40" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        {isRemoved && <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Removed</span>}
                        <button 
                          onClick={() => handleToggleIngredient(ing.name)}
                          disabled={loading || isAnalyzing}
                          className={`w-12 h-7 rounded-full relative flex items-center px-1 transition-all ${isRemoved ? 'bg-surface-container' : 'bg-primary'}`}
                        >
                          <motion.div 
                            animate={{ x: isRemoved ? 0 : 20 }}
                            className="w-5 h-5 bg-white rounded-full shadow-sm" 
                          />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : !loading && (
              <div className="bg-surface-container/20 p-12 rounded-3xl border-2 border-dashed border-surface-container-high text-center">
                <p className="text-on-surface-variant italic text-sm">No ingredients found for this meal.</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Insight Panel or Placeholder */}
        <div className="relative z-50">
          <AnimatePresence mode="wait">
            {aiResponse ? (
              <motion.section 
                key="insights"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border-l-[6px] border-primary p-7 shadow-xl shadow-black/[0.03] overflow-hidden relative border border-surface-container/30"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline italic text-primary text-xl flex items-center gap-3">
                      <Sparkles size={20} fill="currentColor" className="text-primary" />
                      AI Transformation
                    </h3>
                    <span className="font-data text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Analysis complete</span>
                  </div>
                  
                  <div className="flex flex-col gap-4 text-on-surface-variant text-sm leading-relaxed">
                    {aiResponse.insights?.map((insight: string, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                        <p className="font-medium">{insight}</p>
                      </div>
                    ))}
                    <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                      <p className="opacity-80">Adjusted cooking time: <span className="font-bold text-on-surface font-data">{aiResponse.new_time} min</span>.</p>
                    </div>
                  </div>
                  
                  <div className="bg-background/50 p-5 rounded-2xl mt-2 border border-surface-container/30 shadow-inner">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] block mb-3 opacity-60">Balanced Level Shift</span>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant/40 mb-1">Original</span>
                        <span className="font-data text-2xl font-bold text-on-surface-variant/30 line-through leading-none">{recipe.score}</span>
                      </div>
                      <ArrowRight className="text-primary/40" size={20} />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-secondary mb-1">New Score</span>
                        <span className="font-data text-4xl font-bold text-secondary leading-none">
                          {aiResponse.new_score}
                          <span className="text-sm opacity-50 ml-0.5">/100</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-surface-container/5 rounded-3xl p-12 border-2 border-dashed border-primary/5 flex flex-col items-center text-center gap-5"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md ring-4 ring-primary/5 text-primary/30">
                  <Sparkles size={40} />
                </div>
                <div className="max-w-[200px]">
                  <h3 className="font-headline text-xl font-bold text-primary/40">Magic awaits</h3>
                  <p className="text-xs text-on-surface-variant/50 mt-1.5 leading-relaxed italic">Remove an ingredient to see real-time AI insights</p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm rounded-3xl"
            >
              <div className="relative">
                <Loader2 className="animate-spin text-primary" size={48} />
                <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-50" />
              </div>
              <p className="font-headline italic text-primary animate-pulse text-sm">Consulting the digital chef...</p>
            </motion.div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <div className="relative">
              <Loader2 className="animate-spin text-primary" size={40} />
              <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-50" />
            </div>
            <p className="font-headline italic text-primary animate-pulse text-sm">Consulting the digital chef...</p>
          </div>
        )}

        {aiResponse && (
          <div className="flex gap-4 w-full h-48">
            <div className="w-3/5 relative rounded-3xl overflow-hidden shadow-lg border border-white/20">
              <img 
                alt={recipe.name} 
                className="w-full h-full object-cover grayscale opacity-60" 
                referrerPolicy="no-referrer"
                src={recipe.image} 
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg">AI Generated Revision</span>
              </div>
            </div>
            <div className="w-2/5 bg-surface-container shadow-sm border border-surface-container-high rounded-3xl p-5 flex flex-col justify-between">
                <div>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-on-surface-variant opacity-60">Macro Shift</span>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-white rounded-full border border-black/5">
                      <div className="h-full bg-primary" style={{ width: `${aiResponse.test_macros?.protein_percentage || aiResponse.macro_shift?.protein_percentage || 30}%` }} />
                    </div>
                    <span className="text-[9px] font-bold font-data text-primary">PRO {aiResponse.test_macros?.protein_percentage || aiResponse.macro_shift?.protein_percentage || '??'}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-white rounded-full border border-black/5">
                      <div className="h-full bg-secondary" style={{ width: `${aiResponse.test_macros?.fat_percentage || aiResponse.macro_shift?.fat_percentage || 50}%` }} />
                    </div>
                    <span className="text-[9px] font-bold font-data text-secondary">FAT {aiResponse.test_macros?.fat_percentage || aiResponse.macro_shift?.fat_percentage || '??'}%</span>
                  </div>
                </div>
              </div>
              <Info size={18} className="self-end text-primary opacity-40" />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 w-full glass-nav z-50 h-28 px-6 flex items-center gap-4 border-t border-surface-container/20">
        <button 
          onClick={onBack}
          disabled={isAnalyzing || isSaving}
          className="flex-1 bg-white text-on-surface font-bold text-xs py-5 rounded-2xl shadow-sm border border-surface-container-high/50 active:scale-95 transition-transform uppercase tracking-widest disabled:opacity-50"
        >
          Discard
        </button>
        
        {hasAnalyzed ? (
          <button 
            onClick={handleSaveRevision}
            disabled={!aiResponse || loading || isSaving || isAnalyzing || isSaved}
            className={`flex-[1.8] font-bold text-xs py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3 ${
              isSaved ? 'bg-secondary text-white' : 'vibrant-gradient text-white shadow-primary/20 disabled:opacity-30'
            }`}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : isSaved ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Sparkles size={18} fill="currentColor" />
                Saved to Profile!
              </motion.div>
            ) : (
              <Sparkles size={18} fill="currentColor" />
            )}
            {!isSaving && !isSaved && 'Save AI Revision'}
            {isSaving && 'Crafting Revision...'}
          </button>
        ) : (
          <button 
            onClick={handleAnalyze}
            disabled={removedIngredients.length === 0 || loading || isAnalyzing || isSaving}
            className="flex-[1.8] bg-primary text-white font-bold text-xs py-5 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-transform uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} fill="currentColor" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Changes'}
          </button>
        )}
      </footer>
    </div>
  );
}
