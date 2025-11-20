import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Sparkles, Calendar, Book, CreditCard, Smartphone, ShieldCheck, CheckCircle, Loader2, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { getStats, saveStats, logActivity } from '../utils/storage';
import { generateBoardGuide } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

export const PremiumBoardPrep: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedClass, setSelectedClass] = useState<'10th' | '12th'>('10th');
  const [selectedSubject, setSelectedSubject] = useState('History');
  const [guideContent, setGuideContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const stats = getStats();
    setIsUnlocked(!!stats.isPremium);
  }, []);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
        return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  }

  const handleCardChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'number') formatted = formatCardNumber(value);
    if (field === 'expiry') formatted = formatExpiry(value);
    if (field === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 3);
    
    setCardDetails(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (paymentMethod === 'card') {
        if (cardDetails.number.replace(/\s/g, '').length < 16) newErrors.number = "Invalid card number";
        if (!cardDetails.name.trim()) newErrors.name = "Name required";
        if (cardDetails.expiry.length < 5) newErrors.expiry = "Invalid date";
        if (cardDetails.cvv.length < 3) newErrors.cvv = "Invalid CVV";
    } else {
        if (!upiId.includes('@')) newErrors.upi = "Invalid UPI ID";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = () => {
    if (!validateForm()) return;

    setProcessingState('processing');
    
    // Simulate secure transaction delay
    setTimeout(() => {
      const stats = getStats();
      stats.isPremium = true;
      saveStats(stats);
      setProcessingState('success');
      logActivity('premium', 'Unlocked Premium Board Prep', 'Transaction: #TXN_88291');
      
      setTimeout(() => {
          setIsUnlocked(true);
          setShowPayment(false);
          setProcessingState('idle');
      }, 1500);
    }, 3000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    logActivity('premium', `Generated guide for Class ${selectedClass} ${selectedSubject}`);
    try {
      const content = await generateBoardGuide(selectedClass, selectedSubject);
      setGuideContent(content);
    } catch (e) {
      setGuideContent("Sorry, I couldn't generate the guide right now. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // LOCK SCREEN / PAYMENT GATEWAY
  if (!isUnlocked) {
    return (
      <div className="h-full flex items-center justify-center p-4 relative overflow-hidden overflow-y-auto">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 z-0">
             <div className="absolute top-0 left-0 w-full h-full opacity-10" 
                  style={{backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        </div>

        {!showPayment ? (
            // HERO LANDING
            <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10 border border-amber-100 dark:border-amber-900/30 animate-fade-in">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-dark-card">
                <Lock size={40} className="text-white" />
            </div>
            
            <div className="mt-10">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Unlock Premium</h2>
                <p className="text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider text-sm mb-6">Ultimate Board Prep</p>
                
                <ul className="text-left space-y-4 mb-8 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-amber-500 flex-shrink-0" />
                    <span>Access important dates & events timeline</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-amber-500 flex-shrink-0" />
                    <span>10th & 12th Board cheat sheets</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-amber-500 flex-shrink-0" />
                    <span>Priority AI responses</span>
                </li>
                </ul>

                <div className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
                ₹100 <span className="text-base font-normal text-gray-400">/ one-time</span>
                </div>

                <button 
                onClick={() => setShowPayment(true)}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    <Unlock size={20} /> Proceed to Payment
                </button>
            </div>
            </div>
        ) : (
            // PAYMENT GATEWAY UI
            <div className="bg-white dark:bg-dark-card p-0 rounded-3xl shadow-2xl max-w-lg w-full relative z-10 border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-600" />
                        <span className="font-bold text-gray-700 dark:text-gray-200">Secure Checkout</span>
                    </div>
                    <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Parent Warning */}
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="text-amber-600 dark:text-amber-500 flex-shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Parent/Guardian Required</h4>
                            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                                Please ask your parent to complete this transaction. Do not use a payment card without permission.
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <div className="text-lg font-bold text-gray-800 dark:text-white">Premium Board Prep</div>
                            <div className="text-xs text-gray-500">Lifetime Access</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">₹100.00</div>
                    </div>

                    {processingState === 'success' ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Successful!</h3>
                            <p className="text-gray-500 mt-2">Transaction ID: #TXN_88291</p>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-4">Redirecting...</p>
                        </div>
                    ) : processingState === 'processing' ? (
                         <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Processing Payment...</h3>
                            <p className="text-gray-500 text-sm mt-2">Securely contacting bank</p>
                        </div>
                    ) : (
                        <>
                            {/* Payment Methods */}
                            <div className="flex gap-3 mb-6">
                                <button 
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                        paymentMethod === 'card' 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    <CreditCard size={18} /> Card
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${
                                        paymentMethod === 'upi' 
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    <Smartphone size={18} /> UPI
                                </button>
                            </div>

                            {/* Forms */}
                            <div className="space-y-4">
                                {paymentMethod === 'card' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Card Number</label>
                                            <input 
                                                type="text" 
                                                placeholder="0000 0000 0000 0000"
                                                value={cardDetails.number}
                                                maxLength={19}
                                                onChange={(e) => handleCardChange('number', e.target.value)}
                                                className={`w-full p-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${errors.number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            />
                                            {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Cardholder Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Name on card"
                                                value={cardDetails.name}
                                                onChange={(e) => handleCardChange('name', e.target.value)}
                                                className={`w-full p-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="MM/YY"
                                                    value={cardDetails.expiry}
                                                    maxLength={5}
                                                    onChange={(e) => handleCardChange('expiry', e.target.value)}
                                                    className={`w-full p-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${errors.expiry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                />
                                                {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
                                                <input 
                                                    type="password" 
                                                    placeholder="123"
                                                    value={cardDetails.cvv}
                                                    maxLength={3}
                                                    onChange={(e) => handleCardChange('cvv', e.target.value)}
                                                    className={`w-full p-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${errors.cvv ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                />
                                                {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID</label>
                                        <input 
                                            type="text" 
                                            placeholder="username@bank"
                                            value={upiId}
                                            onChange={(e) => {
                                                setUpiId(e.target.value);
                                                if(errors.upi) setErrors({...errors, upi: ''});
                                            }}
                                            className={`w-full p-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 ${errors.upi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                        />
                                        {errors.upi && <p className="text-red-500 text-xs mt-1">{errors.upi}</p>}
                                        <p className="text-xs text-gray-400 mt-2">Open your UPI app to approve the request after clicking Pay.</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handlePayment}
                                className="w-full mt-8 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                Pay ₹100.00
                            </button>
                        </>
                    )}
                </div>
                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-[10px] text-gray-400 border-t border-gray-200 dark:border-gray-700">
                     Secured by StudyMate Secure Payments. Data is encrypted.
                </div>
            </div>
        )}

      </div>
    );
  }

  // UNLOCKED CONTENT VIEW
  return (
    <div className="h-full overflow-y-auto p-1">
       <div className="flex flex-col lg:flex-row gap-6 h-full">
          
          {/* Sidebar / Control Panel */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
               <div className="flex items-center gap-2 mb-2 opacity-90">
                 <Sparkles size={20} /> Premium Activated
               </div>
               <h1 className="text-2xl font-bold mb-4">Board Exam Master</h1>
               <p className="text-white/80 text-sm">
                 Generate specific timelines, important years, and event summaries for your exams.
               </p>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Class</label>
              <div className="flex gap-3 mb-6">
                {['10th', '12th'].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls as any)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                      selectedClass === cls 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 border-2 border-amber-500' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 mb-6 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option>History</option>
                <option>Civics/Polity</option>
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>Geography</option>
                <option>Economics</option>
              </select>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Book className="w-5 h-5" />}
                Generate Cheat Sheet
              </button>
            </div>
          </div>

          {/* Output Area */}
          <div className="lg:w-2/3 bg-white dark:bg-dark-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 lg:p-8 overflow-y-auto min-h-[400px]">
            {guideContent ? (
               <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {selectedSubject} - Class {selectedClass}
                     </h2>
                     <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg font-medium">
                        Important Dates & Events
                     </span>
                  </div>
                  <MarkdownRenderer content={guideContent} />
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Calendar className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No content generated yet</p>
                  <p className="text-sm">Select a subject and click generate to see key dates and timelines.</p>
               </div>
            )}
          </div>

       </div>
    </div>
  );
};