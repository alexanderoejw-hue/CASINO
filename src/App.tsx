import React, { useState, useEffect, useRef } from 'react';
import type { GameView, NavState } from './types/casino.ts';
import { MainHub } from './components/MainHub.tsx';
import { BlackjackGame } from './components/BlackjackGame.tsx';
import { RouletteGame } from './components/RouletteGame.tsx';
import { PlinkoGame } from './components/PlinkoGame.tsx';
import { CreditsGame } from './components/CreditsGame.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { sendAnalyticsEvent } from './utils/analytics.ts';
import { initGoogleAuth } from './utils/googleSheetsSync.ts';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameView>('home');
  const [navState, setNavState] = useState<NavState>('home-playing');
  const [highlightedObject, setHighlightedObject] = useState<string | null>(null);
  const [blackoutOpaque, setBlackoutOpaque] = useState<boolean>(false);

  // Requirement: All players start with 0 credits and must use the CRÉDITOS button on the main screen to earn credits
  const [credits, setCredits] = useState<number>(0);

  // Username must be entered at start with educational notice, and remain visible at all times
  const [username, setUsername] = useState<string>('');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  const transitionLockRef = useRef<boolean>(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const scheduleTimer = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => {
    initGoogleAuth();
  }, []);

  useEffect(() => {
    // Check URL parameters for direct view testing (?game=cards | roulette | plinko | credits)
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam === 'cards' || gameParam === 'roulette' || gameParam === 'white-ball' || gameParam === 'plinko' || gameParam === 'credits') {
      const target: GameView = gameParam === 'plinko' ? 'white-ball' : (gameParam as GameView);
      setActiveGame(target);
      setNavState('game-active');
      if (!username) {
        setUsername('Jugador1');
        setHasCompletedOnboarding(true);
      }
    }
  }, [username]);

  const handleOnboardingComplete = (name: string) => {
    const finalName = name.trim() || 'Jugador';
    setUsername(finalName);
    setHasCompletedOnboarding(true);

    sendAnalyticsEvent('SESSION_START', 'SISTEMA', finalName, {
      initialCredits: 0,
      userAgent: navigator.userAgent,
    });
  };

  const handleSelectGame = (game: GameView) => {
    if (transitionLockRef.current || navState !== 'home-playing') return;
    transitionLockRef.current = true;
    clearTimers();

    setHighlightedObject(game);
    setNavState('object-highlight');

    // 400ms highlight pulse -> fade to black
    scheduleTimer(() => {
      setNavState('fade-out');
      setBlackoutOpaque(true);

      scheduleTimer(() => {
        setHighlightedObject(null);
        setActiveGame(game);

        scheduleTimer(() => {
          setNavState('game-active');
          setBlackoutOpaque(false);

          scheduleTimer(() => {
            transitionLockRef.current = false;
          }, 350);
        }, 120);
      }, 450);
    }, 420);
  };

  const handleReturnHome = () => {
    if (transitionLockRef.current || navState !== 'game-active') return;
    transitionLockRef.current = true;
    clearTimers();

    setNavState('return-fade-out');
    setBlackoutOpaque(true);

    scheduleTimer(() => {
      setActiveGame('home');
      setNavState('return-home');

      scheduleTimer(() => {
        setBlackoutOpaque(false);

        scheduleTimer(() => {
          setNavState('home-playing');
          transitionLockRef.current = false;
        }, 350);
      }, 120);
    }, 450);
  };

  const isHome = activeGame === 'home';

  return (
    <div className="relative w-screen h-screen overflow-x-hidden bg-black text-white font-sans">
      {/* 1. Onboarding Educational Notice & Username Screen */}
      {!hasCompletedOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* 2. Main Hub Screen (Always in DOM for smooth seamless video loop continuity) */}
      <div
        className="fixed inset-0 w-full h-full z-10 transition-opacity duration-300"
        style={{
          visibility: isHome ? 'visible' : 'hidden',
          pointerEvents: isHome && hasCompletedOnboarding ? 'auto' : 'none',
        }}
        aria-hidden={!isHome}
      >
        <MainHub
          username={username}
          credits={credits}
          onSelectGame={handleSelectGame}
          highlightedObject={highlightedObject}
          navState={navState}
        />
      </div>

      {/* 3. Interactive Game Views */}
      {!isHome && hasCompletedOnboarding && (
        <div className="relative z-20 min-h-screen w-full">
          {activeGame === 'cards' && (
            <BlackjackGame
              username={username}
              credits={credits}
              setCredits={setCredits}
              onReturnHome={handleReturnHome}
            />
          )}

          {activeGame === 'roulette' && (
            <RouletteGame
              username={username}
              credits={credits}
              setCredits={setCredits}
              onReturnHome={handleReturnHome}
            />
          )}

          {activeGame === 'white-ball' && (
            <PlinkoGame
              username={username}
              credits={credits}
              setCredits={setCredits}
              onReturnHome={handleReturnHome}
            />
          )}

          {activeGame === 'credits' && (
            <CreditsGame
              username={username}
              credits={credits}
              setCredits={setCredits}
              onReturnHome={handleReturnHome}
            />
          )}
        </div>
      )}

      {/* 4. Global Cinematic Blackout Fade Layer for Transitions */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none bg-black transition-opacity duration-500 ease-in-out ${
          blackoutOpaque ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      />
    </div>
  );
}
