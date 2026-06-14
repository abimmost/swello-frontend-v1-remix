import { motion } from 'motion/react';
import { Screen } from '../types';

interface OnboardingProps {
  onStart: (screen: Screen) => void;
}

export default function Onboarding({ onStart }: OnboardingProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] w-full overflow-hidden shrink-0">
        <motion.img
          id="onboarding-hero-image"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          alt="Fresh Cameroonian produce"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          src="https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=1200"
        />
        {/* Blending Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        
        {/* Branding Overlay */}
        <div className="absolute top-0 left-0 p-6 pt-10 z-20">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="font-headline text-5xl font-black text-secondary leading-none drop-shadow-md mb-1"
          >
            Swello
          </motion.h1>
          <motion.p 
            id="onboarding-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-sans text-[14px] leading-[21px] italic font-medium text-secondary drop-shadow-sm"
          >
            A Bountiful Harvest...
          </motion.p>
        </div>
      </section>

      {/* Content Section Overlay */}
      <main className="flex-grow flex flex-col items-center px-6 pt-10 pb-6 relative z-20 bg-background rounded-t-[40px] -mt-12 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3 mb-6"
        >
          <h2 className="font-headline text-2xl font-bold text-primary leading-tight">Eat Well. Eat Cameroonian.</h2>
          <p className="text-on-surface-variant max-w-[320px] mx-auto text-sm leading-relaxed">
            Discover authentic meals, plan your week, and understand your nutrition in a way that feels natural.
          </p>
        </motion.div>

        {/* CTA & Secondary Action */}
        <div className="w-full space-y-4 mt-auto pb-4">
          <button
            onClick={() => onStart('discovery')}
            className="w-full vibrant-gradient text-white py-4 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-transform"
          >
            Get Started
          </button>
          <div className="text-center">
            <button className="font-sans text-sm font-semibold text-primary border-b border-primary/30 inline-block pb-0.5 active:opacity-70 transition-opacity">
              I already have an account
            </button>
          </div>
        </div>

        {/* Onboarding Indicators */}
        <nav className="mt-4 flex justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <div className="w-2.5 h-2.5 rounded-full bg-surface-container" />
          <div className="w-2.5 h-2.5 rounded-full bg-surface-container" />
        </nav>
      </main>
    </div>
  );
}
