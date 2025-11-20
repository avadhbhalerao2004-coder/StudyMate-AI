import React, { useState, useEffect } from 'react';
import { Map, Calendar, CheckCircle, Clock, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import { generateStudyRoadmap } from '../services/geminiService';
import { RoadmapStep } from '../types';
import { logActivity, saveRoadmapState, getRoadmapState } from '../utils/storage';

export const StudyRoadmap: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Load from storage on mount
  useEffect(() => {
    const stored = getRoadmapState();
    if (stored) {
        setGoal(stored.goal);
        setDuration(stored.duration);
        setSteps(stored.steps);
        setCompletedSteps(stored.completedSteps);
    }
  }, []);

  // Save whenever state changes (and steps exist)
  useEffect(() => {
    if (steps.length > 0) {
        saveRoadmapState({ goal, duration, steps, completedSteps });
    }
  }, [steps, completedSteps, goal, duration]);

  const handleGenerate = async () => {
    if (!goal.trim() || !duration.trim()) return;
    setLoading(true);
    setSteps([]);
    setCompletedSteps([]);
    
    try {
        const newSteps = await generateStudyRoadmap(goal, duration);
        setSteps(newSteps);
        logActivity('roadmap', `Generated plan for: ${goal}`);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => 
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const clearRoadmap = () => {
      setGoal('');
      setDuration('');
      setSteps([]);
      setCompletedSteps([]);
      localStorage.removeItem('studymate_active_roadmap');
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden p-1 animate-fade-in">
        
        {/* Input Panel */}
        <div className="lg:w-1/3 flex flex-col gap-6 h-full overflow-y-auto">
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                        <Map size={24} />
                        <h2 className="text-xl font-bold">Create Roadmap</h2>
                    </div>
                    {steps.length > 0 && (
                        <button onClick={clearRoadmap} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear Roadmap">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What do you want to learn?</label>
                        <input 
                            type="text" 
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g. Organic Chemistry, Calculus, French"
                            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration / Timeframe</label>
                        <input 
                            type="text" 
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g. 2 weeks, 1 month, 5 days"
                            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !goal || !duration}
                        className="w-full mt-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <ArrowRight size={18} />}
                        {loading ? 'Planning...' : (steps.length > 0 ? 'Regenerate Plan' : 'Generate Plan')}
                    </button>
                </div>
            </div>

            {/* Tip Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white">
                <h3 className="font-bold text-lg mb-2">Why use a roadmap?</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                    Breaking down complex subjects into manageable milestones increases retention by 40%. Follow the plan step-by-step!
                </p>
            </div>
        </div>

        {/* Results Panel */}
        <div className="lg:w-2/3 bg-white dark:bg-dark-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 lg:p-8 overflow-y-auto relative">
            {steps.length > 0 ? (
                <div className="animate-slide-up">
                    <div className="mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 capitalize">{goal}</h2>
                        <p className="text-gray-500 flex items-center gap-2">
                            <Calendar size={16} /> {duration} Plan
                            <span className="text-gray-300 dark:text-gray-600 mx-2">|</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">{Math.round((completedSteps.length / steps.length) * 100)}% Complete</span>
                        </p>
                    </div>

                    <div className="relative pl-4 lg:pl-8 space-y-8">
                        {/* Vertical Line */}
                        <div className="absolute left-[23px] lg:left-[39px] top-2 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        {steps.map((step, idx) => (
                            <div key={step.id} className="relative pl-8 lg:pl-10 group">
                                {/* Connector Dot */}
                                <button 
                                    onClick={() => toggleStep(step.id)}
                                    className={`absolute left-0 lg:left-2 top-1 w-12 h-12 rounded-full border-4 border-white dark:border-dark-card z-10 flex items-center justify-center transition-all cursor-pointer
                                    ${completedSteps.includes(step.id) 
                                        ? 'bg-green-500 text-white shadow-lg scale-105' 
                                        : 'bg-indigo-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {completedSteps.includes(step.id) ? <CheckCircle size={20} /> : <span className="font-bold text-sm">{idx + 1}</span>}
                                </button>

                                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                                    completedSteps.includes(step.id)
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 opacity-75'
                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-gray-600'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`text-lg font-bold ${completedSteps.includes(step.id) ? 'text-green-800 dark:text-green-400 line-through' : 'text-gray-800 dark:text-white'}`}>
                                            {step.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <Clock size={12} /> {step.duration}
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                        {step.description}
                                    </p>

                                    <div className="space-y-2">
                                        {step.keyTopics.map((topic, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <div className={`w-1.5 h-1.5 rounded-full ${completedSteps.includes(step.id) ? 'bg-green-400' : 'bg-indigo-500'}`}></div>
                                                {topic}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                            <p className="font-medium text-gray-600 dark:text-gray-300">Designing your curriculum...</p>
                        </div>
                    ) : (
                        <>
                            <Map className="w-20 h-20 mb-4 opacity-20" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Plan Generated Yet</h3>
                            <p className="max-w-sm mx-auto">
                                Enter a subject and timeline on the left to receive a personalized study schedule tailored to your goals.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};