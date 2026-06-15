/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen, Recipe } from './types';
import './index.css';
import './i18n'; // Initialize i18n
import { RECIPES } from './data';
import { getSupabase } from './lib/supabase';
import { api } from './api';

// Component Imports
import Onboarding from './components/Onboarding';
import DiscoveryFeed from './components/DiscoveryFeed';
import SearchScreen from './components/Search';
import MealDetail from './components/MealDetail';
import Plan from './components/Plan';
import Profile from './components/Profile';
import Settings from './components/Settings';
import YourRecipesList from './components/YourRecipesList';
import NutrientBreakdown from './components/NutrientBreakdown';
import AIEditor from './components/AIEditor';
import AddRecipeIngredients from './components/AddRecipeIngredients';
import NavBar from './components/NavBar';
import Auth from './components/Auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(RECIPES[0]);
  const [navigationHistory, setNavigationHistory] = useState<Screen[]>(['onboarding']);
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchBookmarks = async () => {
    if (!session) return;
    try {
      const bookmarks = await api.getBookmarks();
      const ids = new Set((bookmarks || []).map((b: any) => b.id || b.recipe_id));
      setBookmarkedIds(ids);
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookmarks();
    } else {
      setBookmarkedIds(new Set());
    }
  }, [session]);

  const toggleBookmark = async (recipeId: string) => {
    const isBookmarked = bookmarkedIds.has(recipeId);
    
    // Optimistic update
    const newIds = new Set(bookmarkedIds);
    if (isBookmarked) {
      newIds.delete(recipeId);
    } else {
      newIds.add(recipeId);
    }
    setBookmarkedIds(newIds);

    try {
      if (isBookmarked) {
        await api.removeBookmark(recipeId);
      } else {
        await api.bookmarkRecipe(recipeId);
      }
      window.dispatchEvent(new CustomEvent('bookmarks-updated'));
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // Revert on error
      setBookmarkedIds(bookmarkedIds);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = getSupabase();
        const { data: { session } } = await client.auth.getSession();
        setSession(session);
        
        // If already logged in, skip onboarding
        if (session && currentScreen === 'onboarding') {
          setCurrentScreen('discovery');
          setNavigationHistory(['discovery']);
        }
      } catch (err) {
        console.error('Supabase initialization failed:', err);
      } finally {
        setAuthChecking(false);
      }
    };

    initAuth();

    let subscription: any = null;
    try {
      const client = getSupabase();
      const { data } = client.auth.onAuthStateChange((_event: any, session: any) => {
        setSession(session);
      });
      subscription = data.subscription;
    } catch (err) {
      console.warn('Auth state change listener not registered:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleGlobalNav = (e: any) => {
      if (e.type === 'navigate-search') {
        setCurrentScreen('search');
        setNavigationHistory(prev => [...prev, 'search']);
      } else if (e.type === 'navigate') {
        const screen = e.detail;
        setCurrentScreen(screen);
        setNavigationHistory(prev => [...prev, screen]);
      } else if (e.type === 'select-recipe') {
        handleSelectRecipe(e.detail);
      }
    };
    window.addEventListener('navigate-search' as any, handleGlobalNav);
    window.addEventListener('navigate' as any, handleGlobalNav);
    window.addEventListener('select-recipe' as any, handleGlobalNav);
    return () => {
      window.removeEventListener('navigate-search' as any, handleGlobalNav);
      window.removeEventListener('navigate' as any, handleGlobalNav);
      window.removeEventListener('select-recipe' as any, handleGlobalNav);
    };
  }, []);

  // Global Pull-to-Refresh Handler
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollable = target.closest('.overflow-y-auto, .overflow-y-scroll, body') || document.documentElement;
      if (scrollable.scrollTop <= 0) {
        startY = e.touches[0].pageY;
      } else {
        startY = 0;
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (startY === 0) return;
      const target = e.target as HTMLElement;
      const scrollable = target.closest('.overflow-y-auto, .overflow-y-scroll, body') || document.documentElement;
      
      if (scrollable.scrollTop <= 0 && e.changedTouches[0].pageY - startY > 150) {
        window.location.reload();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleNavigate = (screen: Screen) => {
    setNavigationHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('discovery');
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    handleNavigate('detail');
  };

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth Guard
  if (!session && currentScreen !== 'onboarding') {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen shadow-2xl relative overflow-hidden">
        <Auth onSuccess={() => {
          setCurrentScreen('discovery');
          setNavigationHistory(['discovery']);
        }} />
      </div>
    );
  }

  const showNavBar = ['discovery', 'search', 'plan', 'profile'].includes(currentScreen);

  // Helper to determine if a screen should be visible
  const isTabActive = (tab: Screen) => currentScreen === tab;

  return (
    <div className="max-w-md mx-auto bg-background h-screen shadow-2xl relative overflow-hidden">
      {/* Main Tab Screens (Pre-loaded / Cached) */}
      {session && (
        <div className="w-full h-full overflow-y-auto">
          <div style={{ display: isTabActive('discovery') ? 'block' : 'none' }}>
            <DiscoveryFeed 
              onNavigate={handleNavigate}
            />
          </div>
          <div style={{ display: isTabActive('search') ? 'block' : 'none' }}>
            <SearchScreen />
          </div>
          <div style={{ display: isTabActive('plan') ? 'block' : 'none' }}>
            <Plan />
          </div>
          <div style={{ display: isTabActive('profile') ? 'block' : 'none' }}>
            <Profile />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Layered screens (Not pre-loaded) */}
        {['onboarding', 'detail', 'breakdown', 'editor', 'add-ingredients', 'your-recipes', 'settings'].includes(currentScreen) && (
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full absolute inset-0 z-20 bg-background overflow-y-auto"
          >
            {currentScreen === 'onboarding' && (
              <Onboarding onStart={handleNavigate} />
            )}

            {currentScreen === 'your-recipes' && (
              <YourRecipesList 
                onBack={handleBack} 
              />
            )}

            {currentScreen === 'settings' && (
              <Settings 
                onBack={handleBack} 
              />
            )}

            {currentScreen === 'detail' && (
              <MealDetail 
                recipe={selectedRecipe} 
                onBack={handleBack} 
                onNavigate={handleNavigate}
                isBookmarked={bookmarkedIds.has(selectedRecipe.id)}
                onToggleBookmark={() => toggleBookmark(selectedRecipe.id)}
              />
            )}

            {currentScreen === 'breakdown' && (
              <NutrientBreakdown recipe={selectedRecipe} onBack={handleBack} />
            )}

            {currentScreen === 'editor' && (
              <AIEditor recipe={selectedRecipe} onBack={handleBack} />
            )}

            {currentScreen === 'add-ingredients' && (
              <AddRecipeIngredients onBack={handleBack} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showNavBar && (
        <NavBar currentScreen={currentScreen} onNavigate={handleNavigate} />
      )}
    </div>
  );
}
