import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReturnHomeButton } from './ReturnHomeButton.tsx';
import { ROULETTE_MULTIPLIERS } from '../utils/casinoRules.ts';
import { PREGUNTAS_RETIRAR, RetirarQuestion } from '../data/preguntasRetirar.ts';
import { playTickSound, playWinSound, playLoseSound, playCorrectChime, playWrongBuzzer } from '../utils/soundEffects.ts';
import { sendAnalyticsEvent } from '../utils/analytics.ts';

interface RouletteGameProps {
  username: string;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  onReturnHome: () => void;
}

export const RouletteGame: React.FC<RouletteGameProps> = ({
  username,
  credits,
  setCredits,
  onReturnHome,
}) => {
  const [bet, setBet] = useState<number>(() => (credits >= 100 ? 100 : Math.max(0, credits)));
  const [selectedMult, setSelectedMult] = useState<string>('x2');
  const [accumulated, setAccumulated] = useState<number>(0);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [arcOffset, setArcOffset] = useState<number>(0);
  const [isAllInActive, setIsAllInActive] = useState<boolean>(false);

  // Withdraw Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawQuestion, setWithdrawQuestion] = useState<RetirarQuestion | null>(null);
  const [usedRetirarQuestionIds, setUsedRetirarQuestionIds] = useState<number[]>([]);
  const [withdrawSelectedOption, setWithdrawSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [withdrawFeedback, setWithdrawFeedback] = useState<string | null>(null);
  const [withdrawIsCorrect, setWithdrawIsCorrect] = useState<boolean | null>(null);
  const [withdrawQuestionStartTime, setWithdrawQuestionStartTime] = useState<number>(Date.now());
  const [withdrawQuestionEventId, setWithdrawQuestionEventId] = useState<string>('');

  const resultTimeoutRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const allInTimeoutRef = useRef<number | null>(null);

  const currentMult = ROULETTE_MULTIPLIERS[selectedMult] || ROULETTE_MULTIPLIERS.x2;

  // Keep bet aligned if credits change
  useEffect(() => {
    if (credits < bet && credits > 0) {
      setBet(credits);
    }
  }, [credits, bet]);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (allInTimeoutRef.current) clearTimeout(allInTimeoutRef.current);
    };
  }, []);

  const adjustBet = (amount: number) => {
    if (isSpinning) return;
    setBet((prev) => {
      const newBet = prev + amount;
      if (newBet < 100) return credits >= 100 ? 100 : Math.max(0, credits);
      if (newBet > credits) return Math.max(0, credits);
      return newBet;
    });
  };

  const handleAllIn = () => {
    if (isSpinning || credits <= 0) return;
    setBet(credits);
    setIsAllInActive(true);
    if (allInTimeoutRef.current) clearTimeout(allInTimeoutRef.current);
    allInTimeoutRef.current = window.setTimeout(() => {
      setIsAllInActive(false);
    }, 2000);
  };

  const handleSpin = () => {
    if (isSpinning || credits < bet || bet <= 0) return;

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }
    setResult(null);
    setIsSpinning(true);

    // Strictly deduct bet from shared bankroll immediately
    const currentBetAmount = bet;
    setCredits((prev) => Math.max(0, prev - currentBetAmount));

    sendAnalyticsEvent('BET_PLACED', 'RULETA', username, {
      betAmount: currentBetAmount,
      multiplier: selectedMult,
      newBalance: Math.max(0, credits - currentBetAmount),
    });

    playTickSound();

    const newArcOffset = Math.floor(Math.random() * 360);
    setArcOffset(newArcOffset);

    const isWin = Math.random() <= currentMult.prob;
    const wedgeAngle = currentMult.prob * 360;

    let targetAngleInCircle: number;
    if (isWin) {
      targetAngleInCircle = newArcOffset + 3 + Math.random() * (wedgeAngle - 6);
    } else {
      targetAngleInCircle = newArcOffset + wedgeAngle + 3 + Math.random() * (360 - wedgeAngle - 6);
    }

    targetAngleInCircle = targetAngleInCircle % 360;

    const fullSpins = 360 * 6;
    const currentMod = rotation % 360;
    let targetRotation = rotation + fullSpins + targetAngleInCircle - currentMod;

    if (targetRotation < rotation + fullSpins) {
      targetRotation += 360;
    }

    setRotation(targetRotation);

    spinTimeoutRef.current = window.setTimeout(() => {
      if (isWin) {
        const winnings = currentBetAmount * currentMult.val;
        setAccumulated((prev) => prev + winnings);
        setResult('win');
        playWinSound();

        sendAnalyticsEvent('SPIN_COMPLETED', 'RULETA', username, {
          result: 'WIN',
          winnings,
          accumulated: accumulated + winnings,
          multiplier: selectedMult,
        });
      } else {
        setResult('lose');
        playLoseSound();

        sendAnalyticsEvent('SPIN_COMPLETED', 'RULETA', username, {
          result: 'LOSE',
          loss: currentBetAmount,
          multiplier: selectedMult,
        });
      }
      setIsSpinning(false);

      resultTimeoutRef.current = window.setTimeout(() => {
        setResult(null);
      }, 5000);
    }, 5000);
  };

  // Withdraw Question Logic from PREGUNTAS_RETIRAR
  const getNextWithdrawQuestion = useCallback((): RetirarQuestion => {
    let available = PREGUNTAS_RETIRAR.filter((q) => !usedRetirarQuestionIds.includes(q.id));
    if (available.length === 0) {
      setUsedRetirarQuestionIds([]);
      available = [...PREGUNTAS_RETIRAR];
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];
    setUsedRetirarQuestionIds((prev) => [...prev, chosen.id]);
    return chosen;
  }, [usedRetirarQuestionIds]);

  const handleOpenWithdraw = async () => {
    if (accumulated <= 0 || isSpinning) return;
    const q = getNextWithdrawQuestion();
    setWithdrawQuestion(q);
    setWithdrawSelectedOption(null);
    setWithdrawFeedback(null);
    setWithdrawIsCorrect(null);
    setWithdrawQuestionStartTime(Date.now());
    setIsWithdrawModalOpen(true);

    const eventId = await sendAnalyticsEvent('QUESTION_PRESENTED', 'RULETA', username, {
      questionId: `retirar_${q.id}`,
      question: q.question,
      status: 'PENDIENTE',
      accumulatedAmount: accumulated,
    });
    setWithdrawQuestionEventId(eventId);
  };

  const handleAnswerWithdraw = async (optionId: 'A' | 'B' | 'C' | 'D') => {
    if (!withdrawQuestion || withdrawFeedback !== null) return;
    setWithdrawSelectedOption(optionId);

    const isCorrect = optionId === withdrawQuestion.correctOptionId;
    const selectedOptObj = withdrawQuestion.options.find((o) => o.id === optionId);
    const correctOptObj = withdrawQuestion.options.find((o) => o.id === withdrawQuestion.correctOptionId);
    const responseTimeSec = ((Date.now() - withdrawQuestionStartTime) / 1000).toFixed(1);

    setWithdrawFeedback(selectedOptObj?.feedback || '');
    setWithdrawIsCorrect(isCorrect);

    if (isCorrect) {
      playCorrectChime();
    } else {
      playWrongBuzzer();
    }

    sendAnalyticsEvent('QUESTION_ANSWERED', 'RULETA', username, {
      questionEventId: withdrawQuestionEventId,
      questionId: `retirar_${withdrawQuestion.id}`,
      question: withdrawQuestion.question,
      selectedOption: optionId,
      selectedText: selectedOptObj?.text || '',
      correctOption: withdrawQuestion.correctOptionId,
      correctText: correctOptObj?.text || '',
      result: isCorrect ? 'CORRECTA' : 'INCORRECTA',
      feedback: selectedOptObj?.feedback || '',
      responseTimeSec: parseFloat(responseTimeSec),
      creditsAwarded: 0,
      status: isCorrect ? 'CORRECTA' : 'INCORRECTA',
    });
  };

  const handleConfirmWithdraw = () => {
    if (!withdrawIsCorrect || accumulated <= 0) return;
    const amountToWithdraw = accumulated;
    setCredits((prev) => prev + amountToWithdraw);
    setAccumulated(0);
    setIsWithdrawModalOpen(false);
    playWinSound();

    sendAnalyticsEvent('WITHDRAW_COMPLETED', 'RULETA', username, {
      amount: amountToWithdraw,
      newBalance: credits + amountToWithdraw,
    });
  };

  const handleRetryWithdrawQuestion = async () => {
    const nextQ = getNextWithdrawQuestion();
    setWithdrawQuestion(nextQ);
    setWithdrawSelectedOption(null);
    setWithdrawFeedback(null);
    setWithdrawIsCorrect(null);
    setWithdrawQuestionStartTime(Date.now());

    const eventId = await sendAnalyticsEvent('QUESTION_PRESENTED', 'RULETA', username, {
      questionId: `retirar_${nextQ.id}`,
      question: nextQ.question,
      status: 'PENDIENTE',
      accumulatedAmount: accumulated,
    });
    setWithdrawQuestionEventId(eventId);
  };

  let rouletteBorderClass = 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]';
  if (result === 'win') rouletteBorderClass = 'border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)] animate-pulse';
  if (result === 'lose') rouletteBorderClass = 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]';

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-200 font-mono flex flex-col items-center justify-center py-12 px-4 select-none">
      <ReturnHomeButton onReturn={onReturnHome} />

      {/* Top Credits Bar with Player Username visible at all times */}
      <div className="mb-6 bg-slate-800/90 px-8 py-3 rounded-full border border-slate-700 shadow-xl backdrop-blur-md flex items-center gap-6">
        <div className="text-xs sm:text-sm text-neutral-300 font-sans">
          Jugador: <strong className="text-white font-bold">{username}</strong>
        </div>
        <div className="text-xl sm:text-2xl text-slate-300 font-bold tracking-wider">
          CRÉDITOS: <span className="text-amber-400 font-mono font-black">${credits.toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full max-w-[1100px] overflow-x-auto pb-6">
        <div className="min-w-[850px] flex flex-col gap-8 mx-auto px-4">
          {/* Main 3-Column Display: Bet | Wheel | Potential */}
          <div className="flex flex-row items-center justify-between gap-6 w-full">
            {/* Column 1: Apuesta */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-between w-64 h-[300px] shadow-2xl">
              <h2 className="text-base text-slate-400 text-center tracking-widest font-bold bg-slate-900/90 px-4 py-1.5 rounded-lg border border-slate-700">
                APUESTA
              </h2>
              <div className="text-6xl drop-shadow-md">🪙</div>
              <div className="flex items-center gap-2 bg-slate-950/90 p-2 rounded-xl border border-slate-700 shadow-inner w-full justify-between">
                <button
                  type="button"
                  onClick={() => adjustBet(-100)}
                  disabled={isSpinning || bet <= 100 || credits < 100}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-2xl font-bold flex items-center justify-center transition-colors border border-slate-600 cursor-pointer"
                >
                  -
                </button>
                <div className="text-2xl w-24 text-center font-black text-amber-400 font-mono">
                  {bet}
                </div>
                <button
                  type="button"
                  onClick={() => adjustBet(100)}
                  disabled={isSpinning || bet >= credits || credits < 100}
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-2xl font-bold flex items-center justify-center transition-colors border border-slate-600 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Column 2: Roulette Center Wheel */}
            <div className="flex flex-col items-center relative shrink-0 z-10">
              <div
                className={`relative w-[320px] h-[320px] rounded-full border-[6px] bg-slate-950 flex flex-col items-center justify-center transition-all duration-500 ${rouletteBorderClass}`}
              >
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full transform -rotate-90 absolute inset-0 rounded-full z-0"
                >
                  {Array.from({ length: 36 }).map((_, i) => {
                    const isRed = i % 2 === 0;
                    const tickColor = isRed ? '#ef4444' : '#334155';
                    return (
                      <line
                        key={i}
                        x1="100"
                        y1="6"
                        x2="100"
                        y2="18"
                        stroke={tickColor}
                        strokeWidth="3.5"
                        transform={`rotate(${i * 10} 100 100)`}
                      />
                    );
                  })}

                  <circle cx="100" cy="100" r="76" fill="#0f172a" />

                  <circle
                    cx="100"
                    cy="100"
                    r="76"
                    fill="none"
                    stroke={currentMult.color}
                    strokeWidth="10"
                    strokeDasharray={`${currentMult.prob * (2 * Math.PI * 76)} ${2 * Math.PI * 76}`}
                    strokeLinecap="butt"
                    transform={`rotate(${arcOffset} 100 100)`}
                    className="transition-transform duration-500 ease-out"
                    style={{ filter: currentMult.glow }}
                  />
                </svg>

                {/* Central Overlay Info & All-in */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <span className={`text-5xl font-bold drop-shadow-lg font-mono ${currentMult.labelClass}`}>
                    {(currentMult.prob * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-400 text-xs tracking-widest mt-1 mb-3 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    PROBABILIDAD
                  </span>

                  <button
                    type="button"
                    onClick={handleAllIn}
                    disabled={isSpinning || credits <= 0}
                    className={`pointer-events-auto px-6 py-2 rounded-full font-bold text-sm tracking-wider uppercase transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 ${
                      isAllInActive
                        ? 'bg-amber-400 text-black shadow-[0_0_20px_#f59e0b] animate-bounce'
                        : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                    }`}
                  >
                    ALL IN
                  </button>
                </div>

                {/* Spinning Needle Pointer */}
                <div
                  className="absolute inset-0 z-20 pointer-events-none transition-transform duration-[5000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-lg" />
                </div>

                {/* Win / Lose Result Notification Overlay */}
                {result && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-slate-950/80 rounded-full backdrop-blur-sm animate-fade-in">
                    <span
                      className={`text-5xl font-black tracking-widest ${
                        result === 'win' ? 'text-green-400 drop-shadow-[0_0_20px_#22c55e]' : 'text-red-500'
                      }`}
                    >
                      {result === 'win' ? 'WIN!' : 'LOSE'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Ganancia Potencial */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-between w-64 h-[300px] shadow-2xl">
              <h2 className="text-base text-slate-400 text-center tracking-widest font-bold bg-slate-900/90 px-4 py-1.5 rounded-lg border border-slate-700">
                GANANCIA POTENCIAL
              </h2>
              <div className="text-6xl drop-shadow-md">💵</div>
              <div className="bg-slate-950/90 py-3.5 w-full text-center rounded-xl border border-slate-700 shadow-inner">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  ${(bet * currentMult.val).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-row items-center justify-between gap-6 bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-2xl w-full backdrop-blur-md">
            {/* Button TIRAR */}
            <div className="flex-1 flex justify-start">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || credits < bet || bet <= 0}
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:opacity-40 text-neutral-950 font-black text-2xl tracking-widest rounded-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-200/50"
              >
                {isSpinning ? 'GIRANDO...' : 'TIRAR'}
              </button>
            </div>

            {/* Acumulado / Retirar con Pregunta */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-slate-950/90 px-6 py-4 rounded-xl border border-slate-700 w-full max-w-[280px] text-center shadow-inner flex flex-col gap-1.5">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Acumulado de Ronda
                </div>
                <div className="text-3xl text-green-400 font-black font-mono">
                  ${accumulated.toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={handleOpenWithdraw}
                  disabled={accumulated === 0 || isSpinning}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold tracking-wider rounded-lg transition-colors border border-emerald-400/40 shadow cursor-pointer text-xs uppercase"
                >
                  RETIRAR GANANCIAS
                </button>
              </div>
            </div>

            {/* Selector de Multiplicadores */}
            <div className="flex-1 flex justify-end gap-2.5">
              {Object.entries(ROULETTE_MULTIPLIERS).map(([key, data]) => {
                const isSelected = selectedMult === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !isSpinning && setSelectedMult(key)}
                    disabled={isSpinning}
                    className={`w-16 sm:w-20 h-20 flex flex-col items-center justify-center rounded-xl transition-all shadow-lg cursor-pointer ${
                      isSelected
                        ? 'bg-slate-700 border-2 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-slate-950/80 border border-slate-700 opacity-75 hover:opacity-100 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`text-2xl font-black ${data.labelClass}`}>{key}</span>
                    <span className="text-[11px] text-slate-400 mt-1 font-sans">
                      {data.prob * 100}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {credits < bet && !isSpinning && (
            <div className="text-center text-red-400 font-bold text-sm tracking-wide bg-red-950/40 p-3 rounded-xl border border-red-500/30">
              ⚠️ Créditos insuficientes para la apuesta actual (${bet}). Ve al botón CRÉDITOS en la pantalla principal para ganar saldo respondiendo preguntas.
            </div>
          )}
        </div>
      </div>

      {/* WITHDRAW EDUCATIONAL VALIDATION MODAL - RESPONSIVE & NEVER CUT OFF */}
      {isWithdrawModalOpen && withdrawQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fade-in font-sans overflow-hidden">
          <div className="w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] bg-[#151521] border-2 border-amber-400/80 rounded-2xl shadow-2xl flex flex-col text-white overflow-hidden">
            {/* 1. Fixed Header */}
            <div className="flex items-center justify-between border-b border-[#29293B] px-5 py-3.5 sm:px-6 shrink-0 bg-[#11111c]">
              <div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  Validación para Retiro de Ganancias
                </span>
                <span className="text-[11px] text-neutral-400">
                  Responde correctamente para transferir al saldo total
                </span>
              </div>
              <span className="font-mono text-sm sm:text-base font-black text-emerald-400 bg-emerald-950/80 px-3.5 py-1 rounded-full border border-emerald-500/50 shadow-inner">
                Monto: ${accumulated.toLocaleString()}
              </span>
            </div>

            {/* 2. Scrollable Body: Question, Options, and Detailed Feedback */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pr-3 sm:pr-5 custom-scrollbar">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Para cobrar tus créditos ganados en la ruleta a tu saldo total, responde correctamente la siguiente pregunta del banco educativo:
              </p>

              <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed bg-[#0c0c14] p-3.5 rounded-xl border border-neutral-800">
                {withdrawQuestion.question}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {withdrawQuestion.options.map((opt) => {
                  const isSelected = withdrawSelectedOption === opt.id;
                  const isCorrect = opt.id === withdrawQuestion.correctOptionId;

                  let btnClass = 'bg-[#09090F] border-[#29293B] text-neutral-300 hover:border-amber-400/60';

                  if (withdrawFeedback !== null) {
                    if (isCorrect) {
                      btnClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                    } else if (isSelected && !isCorrect) {
                      btnClass = 'bg-red-950/60 border-red-500 text-red-200 ring-2 ring-red-500/50';
                    } else {
                      btnClass = 'bg-[#09090F] border-[#29293B] opacity-40';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={withdrawFeedback !== null}
                      onClick={() => handleAnswerWithdraw(opt.id)}
                      className={`text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${btnClass}`}
                    >
                      <div className="font-black text-xs text-amber-400 mb-0.5">{opt.id}.</div>
                      <div className="text-xs sm:text-sm">{opt.text}</div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Block (Cleanly inside the scrollable container) */}
              {withdrawFeedback !== null && (
                <div
                  className={`p-4 rounded-xl border-l-4 text-xs sm:text-sm leading-relaxed animate-fade-in ${
                    withdrawIsCorrect
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                      : 'bg-red-950/50 border-red-500 text-red-200'
                  }`}
                >
                  <strong className="block mb-1 font-bold">
                    {withdrawIsCorrect
                      ? '¡RESPUESTA CORRECTA! Retiro autorizado.'
                      : 'RESPUESTA INCORRECTA.'}
                  </strong>
                  <p>{withdrawFeedback}</p>
                  {!withdrawIsCorrect && (
                    <p className="mt-2 text-amber-300 font-semibold">
                      Intenta otra vez. Responde correctamente para continuar con el retiro de tus créditos.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 3. Sticky Action Footer (ALWAYS 100% VISIBLE, NEVER CUT OFF!) */}
            <div className="p-3.5 sm:p-5 bg-[#0d0d17] border-t border-[#29293B] shrink-0">
              {withdrawFeedback !== null ? (
                <div>
                  {withdrawIsCorrect ? (
                    <button
                      type="button"
                      onClick={handleConfirmWithdraw}
                      className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>✓ CONTINUAR PARA RETIRAR (${accumulated.toLocaleString()})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRetryWithdrawQuestion}
                      className="w-full py-3 sm:py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      ↻ INTENTA OTRA VEZ (PROBAR CON OTRA PREGUNTA)
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-400">Selecciona tu respuesta para validar</span>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-neutral-800"
                  >
                    Cancelar retiro por ahora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
