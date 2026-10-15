import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHandScore,
  evaluateBlackjackGame,
  checkRouletteWin,
  calculatePlinkoStepMultiplier,
  calculatePlinkoPenalty,
  calculateCreditsRacha,
} from './casinoRules.ts';
import type { Card } from '../types/casino.ts';

test('Blackjack: hand score calculates standard number cards', () => {
  const hand: Card[] = [
    { value: '7', suit: '♠' },
    { value: '9', suit: '♥' },
  ];
  assert.equal(calculateHandScore(hand), 16);
});

test('Blackjack: hand score counts Face cards as 10', () => {
  const hand: Card[] = [
    { value: 'K', suit: '♦' },
    { value: 'Q', suit: '♣' },
  ];
  assert.equal(calculateHandScore(hand), 20);
});

test('Blackjack: Ace counts as 11 then reduces to 1 when busting', () => {
  const softHand: Card[] = [
    { value: 'A', suit: '♠' },
    { value: '8', suit: '♥' },
  ];
  assert.equal(calculateHandScore(softHand), 19);

  const hardHand: Card[] = [
    { value: 'A', suit: '♠' },
    { value: '8', suit: '♥' },
    { value: '5', suit: '♦' },
  ];
  assert.equal(calculateHandScore(hardHand), 14);
});

test('Blackjack: outcome evaluation handles win, loss, bust, push', () => {
  assert.equal(evaluateBlackjackGame(21, 19, true), 'blackjack');
  assert.equal(evaluateBlackjackGame(22, 18), 'bust');
  assert.equal(evaluateBlackjackGame(19, 23), 'dealer_bust');
  assert.equal(evaluateBlackjackGame(20, 18), 'win');
  assert.equal(evaluateBlackjackGame(17, 19), 'lose');
  assert.equal(evaluateBlackjackGame(18, 18), 'push');
});

test('Roulette: multiplier probability check matches threshold', () => {
  assert.equal(checkRouletteWin('x2', 0.30), true);
  assert.equal(checkRouletteWin('x2', 0.50), false);
  assert.equal(checkRouletteWin('x10', 0.04), true);
  assert.equal(checkRouletteWin('x10', 0.06), false);
});

test('Plinko: calculates correct multiplier progression', () => {
  const step0 = calculatePlinkoStepMultiplier(1.0, true, 0);
  assert.equal(step0, 2.0);

  const step1 = calculatePlinkoStepMultiplier(2.0, true, 1);
  assert.equal(step1, 3.0);

  const step0Fail = calculatePlinkoStepMultiplier(1.0, false, 0);
  assert.equal(step0Fail, 0.5);
});

test('Plinko: calculates penalty correctly based on rate', () => {
  const bet = 1000;
  assert.equal(calculatePlinkoPenalty(bet, 0), 20);
  assert.equal(calculatePlinkoPenalty(bet, 4), 120);
});

test('Credits Tab: Racha progression grants 20, 40, 60, 80, 100 credits and caps at 100', () => {
  // 1st correct answer: racha 0 -> 1, +20
  let res = calculateCreditsRacha(0, true);
  assert.equal(res.newRacha, 1);
  assert.equal(res.reward, 20);

  // 2nd correct answer: racha 1 -> 2, +40
  res = calculateCreditsRacha(1, true);
  assert.equal(res.newRacha, 2);
  assert.equal(res.reward, 40);

  // 3rd correct answer: racha 2 -> 3, +60
  res = calculateCreditsRacha(2, true);
  assert.equal(res.newRacha, 3);
  assert.equal(res.reward, 60);

  // 4th correct answer: racha 3 -> 4, +80
  res = calculateCreditsRacha(3, true);
  assert.equal(res.newRacha, 4);
  assert.equal(res.reward, 80);

  // 5th correct answer: racha 4 -> 5, +100
  res = calculateCreditsRacha(4, true);
  assert.equal(res.newRacha, 5);
  assert.equal(res.reward, 100);

  // 6th correct answer: stays at racha 5, +100
  res = calculateCreditsRacha(5, true);
  assert.equal(res.newRacha, 5);
  assert.equal(res.reward, 100);

  // Incorrect answer: racha resets to 0, reward 0 (no credits lost)
  res = calculateCreditsRacha(4, false);
  assert.equal(res.newRacha, 0);
  assert.equal(res.reward, 0);
});
