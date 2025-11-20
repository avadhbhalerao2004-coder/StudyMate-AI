import React from 'react';
import { BookOpen, Pen } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-dark-bg flex flex-col items-center justify-center">
      <div className="relative">
        {/* Animated Book */}
        <BookOpen 
          size={80} 
          className="text-indigo-600 dark:text-indigo-400 animate-book-open" 
          strokeWidth={1.5}
        />
        
        {/* Animated Pen */}
        <div className="absolute -top-8 -right-8 animate-pen-write">
            <Pen 
                size={40} 
                className="text-purple-600 dark:text-purple-400 drop-shadow-lg" 
                fill="currentColor"
            />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center animate-fade-up">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
            StudyMate<span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Starting your session...
        </p>
      </div>

      <style>{`
        @keyframes bookOpen {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes penWrite {
            0% { transform: translate(-20px, -20px) rotate(0deg); opacity: 0; }
            30% { opacity: 1; }
            100% { transform: translate(10px, 0px) rotate(15deg); opacity: 1; }
        }
        @keyframes fadeUp {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
        .animate-book-open { animation: bookOpen 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-pen-write { animation: penWrite 1s ease-out forwards 0.3s; }
        .animate-fade-up { animation: fadeUp 0.8s ease-out forwards 0.5s; }
      `}</style>
    </div>
  );
};