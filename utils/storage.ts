import { UserStats, ChatMessage, ActivityLog, ChatSession, Flashcard, RoadmapStep } from "../types";

const STATS_KEY = 'studymate_stats';
const SESSIONS_KEY = 'studymate_chat_sessions_v2';
const LOGS_KEY = 'studymate_activity_logs';
const ROADMAP_KEY = 'studymate_active_roadmap';
const FLASHCARDS_KEY = 'studymate_active_flashcards';

export const getStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    let stats: UserStats;

    if (stored) {
      stats = JSON.parse(stored);
    } else {
      stats = {
        streak: 0,
        lastStudyDate: new Date(0).toISOString(),
        quizzesTaken: 0,
        questionsAsked: 0,
        correctAnswers: 0,
        isPremium: false,
        imageGenCount: 0,
        lastImageGenDate: new Date().toISOString().split('T')[0]
      };
    }

    // Check for daily reset of Image Generation Limit
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastImageGenDate !== today) {
      stats.imageGenCount = 0;
      stats.lastImageGenDate = today;
      saveStats(stats);
    }

    return stats;
  } catch (e) {
    console.error("Failed to get stats", e);
    return {
        streak: 0,
        lastStudyDate: new Date(0).toISOString(),
        quizzesTaken: 0,
        questionsAsked: 0,
        correctAnswers: 0,
        isPremium: false,
        imageGenCount: 0,
        lastImageGenDate: new Date().toISOString().split('T')[0]
    };
  }
};

export const saveStats = (stats: UserStats) => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save stats", e);
  }
};

export const updateStreak = () => {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  const lastStudy = stats.lastStudyDate.split('T')[0];

  if (today !== lastStudy) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastStudy === yesterdayStr) {
      stats.streak += 1;
    } else {
      stats.streak = 1; // Reset if skipped a day, or 1 if new
    }
    stats.lastStudyDate = new Date().toISOString();
    saveStats(stats);
  }
  return stats;
};

// --- Session Management ---

export const getChatSessions = (): ChatSession[] => {
    try {
        const stored = localStorage.getItem(SESSIONS_KEY);
        if (stored) {
            return JSON.parse(stored).sort((a: ChatSession, b: ChatSession) => b.lastModified - a.lastModified);
        }
        return [];
    } catch (e) {
        console.error("Failed to get sessions", e);
        return [];
    }
};

// Helper to handle storage limits
export const saveChatSession = (session: ChatSession): boolean => {
    try {
        const sessions = getChatSessions();
        const index = sessions.findIndex(s => s.id === session.id);
        
        if (index >= 0) {
            sessions[index] = session;
        } else {
            sessions.unshift(session);
        }
        
        try {
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
            return true;
        } catch (e: any) {
            // Handle Quota Exceeded
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                console.warn("LocalStorage full. Attempting to prune old sessions...");
                
                // Strategy 1: Delete oldest sessions (except current)
                // Sort by oldest modified first
                const sorted = sessions.filter(s => s.id !== session.id).sort((a, b) => a.lastModified - b.lastModified);
                
                while (sorted.length > 0) {
                    const removed = sorted.shift();
                    const newSessions = sessions.filter(s => s.id !== removed?.id);
                    
                    // Update the main sessions array to reflect removal for next iteration logic
                    const idxToRemove = sessions.findIndex(s => s.id === removed?.id);
                    if (idxToRemove !== -1) sessions.splice(idxToRemove, 1);

                    try {
                        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
                        console.log("Pruned session", removed?.id, "to save space.");
                        return true; // Success
                    } catch (retryError) {
                        continue; // Still full, try removing next oldest
                    }
                }

                // Strategy 2: If still full (or no other sessions to delete), strip images from current session
                console.warn("Storage still full. Stripping images from current session.");
                const strippedSession = {
                    ...session,
                    messages: session.messages.map(m => ({
                        ...m,
                        imageUrl: m.imageUrl ? undefined : undefined,
                        text: m.imageUrl ? m.text + "\n\n*[Image removed to save storage space]*" : m.text
                    }))
                };
                
                const currentIdx = sessions.findIndex(s => s.id === session.id);
                if (currentIdx !== -1) sessions[currentIdx] = strippedSession;
                
                try {
                    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
                    return true;
                } catch (finalError) {
                    console.error("Critical: Failed to save even after pruning.", finalError);
                    return false;
                }
            }
            throw e;
        }
    } catch (e) {
        console.error("Failed to save session", e);
        return false;
    }
};

export const deleteChatSession = (sessionId: string) => {
    try {
        const sessions = getChatSessions().filter(s => s.id !== sessionId);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error("Failed to delete session", e);
    }
};

export const logActivity = (type: ActivityLog['type'], topic: string, details?: string) => {
  try {
      const logs = getActivityLogs();
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        type,
        topic,
        timestamp: Date.now(),
        details
      };
      // Keep last 50 logs to save space
      const updatedLogs = [newLog, ...logs].slice(0, 50);
      localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
      console.error("Failed to log activity", e);
      // If logs are failing, we might be full, try clearing logs
      try {
          localStorage.removeItem(LOGS_KEY);
      } catch(err) {}
  }
};

export const getActivityLogs = (): ActivityLog[] => {
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
      return [];
  }
};

// --- Persistence for Tools ---

export interface StoredRoadmap {
    goal: string;
    duration: string;
    steps: RoadmapStep[];
    completedSteps: string[];
}

export const saveRoadmapState = (data: StoredRoadmap) => {
    try {
        localStorage.setItem(ROADMAP_KEY, JSON.stringify(data));
    } catch (e) { console.error(e); }
};

export const getRoadmapState = (): StoredRoadmap | null => {
    try {
        const stored = localStorage.getItem(ROADMAP_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
};

export interface StoredFlashcards {
    topic: string;
    cards: Flashcard[];
}

export const saveFlashcardState = (data: StoredFlashcards) => {
    try {
        localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(data));
    } catch (e) { console.error(e); }
};

export const getFlashcardState = (): StoredFlashcards | null => {
    try {
        const stored = localStorage.getItem(FLASHCARDS_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
};