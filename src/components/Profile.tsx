import { motion } from 'motion/react';
import { Settings, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../api';
import { getSupabase } from '../lib/supabase';
import { getScoreColor } from '../utils';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [editedRecipes, setEditedRecipes] = useState<any[]>([]);
  const [nutritionBalance, setNutritionBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [silentLoading, setSilentLoading] = useState(false);

  // Expose onNavigate globally if props needed OR use an event
  // but Profile is rendered inside App. We should add onNavigate to Profile props.

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!profile) setLoading(true);
        else setSilentLoading(true);

        setError(null);
        const today = new Date().toISOString().split('T')[0];
        const [profileData, bookmarksData, mealPlanData, recipesData] = await Promise.all([
          api.getMe(),
          api.getBookmarks(),
          api.getMealPlan(today, today),
          api.getUserRecipes().catch(() => [])
        ]);
        setProfile(profileData);
        setBookmarks(bookmarksData);
        setEditedRecipes(recipesData || []);
        setNutritionBalance(mealPlanData.weekly_nutrition_balance);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to connect to the Swello server.');
      } finally {
        setLoading(false);
        setSilentLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('bookmarks-updated', handler);
    return () => window.removeEventListener('bookmarks-updated', handler);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const stats = [
    { label: 'Protein', value: `${Math.round(nutritionBalance?.protein_percentage || 0)}%`, color: 'bg-primary' },
    { label: 'Carbs', value: `${Math.round(nutritionBalance?.carb_percentage || 0)}%`, color: 'bg-secondary' },
    { label: 'Fats', value: `${Math.round(nutritionBalance?.fat_percentage || 0)}%`, color: 'bg-tertiary' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Top AppBar */}
      <header className="bg-white/70 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 border-b border-surface-container/30">
        <h1 className="font-headline text-2xl text-secondary font-bold">Profile</h1>
        <div className="flex items-center gap-4">
          {silentLoading && <Loader2 size={16} className="animate-spin text-primary opacity-50" />}
          <button 
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-error transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <LogOut size={22} className="hover:-rotate-12 transition-transform duration-300" />
          </button>
          <Settings className="text-primary cursor-pointer hover:rotate-90 transition-transform duration-500" size={24} />
        </div>
      </header>

      <main className="mt-28 px-6 space-y-12">
        {error && (
          <div className="bg-error-container/20 text-error p-6 rounded-3xl text-center border border-error/10 mb-8">
            <p className="font-bold mb-2">System Notice</p>
            <p className="text-sm opacity-70 mb-4">{error}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest bg-error/10 px-4 py-1.5 rounded-full inline-block">Service Unavailable</p>
          </div>
        )}
        {/* Profile Header */}
        <section className="flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-primary/10 shadow-xl flex items-center justify-center mb-6 ring-4 ring-white">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-headline text-4xl font-bold">
                {profile?.display_name?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <h2 className="font-headline text-3xl text-secondary font-bold mb-1">{profile?.display_name || 'User'}</h2>
          <p className="text-on-surface-variant italic mb-5 opacity-75">Flavorful Cameroonian Journey</p>
          <span className="bg-primary/5 text-primary px-6 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'May 2026'}
          </span>
        </section>

        {/* Today's Nutrition Card */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-surface-container/30">
          <div className="flex justify-between items-baseline mb-8">
            <h3 className="font-headline text-2xl text-secondary font-bold">Today's Nutrition</h3>
          </div>
          
          <div className="space-y-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between font-data text-sm">
                  <span className="text-on-surface font-medium">{stat.label}</span>
                  <span className="font-bold">{stat.value}</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: stat.value }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${stat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t border-surface-container">
            <p className="text-sm text-on-surface-variant">
              Avg Balanced Level today: <span className="font-data text-2xl text-primary align-middle ml-2 font-bold">{Math.round(nutritionBalance?.score || 0)}/100</span>
            </p>
          </div>
        </section>

        {/* Your Recipes Section */}
        <section>
          <h3 className="font-headline text-2xl text-secondary font-bold mb-6">Your Recipes</h3>
          {(bookmarks.length > 0 || editedRecipes.length > 0) ? (
            <div className="grid grid-cols-2 gap-4">
              {[...editedRecipes, ...bookmarks].slice(0, 4).map((item: any, i: number) => {
                const recipeRaw = item.recipes || item.recipe || item;
                const recipe = Array.isArray(recipeRaw) ? (recipeRaw[0] || {}) : recipeRaw;
                const mealRaw = recipe.meals || recipe.meal || item.meals || item.meal || recipe;
                const meal = Array.isArray(mealRaw) ? (mealRaw[0] || {}) : mealRaw;

                return (
                  <div 
                    key={`${recipe.id || meal.id}-${i}`} 
                    className="space-y-3 cursor-pointer group"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('select-recipe', { detail: recipe }));
                    }}
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-surface-container relative shadow-lg">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        referrerPolicy="no-referrer" 
                        src={meal?.image_url || recipe?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'} 
                        alt={meal?.title || recipe?.name} 
                      />
                      <div className={`absolute bottom-4 left-4 ${getScoreColor(meal?.balanced_level_score || recipe?.score || 0)} text-white px-3 py-1.5 rounded-xl text-xs font-data font-bold shadow-md border border-white/10`}>
                        {meal?.balanced_level_score || recipe?.score || 0}/100
                      </div>
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
          ) : (
            <div className="text-center py-10 bg-surface-container/20 rounded-3xl border border-dashed flex flex-col items-center gap-4">
              <p className="text-on-surface-variant italic">No cooked or saved recipes yet.</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }))}
                className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                Add Recipe
              </button>
            </div>
          )}
          {(bookmarks.length + editedRecipes.length) > 4 && (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'your-recipes' }))}
              className="flex items-center mt-8 text-primary font-bold text-sm hover:translate-x-1 transition-transform"
            >
              View all {bookmarks.length + editedRecipes.length} your recipes
              <ArrowRight size={16} className="ml-1" />
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
