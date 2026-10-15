import type { Card } from '../types/casino.ts';

// -------------------------------------------------------------
// BLACKJACK LOGIC
// -------------------------------------------------------------

export function getCardNumericalValue(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value, 10);
}

export function calculateHandScore(hand: Card[]): number {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    score += getCardNumericalValue(card);
    if (card.value === 'A') aces++;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

export function evaluateBlackjackGame(
  playerScore: number,
  dealerScore: number,
  isNaturalBlackjack = false
): 'blackjack' | 'bust' | 'dealer_bust' | 'win' | 'lose' | 'push' {
  if (isNaturalBlackjack && playerScore === 21) {
    return 'blackjack';
  }
  if (playerScore > 21) {
    return 'bust';
  }
  if (dealerScore > 21) {
    return 'dealer_bust';
  }
  if (dealerScore > playerScore) {
    return 'lose';
  }
  if (dealerScore < playerScore) {
    return 'win';
  }
  return 'push';
}

// -------------------------------------------------------------
// ROULETTE LOGIC
// -------------------------------------------------------------

export interface RouletteMultiplierConfig {
  val: number;
  prob: number;
  color: string;
  labelClass: string;
  glow: string;
}

export const ROULETTE_MULTIPLIERS: Record<string, RouletteMultiplierConfig> = {
  x2: { val: 2, prob: 0.45, color: '#f59e0b', labelClass: 'text-amber-500', glow: 'drop-shadow(0 0 10px rgba(245,158,11,0.8))' },
  x4: { val: 4, prob: 0.20, color: '#94a3b8', labelClass: 'text-slate-400', glow: 'drop-shadow(0 0 10px rgba(148,163,184,0.8))' },
  x8: { val: 8, prob: 0.10, color: '#fcd34d', labelClass: 'text-yellow-300', glow: 'drop-shadow(0 0 10px rgba(252,211,77,0.8))' },
  x10: { val: 10, prob: 0.05, color: '#4ade80', labelClass: 'text-green-400', glow: 'drop-shadow(0 0 10px rgba(74,222,128,0.8))' },
};

export function checkRouletteWin(multKey: string, roll: number): boolean {
  const config = ROULETTE_MULTIPLIERS[multKey];
  if (!config) return false;
  return roll <= config.prob;
}

// -------------------------------------------------------------
// PLINKO LOGIC
// -------------------------------------------------------------

export const PLINKO_CORRECT_TARGETS = [1, 2, 3, 4, 5, 10];
export const PLINKO_INCORRECT_TARGETS = [1, 0.50, 0.25, 0.10, 0.05, 0.01];
export const PLINKO_PENALTY_RATES = [0.02, 0.03, 0.05, 0.08, 0.12];

export function calculatePlinkoStepMultiplier(
  currentMult: number,
  isCorrect: boolean,
  stepIndex: number
): number {
  if (stepIndex < 0 || stepIndex >= 5) return currentMult;

  if (isCorrect) {
    const ratio = PLINKO_CORRECT_TARGETS[stepIndex + 1] / PLINKO_CORRECT_TARGETS[stepIndex];
    return Number((currentMult * ratio).toFixed(4));
  } else {
    const ratio = PLINKO_INCORRECT_TARGETS[stepIndex + 1] / PLINKO_INCORRECT_TARGETS[stepIndex];
    return Number((currentMult * ratio).toFixed(4));
  }
}

export function calculatePlinkoPenalty(initialBet: number, stepIndex: number): number {
  if (stepIndex < 0 || stepIndex >= PLINKO_PENALTY_RATES.length) return 0;
  return Math.round(initialBet * PLINKO_PENALTY_RATES[stepIndex]);
}

// -------------------------------------------------------------
// CREDITS TAB RACHA LOGIC
// -------------------------------------------------------------

export function calculateCreditsRacha(
  currentRacha: number,
  isCorrect: boolean
): { newRacha: number; reward: number } {
  if (!isCorrect) {
    return { newRacha: 0, reward: 0 };
  }

  const newRacha = Math.min(currentRacha + 1, 5);
  // 1: 20, 2: 40, 3: 60, 4: 80, 5+: 100
  const reward = Math.min(newRacha * 20, 100);
  return { newRacha, reward };
}
