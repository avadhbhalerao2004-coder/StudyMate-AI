import React, { useState, useEffect } from 'react';
import { Layers, RotateCw, Check, X, Plus, Loader2, BrainCircuit, Trash2 } from 'lucide-react';
import { generateFlashcards } from '../services/geminiService';
import { Flashcard } from '../types';
import { logActivity, getFlashcardState, saveFlashcardState } from '../utils/storage';

export const Flashcards: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const stored = getFlashcardState();
    if (stored && stored.cards.length > 0) {
        setTopic(stored.topic);
        setCards(stored.cards);
        
        // Find first non-mastered card
        const firstNew = stored.cards.findIndex(c => c.status !== 'known');
        if (firstNew === -1 && stored.cards.every(c => c.status === 'known')) {
            setComplete(true);
            setCurrentIndex(stored.cards.length - 1);
        } else {
            setCurrentIndex(firstNew === -1 ? 0 : firstNew);
        }
    }
  }, []);

  // Save whenever cards change
  useEffect(() => {
    if (cards.length > 0) {
        saveFlashcardState({ topic, cards });
    }
  }, [cards, topic]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setComplete(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
        const newCards = await generateFlashcards(topic);
        setCards(newCards);
        logActivity('flashcards', `Created deck for ${topic}`);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCardAction = (status: 'known' | 'review') => {
    const updatedCards = [...cards];
    updatedCards[currentIndex].status = status;
    setCards(updatedCards);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
        setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
        setComplete(true);
    }
  };

  const resetDeck = () => {
    setComplete(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    // Reset statuses
    setCards(cards.map(c => ({...c, status: 'new'})));
  };

  const clearData = () => {
      setCards([]);
      setTopic('');
      setComplete(false);
      setCurrentIndex(0);
      localStorage.removeItem('studymate_active_flashcards');
  };

  const knownCount = cards.filter(c => c.status === 'known').length;
  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-lg overflow-hidden relative animate-fade-in">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Layers className="text-indigo-600" /> Smart Flashcards
            </h2>
            <p className="text-sm text-gray-500">Master definitions with AI-generated decks.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {!loading && cards.length > 0 && !complete && (
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Card {currentIndex + 1} of {cards.length}
                </div>
            )}
            {cards.length > 0 && (
                <button onClick={clearData} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear Deck">
                    <Trash2 size={18} />
                </button>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center relative">
        
        {cards.length === 0 && !loading && (
            <div className="max-w-md w-full text-center animate-slide-up">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BrainCircuit className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">What do you want to learn?</h3>
                <p className="text-gray-500 mb-8">Enter a topic (e.g., "Photosynthesis", "Spanish Verbs", "Java Basics") and AI will build a study deck for you.</p>
                
                <div className="relative">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic..."
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        className="w-full p-4 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={!topic.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Plus />
                    </button>
                </div>
            </div>
        )}

        {loading && (
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4 mx-auto" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Generating flashcards...</p>
            </div>
        )}

        {cards.length > 0 && !complete && !loading && (
            <div className="w-full max-w-xl perspective-1000 relative">
                {/* Card Container */}
                <div 
                    className="relative w-full aspect-[3/2] cursor-pointer group"
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ perspective: '1000px' }}
                >
                    <div 
                        className={`w-full h-full relative transition-all duration-500 transform-style-3d shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-4">Term</span>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{cards[currentIndex].front}</h3>
                            <p className="absolute bottom-4 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Click to flip</p>
                        </div>

                        {/* Back */}
                        <div 
                            className="absolute inset-0 backface-hidden bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center p-8 text-center"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4">Definition</span>
                            <p className="text-xl font-medium leading-relaxed">{cards[currentIndex].back}</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="mt-10 flex justify-center gap-6">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCardAction('review'); }}
                        className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <X size={20} /> Needs Review
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                        className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RotateCw size={20} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCardAction('known'); }}
                        className="flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                        <Check size={20} /> I Know It
                    </button>
                </div>
            </div>
        )}

        {complete && (
            <div className="text-center animate-fade-in max-w-md">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Layers className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Deck Complete!</h3>
                <p className="text-gray-500 mb-8">
                    You mastered <span className="font-bold text-green-600">{knownCount}</span> out of {cards.length} terms.
                </p>
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={clearData}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    >
                        New Topic
                    </button>
                    <button 
                        onClick={resetDeck}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Review Again
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* Progress Bar */}
      {cards.length > 0 && !loading && !complete && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
            <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};