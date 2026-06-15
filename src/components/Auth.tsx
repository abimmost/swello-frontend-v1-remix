import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
        });
        if (error) throw error;
        alert(t('auth.emailCheck'));
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 pt-20 bg-background">
      <div className="mb-12">
        <h1 className="text-4xl font-headline font-black text-secondary mb-2">
          {isLogin ? t('auth.welcomeBack') : t('auth.join')}
        </h1>
        <p className="text-on-surface-variant italic">
          {isLogin ? t('auth.welcomeSub') : t('auth.joinSub')}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
            <Mail size={16} /> {t('auth.email')}
          </label>
          <input
            id="auth-email"
            name="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary outline-none transition-shadow"
            placeholder="ndole@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
            <Lock size={16} /> {t('auth.password')}
          </label>
          <input
            id="auth-password"
            name="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary outline-none transition-shadow"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full vibrant-gradient text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? t('auth.signIn') : t('auth.createAccount'))}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary font-bold text-sm border-b border-primary/30 pb-0.5"
        >
          {isLogin ? t('auth.switchSignUp') : t('auth.switchSignIn')}
        </button>
      </div>
    </div>
  );
}
