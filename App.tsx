import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { QuizGenerator } from './components/QuizGenerator';
import { Summarizer } from './components/Summarizer';
import { Dashboard } from './components/Dashboard';
import { LiveSession } from './components/LiveSession';
import { ParentDashboard } from './components/ParentDashboard';
import { PremiumBoardPrep } from './components/PremiumBoardPrep';
import { Flashcards } from './components/Flashcards';
import { StudyRoadmap } from './components/StudyRoadmap';
import { GlobalEffects } from './components/GlobalEffects';
import { PremiumNotes } from './components/PremiumNotes';
import { SplashScreen } from './components/SplashScreen';
import { ViewMode, UserStats } from './types';
import { updateStreak, getStats } from './utils/storage';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState<UserStats>(updateStreak());
  const [showSplash, setShowSplash] = useState(true);

  // Initial Setup: Theme, Splash Screen timer, Notifications
  useEffect(() => {
    // 1. Theme Check
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }

    // 2. Splash Screen Animation
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Runs for 2.5 seconds to show book animation

    // 3. Notification & Inactivity Check
    const checkInactivity = () => {
      if ('Notification' in window) {
        // Request permission if not granted
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const currentStats = getStats();
        const lastStudyTime = new Date(currentStats.lastStudyDate).getTime();
        const now = Date.now();
        const hoursSinceStudy = (now - lastStudyTime) / (1000 * 60 * 60);

        // If > 24 hours inactive, send notification
        if (hoursSinceStudy > 24) {
            if (Notification.permission === 'granted') {
                new Notification("Time to Study!", {
                    body: "It's been a while since your last session. Keep your streak alive!",
                    icon: "/favicon.ico"
                });
            } else {
                // Fallback alert if notifications blocked
                // We can't use standard 'alert' nicely in React, so we might rely on Dashboard streak logic,
                // but let's log it or handle it silently as the Dashboard handles streaks visually.
            }
        }
      }
    };

    checkInactivity();

    return () => clearTimeout(splashTimer);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const refreshStats = () => {
    setStats(updateStreak());
  };

  return (
    <>
      {showSplash && <SplashScreen />}
      <GlobalEffects />
      <Layout 
        currentView={view} 
        onViewChange={setView} 
        isDark={isDark} 
        toggleTheme={toggleTheme}
      >
        <div className="h-full animate-fade-in">
          {view === 'dashboard' && <Dashboard stats={stats} />}
          {view === 'chat' && <ChatInterface updateStats={refreshStats} />}
          {view === 'live' && <LiveSession />}
          {view === 'quiz' && <QuizGenerator updateStats={refreshStats} />}
          {view === 'notes' && <Summarizer />}
          {view === 'parents' && <ParentDashboard />}
          {view === 'premium' && <PremiumBoardPrep />}
          {view === 'premium-notes' && <PremiumNotes />}
          {view === 'flashcards' && <Flashcards />}
          {view === 'roadmap' && <StudyRoadmap />}
        </div>
      </Layout>
    </>
  );
};

export default App;