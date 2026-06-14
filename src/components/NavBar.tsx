import { motion } from 'motion/react';
import { Compass, Calendar as CalendarIcon, ShoppingBag, User, Search, Bookmark, Clock } from 'lucide-react';
import { Screen } from '../types';

interface NavBarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function NavBar({ currentScreen, onNavigate }: NavBarProps) {
  const items = [
    { id: 'discovery', label: 'Discover', icon: Compass },
    { id: 'plan', label: 'Plan', icon: CalendarIcon },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm glass-nav rounded-full shadow-[0_8px_32px_rgba(6,78,59,0.12)] px-8 py-4 flex items-center justify-between z-50">
      {items.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onNavigate(item.id as Screen)}
            initial={false}
            animate={{ 
              scale: isActive ? 1.1 : 1,
              opacity: isActive ? 1 : 0.5
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`flex flex-col items-center gap-1.5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
