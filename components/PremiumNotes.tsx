import React, { useState } from 'react';
import { Book, Sparkles, FileText, CreditCard, Smartphone, CheckCircle, Loader2, Lock, Unlock, X, AlertTriangle } from 'lucide-react';
import { generateDetailedNotes } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { logActivity } from '../utils/storage';

export const PremiumNotes: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false); // Per session/topic unlock
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('upi'); // Default to UPI for 5rs
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');

  const handlePayment = () => {
    if (!upiId.includes('@') && paymentMethod === 'upi') {
        setError('Invalid UPI ID');
        return;
    }

    setProcessingState('processing');
    
    // Simulate payment of 5 rupees
    setTimeout(() => {
        setProcessingState('success');
        logActivity('notes', `Unlocked Extra Notes for ${topic}`, 'Paid ₹5.00');
        
        setTimeout(() => {
            setShowPayment(false);
            setIsUnlocked(true);
            setProcessingState('idle');
            handleGenerate(); // Auto start generation after payment
        }, 1500);
    }, 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const result = await generateDetailedNotes(topic);
        setNotes(result);
    } catch (e) {
        setNotes("Error generating notes. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const reset = () => {
      setNotes('');
      setIsUnlocked(false);
      setTopic('');
  }

  return (
    <div className="h-full overflow-y-auto p-1">
      
      {/* Payment Modal */}
      {showPayment && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-slide-up">
                <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><Lock size={18} /> Unlock Notes</h3>
                    <button onClick={() => setShowPayment(false)} className="hover:opacity-80"><X size={20} /></button>
                </div>
                
                <div className="p-6">
                    <div className="text-center mb-6">
                        <h4 className="text-2xl font-bold text-gray-800 dark:text-white">₹5.00</h4>
                        <p className="text-sm text-gray-500">For detailed "{topic}" notes</p>
                    </div>

                    {processingState === 'success' ? (
                         <div className="flex flex-col items-center text-green-600 py-4">
                             <CheckCircle size={48} className="mb-2" />
                             <span className="font-bold">Payment Received!</span>
                         </div>
                    ) : processingState === 'processing' ? (
                        <div className="flex flex-col items-center text-indigo-600 py-4">
                            <Loader2 size={48} className="animate-spin mb-2" />
                            <span className="font-bold">Processing...</span>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-6">
                                <button 
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`w-full p-3 rounded-xl border flex items-center gap-3 ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    <Smartphone className="text-indigo-600" />
                                    <div className="text-left">
                                        <div className="font-semibold text-sm text-gray-800 dark:text-white">UPI</div>
                                        <div className="text-[10px] text-gray-500">Google Pay, PhonePe, Paytm</div>
                                    </div>
                                </button>
                                
                                {paymentMethod === 'upi' && (
                                    <input 
                                        type="text" 
                                        placeholder="Enter UPI ID"
                                        value={upiId}
                                        onChange={(e) => { setUpiId(e.target.value); setError(''); }}
                                        className="w-full p-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    />
                                )}
                                {error && <p className="text-red-500 text-xs">{error}</p>}
                            </div>

                            <button 
                                onClick={handlePayment}
                                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                            >
                                Pay ₹5.00
                            </button>
                        </>
                    )}
                </div>
            </div>
          </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* Input Section */}
        <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <Sparkles size={20} /> Premium Feature
                </div>
                <h1 className="text-2xl font-bold mb-2">Extra Study Notes</h1>
                <p className="text-white/80 text-sm">
                    Get AI-generated deep-dive material, complex examples, and expert definitions for any specific topic.
                </p>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">What topic do you need?</label>
                <input 
                    type="text" 
                    value={topic}
                    disabled={isUnlocked}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Thermodynamics, French Revolution"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 mb-6 outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white disabled:opacity-60"
                />

                {!isUnlocked ? (
                    <button 
                        onClick={() => { if(topic.trim()) setShowPayment(true); }}
                        disabled={!topic.trim()}
                        className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Lock size={18} /> Pay ₹5.00 to Generate
                    </button>
                ) : (
                    <div className="text-center text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2 p-3 border border-green-200 dark:border-green-900 rounded-xl bg-green-50 dark:bg-green-900/10">
                        <Unlock size={18} /> Notes Unlocked
                    </div>
                )}
            </div>
            
            {isUnlocked && (
                <button onClick={reset} className="text-gray-500 text-sm hover:text-indigo-600 underline text-center">
                    Start new topic
                </button>
            )}
        </div>

        {/* Content Area */}
        <div className="lg:w-2/3 bg-white dark:bg-dark-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 lg:p-8 overflow-y-auto">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Researching "{topic}" deeply...</p>
                </div>
            ) : notes ? (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">{topic}</h2>
                        <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-lg font-medium">
                            Premium Notes
                        </span>
                    </div>
                    <MarkdownRenderer content={notes} />
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                    <FileText className="w-20 h-20 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Notes Yet</h3>
                    <p className="max-w-sm mx-auto">
                        Enter a topic and unlock premium access to get comprehensive study material.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};