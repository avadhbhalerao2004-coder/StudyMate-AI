import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Bot, User, RotateCcw, Sparkles, Image as ImageIcon, Loader2, Paperclip, X, ShieldCheck, CreditCard, AlertTriangle, CheckCircle, Smartphone, Trash2, Plus, MessageSquare, Menu, Cloud, CloudOff } from 'lucide-react';
import { ChatMessage, MessageRole, ChatSession } from '../types';
import { streamChatResponse, getSmartSuggestions, generateStudyImage } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getStats, saveStats, getChatSessions, saveChatSession, deleteChatSession, logActivity } from '../utils/storage';

interface Props {
    updateStats: () => void;
}

export const ChatInterface: React.FC<Props> = ({ updateStats }) => {
  // Chat State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true); // For mobile toggle
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingImagePrompt, setPendingImagePrompt] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<{[key: string]: string}>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Flag detection ref to prevent double logging
  const flagLoggedRef = useRef<boolean>(false);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = getChatSessions();
    setSessions(loadedSessions);
    
    // Load most recent session or start new
    if (loadedSessions.length > 0) {
        loadSession(loadedSessions[0]);
    } else {
        startNewChat();
    }

    // Responsive Sidebar
    if (window.innerWidth < 768) {
        setShowSidebar(false);
    }
  }, []);

  // Debounced Saving Logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // We only want to save if we have a valid session and messages
    if (!currentSessionId || messages.length === 0) return;

    // Debounce time: 2000ms if typing (streaming), 0ms (immediate) if finished.
    const delay = isTyping ? 2000 : 0;

    const timeoutId = setTimeout(() => {
        setSaveStatus('saving');
        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === currentSessionId);
            if (idx === -1) return prev;

            const currentSession = prev[idx];
            
            // Update title if it's still "New Chat" and we have user messages
            let title = currentSession.title;
            if (title === 'New Chat' && messages.length > 1) {
                const firstUserMsg = messages.find(m => m.role === MessageRole.USER);
                if (firstUserMsg) {
                    title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
                }
            }

            const updatedSession: ChatSession = {
                ...currentSession,
                messages,
                title,
                lastModified: Date.now()
            };

            // Perform the actual save to localStorage
            const success = saveChatSession(updatedSession);
            setSaveStatus(success ? 'saved' : 'error');
            
            // Return the new state for the list
            const newSessions = [...prev];
            newSessions[idx] = updatedSession;
            return newSessions.sort((a, b) => b.lastModified - a.lastModified);
        });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [messages, currentSessionId, isTyping]);

  // Smart Suggestions Debounce
  useEffect(() => {
      const timer = setTimeout(async () => {
          if (input.length > 5 && !isTyping && !selectedImage) {
             try {
                 const sugs = await getSmartSuggestions(input);
                 setSuggestions(sugs);
             } catch(e) { /* ignore */ }
          } else {
              setSuggestions([]);
          }
      }, 1000);
      return () => clearTimeout(timer);
  }, [input, isTyping, selectedImage]);

  // --- Session Management ---

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
        id: newId,
        title: 'New Chat',
        messages: [{
            id: 'welcome',
            role: MessageRole.MODEL,
            text: "Hi! I'm StudyMate. Ask me anything about your studies, upload a picture of a homework question, or request a diagram!",
            timestamp: Date.now()
        }],
        lastModified: Date.now()
    };
    
    setMessages(newSession.messages);
    setCurrentSessionId(newId);
    setSessions(prev => [newSession, ...prev]);
    saveChatSession(newSession);
    
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const loadSession = (session: ChatSession) => {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      if (window.innerWidth < 768) setShowSidebar(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      deleteChatSession(id);
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      
      if (currentSessionId === id) {
          if (updated.length > 0) loadSession(updated[0]);
          else startNewChat();
      }
  };

  // --- Input Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Please choose an image under 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    
    if ((!textToSend.trim() && !selectedImage) || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: textToSend,
      imageUrl: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setSuggestions([]);
    setIsTyping(true);
    flagLoggedRef.current = false; // Reset flag log state for new turn

    const stats = getStats();
    stats.questionsAsked += 1;
    saveStats(stats);
    updateStats();
    logActivity('chat', imageToSend ? 'Image Analysis Request' : 'Study Question', textToSend.substring(0, 30) + '...');

    // API History Preparation
    const apiHistory = messages.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.text }] 
    }));

    const modelMsgId = (Date.now() + 1).toString();
    let modelText = "";

    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: MessageRole.MODEL,
      text: "",
      timestamp: Date.now(),
      isTyping: true
    }]);

    await streamChatResponse(apiHistory, textToSend, (chunk) => {
      modelText += chunk;

      // Safety Flag Check
      if (modelText.startsWith('[[FLAGGED:')) {
        const endIdx = modelText.indexOf(']]');
        if (endIdx !== -1) {
            // Flag detected
            const reason = modelText.substring(10, endIdx).trim();
            
            if (!flagLoggedRef.current) {
                logActivity('alert', 'Inappropriate/Unhealthy Content Detected', reason);
                flagLoggedRef.current = true;
                
                // Trigger Browser Notification if allowed
                if (Notification.permission === 'granted') {
                    new Notification("StudyMate Parent Alert", {
                        body: `Flagged content detected in study session: ${reason}`,
                        icon: "/favicon.ico"
                    });
                }
            }
            
            // Clean the text for display (remove the flag tag)
            const cleanText = modelText.substring(endIdx + 2).trim();
            
            setMessages(prev => prev.map(msg => 
                msg.id === modelMsgId 
                  ? { ...msg, text: cleanText, isTyping: false } 
                  : msg
            ));
            return;
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, text: modelText, isTyping: false } 
          : msg
      ));
    }, imageToSend);

    setIsTyping(false);
  };

  const checkImageLimit = (): boolean => {
    const stats = getStats();
    if (stats.imageGenCount >= 5) {
      return false;
    }
    return true;
  };

  // --- Payment Logic (Matches PremiumBoardPrep) ---

  const handleCardChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'number') formatted = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').replace(/(.{4})/g, '$1 ').trim();
    if (field === 'expiry') formatted = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').replace(/^(\d{2})(\d{0,2})/, '$1/$2').substring(0, 5);
    if (field === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 3);
    
    setCardDetails(prev => ({ ...prev, [field]: formatted }));
    if (paymentErrors[field]) setPaymentErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validatePayment = () => {
    const newErrors: {[key: string]: string} = {};
    if (paymentMethod === 'card') {
        if (cardDetails.number.replace(/\s/g, '').length < 16) newErrors.number = "Invalid card number";
        if (!cardDetails.name.trim()) newErrors.name = "Name required";
        if (cardDetails.expiry.length < 5) newErrors.expiry = "Invalid date";
        if (cardDetails.cvv.length < 3) newErrors.cvv = "Invalid CVV";
    } else {
        if (!upiId.includes('@')) newErrors.upi = "Invalid UPI ID";
    }
    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmPaymentAndGenerate = () => {
    if (!validatePayment()) return;

    setProcessingState('processing');

    // Simulate processing
    setTimeout(() => {
        setProcessingState('success');
        
        setTimeout(() => {
            setIsGeneratingImage(false); // Reset loading state from chat if stuck
            setShowPaymentModal(false);
            setProcessingState('idle');
            // Reset form
            setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
            setUpiId('');
            
            if (pendingImagePrompt) {
                executeImageGeneration(pendingImagePrompt, true); // true = isPaid
                setPendingImagePrompt(null);
            }
        }, 1500);
    }, 2500);
  };

  const handleGenerateImage = async () => {
    if (!input.trim()) {
        alert("Please type a description for the image you want (e.g., 'Diagram of a plant cell').");
        return;
    }
    
    if (!checkImageLimit()) {
      setPendingImagePrompt(input);
      setShowPaymentModal(true);
      return;
    }

    executeImageGeneration(input, false);
  };

  const executeImageGeneration = async (prompt: string, isPaid: boolean) => {
    setInput('');
    setIsGeneratingImage(true);
    logActivity('chat', 'Image Generation', prompt);

    const stats = getStats();
    if (!isPaid) {
        stats.imageGenCount += 1;
    }
    saveStats(stats);
    updateStats();

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: MessageRole.USER,
        text: `Generate an image: ${prompt}`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
        const imageUrl = await generateStudyImage(prompt);
        
        const modelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: MessageRole.MODEL,
            text: `Here is a visual aid for: **${prompt}**`,
            imageUrl: imageUrl,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: MessageRole.MODEL,
            text: "Sorry, I couldn't generate that image right now.",
            timestamp: Date.now()
        }]);
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleMic = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
      
      {/* --- History Sidebar --- */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">History</h3>
            <button onClick={startNewChat} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors" title="New Chat">
                <Plus size={18} />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(session => (
                <div 
                    key={session.id} 
                    onClick={() => loadSession(session)}
                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-sm border border-transparent ${
                        currentSessionId === session.id 
                        ? 'bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 font-medium' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                >
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <div className="flex-1 truncate">
                        {session.title}
                    </div>
                    <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                        title="Delete chat"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            {sessions.length === 0 && (
                <div className="text-center p-4 text-gray-400 text-xs mt-4">
                    No history yet. Start chatting!
                </div>
            )}
        </div>
      </div>

      {/* --- Main Chat Area --- */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Mobile Toggle for Sidebar */}
        <div className="md:hidden absolute top-4 left-4 z-10">
            <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            >
                <Menu size={20} />
            </button>
        </div>

        {/* Save Status Indicator */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-medium transition-all">
            {saveStatus === 'saving' && (
                <>
                    <Loader2 size={14} className="animate-spin text-indigo-500" />
                    <span className="text-gray-500 dark:text-gray-400">Saving...</span>
                </>
            )}
            {saveStatus === 'saved' && (
                <>
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Saved</span>
                </>
            )}
            {saveStatus === 'error' && (
                <>
                    <CloudOff size={14} className="text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Storage Full</span>
                </>
            )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-slide-up">
                
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-600" />
                        <span className="font-bold text-gray-700 dark:text-gray-200">Secure Checkout</span>
                    </div>
                    <button 
                        onClick={() => {
                            setShowPaymentModal(false);
                            setProcessingState('idle');
                            setPendingImagePrompt(null);
                        }} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="inline-block p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-2">
                            <ImageIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Daily Limit Reached</h3>
                        <p className="text-sm text-gray-500">Pay <span className="font-bold text-gray-800 dark:text-white">₹1.00</span> to generate this image.</p>
                    </div>

                    {/* Parent Warning */}
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-3">
                        <AlertTriangle className="text-amber-600 dark:text-amber-500 flex-shrink-0" size={20} />
                        <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-400 text-xs">Parent/Guardian Required</h4>
                            <p className="text-amber-700 dark:text-amber-300 text-[10px] mt-0.5">
                                Please ask your parent to complete this transaction.
                            </p>
                        </div>
                    </div>

                    {processingState === 'success' ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Payment Successful!</h3>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Generating image...</p>
                        </div>
                    ) : processingState === 'processing' ? (
                         <div className="py-8 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Processing...</h3>
                            <p className="text-gray-500 text-xs mt-1">Securely contacting bank</p>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button 
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        paymentMethod === 'card' 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    <CreditCard size={16} /> Card
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        paymentMethod === 'upi' 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    <Smartphone size={16} /> UPI
                                </button>
                            </div>

                            {/* Forms */}
                            <div className="space-y-3">
                                {paymentMethod === 'card' ? (
                                    <>
                                        <div>
                                            <input 
                                                type="text" 
                                                placeholder="Card Number"
                                                value={cardDetails.number}
                                                maxLength={19}
                                                onChange={(e) => handleCardChange('number', e.target.value)}
                                                className={`w-full p-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${paymentErrors.number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="MM/YY"
                                                value={cardDetails.expiry}
                                                maxLength={5}
                                                onChange={(e) => handleCardChange('expiry', e.target.value)}
                                                className={`flex-1 p-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${paymentErrors.expiry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            />
                                            <input 
                                                type="password" 
                                                placeholder="CVV"
                                                value={cardDetails.cvv}
                                                maxLength={3}
                                                onChange={(e) => handleCardChange('cvv', e.target.value)}
                                                className={`w-20 p-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${paymentErrors.cvv ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Cardholder Name"
                                            value={cardDetails.name}
                                            onChange={(e) => handleCardChange('name', e.target.value)}
                                            className={`w-full p-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${paymentErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                        />
                                    </>
                                ) : (
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="UPI ID (e.g. name@bank)"
                                            value={upiId}
                                            onChange={(e) => {
                                                setUpiId(e.target.value);
                                                if(paymentErrors.upi) setPaymentErrors({...paymentErrors, upi: ''});
                                            }}
                                            className={`w-full p-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${paymentErrors.upi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                        />
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={confirmPaymentAndGenerate}
                                className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-transform transform active:scale-95 flex items-center justify-center gap-2 text-sm"
                            >
                                Pay ₹1.00
                            </button>
                        </>
                    )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-[10px] text-gray-400 border-t border-gray-200 dark:border-gray-700">
                     Secured by StudyMate Payments
                </div>
            </div>
            </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
            <div
                key={msg.id}
                className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'} gap-1`}>
                    
                    <div className={`flex ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === MessageRole.USER ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                            {msg.role === MessageRole.USER ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                        </div>

                        <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base ${
                            msg.role === MessageRole.USER 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                        }`}>
                            {msg.imageUrl && msg.role === MessageRole.USER && (
                                <div className="mb-3 rounded-lg overflow-hidden">
                                    <img src={msg.imageUrl} alt="User upload" className="max-w-full h-auto max-h-60 object-cover" />
                                </div>
                            )}
                            
                            <MarkdownRenderer content={msg.text} />
                            
                            {msg.imageUrl && msg.role === MessageRole.MODEL && (
                                <div className="mt-3 rounded-xl overflow-hidden shadow-md border border-white/20">
                                    <img src={msg.imageUrl} alt="Generated study aid" className="w-full h-auto" />
                                </div>
                            )}

                            {msg.isTyping && <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce ml-1"></span>}
                        </div>
                    </div>
                </div>
            </div>
            ))}
            
            {isGeneratingImage && (
                <div className="flex w-full justify-start">
                    <div className="flex flex-row gap-3 ml-11">
                        <div className="p-4 rounded-2xl rounded-tl-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-gray-500">
                            <Loader2 size={16} className="animate-spin" /> Generating visual aid...
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 overflow-x-auto flex gap-2">
                <div className="flex items-center text-xs text-indigo-500 font-medium uppercase tracking-wider shrink-0 mr-2">
                    <Sparkles size={12} className="mr-1" /> Suggestions
                </div>
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(s)}
                        className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-700 border border-indigo-100 dark:border-gray-600 rounded-full text-xs text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        )}

        {/* Image Preview */}
        {selectedImage && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center animate-slide-up">
                <div className="relative group">
                    <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-indigo-200 dark:border-gray-600" />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </div>
                <div className="ml-3 text-xs text-gray-500 flex-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Image attached.</span> StudyMate will analyze this.
                </div>
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-full border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent shadow-sm transition-all">
            
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Upload Image"
            >
                <Paperclip size={20} />
            </button>

            <button 
                onClick={handleMic}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Voice Input"
            >
                <Mic size={20} />
            </button>
            
            <button 
                onClick={handleGenerateImage}
                className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Generate Study Image (Limit: 5/day)"
            >
                <ImageIcon size={20} />
            </button>

            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onPaste={handlePaste}
                placeholder={selectedImage ? "Ask about this image..." : "Ask a question..."}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
            />

            <button 
                onClick={() => handleSend()}
                disabled={(!input.trim() && !selectedImage) || isTyping || isGeneratingImage}
                className={`p-2 rounded-full transition-all ${
                    (input.trim() || selectedImage) && !isTyping && !isGeneratingImage
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
            >
                {isTyping || isGeneratingImage ? <RotateCcw size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
            </div>
            <div className="mt-1 text-right">
                <span className="text-[10px] text-gray-400">
                    Free Images: {Math.max(0, 5 - getStats().imageGenCount)}/5
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};