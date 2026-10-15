import React, { useState, useEffect, useCallback } from 'react';
import type { PlinkoQuestion, PlinkoHistoryRecord } from '../types/casino.ts';
import { ReturnHomeButton } from './ReturnHomeButton.tsx';
import { PLINKO_DEFAULT_BANK } from '../data/plinkoBank.ts';
import {
  calculatePlinkoStepMultiplier,
  calculatePlinkoPenalty,
} from '../utils/casinoRules.ts';
import { playTickSound, playCorrectChime, playWrongBuzzer, playWinSound } from '../utils/soundEffects.ts';
import { sendAnalyticsEvent } from '../utils/analytics.ts';

interface PlinkoGameProps {
  username: string;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  onReturnHome: () => void;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
  username,
  credits,
  setCredits,
  onReturnHome,
}) => {
  const [history, setHistory] = useState<PlinkoHistoryRecord[]>([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  const [gameState, setGameState] = useState<
    'idle' | 'dropping' | 'question_active' | 'feedback' | 'resuming' | 'settling' | 'round_complete' | 'recovery_mode'
  >('idle');

  const [bet, setBet] = useState<number>(() => (credits >= 100 ? 100 : Math.max(0, credits)));
  const [currentRoundId, setCurrentRoundId] = useState<string>('');
  const [initialBet, setInitialBet] = useState<number>(0);

  const [step, setStep] = useState<number>(0);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 5 });
  const [cameraZoom, setCameraZoom] = useState<boolean>(false);

  const [currentQuestions, setCurrentQuestions] = useState<PlinkoQuestion[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<PlinkoQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [penalties, setPenalties] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [recoveryEarnings, setRecoveryEarnings] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [currentQuestionEventId, setCurrentQuestionEventId] = useState<string>('');

  // Keep bet aligned if credits change
  useEffect(() => {
    if (credits < bet && credits > 0) {
      setBet(credits);
    }
  }, [credits, bet]);

  const getRandomQuestions = useCallback(
    (count: number): PlinkoQuestion[] => {
      let available = PLINKO_DEFAULT_BANK.filter((q) => !usedQuestionIds.includes(q.id));
      if (available.length < count) {
        setUsedQuestionIds([]);
        available = [...PLINKO_DEFAULT_BANK];
      }
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      setUsedQuestionIds((prev) => [...prev, ...selected.map((q) => q.id)]);
      return selected;
    },
    [usedQuestionIds]
  );

  const modifyBet = (amount: number) => {
    if (gameState !== 'idle') return;
    setBet((prev) => {
      const newBet = prev + amount;
      if (newBet < 100) return credits >= 100 ? 100 : Math.max(0, credits);
      if (newBet > credits) return Math.max(0, credits);
      return newBet;
    });
  };

  const handleAllIn = () => {
    if (gameState !== 'idle' || credits <= 0) return;
    setBet(credits);
  };

  const moveToNextIntersection = async (currentStep: number, currentX: number, nextQuestion: PlinkoQuestion) => {
    setBallPos({ x: currentX, y: 15 + currentStep * 18 });
    setCameraZoom(true);
    playTickSound();

    const start = Date.now();
    setQuestionStartTime(start);

    // Send analytics event for presented question
    const eventId = await sendAnalyticsEvent('QUESTION_PRESENTED', 'PLINKO', username, {
      questionId: nextQuestion.id,
      question: nextQuestion.question,
      step: currentStep + 1,
      status: 'PENDIENTE',
    });
    setCurrentQuestionEventId(eventId);

    window.setTimeout(() => {
      setActiveQuestion(nextQuestion);
      setGameState('question_active');
    }, 400);
  };

  const initDrop = (qs: PlinkoQuestion[]) => {
    setCurrentRoundId(`round_${Date.now()}`);
    setStep(0);
    setMultiplier(1.0);
    setPenalties(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setRecoveryEarnings(0);
    setBallPos({ x: 50, y: 5 });
    setCurrentQuestions(qs);
    setGameState('dropping');

    window.setTimeout(() => moveToNextIntersection(0, 50, qs[0]), 800);
  };

  const startRound = () => {
    if (gameState !== 'idle' || credits < 100 || bet <= 0) return;
    setInitialBet(bet);
    setCredits((prev) => Math.max(0, prev - bet));

    sendAnalyticsEvent('BET_PLACED', 'PLINKO', username, {
      betAmount: bet,
      newBalance: Math.max(0, credits - bet),
    });

    const qs = getRandomQuestions(5);
    initDrop(qs);
  };

  const startRecoveryMode = () => {
    if (gameState !== 'idle') return;
    const qs = getRandomQuestions(3);
    setInitialBet(0);
    setGameState('recovery_mode');
    initDrop(qs);
  };

  const handleAnswer = (optionId: string) => {
    if (gameState !== 'question_active' || !activeQuestion) return;
    setGameState('feedback');
    setSelectedOption(optionId);

    const isCorrect = optionId === activeQuestion.correctOptionId;
    const isRecovery = initialBet === 0;
    const responseTimeSec = ((Date.now() - questionStartTime) / 1000).toFixed(1);

    if (isCorrect) {
      playCorrectChime();
    } else {
      playWrongBuzzer();
    }

    if (isRecovery) {
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
        setRecoveryEarnings((prev) => prev + 100);
        setCredits((prev) => prev + 100);
      } else {
        setIncorrectCount((prev) => prev + 1);
      }
    } else {
      let newMultiplier = multiplier;
      if (isCorrect) {
        newMultiplier = calculatePlinkoStepMultiplier(multiplier, true, step);
        setCorrectCount((prev) => prev + 1);
      } else {
        newMultiplier = calculatePlinkoStepMultiplier(multiplier, false, step);
        setIncorrectCount((prev) => prev + 1);

        const penaltyAmount = calculatePlinkoPenalty(initialBet, step);
        setPenalties((prev) => prev + penaltyAmount);
        setCredits((prev) => Math.max(0, prev - penaltyAmount));

        sendAnalyticsEvent('PENALTY_APPLIED', 'PLINKO', username, {
          penalty: penaltyAmount,
          step: step + 1,
          newBalance: Math.max(0, credits - penaltyAmount),
        });
      }
      setMultiplier(newMultiplier);
    }

    const selectedOptObj = activeQuestion.options.find((o) => o.id === optionId);
    const correctOptObj = activeQuestion.options.find((o) => o.id === activeQuestion.correctOptionId);

    sendAnalyticsEvent('QUESTION_ANSWERED', 'PLINKO', username, {
      questionEventId: currentQuestionEventId,
      questionId: activeQuestion.id,
      question: activeQuestion.question,
      step: step + 1,
      selectedOption: optionId,
      selectedText: selectedOptObj?.text || '',
      correctOption: activeQuestion.correctOptionId,
      correctText: correctOptObj?.text || '',
      result: isCorrect ? 'CORRECTA' : 'INCORRECTA',
      feedback: selectedOptObj?.feedback || '',
      responseTimeSec: parseFloat(responseTimeSec),
      status: isCorrect ? 'CORRECTA' : 'INCORRECTA',
    });
  };

  const settleRound = (finalX: number, isRecovery: boolean) => {
    setGameState('settling');
    setBallPos({ x: finalX, y: 95 });

    let netResult = 0;
    let grossPrize = 0;

    if (isRecovery) {
      netResult = recoveryEarnings;
      grossPrize = recoveryEarnings;
    } else {
      grossPrize = Math.round(initialBet * multiplier);
      netResult = grossPrize - initialBet - penalties;
      setCredits((prev) => prev + grossPrize);
    }

    if (netResult > 0) {
      playWinSound();
    }

    const finalHistory: PlinkoHistoryRecord = {
      id: currentRoundId,
      date: new Date().toLocaleTimeString(),
      initialBet,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      finalMultiplier: isRecovery ? 1 : multiplier,
      grossPrize,
      penalties,
      netResult,
      finalBalance: credits + grossPrize,
      isRecovery,
    };

    setHistory((prev) => [finalHistory, ...prev].slice(0, 20));

    sendAnalyticsEvent('PLINKO_SETTLED', 'PLINKO', username, {
      initialBet,
      correctCount,
      incorrectCount,
      finalMultiplier: isRecovery ? 1 : multiplier,
      grossPrize,
      penalties,
      netResult,
      finalBalance: credits + grossPrize,
      isRecovery,
    });

    window.setTimeout(() => {
      setGameState('round_complete');
    }, 1000);
  };

  const handleContinue = () => {
    setGameState('resuming');
    setSelectedOption(null);
    setCameraZoom(false);
    setActiveQuestion(null);

    const nextStep = step + 1;
    const isCorrect = selectedOption === currentQuestions[step]?.correctOptionId;

    let nextX = isCorrect ? ballPos.x + 12 : ballPos.x - 12;
    nextX = Math.max(10, Math.min(90, nextX));

    setStep(nextStep);

    const maxSteps = initialBet === 0 ? 3 : 5;

    if (nextStep < maxSteps) {
      window.setTimeout(() => {
        setGameState('dropping');
        moveToNextIntersection(nextStep, nextX, currentQuestions[nextStep]);
      }, 500);
    } else {
      window.setTimeout(() => settleRound(nextX, initialBet === 0), 500);
    }
  };

  const isZoomed = cameraZoom && gameState !== 'round_complete';
  const scale = isZoomed ? 'scale(1.5)' : 'scale(1)';
  const translateY = isZoomed ? `translateY(-${step * 14}%)` : 'translateY(0)';

  return (
    <div className="relative min-h-screen bg-[#09090F] text-white font-sans p-3 pt-18 sm:p-6 sm:pt-20 select-none">
      <ReturnHomeButton onReturn={onReturnHome} />

      {/* Header bar with Username and Credits visible at all times */}
      <header className="max-w-6xl mx-auto flex flex-wrap justify-between items-center bg-[#151521] p-4 sm:p-5 rounded-2xl border border-[#29293B] mb-6 shadow-xl gap-3">
        <div className="flex items-center gap-4 sm:gap-6">
          <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 drop-shadow-md">
            PLINKO ARCADE
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="text-xs font-bold text-neutral-300 hover:text-white px-2.5 py-1.5 bg-[#29293B] hover:bg-[#38384f] rounded-lg transition-colors cursor-pointer"
            >
              REGLAS
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="text-xs font-bold text-neutral-300 hover:text-white px-2.5 py-1.5 bg-[#29293B] hover:bg-[#38384f] rounded-lg transition-colors cursor-pointer"
            >
              HISTORIAL
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs sm:text-sm text-neutral-300">
            Jugador: <strong className="text-white font-bold">{username}</strong>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Saldo</span>
            <span className="text-xl sm:text-3xl font-black font-mono drop-shadow text-emerald-400">
              ${credits.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container - On mobile, board is order-1, controls are order-2 */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Side / Mobile Top: Plinko Pegboard or Round Complete */}
        <section className="order-1 lg:order-2 lg:col-span-8">
          {gameState === 'round_complete' ? (
            <div className="w-full h-[620px] bg-[#151521] border-2 border-amber-400/70 rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-black text-amber-300 mb-8 tracking-widest uppercase">
                Liquidación de Ronda
              </h2>

              <div className="w-full max-w-xl grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#09090F] p-5 rounded-xl border border-[#29293B]">
                  <span className="text-xs text-neutral-400 block font-bold uppercase mb-1">Apuesta Inicial</span>
                  <span className="font-mono text-2xl font-black">${initialBet}</span>
                </div>
                <div className="bg-[#09090F] p-5 rounded-xl border border-[#29293B]">
                  <span className="text-xs text-neutral-400 block font-bold uppercase mb-1">Premio Bruto</span>
                  <span className="font-mono text-2xl font-black text-emerald-400">
                    ${initialBet === 0 ? recoveryEarnings : Math.round(initialBet * multiplier)}
                  </span>
                </div>
                <div className="bg-[#09090F] p-5 rounded-xl border border-[#29293B]">
                  <span className="text-xs text-neutral-400 block font-bold uppercase mb-1">Penalizaciones</span>
                  <span className="font-mono text-2xl font-black text-red-400">-${penalties}</span>
                </div>
                <div className="bg-[#09090F] p-5 rounded-xl border border-amber-400/40">
                  <span className="text-xs text-amber-300 block font-bold uppercase mb-1">Retorno Final</span>
                  <span className="font-black text-3xl font-mono text-amber-300">
                    x{initialBet === 0 ? 1 : multiplier.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGameState('idle')}
                className="w-full max-w-xl py-4 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-black text-lg rounded-xl shadow-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
              >
                NUEVA JUGADA
              </button>
            </div>
          ) : (
            <div className="relative w-full h-[620px] bg-[#09090F] border-2 border-[#29293B] rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(41,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(41,41,59,0.3)_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Pegboard and Ball */}
              <div
                className="absolute w-full h-full transition-transform duration-700 ease-in-out"
                style={{
                  transform: `${scale} ${translateY}`,
                  transformOrigin: `${ballPos.x}% ${ballPos.y}%`,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                  <div
                    key={row}
                    className="absolute w-full flex justify-center gap-[9%]"
                    style={{ top: `${row * 13}%` }}
                  >
                    {Array.from({ length: row + 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full bg-[#151521] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      />
                    ))}
                  </div>
                ))}

                <div
                  className="absolute w-8 h-8 rounded-full bg-white shadow-[0_0_20px_#ffffff,inset_0_0_10px_#cbd5e1] transition-all duration-500 z-20"
                  style={{ left: `calc(${ballPos.x}% - 16px)`, top: `${ballPos.y}%` }}
                />
              </div>

              {/* Question Modal at Intersection - Responsive & Never Cut Off */}
              {(gameState === 'question_active' || gameState === 'feedback') && activeQuestion && (
                <div className="absolute inset-0 bg-[#09090F]/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-3 sm:p-5 animate-fade-in overflow-hidden">
                  <div className="w-full max-w-xl max-h-[88vh] bg-[#151521] border border-[#29293B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
                    {/* Header */}
                    <div className="flex justify-between items-center px-5 py-3 border-b border-[#29293B] shrink-0 bg-[#10101b]">
                      <span className="text-cyan-400 font-bold tracking-widest text-xs uppercase">
                        Intersección {step + 1} de {initialBet === 0 ? 3 : 5}
                      </span>
                      {initialBet > 0 && (
                        <span className="text-amber-300 font-black text-base sm:text-lg font-mono">
                          x{multiplier.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
                      <h2 className="text-white text-xs sm:text-sm leading-relaxed font-medium bg-[#0c0c14] p-3 rounded-xl border border-neutral-800">
                        {activeQuestion.question}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeQuestion.options.map((opt) => {
                          const isSelected = selectedOption === opt.id;
                          const isCorrectAnswer = opt.id === activeQuestion.correctOptionId;

                          let btnStyle = 'bg-[#09090F] border-[#29293B] text-neutral-300 hover:border-cyan-400 hover:text-white';

                          if (gameState === 'feedback') {
                            if (isCorrectAnswer) {
                              btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                            } else if (isSelected && !isCorrectAnswer) {
                              btnStyle = 'bg-red-950/60 border-red-500 text-red-200 ring-2 ring-red-500/50';
                            } else {
                              btnStyle = 'bg-[#09090F] border-[#29293B] opacity-30';
                            }
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={gameState === 'feedback'}
                              onClick={() => handleAnswer(opt.id)}
                              className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${btnStyle}`}
                            >
                              <div className="font-black text-xs text-cyan-400 mb-0.5">{opt.id}.</div>
                              <div className="text-xs leading-normal">{opt.text}</div>
                            </button>
                          );
                        })}
                      </div>

                      {gameState === 'feedback' && (
                        <div
                          className={`p-3.5 rounded-xl border-l-4 text-xs animate-fade-in ${
                            selectedOption === activeQuestion.correctOptionId
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                              : 'bg-red-950/40 border-red-500 text-red-200'
                          }`}
                        >
                          <span className="font-bold text-xs block mb-1">
                            {selectedOption === activeQuestion.correctOptionId ? '¡RESPUESTA CORRECTA!' : 'RESPUESTA INCORRECTA'}
                          </span>
                          <p className="leading-relaxed">
                            {activeQuestion.options.find((o) => o.id === selectedOption)?.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Fixed Action Footer */}
                    {gameState === 'feedback' && (
                      <div className="p-3.5 sm:p-4 bg-[#0d0d17] border-t border-[#29293B] shrink-0">
                        <button
                          type="button"
                          onClick={handleContinue}
                          className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-black rounded-xl uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-lg active:scale-[0.98]"
                        >
                          CONTINUAR DESCENSO
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Left Side: Bet & Multiplier Controls */}
        <aside className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#151521] p-6 rounded-2xl border border-[#29293B] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-cyan-400" />
            <h3 className="text-xs text-neutral-400 mb-4 uppercase tracking-widest font-bold">
              Control de Apuesta
            </h3>

            <div className="flex items-center justify-between bg-[#09090F] rounded-xl p-2 mb-4 border border-[#29293B] shadow-inner">
              <button
                type="button"
                onClick={() => modifyBet(-100)}
                disabled={gameState !== 'idle' || credits < 100}
                className="w-11 h-11 bg-[#151521] hover:bg-[#29293B] text-xl font-bold rounded-lg disabled:opacity-30 cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-3xl font-black text-amber-300">${bet.toLocaleString()}</span>
              <button
                type="button"
                onClick={() => modifyBet(100)}
                disabled={gameState !== 'idle' || bet + 100 > credits || credits < 100}
                className="w-11 h-11 bg-[#151521] hover:bg-[#29293B] text-xl font-bold rounded-lg disabled:opacity-30 cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAllIn}
              disabled={gameState !== 'idle' || credits <= 0}
              className="w-full py-3 mb-4 font-black text-lg tracking-widest rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-95 text-white shadow-lg transition-all cursor-pointer disabled:opacity-30"
            >
              ALL IN
            </button>

            <button
              type="button"
              onClick={startRound}
              disabled={gameState !== 'idle' || credits < 100}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-neutral-950 font-black text-xl rounded-xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-30"
            >
              SOLTAR BOLA
            </button>

            {credits < 100 && gameState === 'idle' && (
              <div className="mt-4 p-4 border border-amber-400/50 bg-amber-400/10 rounded-xl text-center">
                <span className="text-amber-300 text-xs block mb-2 font-bold uppercase tracking-wider">
                  ⚠️ Saldo insuficiente
                </span>
                <p className="text-[11px] text-neutral-300 mb-2.5">
                  Puedes ganar créditos en el botón CRÉDITOS del inicio o jugar el reto de recuperación sin costo:
                </p>
                <button
                  type="button"
                  onClick={startRecoveryMode}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black py-2.5 px-3 rounded-lg text-xs uppercase tracking-wide cursor-pointer"
                >
                  RETO DE RECUPERACIÓN (3 PREGUNTAS)
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#151521] p-6 rounded-2xl border border-[#29293B] flex-1 flex flex-col justify-center items-center shadow-xl">
            <h3 className="text-xs text-neutral-400 mb-2 uppercase tracking-widest font-bold">
              Multiplicador Actual
            </h3>
            <div
              className={`text-6xl font-black font-mono tracking-tighter ${
                initialBet === 0 ? 'text-neutral-400' : 'text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.5)]'
              }`}
            >
              x{multiplier.toFixed(2)}
            </div>
            {gameState !== 'idle' && (
              <div className="mt-5 w-full flex justify-between px-4 text-xs font-bold bg-[#09090F] py-2.5 rounded-lg border border-[#29293B]">
                <span className="text-emerald-400">Aciertos: {correctCount}</span>
                <span className="text-red-400">Errores: {incorrectCount}</span>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#151521] border border-[#29293B] rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#29293B] flex justify-between items-center">
              <h2 className="text-xl font-bold">Historial de Rondas</h2>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-neutral-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 border-b border-[#29293B]">
                    <th className="pb-3">Hora</th>
                    <th className="pb-3">Apuesta</th>
                    <th className="pb-3">Multiplicador</th>
                    <th className="pb-3">Penalización</th>
                    <th className="pb-3">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#29293B]/50 font-mono">
                  {history.map((r, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="py-2.5 text-neutral-400">{r.date}</td>
                      <td className="py-2.5">{r.isRecovery ? 'RETO' : `$${r.initialBet}`}</td>
                      <td className="py-2.5 text-amber-300 font-bold">x{r.finalMultiplier.toFixed(2)}</td>
                      <td className="py-2.5 text-red-400">-${r.penalties}</td>
                      <td className={`py-2.5 font-bold ${r.netResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.netResult >= 0 ? `+$${r.netResult}` : `-$${Math.abs(r.netResult)}`}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
                        No hay jugadas registradas aún en esta sesión.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#151521] border border-[#29293B] rounded-2xl w-full max-w-xl max-h-[75vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#29293B] flex justify-between items-center">
              <h2 className="text-xl font-bold">Reglas de Plinko</h2>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="text-neutral-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 text-neutral-300 space-y-4 text-xs leading-relaxed">
              <p>
                <strong>1. Apuesta Inicial:</strong> Ajusta tu apuesta o juega ALL IN. La bola caerá a través de una pirámide con 5 intersecciones.
              </p>
              <p>
                <strong>2. Desafíos Formativos:</strong> En cada intersección, responderás una pregunta científica preventiva sobre la salud cerebral y hábitos saludables.
              </p>
              <p>
                <strong>3. Multiplicadores y Penalizaciones:</strong> Cada acierto desvía la bola favorablemente y multiplica tu ganancia hasta x10. Cada error reduce el multiplicador y descuenta una penalización proporcional (2% a 12%).
              </p>
              <p>
                <strong>4. Reto de Recuperación:</strong> Si tus créditos bajan de 100, se habilita una ronda especial sin costo de 3 preguntas para recuperar saldo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
