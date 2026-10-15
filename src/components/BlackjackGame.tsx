import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../types/casino.ts';
import { ReturnHomeButton } from './ReturnHomeButton.tsx';
import {
  calculateHandScore,
  getCardNumericalValue,
  evaluateBlackjackGame,
} from '../utils/casinoRules.ts';
import { playCardSound, playWinSound, playLoseSound, playChipSound } from '../utils/soundEffects.ts';
import { sendAnalyticsEvent } from '../utils/analytics.ts';

interface BlackjackGameProps {
  username: string;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  onReturnHome: () => void;
}

const SUITS: ('♥' | '♦' | '♣' | '♠')[] = ['♥', '♦', '♣', '♠'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  username,
  credits,
  setCredits,
  onReturnHome,
}) => {
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [betInputVal, setBetInputVal] = useState<string>(() => (credits >= 100 ? '100' : String(credits)));
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [showDealerCards, setShowDealerCards] = useState<boolean>(false);
  const [overlay, setOverlay] = useState<{ visible: boolean; text: string; isWarning: boolean }>({
    visible: false,
    text: '',
    isWarning: false,
  });

  const deckRef = useRef<Card[]>([]);
  const overlayTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, []);

  const buildDeck = () => {
    const d: Card[] = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        d.push({ value, suit });
      }
    }
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    deckRef.current = d;
  };

  const showMessage = (msg: string) => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    setOverlay({ visible: true, text: msg, isWarning: false });
    overlayTimeoutRef.current = window.setTimeout(() => {
      setOverlay((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const showWarning = (msg: string) => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    setOverlay({ visible: true, text: msg, isWarning: true });
    overlayTimeoutRef.current = window.setTimeout(() => {
      setOverlay({ visible: false, text: '', isWarning: false });
    }, 2500);
  };

  const finishGame = (
    result: 'blackjack' | 'bust' | 'dealer_bust' | 'win' | 'lose' | 'push',
    betInPlay: number,
    pHand: Card[],
    dHand: Card[]
  ) => {
    setGameActive(false);
    setShowDealerCards(true);
    setPlayerHand([...pHand]);
    setDealerHand([...dHand]);

    let netProfit = 0;

    switch (result) {
      case 'blackjack':
        showMessage('¡BLACKJACK NATURAL! Ganas x2.5');
        playWinSound();
        const bjGain = Math.round(betInPlay * 2.5);
        setCredits((c) => c + bjGain);
        netProfit = bjGain - betInPlay;
        break;
      case 'bust':
        showMessage('¡Te pasaste de 21! Pierdes la ronda.');
        playLoseSound();
        netProfit = -betInPlay;
        break;
      case 'dealer_bust':
        showMessage('¡El Crupier se pasó de 21! ¡GANASTE!');
        playWinSound();
        setCredits((c) => c + betInPlay * 2);
        netProfit = betInPlay;
        break;
      case 'win':
        showMessage('¡GANASTE LA RONDA!');
        playWinSound();
        setCredits((c) => c + betInPlay * 2);
        netProfit = betInPlay;
        break;
      case 'lose':
        showMessage('El Crupier Gana esta mano.');
        playLoseSound();
        netProfit = -betInPlay;
        break;
      case 'push':
        showMessage('Empate (Push). Recuperas tu apuesta.');
        setCredits((c) => c + betInPlay);
        netProfit = 0;
        break;
    }

    sendAnalyticsEvent('BLACKJACK_SETTLED', 'CARTAS', username, {
      result,
      bet: betInPlay,
      playerScore: calculateHandScore(pHand),
      dealerScore: calculateHandScore(dHand),
      netProfit,
    });

    setCurrentBet(0);
  };

  const runDealerTurn = (pHand: Card[], dHand: Card[], betInPlay: number) => {
    const nextDHand = [...dHand];
    let dealerScore = calculateHandScore(nextDHand);

    while (dealerScore < 17) {
      const drawn = deckRef.current.pop();
      if (drawn) {
        nextDHand.push(drawn);
        playCardSound();
      }
      dealerScore = calculateHandScore(nextDHand);
    }

    const playerScore = calculateHandScore(pHand);
    const outcome = evaluateBlackjackGame(playerScore, dealerScore);
    finishGame(outcome, betInPlay, pHand, nextDHand);
  };

  const startGameWithBet = (betAmount: number) => {
    if (isNaN(betAmount) || betAmount < 100) {
      showWarning('La apuesta mínima es de 100 créditos.');
      return;
    }
    if (betAmount > credits) {
      showWarning('CRÉDITOS INSUFICIENTES. VE A CRÉDITOS EN EL INICIO.');
      return;
    }

    playChipSound();
    playCardSound();

    // Deduct immediately to prevent double spending
    setCredits((c) => Math.max(0, c - betAmount));
    setCurrentBet(betAmount);
    setGameActive(true);
    setShowDealerCards(false);

    sendAnalyticsEvent('BET_PLACED', 'CARTAS', username, {
      betAmount,
      newBalance: Math.max(0, credits - betAmount),
    });

    buildDeck();
    const pCard1 = deckRef.current.pop()!;
    const pCard2 = deckRef.current.pop()!;
    const dCard1 = deckRef.current.pop()!;
    const dCard2 = deckRef.current.pop()!;

    const pHand = [pCard1, pCard2];
    const dHand = [dCard1, dCard2];

    setPlayerHand(pHand);
    setDealerHand(dHand);

    if (calculateHandScore(pHand) === 21) {
      finishGame('blackjack', betAmount, pHand, dHand);
    }
  };

  const handleHit = () => {
    if (!gameActive) {
      showWarning('HAZ UNA APUESTA PRIMERO');
      return;
    }
    const drawn = deckRef.current.pop();
    if (!drawn) return;
    playCardSound();

    const nextPHand = [...playerHand, drawn];
    setPlayerHand(nextPHand);
    const score = calculateHandScore(nextPHand);

    if (score > 21) {
      finishGame('bust', currentBet, nextPHand, dealerHand);
    } else if (score === 21) {
      runDealerTurn(nextPHand, dealerHand, currentBet);
    }
  };

  const handleStand = () => {
    if (!gameActive) {
      showWarning('HAZ UNA APUESTA PRIMERO');
      return;
    }
    runDealerTurn(playerHand, dealerHand, currentBet);
  };

  const handleDoubleDown = () => {
    if (!gameActive) {
      showWarning('HAZ UNA APUESTA PRIMERO');
      return;
    }
    if (playerHand.length !== 2) return;
    if (credits < currentBet) {
      showWarning('CRÉDITOS INSUFICIENTES PARA DOBLAR');
      return;
    }

    const additionalBet = currentBet;
    const doubledBet = currentBet * 2;
    setCredits((c) => Math.max(0, c - additionalBet));
    setCurrentBet(doubledBet);
    playCardSound();

    const drawn = deckRef.current.pop();
    const nextPHand = drawn ? [...playerHand, drawn] : playerHand;
    setPlayerHand(nextPHand);

    if (calculateHandScore(nextPHand) > 21) {
      finishGame('bust', doubledBet, nextPHand, dealerHand);
    } else {
      runDealerTurn(nextPHand, dealerHand, doubledBet);
    }
  };

  const handleSurrender = () => {
    if (!gameActive) {
      showWarning('HAZ UNA APUESTA PRIMERO');
      return;
    }
    if (playerHand.length !== 2) return;
    const refund = Math.floor(currentBet / 2);
    setCredits((c) => c + refund);
    showMessage(`Te rendiste. Recuperas $${refund}`);
    setGameActive(false);
    setShowDealerCards(true);
    setCurrentBet(0);
  };

  const handleAllIn = () => {
    if (gameActive) return;
    if (credits < 100) {
      showWarning('CRÉDITOS INSUFICIENTES. VE A CRÉDITOS.');
      return;
    }
    setBetInputVal(String(credits));
    startGameWithBet(credits);
  };

  const canDoubleOrSurrender = gameActive && playerHand.length === 2;

  return (
    <div className="relative w-screen h-screen bg-[#0b5a2c] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      <ReturnHomeButton onReturn={onReturnHome} />

      {/* Top Bar with Username and Credits always visible */}
      <header className="bg-black/80 px-4 sm:px-8 py-3 pt-16 sm:pt-3 text-center border-b-2 border-amber-400 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-neutral-300 font-sans">
          Jugador: <strong className="text-white font-bold">{username}</strong>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm sm:text-lg font-bold tracking-wide">
            CRÉDITOS: <span className="text-amber-300 font-mono font-black">${credits.toLocaleString()}</span>
          </div>
          <div className="text-sm sm:text-lg font-bold tracking-wide">
            APUESTA EN JUEGO: <span className="text-amber-300 font-mono font-black">${currentBet.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Table Felt Surface */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-4">
        {/* Deck area decoration on right */}
        <div className="hidden md:flex absolute right-[8%] top-[35%] w-20 h-28 bg-red-800 border-2 border-white/80 rounded-lg shadow-2xl items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.2)_5px,rgba(255,255,255,0.2)_10px)]">
          <span className="text-white/60 font-black text-xs">BARAJA</span>
        </div>

        {/* Message Overlay */}
        {overlay.visible && (
          <div
            className={`absolute z-30 px-8 py-4 rounded-2xl text-xl sm:text-3xl font-black uppercase text-center shadow-2xl backdrop-blur-md border-2 animate-fade-in ${
              overlay.isWarning
                ? 'bg-black/90 text-red-400 border-red-500'
                : 'bg-black/90 text-amber-300 border-amber-400'
            }`}
          >
            {overlay.text}
          </div>
        )}

        {/* Dealer Area */}
        <section className="text-center my-3 min-h-[170px]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">
            CRUPIER
          </h2>
          <div className="flex justify-center gap-3 min-h-[120px] flex-wrap">
            {dealerHand.map((card, index) => {
              const hidden = !showDealerCards && index === 1;
              if (hidden) {
                return (
                  <div
                    key={index}
                    className="w-20 h-28 bg-red-800 border-2 border-white rounded-lg shadow-xl bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.2)_5px,rgba(255,255,255,0.2)_10px)] animate-fade-in"
                  />
                );
              }
              const isRed = card.suit === '♥' || card.suit === '♦';
              return (
                <div
                  key={index}
                  className={`w-20 h-28 bg-white rounded-lg p-2 flex flex-col justify-between font-bold text-lg shadow-xl animate-fade-in ${
                    isRed ? 'text-red-600' : 'text-neutral-900'
                  }`}
                >
                  <div className="text-left leading-none font-mono">{card.value}{card.suit}</div>
                  <div className="text-center text-3xl leading-none">{card.suit}</div>
                  <div className="text-right leading-none font-mono rotate-180">{card.value}{card.suit}</div>
                </div>
              );
            })}
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono mt-2">
            {showDealerCards && dealerHand.length > 0
              ? `Puntuación: ${calculateHandScore(dealerHand)}`
              : dealerHand.length > 0
              ? `Carta Visible: ${getCardNumericalValue(dealerHand[0])}`
              : ''}
          </div>
        </section>

        {/* Player Area */}
        <section className="text-center my-3 min-h-[170px]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">
            JUGADOR
          </h2>
          <div className="flex justify-center gap-3 min-h-[120px] flex-wrap">
            {playerHand.map((card, index) => {
              const isRed = card.suit === '♥' || card.suit === '♦';
              return (
                <div
                  key={index}
                  className={`w-20 h-28 bg-white rounded-lg p-2 flex flex-col justify-between font-bold text-lg shadow-xl animate-fade-in ${
                    isRed ? 'text-red-600' : 'text-neutral-900'
                  }`}
                >
                  <div className="text-left leading-none font-mono">{card.value}{card.suit}</div>
                  <div className="text-center text-3xl leading-none">{card.suit}</div>
                  <div className="text-right leading-none font-mono rotate-180">{card.value}{card.suit}</div>
                </div>
              );
            })}
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono mt-2">
            {playerHand.length > 0 ? `Puntuación: ${calculateHandScore(playerHand)}` : ''}
          </div>
        </section>
      </main>

      {/* Bottom Controls Bar */}
      <footer className="bg-black/85 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-t-2 border-neutral-800">
        <div className="flex items-center gap-2.5">
          <label htmlFor="blackjack-bet-input" className="sr-only">Cantidad de apuesta</label>
          <input
            id="blackjack-bet-input"
            type="number"
            min="100"
            step="100"
            disabled={gameActive}
            value={betInputVal}
            onChange={(e) => setBetInputVal(e.target.value)}
            className="w-24 sm:w-28 p-2.5 text-lg font-bold font-mono text-center text-black bg-white rounded-lg border border-neutral-300 disabled:opacity-50"
          />
          <button
            type="button"
            disabled={gameActive || credits < 100}
            onClick={() => startGameWithBet(parseInt(betInputVal, 10))}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          >
            APOSTAR
          </button>
          <button
            type="button"
            disabled={gameActive || credits < 100}
            onClick={handleAllIn}
            className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          >
            ALL IN
          </button>
        </div>

        {credits < 100 && !gameActive && (
          <div className="text-xs text-amber-300 font-bold bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/30">
            ⚠️ Tienes menos de 100 créditos. Vuelve al inicio y entra a <strong>CRÉDITOS</strong> para ganar saldo.
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            disabled={!gameActive}
            onClick={handleHit}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            Hit (Pedir)
          </button>
          <button
            type="button"
            disabled={!gameActive}
            onClick={handleStand}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            Stand (Plantar)
          </button>
          <button
            type="button"
            disabled={!canDoubleOrSurrender}
            onClick={handleDoubleDown}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            Double Down
          </button>
          <button
            type="button"
            disabled={!canDoubleOrSurrender}
            onClick={handleSurrender}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            Rendirse
          </button>
        </div>
      </footer>
    </div>
  );
};
