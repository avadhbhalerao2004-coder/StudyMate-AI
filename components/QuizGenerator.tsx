import React, { useState } from 'react';
import { generateQuiz } from '../services/geminiService';
import { GeneratedQuiz, QuizQuestion } from '../types';
import { Loader2, CheckCircle, XCircle, Trophy, BookOpen } from 'lucide-react';
import { getStats, saveStats, logActivity } from '../utils/storage';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
    updateStats: () => void;
}

export const QuizGenerator: React.FC<Props> = ({ updateStats }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    logActivity('quiz', `Generated ${difficulty} quiz on ${topic}`);
    try {
      const data = await generateQuiz(topic, difficulty);
      setQuiz(data);
      setCurrentQuestionIdx(0);
      setScore(0);
      setQuizComplete(false);
      setSelectedOption(null);
      setShowExplanation(false);
    } catch (e) {
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
    setShowExplanation(true);
    
    const isCorrect = option === quiz?.questions[currentQuestionIdx].correctAnswer;
    if (isCorrect) {
        setScore(s => s + 1);
        const stats = getStats();
        stats.correctAnswers += 1;
        saveStats(stats);
        updateStats();
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      const stats = getStats();
      stats.quizzesTaken += 1;
      saveStats(stats);
      updateStats();
      logActivity('quiz', `Completed quiz on ${quiz.topic}`, `Score: ${score + (selectedOption === quiz.questions[currentQuestionIdx].correctAnswer ? 1 : 0)}/${quiz.questions.length}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-dark-card rounded-2xl shadow-lg p-8">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Generating Quiz...</h3>
        <p className="text-gray-500 mt-2">Crafting questions about "{topic}"</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 md:p-10 h-full flex flex-col justify-center">
        <div className="max-w-lg mx-auto w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Quiz Generator</h2>
            <p className="text-gray-500 dark:text-gray-400">Test your knowledge on any subject. AI will generate a custom quiz for you.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, World War II, Calculus"
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select 
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!topic}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md transition-transform transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-dark-card rounded-2xl shadow-lg p-8 text-center animate-fade-in">
        <Trophy className="w-20 h-20 text-yellow-400 mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Quiz Complete!</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          You scored <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span> out of {quiz.questions.length}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setQuiz(null)}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            New Topic
          </button>
          <button 
            onClick={() => {
              setCurrentQuestionIdx(0);
              setScore(0);
              setQuizComplete(false);
              setSelectedOption(null);
              setShowExplanation(false);
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry Quiz
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIdx];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white capitalize">{quiz.topic}</h3>
          <span className="text-sm text-gray-500">Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
        </div>
        <div className="text-indigo-600 dark:text-indigo-400 font-bold">
          Score: {score}
        </div>
      </div>

      {/* Question Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-medium text-gray-800 dark:text-white mb-6 leading-relaxed">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50";
            
            if (selectedOption) {
              if (option === question.correctAnswer) {
                btnClass = "w-full text-left p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
              } else if (option === selectedOption) {
                btnClass = "w-full text-left p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
              } else {
                btnClass = "w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                disabled={!!selectedOption}
                onClick={() => handleAnswer(option)}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selectedOption && option === question.correctAnswer && <CheckCircle size={20} className="text-green-600" />}
                  {selectedOption && option === selectedOption && option !== question.correctAnswer && <XCircle size={20} className="text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {showExplanation && (
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg animate-slide-up">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold mb-2">
              <Loader2 size={18} className="animate-pulse" /> AI Explanation
            </div>
            <MarkdownRenderer content={question.explanation} className="text-gray-700 dark:text-gray-300 text-sm" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedOption}
          className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {currentQuestionIdx === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
};