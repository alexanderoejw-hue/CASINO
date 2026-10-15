export type GameView = 'home' | 'cards' | 'roulette' | 'white-ball' | 'credits' | 'analytics';

export type NavState =
  | 'onboarding'
  | 'home-playing'
  | 'object-highlight'
  | 'fade-out'
  | 'game-active'
  | 'return-fade-out'
  | 'return-home';

export interface Card {
  value: string;
  suit: '♥' | '♦' | '♣' | '♠';
}

export interface PlinkoQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    feedback: string;
  }[];
  correctOptionId: string;
}

export interface PlinkoHistoryRecord {
  id: string;
  date: string;
  initialBet: number;
  correctAnswers: number;
  incorrectAnswers: number;
  finalMultiplier: number;
  grossPrize: number;
  penalties: number;
  netResult: number;
  finalBalance: number;
  isRecovery: boolean;
}

export interface AnalyticsEvent {
  eventId: string;
  eventType:
    | 'SESSION_START'
    | 'QUESTION_PRESENTED'
    | 'QUESTION_ANSWERED'
    | 'RACHA_UPDATED'
    | 'CREDITS_AWARDED'
    | 'BET_PLACED'
    | 'SPIN_COMPLETED'
    | 'PLINKO_SETTLED'
    | 'BLACKJACK_SETTLED'
    | 'PENALTY_APPLIED'
    | 'WITHDRAW_REQUESTED'
    | 'WITHDRAW_COMPLETED'
    | 'WITHDRAW_FAILED';
  playerId: string;
  username: string;
  sessionId: string;
  timestamp: string;
  game: 'PLINKO' | 'RULETA' | 'CARTAS' | 'CREDITOS' | 'SISTEMA';
  data: Record<string, any>;
}

export interface PlayerStats {
  playerId: string;
  username: string;
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  lastBalance: number;
  creditsEarnedEducational: number;
  questionsPlinko: number;
  questionsRetirar: number;
  questionsCreditos: number;
  totalCorrect: number;
  totalIncorrect: number;
  netPlinko: number;
  netRoulette: number;
  netBlackjack: number;
}
