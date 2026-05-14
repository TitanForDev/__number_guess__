import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, AlertCircle, Sun, Moon } from 'lucide-react';

type GameStatus = 'playing' | 'won' | 'lost';
type Theme = 'light' | 'dark';

interface GuessHistory {
  value: number;
  result: 'high' | 'low' | 'correct';
}

const MAX_ATTEMPTS = 7;
const MIN_NUMBER = 1;
const MAX_NUMBER = 100;

export default function App() {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessHistory[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string>('目標數字在 1 到 100 之間。');
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [currentRange, setCurrentRange] = useState({ min: MIN_NUMBER, max: MAX_NUMBER });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Initialize game
  const initGame = () => {
    setTargetNumber(Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER);
    setGuesses([]);
    setStatus('playing');
    setCurrentGuess('');
    setMessage('目標數字在 1 到 100 之間。');
    setCurrentRange({ min: MIN_NUMBER, max: MAX_NUMBER });
  };

  useEffect(() => {
    initGame();
  }, []);

  const [isShaking, setIsShaking] = useState(false);

  const handleGuess = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (status !== 'playing') return;

    const guessNum = parseInt(currentGuess);

    if (isNaN(guessNum) || guessNum < MIN_NUMBER || guessNum > MAX_NUMBER) {
      setMessage(`請輸入有效的數字 (${MIN_NUMBER}-${MAX_NUMBER})。`);
      triggerShake();
      return;
    }

    if (guesses.some(g => g.value === guessNum)) {
      setMessage('你已經猜過這個數字了！');
      triggerShake();
      return;
    }

    let result: 'high' | 'low' | 'correct';
    let newMessage = '';

    if (guessNum === targetNumber) {
      result = 'correct';
      newMessage = '完美猜中！';
      setStatus('won');
      if (bestScore === null || guesses.length + 1 < bestScore) {
        setBestScore(guesses.length + 1);
      }
    } else {
      triggerShake();
      if (guessNum > targetNumber) {
        result = 'high';
        newMessage = '快接近了 (太高了 ↑)';
        setCurrentRange(prev => ({ ...prev, max: Math.min(prev.max, guessNum - 1) }));
      } else {
        result = 'low';
        newMessage = '快接近了 (太低了 ↓)';
        setCurrentRange(prev => ({ ...prev, min: Math.max(prev.min, guessNum + 1) }));
      }
    }

    const newGuesses = [{ value: guessNum, result }, ...guesses];
    setGuesses(newGuesses);
    setMessage(newMessage);
    setCurrentGuess('');

    if (result !== 'correct' && newGuesses.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      setMessage(`遊戲結束！目標數字是 ${targetNumber}。`);
    }

    inputRef.current?.focus();
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const attemptsLeft = MAX_ATTEMPTS - guesses.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col font-sans text-slate-800 dark:text-slate-300 relative overflow-hidden transition-colors duration-500">
      {/* Animated Background Decoration */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-10 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-200 dark:bg-indigo-900/30 blur-3xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              x: [0, 50, -50, 0],
              y: [0, -50, 50, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header Navigation */}
      <nav className="h-16 px-4 md:px-12 border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10 transition-colors duration-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">終極密碼<span className="text-indigo-600">.挑戰</span></span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">最佳紀錄</span>
            <span className="text-sm font-semibold">{bestScore ? `${bestScore} 次猜測` : '--'}</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <button 
            onClick={initGame}
            className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            重置遊戲
          </button>
        </div>
      </nav>

      {/* Main Game Area */}
      <main className="flex-1 overflow-auto p-4 md:p-12 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-stretch">
          
          {/* Left Sidebar: Stats & History */}
          <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
            {/* History Card */}
            <div className="bg-white/80 dark:bg-black backdrop-blur-md border border-slate-200 dark:border-slate-900 rounded-3xl p-6 md:p-8 shadow-sm flex-1 min-h-[300px] flex flex-col transition-colors duration-500">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6">猜測歷史紀錄</h2>
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {guesses.length === 0 ? (
                    <div className="text-sm text-slate-300 dark:text-slate-600 italic py-4">目前尚無紀錄。</div>
                  ) : (
                    guesses.map((g, i) => (
                      <motion.div
                        key={guesses.length - i}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          g.result === 'correct' 
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900 shadow-indigo-50 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
                        } transition-colors duration-500`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          g.result === 'correct' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {(guesses.length - i).toString().padStart(2, '0')}
                        </span>
                        <span className="font-mono font-bold text-lg">{g.value}</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          g.result === 'high' ? 'text-rose-500' : 
                          g.result === 'low' ? 'text-blue-500' : 
                          'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {g.result === 'high' ? '太高了' : g.result === 'low' ? '太低了' : '正確！'}
                        </span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Chances remaining card */}
            <div className="bg-indigo-900 dark:bg-black rounded-3xl p-8 text-white shadow-xl relative overflow-hidden shrink-0 transition-colors duration-500 border dark:border-indigo-950/50">
              <div className="relative z-10">
                <h3 className="text-xs font-bold text-indigo-300 dark:text-indigo-500 uppercase tracking-widest mb-1">剩餘機會</h3>
                <div className="text-5xl font-light mb-4">
                  {attemptsLeft.toString().padStart(2, '0')}
                  <span className="text-xl text-indigo-400 ml-1">/ {MAX_ATTEMPTS}</span>
                </div>
                <div className="h-2 w-full bg-indigo-800 dark:bg-indigo-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(attemptsLeft / MAX_ATTEMPTS) * 100}%` }}
                    className={`h-full ${attemptsLeft <= 2 ? 'bg-rose-500' : 'bg-indigo-400'}`}
                  />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-800 dark:bg-indigo-800 rounded-full opacity-50 blur-xl"></div>
            </div>
          </div>

          {/* Right Area: Main Interaction Card */}
          <motion.div 
            animate={{
              x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            className={`lg:col-span-8 bg-white dark:bg-black border border-slate-200 dark:border-slate-900 rounded-[40px] shadow-2xl dark:shadow-none p-8 md:p-12 flex flex-col items-center justify-center relative min-h-[500px] order-1 lg:order-2 transition-all duration-500 ${isShaking ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' : ''}`}
          >
            
            {/* Status Hint */}
            <div className="mb-10 text-center">
              <motion.div 
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 ${
                  message.includes('高') ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900' : 
                  message.includes('低') ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900' :
                  message.includes('中') ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' :
                  'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900'
                }`}
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  message.includes('高') ? 'bg-rose-500' : 
                  message.includes('低') ? 'bg-blue-500' :
                  'bg-amber-500'
                }`}></div>
                <span className="text-xs font-bold uppercase tracking-wide">{message}</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                目標：<span className="text-slate-200 dark:text-slate-900">{status === 'playing' ? '??' : targetNumber}</span>
              </h1>
              
              {/* Enhanced Range Hint */}
              <div className="mt-8 flex items-center justify-center gap-4 md:gap-8">
                <motion.div 
                  key={currentRange.min}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-900 px-6 py-3 rounded-2xl shadow-sm transition-colors duration-500"
                >
                  <span className="text-[10px] block text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mb-1">最小值</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{currentRange.min}</span>
                </motion.div>
                
                <div className="flex flex-col items-center">
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-900"></div>
                  <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold mt-1 uppercase">TO</span>
                </div>

                <motion.div 
                  key={currentRange.max}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-900 px-6 py-3 rounded-2xl shadow-sm transition-colors duration-500"
                >
                  <span className="text-[10px] block text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mb-1">最大值</span>
                  <span className="text-3xl font-black text-rose-500 dark:text-rose-400 font-mono tracking-tighter">{currentRange.max}</span>
                </motion.div>
              </div>
            </div>

            {/* Input Control */}
            <div className="w-full max-w-sm">
              <div className="relative mb-8 group">
                <motion.input 
                  ref={inputRef}
                  type="number"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                  disabled={status !== 'playing'}
                  whileFocus={{ scale: 1.02 }}
                  placeholder="00"
                  className="w-full text-center text-8xl font-black text-slate-900 dark:text-white border-b-4 border-slate-100 dark:border-slate-900 focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none bg-transparent py-4 transition-all placeholder:text-slate-100 dark:placeholder:text-slate-900 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentGuess('')}
                  disabled={status !== 'playing' || !currentGuess}
                  className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  清除
                </button>
                <button 
                  onClick={() => handleGuess()}
                  disabled={status !== 'playing' || !currentGuess}
                  className="h-16 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  送出猜測
                </button>
              </div>
            </div>

            {/* Success/Failure Overlay */}
            <AnimatePresence>
              {status !== 'playing' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-[40px] flex flex-col items-center justify-center z-50 p-8 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white mb-6 shadow-xl ${
                      status === 'won' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    {status === 'won' ? (
                      <Trophy className="w-12 h-12" strokeWidth={3} />
                    ) : (
                      <AlertCircle className="w-12 h-12" strokeWidth={3} />
                    )}
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-2">
                    {status === 'won' ? '完美猜中！' : '遊戲結束'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-500 mb-8 max-w-xs leading-relaxed">
                    {status === 'won' 
                      ? `答案就是 ${targetNumber}。你在 ${guesses.length} 次猜測內完成了挑戰！` 
                      : `可惜機會用完了。正確答案是 ${targetNumber}。`
                    }
                  </p>
                  <button 
                    onClick={initGame}
                    className="px-10 py-4 bg-slate-900 dark:bg-indigo-600 dark:text-white text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> 再玩一次
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Bottom Bar Info */}
      <footer className="h-16 px-4 md:px-12 border-t border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-between text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest shrink-0 z-10 transition-colors duration-500">
        <div className="flex gap-4 md:gap-8 overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-indigo-600">●</span> 玩家等級：{bestScore && bestScore <= 3 ? '猜數字大師' : bestScore && bestScore <= 5 ? '專業破譯員' : '初級學員'}
          </div>
          <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
            <span className="text-emerald-500">●</span> 系統狀態：連線中
          </div>
        </div>
        <div className="whitespace-nowrap">
          Guess Protocol v1.4.0
        </div>
      </footer>

      {/* Winning Particles Effect */}
      {status === 'won' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: '100%',
                scale: 0
              }}
              animate={{ 
                y: '-20%',
                scale: [0, 1, 0.5, 0],
                rotate: 360,
                x: (Math.random() * 100 - 50 + 50) + '%'
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              style={{
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
