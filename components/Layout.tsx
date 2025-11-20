import React, { useState } from 'react';
import { NavItem, ViewMode } from '../types';
import { LayoutDashboard, MessageSquare, BookOpen, FileText, Sun, Moon, Menu, X, Mic2, ShieldCheck, Crown, Layers, Map, Sparkles } from 'lucide-react';

interface Props {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
  children: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'premium', label: 'Board Prep', icon: <Crown size={20} />, isPremium: true },
  { id: 'premium-notes', label: 'Extra Notes', icon: <Sparkles size={20} />, isPremium: true },
  { id: 'roadmap', label: 'Study Roadmap', icon: <Map size={20} /> },
  { id: 'flashcards', label: 'Flashcards', icon: <Layers size={20} /> },
  { id: 'chat', label: 'Study Chat', icon: <MessageSquare size={20} /> },
  { id: 'live', label: 'Live Session', icon: <Mic2 size={20} /> },
  { id: 'quiz', label: 'Quiz Generator', icon: <BookOpen size={20} /> },
  { id: 'notes', label: 'Summarizer', icon: <FileText size={20} /> },
];

export const Layout: React.FC<Props> = ({ currentView, onViewChange, isDark, toggleTheme, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text transition-colors duration-300 overflow-hidden">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl md:shadow-none transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              S
            </div>
            <h1 className="text-xl font-bold tracking-tight">StudyMate<span className="text-indigo-500">AI</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                ${currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }
                ${item.isPremium && !currentView.includes('premium') ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' : ''}
                ${item.isPremium && currentView === item.id ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white shadow-amber-200' : ''}
                ${item.id === 'premium-notes' && currentView === 'premium-notes' ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : ''}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.isPremium && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 rounded-full font-bold">PRO</span>
              )}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => {
                onViewChange('parents');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                ${currentView === 'parents' 
                  ? 'bg-gray-800 text-white dark:bg-gray-700' 
                  : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <ShieldCheck size={20} />
              <span>Parents</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center gap-3 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-600" />}
            <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 dark:text-gray-300">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg">StudyMate AI</span>
          <div className="w-6"></div> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};