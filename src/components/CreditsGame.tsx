import React, { useState, useEffect, useCallback } from 'react';
import { ReturnHomeButton } from './ReturnHomeButton.tsx';
import { PREGUNTAS_RETIRAR, RetirarQuestion } from '../data/preguntasRetirar.ts';
import { calculateCreditsRacha } from '../utils/casinoRules.ts';
import { playCorrectChime, playWrongBuzzer, playWinSound } from '../utils/soundEffects.ts';
import { sendAnalyticsEvent } from '../utils/analytics.ts';
import { Sparkles, Award, ArrowRight, RotateCcw } from 'lucide-react';

interface CreditsGameProps {
  username: string;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  onReturnHome: () => void;
}

export const CreditsGame: React.FC<CreditsGameProps> = ({
  username,
  credits,
  setCredits,
  onReturnHome,
}) => {
  const [racha, setRacha] = useState<number>(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<number[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<RetirarQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [lastReward, setLastReward] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [currentQuestionEventId, setCurrentQuestionEventId] = useState<string>('');

  // Fisher-Yates draw without replacement
  const getNextQuestion = useCallback((): RetirarQuestion => {
    let available = PREGUNTAS_RETIRAR.filter((q) => !usedQuestionIds.includes(q.id));
    if (available.length === 0) {
      setUsedQuestionIds([]);
      available = [...PREGUNTAS_RETIRAR];
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];
    setUsedQuestionIds((prev) => [...prev, chosen.id]);
    return chosen;
  }, [usedQuestionIds]);

  const loadNewQuestion = useCallback(async () => {
    const q = getNextQuestion();
    setActiveQuestion(q);
    setSelectedOption(null);
    setIsAnswered(false);
    setLastReward(0);
    const start = Date.now();
    setQuestionStartTime(start);

    // Send analytics: Question presented with PENDIENTE status
    const eventId = await sendAnalyticsEvent('QUESTION_PRESENTED', 'CREDITOS', username, {
      questionId: `retirar_${q.id}`,
      question: q.question,
      status: 'PENDIENTE',
      rachaCurrent: racha,
    });
    setCurrentQuestionEventId(eventId);
  }, [getNextQuestion, racha, username]);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const handleSelectOption = async (optionId: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || !activeQuestion) return;
    setIsAnswered(true);
    setSelectedOption(optionId);

    const isCorrect = optionId === activeQuestion.correctOptionId;
    const responseTimeSec = ((Date.now() - questionStartTime) / 1000).toFixed(1);
    const { newRacha, reward } = calculateCreditsRacha(racha, isCorrect);

    setLastReward(reward);
    setRacha(newRacha);

    if (isCorrect) {
      playCorrectChime();
      playWinSound();
      setCredits((prev) => prev + reward);
    } else {
      playWrongBuzzer();
    }

    const selectedOptObj = activeQuestion.options.find((o) => o.id === optionId);
    const correctOptObj = activeQuestion.options.find((o) => o.id === activeQuestion.correctOptionId);

    // Update Analytics: Question Answered
    sendAnalyticsEvent('QUESTION_ANSWERED', 'CREDITOS', username, {
      questionEventId: currentQuestionEventId,
      questionId: `retirar_${activeQuestion.id}`,
      question: activeQuestion.question,
      selectedOption: optionId,
      selectedText: selectedOptObj?.text || '',
      correctOption: activeQuestion.correctOptionId,
      correctText: correctOptObj?.text || '',
      result: isCorrect ? 'CORRECTA' : 'INCORRECTA',
      feedback: selectedOptObj?.feedback || '',
      responseTimeSec: parseFloat(responseTimeSec),
      rachaBefore: racha,
      rachaAfter: newRacha,
      creditsAwarded: reward,
      status: isCorrect ? 'CORRECTA' : 'INCORRECTA',
    });

    if (reward > 0) {
      sendAnalyticsEvent('CREDITS_AWARDED', 'CREDITOS', username, {
        reward,
        newBalance: credits + reward,
        racha: newRacha,
      });
    }
  };

  const nextPotentialReward = Math.min((racha + 1) * 20, 100);

  return (
    <div className="relative min-h-screen bg-[#09090F] text-white font-sans p-4 pt-20 select-none flex flex-col justify-between">
      <ReturnHomeButton onReturn={onReturnHome} />

      {/* Header Bar */}
      <header className="max-w-4xl mx-auto w-full bg-[#151521] p-4 sm:p-5 rounded-2xl border border-[#29293B] shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 uppercase">
              Gana Créditos
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Jugador: <strong className="text-white">{username}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Saldo Actual</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 drop-shadow">
              ${credits.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Racha Indicator Card */}
      <div className="max-w-4xl mx-auto w-full my-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-neutral-200 uppercase tracking-wider">
              {racha >= 5 ? '¡Racha Máxima Activa!' : `Racha Actual: ${racha}/5`}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
            {racha >= 5 ? 'Cada acierto otorga +100 créditos' : `Próximo acierto: +$${nextPotentialReward} CRÉDITOS`}
          </span>
        </div>

        {/* 5 Racha Segments */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((level) => {
            const isActive = racha >= level;
            return (
              <div
                key={level}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : 'bg-neutral-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
        {activeQuestion && (
          <div className="bg-[#151521] border border-[#29293B] rounded-2xl p-6 sm:p-8 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-[#29293B] pb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Pregunta #{activeQuestion.id}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                Premio en juego: +${nextPotentialReward}
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-semibold text-white mb-6 leading-relaxed">
              {activeQuestion.question}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {activeQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isCorrect = opt.id === activeQuestion.correctOptionId;

                let btnClass = 'bg-[#09090F] border-[#29293B] text-neutral-300 hover:border-amber-400/60 hover:text-white';

                if (isAnswered) {
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
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`text-left p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden active:scale-95 ${btnClass}`}
                  >
                    <div className="font-black text-sm text-amber-400 mb-1">{opt.id}.</div>
                    <div className="text-xs sm:text-sm leading-normal">{opt.text}</div>
                  </button>
                );
              })}
            </div>

            {/* Feedback Section */}
            {isAnswered && (
              <div className="animate-fade-in space-y-4">
                <div
                  className={`p-4 sm:p-5 rounded-xl border-l-4 ${
                    selectedOption === activeQuestion.correctOptionId
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : 'bg-red-950/40 border-red-500 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-sm uppercase tracking-wider">
                      {selectedOption === activeQuestion.correctOptionId ? '¡RESPUESTA CORRECTA!' : 'RESPUESTA INCORRECTA'}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40">
                      {selectedOption === activeQuestion.correctOptionId ? `+$${lastReward} CRÉDITOS` : '+0 CRÉDITOS · RACHA REINICIADA'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {activeQuestion.options.find((o) => o.id === selectedOption)?.feedback}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={loadNewQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <span>SIGUIENTE PREGUNTA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto w-full text-center py-3 text-xs text-neutral-400">
        Responde correctamente para sumar créditos compartidos y usarlos en Ruleta, Blackjack o Plinko.
      </footer>
    </div>
  );
};
