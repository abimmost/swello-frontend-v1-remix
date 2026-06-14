import { motion } from 'motion/react';
import { Calendar as CalendarIcon, CheckCircle, PlusCircle, Utensils as Restaurant, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to extract a display time from a timestamptz string.
// Returns null if the time is midnight (00:00) — meaning no time was set.
const extractTime = (isoString: string): string | null => {
  const date = new Date(isoString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  // 00:00 UTC means no time was selected (backend guardrail)
  // 00:01 UTC means user explicitly selected midnight
  if (hours === 0 && minutes === 0) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Helper to display the weekday from a timestamptz string without timezone shift.
const extractWeekday = (isoString: string): string => {
  // Parse as UTC date to avoid off-by-one day from timezone conversion
  const [datePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day); // local midnight = no shift
  return date.toLocaleDateString(undefined, { weekday: 'long' });
};

export default function Plan() {
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [silentLoading, setSilentLoading] = useState(false);
  const [completedMealIds, setCompletedMealIds] = useState<Set<string>>(new Set());

  // Load completed status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('swello-completed-meals');
    if (saved) {
      try {
        setCompletedMealIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to parse completed meals', e);
      }
    }
  }, []);

  // Save completed status to localStorage and API
  const toggleMealComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'prepared' ? 'pending' : 'prepared';
    
    // Optimistic UI update
    const newSet = new Set(completedMealIds);
    if (newStatus === 'prepared') {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setCompletedMealIds(newSet);
    localStorage.setItem('swello-completed-meals', JSON.stringify(Array.from(newSet)));

    // API call
    try {
      await api.updatePlannedMealStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
      // Revert optimistic update on failure (optional, won't add here for simplicity)
    }
  };

  // Date Logic
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const today = new Date();
      const isToday = d.getDate() === today.getDate() && 
                      d.getMonth() === today.getMonth() && 
                      d.getFullYear() === today.getFullYear();
      
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        fullDate: formatDateLocal(d),
        isToday
      });
    }
    return days;
  }, [currentWeekStart]);

  const weekRangeLabel = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    const startStr = currentWeekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [currentWeekStart]);

  const navigateWeek = (direction: 'next' | 'prev') => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return next;
    });
  };

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        if (!mealPlan) setLoading(true);
        else setSilentLoading(true);

        const end = new Date(currentWeekStart);
        end.setDate(currentWeekStart.getDate() + 6);
        const data = await api.getMealPlan(
          formatDateLocal(currentWeekStart), 
          formatDateLocal(end)
        );
        setMealPlan(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setSilentLoading(false);
      }
    };

    fetchPlan();
  }, [currentWeekStart, refreshKey]);

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('meal-plan-updated', handler);
    return () => window.removeEventListener('meal-plan-updated', handler);
  }, []);

  const nutritionBalance = mealPlan?.weekly_nutrition_balance || {
    protein_percentage: 0,
    carb_percentage: 0,
    fat_percentage: 0,
    score: 0
  };

  const hasPlannedMeals = mealPlan?.plans?.some((p: any) => p.planned_meals?.length > 0);

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* TopAppBar */}
      <header className="bg-white/70 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 border-b border-surface-container/30">
        <h1 className="font-headline text-2xl text-secondary font-bold">Plan</h1>
        <div className="flex items-center gap-4">
          {silentLoading && <Loader2 size={16} className="animate-spin text-primary opacity-50" />}
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 hidden sm:block">
            {weekRangeLabel}
          </span>
          <CalendarIcon className="text-primary cursor-pointer hover:scale-110 transition-transform" size={24} />
        </div>
      </header>

      <main className="px-6 pt-24 space-y-10">
        {/* Weekly Calendar Navigation */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Planning Calendar</span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateWeek('prev')}
                className="w-10 h-14 rounded-2xl bg-surface-container/20 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex-grow flex items-center justify-start sm:justify-between gap-1 bg-surface-container/10 p-1.5 rounded-[20px] border border-surface-container/30 overflow-x-auto no-scrollbar">
                {weekDays.map((day) => (
                  <div
                    key={day.fullDate}
                    className={`flex flex-col items-center min-w-[40px] flex-grow py-3 rounded-2xl transition-all ${day.isToday ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-on-surface-variant'}`}
                  >
                    <span className={`text-[9px] font-bold uppercase mb-1 ${day.isToday ? 'opacity-80' : 'opacity-40'}`}>{day.label}</span>
                    <span className="font-data text-lg font-bold">{day.date}</span>
                    {day.isToday && <div className="w-1 h-1 bg-white rounded-full mt-1" />}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => navigateWeek('next')}
                className="w-10 h-14 rounded-2xl bg-surface-container/20 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="text-center mt-6">
              <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.3em]">{weekRangeLabel}</span>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-xs text-on-surface-variant font-medium animate-pulse">Syncing your schedule...</p>
          </div>
        ) : error ? (
          <div className="bg-error-container/20 border border-error/10 text-error p-6 rounded-3xl text-center">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-xs font-bold uppercase tracking-widest underline">Retry</button>
          </div>
        ) : (
          <>
            {/* Week Summary Card */}
            <section className="bg-white rounded-[32px] p-8 space-y-6 shadow-2xl shadow-black/[0.03] relative overflow-hidden border border-surface-container/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline text-3xl text-primary font-bold">Week at a Glance</h2>
                  <p className="text-xs text-on-surface-variant opacity-60">Consolidated wellness breakdown</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="font-data text-3xl font-bold text-primary">
                    {Math.round(nutritionBalance.score)}
                    <span className="text-sm opacity-40">/100</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-6 relative z-10 bg-surface-container/10 p-6 rounded-2xl border border-surface-container/30 shadow-inner">
                <div className="space-y-3">
                  <div className="h-3 w-full bg-surface-container/50 rounded-full overflow-hidden flex shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${nutritionBalance.protein_percentage}%` }}
                      className="h-full bg-primary" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${nutritionBalance.carb_percentage}%` }}
                      className="h-full bg-secondary" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${nutritionBalance.fat_percentage}%` }}
                      className="h-full bg-on-surface-variant/40" 
                    />
                  </div>
                  <div className="flex justify-between gap-4 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary" /> 
                      <span>Protein {Math.round(nutritionBalance.protein_percentage)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-secondary" /> 
                      <span>Carbs {Math.round(nutritionBalance.carb_percentage)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-on-surface-variant/40" /> 
                      <span>Fats {Math.round(nutritionBalance.fat_percentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Main Schedule Section */}
            <section className="space-y-8">
              <div className="flex justify-between items-baseline">
                <h2 className="font-headline text-3xl text-secondary font-bold">Planned Meals</h2>
                {!loading && <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  {mealPlan?.plans?.reduce((acc: number, p: any) => acc + (p.planned_meals?.length || 0), 0) || 0} Meals
                </span>}
              </div>

              <div className="grid gap-6">
                {!hasPlannedMeals ? (
                   <div className="bg-surface-container/5 rounded-3xl p-12 border-2 border-dashed border-primary/5 flex flex-col items-center text-center gap-5">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md ring-4 ring-primary/5 text-primary/30">
                        <Restaurant size={40} />
                      </div>
                      <div className="max-w-[240px]">
                        <h3 className="font-headline text-xl font-bold text-primary/40">Clean Slate</h3>
                        <p className="text-xs text-on-surface-variant/50 mt-1.5 leading-relaxed italic">No meals scheduled for this week range yet.</p>
                      </div>
                    </div>
                ) : (
                    mealPlan.plans.map((dayPlan: any) => 
                      (dayPlan.planned_meals || dayPlan.planned_meal || []).map((pm: any) => {
                        const mealRaw = pm.meals || pm.meal || {};
                        const meal = Array.isArray(mealRaw) ? (mealRaw[0] || {}) : mealRaw;
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={pm.id} 
                            className="bg-white rounded-3xl p-5 flex gap-5 items-center shadow-xl shadow-black/[0.02] border border-surface-container/30 relative overflow-hidden group"
                          >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-md relative">
                              <img 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                referrerPolicy="no-referrer" 
                                src={meal?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'} 
                                alt={meal?.title} 
                              />
                              {pm.recipes?.is_ai_generated && (
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white px-1.5 py-0.5 rounded-md text-[8px] font-bold backdrop-blur-md uppercase tracking-widest border border-white/20">
                                  AI
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                  {extractWeekday(pm.scheduled_date)}
                                </span>
                                <div className="flex gap-2">
                                   {extractTime(pm.scheduled_date) && (
                                     <span className="text-[10px] font-bold text-on-surface-variant/60 bg-surface-container/50 px-2 py-0.5 rounded-md">
                                       {extractTime(pm.scheduled_date)}
                                     </span>
                                   )}
                                   <button 
                                     onClick={() => toggleMealComplete(pm.id, pm.status || (completedMealIds.has(pm.id) ? 'prepared' : 'pending'))}
                                     className={`${pm.status === 'prepared' || completedMealIds.has(pm.id) ? 'text-primary' : 'text-on-surface-variant/20'} hover:scale-110 transition-all`}
                                   >
                                     <CheckCircle 
                                       size={18} 
                                       fill={pm.status === 'prepared' || completedMealIds.has(pm.id) ? "currentColor" : "none"} 
                                       className="transition-all" 
                                     />
                                   </button>
                                </div>
                              </div>
                              <h3 className="font-headline text-xl text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-1">{meal?.title}</h3>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-data text-sm font-bold text-primary">{meal?.balanced_level_score}</span>
                                  <div className="h-1 w-12 bg-surface-container rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${meal?.balanced_level_score}%` }} />
                                  </div>
                                </div>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await api.deletePlannedMeal(pm.id);
                                      // Refresh the current week
                                      setRefreshKey(k => k + 1);
                                    } catch (err) { console.error(err); }
                                  }}
                                  className="text-error/30 hover:text-error transition-colors p-1"
                                >
                                  <PlusCircle className="rotate-45" size={18} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )
                )}

                {/* Add Meal Placeholder */}
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate-search'))}
                  className="w-full bg-surface-container/20 border-2 border-dashed border-primary/10 rounded-2xl p-4 flex items-center justify-center gap-3 transition-all hover:bg-surface-container/40 hover:border-primary/30 active:scale-[0.98] group"
                >
                  <PlusCircle className="text-primary group-hover:scale-110 transition-transform" size={20} />
                  <span className="font-headline font-bold text-primary">Schedule another meal</span>
                </button>
                
                <p className="text-[11px] text-on-surface-variant italic opacity-60 text-center px-10 leading-relaxed font-medium">
                  Nutrition thresholds calculated using <span className="font-bold text-primary">Balanced Level Score</span> algorithm v1.4.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

