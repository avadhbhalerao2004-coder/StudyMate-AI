import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { Flame, Book, Target, Award, Zap, Layers, Map, MessageSquare, ArrowRight, Quote, Sun, Moon, Sunset } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getRoadmapState, getFlashcardState } from '../utils/storage';

interface Props {
  stats: UserStats;
}

const MOTIVATIONAL_QUOTES = [
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "There is no substitute for hard work.", author: "Thomas Edison" },
    { text: "Education is the passport to the future.", author: "Malcolm X" }
];

export const Dashboard: React.FC<Props> = ({ stats }) => {
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [greeting, setGreeting] = useState('');
  const [activeRoadmap, setActiveRoadmap] = useState<string | null>(null);
  const [activeDeck, setActiveDeck] = useState<string | null>(null);

  useEffect(() => {
    // Random quote
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    // Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Check active states
    const roadmap = getRoadmapState();
    if (roadmap && roadmap.steps.length > 0) setActiveRoadmap(roadmap.goal);

    const flashcards = getFlashcardState();
    if (flashcards && flashcards.cards.length > 0) setActiveDeck(flashcards.topic);

  }, []);

  // Chart data
  const chartData = [
    { name: 'Correct', value: stats.correctAnswers, color: '#22c55e' },
    { name: 'Questions', value: stats.questionsAsked, color: '#6366f1' },
    { name: 'Quizzes', value: stats.quizzesTaken, color: '#a855f7' },
  ];

  return (
    <div className="h-full overflow-y-auto p-1 space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {greeting}, Student! 
                {greeting === 'Good Morning' ? <Sun className="text-amber-500" /> : greeting === 'Good Afternoon' ? <Sun className="text-orange-500" /> : <Moon className="text-indigo-400" />}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Ready to learn something new today?</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
             <Flame className="text-orange-500" fill="currentColor" size={20} />
             <span className="font-bold text-gray-800 dark:text-white">{stats.streak} Day Streak</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <MessageSquare className="mb-4" size={28} />
            <h3 className="font-bold text-lg">Ask AI</h3>
            <p className="text-indigo-100 text-sm">Get instant answers</p>
         </div>

         <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <Award className="mb-4" size={28} />
            <h3 className="font-bold text-lg">Take Quiz</h3>
            <p className="text-purple-100 text-sm">Test your skills</p>
         </div>

         <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <Layers className="mb-4" size={28} />
            <h3 className="font-bold text-lg">Flashcards</h3>
            <p className="text-amber-100 text-sm">Memorize terms</p>
         </div>

         <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <Map className="mb-4" size={28} />
            <h3 className="font-bold text-lg">Roadmap</h3>
            <p className="text-emerald-100 text-sm">Plan your study</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Main Stats */}
         <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Your Performance</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={70} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Bar dataKey="value" barSize={24} radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Daily Motivation */}
         <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 dark:text-indigo-400">
                 <Quote size={80} />
             </div>
             <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={16} /> Daily Motivation
             </h3>
             <p className="text-xl font-medium text-gray-800 dark:text-white leading-relaxed italic">
                 "{quote.text}"
             </p>
             <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                 — {quote.author}
             </p>
         </div>
      </div>

      {/* Continue Learning Section (Conditional) */}
      {(activeRoadmap || activeDeck) && (
          <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Continue Learning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeRoadmap && (
                      <div className="bg-white dark:bg-dark-card p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                  <Map size={24} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-gray-800 dark:text-white">{activeRoadmap}</h4>
                                  <p className="text-xs text-gray-500">Resume your roadmap</p>
                              </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              <ArrowRight size={16} />
                          </div>
                      </div>
                  )}
                  {activeDeck && (
                      <div className="bg-white dark:bg-dark-card p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group cursor-pointer hover:border-amber-500 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <Layers size={24} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-gray-800 dark:text-white">{activeDeck}</h4>
                                  <p className="text-xs text-gray-500">Review flashcards</p>
                              </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                              <ArrowRight size={16} />
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};