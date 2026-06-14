import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X, Loader2, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { api } from '../api';
import AddToPlanModal from './AddToPlanModal';

interface SearchScreenProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

export default function SearchScreen({ onSelectRecipe }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Plan Modal state
  const [planMeal, setPlanMeal] = useState<{ id: string, name: string } | null>(null);
  
  // Ingredient search state
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [ingredientSuggestions, setIngredientSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestedIngredients = [
    'Onion', 'Tomato', 'Palm oil', 
    'Garlic', 'Ginger', 'Crayfish', 
    'Beef', 'Chicken', 'Plantain'
  ];

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      // Combine manual search query with selected ingredients
      const ingredientTags = selectedIngredients.map(i => i.name).join(',');
      const data = await api.searchRecipes(searchQuery, undefined, ingredientTags);
      
      const mapped: Recipe[] = data.map((item: any) => {
        const meal = item;
        const recipesRaw = item.recipes || item.recipe || [];
        const recipe = Array.isArray(recipesRaw) ? (recipesRaw[0] || item) : recipesRaw;
        
        return {
          id: recipe.id || item.id,
          meal_id: meal.id || item.meal_id,
          name: meal.title || recipe.name || item.title || 'Untitled',
          description: meal.description || recipe.description || '',
          image: meal.image_url || meal.image || recipe.image_url || recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
          time: `${recipe.cook_time || 0} min`,
          difficulty: recipe.difficulty || 'Medium',
          budget: 'Mid-range',
          score: meal.balanced_level_score || recipe.score || 0,
          tags: Array.isArray(meal.tags) ? meal.tags : (typeof meal.tags === 'string' ? meal.tags.split(',') : (recipe.tags || [])),
          nutrition: recipe.nutrition || { protein: 0, fat: 0, carbs: 0, fiber: 0, iron: 0, vitC: 0 },
          ingredients: (recipe.recipe_ingredients || recipe.ingredients || []).map((ri: any) => {
            const ingRaw = ri.ingredients || ri.ingredient || {};
            const ing = Array.isArray(ingRaw) ? (ingRaw[0] || {}) : ingRaw;
            return {
              id: ri.ingredient_id || ri.id || Math.random().toString(),
              name: ing.name || ri.name || 'Unknown',
              quantity: ri.measurement_value || ri.quantity || '',
              metric: ri.metric_equivalent || ri.metric,
              isEssential: ri.is_essential
            };
          }),
          steps: recipe.steps || []
        };
      });
      // Limit to 5 results as requested
      setResults(mapped.slice(0, 5));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection failed. Please check the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Ingredient suggestion logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (ingredientQuery.length < 2) {
        setIngredientSuggestions([]);
        return;
      }
      try {
        const data = await api.getIngredients(ingredientQuery);
        // Filter out already selected ingredients
        const filtered = data.filter((item: any) => !selectedIngredients.some(si => si.id === item.id));
        setIngredientSuggestions(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [ingredientQuery, selectedIngredients]);

  // Main search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedIngredients]);

  // Outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addIngredient = (ingredient: any) => {
    if (!selectedIngredients.some(i => i.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setIngredientQuery('');
    setIngredientSuggestions([]);
    setShowSuggestions(false);
  };

  const removeIngredient = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== id));
  };

  const toggleTag = async (tagName: string) => {
    // If tag exists in selectedIngredients, remove it
    const existing = selectedIngredients.find(i => i.name.toLowerCase() === tagName.toLowerCase());
    if (existing) {
      removeIngredient(existing.id);
      return;
    }

    // Otherwise, try to find a real ingredient ID from the API first
    try {
      setLoading(true);
      const results = await api.getIngredients(tagName, 5);
      // Find the best match
      const bestMatch = results.find((r: any) => r.name.toLowerCase() === tagName.toLowerCase()) || results[0];
      
      if (bestMatch) {
        addIngredient(bestMatch);
      } else {
        // Fallback to mock ID if no match found (though unlikely for suggested tags)
        addIngredient({ id: `tag-${tagName}`, name: tagName });
      }
    } catch (err) {
      console.warn('Failed to resolve ingredient tag:', err);
      addIngredient({ id: `tag-${tagName}`, name: tagName });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 40) return 'bg-[#78350f]'; // Brown
    if (score <= 69) return 'bg-tertiary'; // Orange
    return 'bg-primary'; // Green
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 border-b border-surface-container/30">
        <h1 className="font-headline text-2xl font-bold text-secondary">Search</h1>
      </header>

      <div className="pt-28 px-6 space-y-10">
        {/* Main Search Bar (Moved Up) */}
        <div className="relative group">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            className="w-full bg-white border-none rounded-full py-5 pl-14 pr-6 shadow-xl shadow-black/[0.03] focus:ring-2 focus:ring-primary/10 text-sm placeholder:text-on-surface-variant/40" 
            placeholder="Search by meal name..." 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Ingredient Search Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-lg font-bold text-primary">Search by ingredient</h2>
          </div>

          <div className="relative" ref={suggestionsRef}>
            <div className="border-b-2 border-surface-container-high py-2 relative group">
              <input 
                className="w-full bg-transparent border-none outline-none text-xl font-headline placeholder:text-on-surface-variant/20 italic" 
                placeholder="Enter ingredient here..." 
                type="text" 
                value={ingredientQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setIngredientQuery(e.target.value);
                  setShowSuggestions(true);
                }}
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                 <Plus className={`text-primary transition-transform duration-300 ${ingredientQuery ? 'rotate-45 opacity-0' : 'opacity-20'}`} size={24} />
              </div>
              
              {/* Live Search Popup */}
              <AnimatePresence>
                {showSuggestions && ingredientSuggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 right-0 top-full mt-4 bg-white rounded-3xl shadow-2xl border border-surface-container/30 overflow-hidden z-[60] max-h-64 overflow-y-auto"
                  >
                    {ingredientSuggestions.map((ing) => (
                      <button
                        key={ing.id}
                        onClick={() => addIngredient(ing)}
                        className="w-full px-6 py-4 text-left hover:bg-surface-container/20 flex justify-between items-center transition-colors border-b border-surface-container/10 last:border-none"
                      >
                        <span className="font-bold text-on-surface">{ing.name}</span>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant opacity-40">{ing.category}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Ingredients Tags */}
            <div className="flex flex-wrap gap-2 mt-6">
              <AnimatePresence>
                {selectedIngredients.map((ing) => (
                  <motion.span 
                    key={ing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-primary/5 text-primary border border-primary/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 group hover:bg-primary hover:text-white transition-all cursor-default"
                  >
                    {ing.name}
                    <button 
                      onClick={() => removeIngredient(ing.id)}
                      className="hover:scale-125 transition-transform"
                    >
                      <X size={14} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {selectedIngredients.length === 0 && (
                <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-widest mt-2">No ingredients selected</span>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Ingredients */}
        <div className="space-y-4 pt-4 border-t border-surface-container/30">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-40">Suggested</h3>
          <div className="grid grid-cols-3 gap-2">
            {suggestedIngredients.map((tag) => {
              const isSelected = selectedIngredients.some(i => i.name.toLowerCase() === tag.toLowerCase());
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white text-on-surface-variant border border-surface-container/50 hover:border-primary/20'}`}
                >
                  <span className="truncate">{tag}</span>
                  {isSelected ? <X size={12} className="shrink-0" /> : <Plus size={12} className="opacity-20 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="px-6 mt-12 max-w-7xl mx-auto">
        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {error ? (
          <div className="bg-error-container/20 text-error p-6 rounded-3xl text-center border border-error/10">
            <p className="font-bold mb-2">Connection Issue</p>
            <p className="text-sm opacity-70 mb-4">{error}</p>
            <button 
              onClick={() => handleSearch()}
              className="text-sm font-headline font-bold underline underline-offset-4"
            >
              Try Reconnecting
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                onClick={() => onSelectRecipe(recipe)}
                className="cursor-pointer group"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-surface-container-high mb-4 shadow-lg">
                  <img src={recipe.image} referrerPolicy="no-referrer" alt={recipe.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`${getScoreColor(recipe.score)} text-white px-3 py-1 rounded-full font-bold text-[11px] shadow-lg`}>{recipe.score}/100</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlanMeal({ id: recipe.meal_id || recipe.id, name: recipe.name });
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm bg-white/70 text-primary hover:bg-primary hover:text-white"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <h4 className="font-headline text-xl font-bold text-primary group-hover:text-secondary transition-colors">{recipe.name}</h4>
              </motion.div>
            ))}
          </div>
        ) : (
          !loading && <p className="text-center text-on-surface-variant py-10 italic">No meals found matching your criteria.</p>
        )}
      </main>

      <AnimatePresence>
        {planMeal && (
          <AddToPlanModal
            mealId={planMeal.id}
            mealName={planMeal.name}
            onClose={() => setPlanMeal(null)}
            onSuccess={() => {
              // Optional: show a global toast or similar
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
