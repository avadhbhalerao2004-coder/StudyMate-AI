import React, { useState, useEffect } from 'react';
import { UserStats, ActivityLog } from '../types';
import { getStats, getActivityLogs } from '../utils/storage';
import { Shield, Clock, BookOpen, AlertCircle, Lock, LogOut, AlertTriangle } from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!isLocked) {
      setStats(getStats());
      setLogs(getActivityLogs());
    }
  }, [isLocked]);

  const handleUnlock = () => {
    if (pin === '1234') { // Simple default PIN for demo
      setIsLocked(false);
      setError('');
    } else {
      setError('Incorrect PIN. Try 1234.');
      setPin('');
    }
  };

  if (isLocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-bg p-4">
        <div className="bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Parent Access</h2>
          <p className="text-gray-500 mb-6">Enter PIN to view student activity.</p>
          
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
            className="w-full text-center text-2xl tracking-widest p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="••••"
          />
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button
            onClick={handleUnlock}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Unlock Dashboard
          </button>
          <p className="mt-4 text-xs text-gray-400">Default PIN: 1234</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-1">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Shield className="text-indigo-600" /> Parent Dashboard
        </h1>
        <button 
          onClick={() => setIsLocked(true)}
          className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} /> Lock
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2 text-indigo-600">
            <Clock size={20} />
            <h3 className="font-semibold">Study Streak</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.streak} Days</p>
          <p className="text-sm text-gray-500">Consistency is key!</p>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2 text-emerald-600">
            <BookOpen size={20} />
            <h3 className="font-semibold">Quizzes Taken</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.quizzesTaken}</p>
          <p className="text-sm text-gray-500">Total tests completed</p>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2 text-orange-600">
            <AlertCircle size={20} />
            <h3 className="font-semibold">Questions Asked</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.questionsAsked}</p>
          <p className="text-sm text-gray-500">Total AI interactions</p>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Activity Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Time</th>
                <th className="px-6 py-3 text-left font-medium">Activity Type</th>
                <th className="px-6 py-3 text-left font-medium">Topic/Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${log.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1
                        ${log.type === 'quiz' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                          log.type === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          log.type === 'alert' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200 font-bold' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }
                      `}>
                        {log.type === 'alert' && <AlertTriangle size={10} />}
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-white font-medium">
                      {log.topic}
                      {log.details && <span className={`block text-xs font-normal ${log.type === 'alert' ? 'text-red-600 dark:text-red-400 mt-1' : 'text-gray-500'}`}>{log.details}</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No recent activity recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};