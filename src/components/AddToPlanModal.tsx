import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Loader2, Check, Sparkles } from 'lucide-react';
import { api } from '../api';

interface AddToPlanModalProps {
  mealId: string;
  mealName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddToPlanModal({ mealId, mealName, onClose, onSuccess }: AddToPlanModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.addPlannedMeal({
        meal_id: mealId,
        scheduled_date: date,
        scheduled_time: time || undefined
      });
      setSuccess(true);
      // Notify the Plan screen to refresh its data
      window.dispatchEvent(new CustomEvent('meal-plan-updated'));
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to schedule meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container/50 text-on-surface-variant hover:bg-surface-container-high transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-primary mb-2">Schedule Meal</h2>
            <p className="text-on-surface-variant text-sm flex items-center gap-2">
              Add <span className="font-bold text-secondary">{mealName}</span> to your plan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Select Date</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  id="plan-date"
                  name="plan-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface-container/30 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Set Time (Optional)</label>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  id="plan-time"
                  name="plan-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-surface-container/30 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-error font-medium px-4 py-2 bg-error-container/20 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-5 rounded-2xl font-bold text-sm tracking-widest transition-all mt-4 flex items-center justify-center gap-3 shadow-xl ${
                success 
                  ? 'bg-secondary text-white shadow-secondary/20' 
                  : 'bg-primary text-white shadow-primary/20 active:scale-95 disabled:opacity-50'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : success ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <Check size={20} />
                  Scheduled Successfully!
                </motion.div>
              ) : (
                <>
                  <Sparkles size={18} fill="currentColor" />
                  ADD TO PLAN
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
