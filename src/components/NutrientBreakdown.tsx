import { motion } from 'motion/react';
import { ArrowLeft, Share2, Info, PlusCircle } from 'lucide-react';
import { Recipe } from '../types';

interface NutrientBreakdownProps {
  recipe: Recipe;
  onBack: () => void;
}

export default function NutrientBreakdown({ recipe, onBack }: NutrientBreakdownProps) {
  const breakdown = [
    { label: 'Protein', value: '28g', dv: '56%', color: 'bg-primary', note: '"~1 palm worth"' },
    { label: 'Carbohydrates', value: '42g', dv: '14%', color: 'bg-secondary', note: '"~2 fists worth"' },
    { label: 'Dietary Fat', value: '18g', dv: '23%', color: 'bg-secondary', note: '"~1 small handful"' },
    { label: 'Fiber', value: '6g', dv: '24%', color: 'bg-primary/40', note: '"~1 pinch"' },
    { label: 'Iron', value: '4.2mg', dv: '23%', color: 'bg-primary/30' },
    { label: 'Vitamin C', value: '12mg', dv: '13%', color: 'bg-primary/20' },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
       {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md shadow-sm border-b border-surface-container/30 flex justify-between items-center w-full px-6 py-4">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="text-primary" size={24} />
        </button>
        <h1 className="font-headline text-xl font-bold text-primary tracking-tight">Nutrient Breakdown</h1>
        <div className="w-6" /> {/* Spacer to balance the back button */}
      </header>

      <main className="px-6 space-y-8 mt-8 max-w-lg mx-auto">
        {/* Meal Summary Chip */}
        <div className="flex justify-center">
          <div className="bg-primary/5 text-primary px-6 py-2 rounded-full font-bold text-xs shadow-sm flex items-center gap-2 border border-primary/10">
            <span>{recipe.name} 🥘</span>
          </div>
        </div>

        {/* Hero Score */}
        <section className="flex flex-col items-center py-4">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Conic Gradient Donut Simulation */}
            <div className="absolute inset-0 rounded-full bg-surface-container flex items-center justify-center shadow-inner overflow-hidden">
               <div 
                  className="absolute inset-0"
                  style={{
                    background: `conic-gradient(#064E3B 0% ${recipe.score}%, #E5E7EB ${recipe.score}% 100%)`
                  }}
               />
               <div className="absolute inset-4 bg-background rounded-full flex flex-col items-center justify-center shadow-lg border border-white/50">
                  <span className="font-data text-5xl font-bold text-primary leading-none">{recipe.score}</span>
                  <span className="font-data text-sm font-bold text-on-surface-variant opacity-40">/100</span>
                  <span className="text-xs font-bold text-primary mt-2 uppercase tracking-widest">Balanced Level</span>
               </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { label: 'Protein: Good', type: 'success' },
              { label: 'Carbs: High', type: 'warning' },
              { label: 'Fats: Balanced', type: 'success' },
            ].map((badge) => (
              <div 
                key={badge.label}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border ${badge.type === 'success' ? 'bg-white text-primary border-primary/10' : 'bg-white text-secondary border-secondary/10'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${badge.type === 'success' ? 'bg-primary' : 'bg-secondary'}`} />
                {badge.label}
              </div>
            ))}
          </div>
        </section>

        {/* Breakdown List */}
        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-bold text-primary mb-6">Per Serving</h2>
          <div className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.label} className="space-y-2 bg-white p-5 rounded-2xl shadow-sm border border-surface-container/30">
                <div className="flex justify-between items-end">
                  <span className="font-headline text-lg font-bold text-on-surface">{item.label}</span>
                  <span className="font-data text-sm font-bold text-primary">{item.value} | {item.dv} DV</span>
                </div>
                <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.dv }}
                    transition={{ duration: 1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
                {item.note && <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">{item.note}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Daily Tracking */}
        <section className="space-y-6 pb-12">
          <h2 className="font-headline text-2xl font-bold text-primary">Daily Tracking</h2>
          <div className="bg-white p-6 rounded-3xl space-y-5 border border-surface-container/30 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-primary" />
              <span className="text-sm font-semibold">Meals logged today: 2</span>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-full bg-surface-container rounded-lg flex overflow-hidden shadow-inner">
                <div className="h-full bg-primary" style={{ width: '40%' }} />
                <div className="h-full bg-secondary" style={{ width: '45%' }} />
                <div className="h-full bg-on-surface-variant/40" style={{ width: '15%' }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-on-surface-variant opacity-60">Daily Goal: 65% complete</span>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-primary">P</span>
                  <span className="text-[10px] font-bold text-secondary">C</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">F</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/70 backdrop-blur-xl border-t border-surface-container/30 z-50">
        <button className="w-full primary-gradient text-white py-4 rounded-xl font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <PlusCircle size={20} />
          Log This Meal Today
        </button>
      </div>
    </div>
  );
}

function CalendarIcon({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
