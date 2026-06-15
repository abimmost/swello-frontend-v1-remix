import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('Flavorful Cameroonian Journey');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email || '');
      }
      
      const savedName = localStorage.getItem('user_name');
      const savedDesc = localStorage.getItem('user_description');
      
      if (savedName) setName(savedName);
      if (savedDesc) setDescription(savedDesc);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save duration
    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_description', description);
    
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
       {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md shadow-sm border-b border-surface-container/30 flex justify-between items-center w-full px-6 py-4">
        <button onClick={onBack} className="active:scale-90 transition-transform">
          <ArrowLeft className="text-primary" size={24} />
        </button>
        <h1 className="font-headline text-xl font-bold text-primary tracking-tight">Settings</h1>
        <div className="w-6" /> {/* Spacer */}
      </header>

      <main className="px-6 space-y-8 mt-8 max-w-lg mx-auto">
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary relative overflow-hidden ring-4 ring-primary/5">
            <User size={40} />
          </div>
          <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">Your Profile</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface ml-1">Email Address (Read-only)</label>
            <input 
              type="email" 
              value={email}
              readOnly
              className="w-full bg-surface-container/30 text-on-surface-variant rounded-2xl px-5 py-4 font-medium border border-surface-container/50 focus:outline-none opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface ml-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chef Claude"
              className="w-full bg-white text-on-surface rounded-2xl px-5 py-4 font-medium border border-surface-container/50 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface ml-1">Bio / Journey</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your food journey"
              rows={3}
              className="w-full bg-white text-on-surface rounded-2xl px-5 py-4 font-medium border border-surface-container/50 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm resize-none"
            />
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/70 backdrop-blur-xl border-t border-surface-container/30 z-50">
        <button 
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className="w-full primary-gradient text-white py-4 rounded-xl font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : isSaved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
