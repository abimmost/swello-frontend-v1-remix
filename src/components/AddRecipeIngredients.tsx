import { ArrowLeft, Check, Edit2, Trash2, ArrowBigDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface AddRecipeIngredientsProps {
  onBack: () => void;
}

export default function AddRecipeIngredients({ onBack }: AddRecipeIngredientsProps) {
  const [ingredients, setIngredients] = useState<any[]>([
    { emoji: '🌿', name: 'Ndolé leaves', quantity: '2', unit: 'large handfuls', metric: '≈ 200g', isEssential: true },
    { emoji: '🥜', name: 'Ground crayfish', quantity: '1', unit: 'small palm', metric: '≈ 30g', isEssential: false },
    { emoji: '🧅', name: 'Onion', quantity: '1', unit: 'medium bulb', metric: '≈ 120g', isEssential: false },
  ]);

  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('large handful');
  const [isEssential, setIsEssential] = useState(false);

  const handleAddIngredient = () => {
    if (!newName) return;
    const icons: Record<string, string> = {
        'Ndole': '🌿',
        'Tomato': '🍅',
        'Onion': '🧅',
        'Garlic': '🧄',
        'Crayfish': '🥜',
        'Beef': '🥩',
        'Chicken': '🍗',
        'Yam': '🥔',
        'Plantain': '🍌',
    };
    const emoji = Object.entries(icons).find(([k]) => newName.toLowerCase().includes(k.toLowerCase()))?.[1] || '🥘';

    setIngredients([...ingredients, {
      emoji,
      name: newName,
      quantity: newQty,
      unit: newUnit,
      metric: `~ ${Math.floor(Math.random() * 100 + 10)}g`,
      isEssential
    }]);

    setNewName('');
    setNewQty('');
    setIsEssential(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-48">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md flex justify-between items-center px-6 py-6 border-b border-surface-container/30">
        <button onClick={onBack} className="active:scale-95 transition-transform">
          <ArrowLeft className="text-primary" size={24} />
        </button>
        <h1 className="font-headline text-2xl font-bold text-secondary tracking-tight">Add Your Recipe</h1>
        <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">Step 2 of 4</span>
      </header>

      <main className="flex-grow px-6 pt-8 max-w-lg mx-auto">
        {/* Progress Dots */}
        <div className="mb-14 flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container -z-10 -translate-y-1/2" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Check size={14} strokeWidth={4} />
            </div>
            <div className="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-primary/5">
                <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center" />
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center" />
        </div>

        <h2 className="font-headline text-3xl font-bold text-secondary mb-8 leading-tight">Add Ingredients</h2>

        {/* Added Ingredients List */}
        <div className="space-y-4 mb-14">
          {ingredients.map((ing, i) => (
            <motion.div 
                key={`${ing.name}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm border border-surface-container/30 group hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-3xl shadow-inner border border-surface-container/20">
                  {ing.emoji}
                </div>
                <div>
                  <p className="font-sans font-bold text-on-surface">{ing.name}</p>
                  <p className="font-data text-on-surface-variant text-sm opacity-60">
                    <span className="font-bold">{ing.quantity}</span> {ing.unit} <span className="text-[10px] ml-1">{ing.metric}</span>
                  </p>
                  {ing.isEssential && <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Essential</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => removeIngredient(i)}
                  className="p-2 text-on-surface-variant hover:text-secondary transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Ingredient Input Area */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-primary/5 border border-surface-container/40 mb-10">
          <div className="space-y-8">
            <div className="relative">
              <input 
                className="w-full border-b-2 border-surface-container focus:border-primary bg-transparent py-4 text-lg font-sans outline-none transition-colors" 
                placeholder="Ingredient name..." 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <input 
                className="w-full border-b-2 border-surface-container focus:border-primary bg-transparent py-4 text-lg font-data outline-none transition-colors" 
                placeholder="Quantity" 
                type="text" 
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
              />
              <div className="relative flex items-center">
                 <select 
                    className="w-full border-b-2 border-surface-container focus:border-primary bg-transparent py-4 text-lg font-sans outline-none transition-colors appearance-none pr-8"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  >
                    <option>large handful</option>
                    <option>small palm</option>
                    <option>medium bulb</option>
                    <option>clove</option>
                    <option>gram (g)</option>
                </select>
                <ArrowDropDown className="absolute right-0 text-on-surface-variant pointer-events-none" size={24} />
              </div>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={isEssential}
                    onChange={(e) => setIsEssential(e.target.checked)}
                    className="w-5 h-5 rounded border-surface-container text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-on-surface-variant">Mark as Essential Ingredient</span>
            </label>

            <button 
                onClick={handleAddIngredient}
                className="w-full py-5 rounded-2xl primary-gradient text-white font-bold text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
            >
               Add Ingredient
            </button>
          </div>
        </div>

        <p className="text-sm italic text-on-surface-variant opacity-40 text-center px-4 leading-relaxed group">
            💡 Tip: Mark essential ingredients that cannot be removed in the <span className="font-bold text-primary opacity-60">AI Editor</span>.
        </p>
      </main>

      {/* Actions */}
      <div className="fixed bottom-10 left-0 right-0 z-50 px-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center gap-4">
          <button onClick={onBack} className="flex-1 py-4.5 rounded-xl bg-white text-primary font-bold shadow-lg shadow-black/5 border border-surface-container active:scale-95 transition-all">
            ← Back
          </button>
          <button className="flex-[1.8] py-4.5 rounded-xl primary-gradient text-white font-bold shadow-xl active:scale-95 transition-all">
            Next: Cooking Steps →
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowDropDown({ size, className }: { size: number, className: string }) {
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
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}
