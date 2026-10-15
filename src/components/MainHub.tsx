import React, { useState, useEffect, useRef } from 'react';
import type { GameView } from '../types/casino.ts';
import { Volume2, VolumeX, Sparkles, HelpCircle, Coins, ExternalLink } from 'lucide-react';
import { playVoiceSyllable, playTickSound } from '../utils/soundEffects.ts';
import {
  subscribeToSyncStatus,
  signInWithGoogle,
  getCurrentSpreadsheetInfo,
} from '../utils/googleSheetsSync.ts';

interface MainHubProps {
  username: string;
  credits: number;
  onSelectGame: (game: GameView) => void;
  highlightedObject: string | null;
  navState: string;
}

const MACHETE_LINES = [
  '¡Hagan juego! Machete reparte la suerte... pero recuerda que el conocimiento es tu verdadero poder.',
  '¿Ves ese mazo de cartas a mi derecha? Toca las cartas si te atreves a buscar el 21.',
  'Haz girar esa ruleta o lanza la bola blanca en Plinko... ¡aquí mando yo!',
  'Con este guiño te digo todo: ¡si te quedas sin créditos, el botón dorado de CRÉDITOS te salvará!',
  '¡Me estoy frotando las patitas! Se siente una jugada legendaria esta noche.',
  'En este casino la casa no tiene ventaja sobre quien estudia y responde bien.',
  'Recuerda: si ganas en la ruleta, para retirar tus créditos tendrás que acertar una pregunta educativa.',
];

export const MainHub: React.FC<MainHubProps> = ({
  username,
  credits,
  onSelectGame,
  highlightedObject,
  navState,
}) => {
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [macheteDialogue, setMacheteDialogue] = useState<string>('');
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(true);

  // Background Google Sheets Sync State
  const [syncStatus, setSyncStatus] = useState<string>('disconnected');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isConnectingSheets, setIsConnectingSheets] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const bubbleTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initial welcome speech from Machete pointing to CRÉDITOS button
  useEffect(() => {
    const initialText = `¡Hola ${username || 'amigo'}! Como ves, empiezas con $0 créditos. Toca el botón dorado de CRÉDITOS aquí arriba para ganar saldo respondiendo preguntas antes de poder jugar.`;
    triggerMacheteSpeech(initialText, 8500);
  }, [username]);

  // Subscribe to background Google Sheets state
  useEffect(() => {
    const unsub = subscribeToSyncStatus((status, details) => {
      setSyncStatus(status);
      if (details?.sheetUrl) {
        setSpreadsheetUrl(details.sheetUrl);
      }
    });

    const info = getCurrentSpreadsheetInfo();
    if (info.spreadsheetUrl) {
      setSpreadsheetUrl(info.spreadsheetUrl);
      setSyncStatus('connected');
    }

    return () => unsub();
  }, []);

  const handleGoogleConnect = async () => {
    setIsConnectingSheets(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google sign-in cancelled or error:', err);
    } finally {
      setIsConnectingSheets(false);
    }
  };

  const triggerMacheteSpeech = (text: string, duration = 4800) => {
    setMacheteDialogue(text);
    setIsBubbleVisible(true);

    if (bubbleTimerRef.current) {
      window.clearTimeout(bubbleTimerRef.current);
    }

    try {
      playVoiceSyllable();
      setTimeout(() => playVoiceSyllable(), 110);
      setTimeout(() => playVoiceSyllable(), 220);
    } catch {}

    bubbleTimerRef.current = window.setTimeout(() => {
      setIsBubbleVisible(false);
    }, duration);
  };

  const handleMacheteClick = () => {
    const randomLine = MACHETE_LINES[Math.floor(Math.random() * MACHETE_LINES.length)];
    triggerMacheteSpeech(randomLine);
  };

  // Ambient Jazz generator using Web Audio API
  const startAmbientJazz = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [293.66, 349.23, 440.0, 523.25], // Dm7
        [196.0, 246.94, 293.66, 349.23], // G7
      ];

      let chordIndex = 0;

      const playChord = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        currentChord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.016 / (idx + 1), ctx.currentTime + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 4.0);
        });

        // Subtle ride cymbal
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.003, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();
      };

      playChord();
      audioIntervalRef.current = window.setInterval(playChord, 3500);
      setIsAudioActive(true);
    } catch (e) {
      console.warn('AudioContext playback error', e);
    }
  };

  const stopAmbientJazz = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsAudioActive(false);
  };

  const toggleAmbientAudio = () => {
    if (isAudioActive) {
      stopAmbientJazz();
    } else {
      startAmbientJazz();
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientJazz();
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  const isInteractive = navState === 'home-playing';

  const handleGameClick = (game: GameView) => {
    if (!isInteractive) return;
    try {
      playTickSound();
    } catch {}
    onSelectGame(game);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#160d08] select-none font-sans flex flex-col justify-between">
      {/* 1. TOP HEADER BAR: Persistent Player Name, Balances, Credits Button, Sheets Indicator, Audio & Help */}
      <header className="relative z-40 flex items-center justify-between px-3 sm:px-8 py-3 bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-[2px] shrink-0">
        {/* Left: Brand "JUEGOS INTERACTIVOS" & Persistent Username */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40">
            <Sparkles className="w-5 h-5 text-neutral-950" />
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-black tracking-wider text-amber-300 uppercase drop-shadow">
              JUEGOS INTERACTIVOS
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-300 font-medium flex items-center gap-1">
              <span>Jugador:</span>
              <strong className="text-white font-bold tracking-wide">{username || 'Invitado'}</strong>
            </p>
          </div>
        </div>

        {/* Right: Credits Button, Balance Display, Background Sync, and Audio Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Main CRÉDITOS Button to earn credits via educational questions */}
          <button
            type="button"
            onClick={() => onSelectGame('credits')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 shadow-lg shadow-amber-500/35 active:scale-95 transition-all cursor-pointer border border-amber-200/70"
            aria-label="Abrir panel de créditos para responder preguntas"
            title="Responder preguntas para ganar créditos"
          >
            <Coins className="w-4 h-4 text-neutral-950" />
            <span>CRÉDITOS</span>
          </button>

          {/* Current Bankroll Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-full shadow-xl">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-neutral-400 tracking-wider">
              Saldo:
            </span>
            <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
              ${credits.toLocaleString()}
            </span>
          </div>

          {/* Discreet Background Google Sheets Sync Indicator */}
          {syncStatus === 'connected' ? (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-md border border-emerald-500/40 rounded-full text-[11px] text-emerald-300 font-medium shadow-md"
              title="Google Sheets conectado en segundo plano. Toda jugada y respuesta se registra automáticamente."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sheets sincronizado</span>
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-white transition-colors ml-0.5 flex items-center gap-0.5 underline font-bold"
                  title="Abrir hoja de cálculo en una nueva pestaña"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={isConnectingSheets}
              title="Conectar Google Sheets para sincronización en segundo plano"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 rounded-full text-xs font-semibold backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isConnectingSheets ? 'Conectando...' : 'Conectar Sheets'}</span>
            </button>
          )}

          {/* Audio toggle button */}
          <button
            type="button"
            onClick={toggleAmbientAudio}
            aria-label={isAudioActive ? 'Silenciar música ambiente' : 'Activar música ambiente jazz'}
            title="Música Jazz"
            className={`p-2 sm:p-2.5 rounded-full border transition-all cursor-pointer backdrop-blur-md ${
              isAudioActive
                ? 'bg-amber-500 border-amber-400 text-neutral-950'
                : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            aria-label="Ayuda e instrucciones"
            title="Instrucciones y Ayuda"
            className="p-2 sm:p-2.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-full transition-all cursor-pointer backdrop-blur-md"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN STAGE: Original Jack Russell Terrier Casino Scene with Minecraft Nametag */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-1 sm:p-3">
        {/* Aspect-Ratio 16:9 Container matching video dimensions (1280x720) */}
        <div className="relative w-full max-w-[1360px] aspect-video max-h-[calc(100vh-130px)] rounded-2xl overflow-hidden border-2 border-amber-950/60 shadow-[0_0_60px_rgba(0,0,0,0.85)] bg-[#1e130d]">
          {/* Loop Video (Original Aesthetic) */}
          <video
            ref={videoRef}
            src="/video.mp4"
            poster="/video_frame.png"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoLoaded(false)}
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Image Fallback if video is unavailable */}
          {!videoLoaded && (
            <img
              src="/video_frame.png"
              alt="Casino Interactivo Jack Russell"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />
          )}

          {/* Dark edge vignette */}
          <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/10 to-black/60" />

          {/* MINECRAFT NAMETAG FOR MACHETE (Floating right above the dog's head) */}
          <div
            className="absolute z-30 pointer-events-auto"
            style={{
              top: '21.5%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <button
              type="button"
              onClick={handleMacheteClick}
              className="minecraft-nametag cursor-pointer focus:outline-none"
              title="Toca a Machete para interactuar"
            >
              MACHETE
            </button>
          </div>

          {/* MACHETE INTERACTIVE HITBOX (Head & Croupier Body) */}
          <button
            type="button"
            onClick={handleMacheteClick}
            aria-label="Hablar con Machete el crupier"
            title="Toca al crupier Machete para escuchar un comentario"
            className="absolute z-20 cursor-pointer rounded-full group focus:outline-none"
            style={{
              top: '24%',
              left: '42%',
              width: '16%',
              height: '30%',
            }}
          >
            {/* Subtle glow ring on hover */}
            <div className="w-full h-full rounded-full border-2 border-transparent group-hover:border-amber-400/50 group-hover:bg-amber-400/5 transition-all" />
          </button>

          {/* MACHETE SPEECH BUBBLE */}
          {isBubbleVisible && (
            <div
              className="absolute z-40 pointer-events-none transition-all duration-300 animate-fade-in"
              style={{
                left: '50%',
                top: '7%',
                transform: 'translateX(-50%)',
                maxWidth: '420px',
                width: '88%',
              }}
            >
              <div className="relative bg-[#10080b]/95 border-2 border-amber-400 text-amber-200 text-xs sm:text-sm font-semibold p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md leading-relaxed text-center">
                <span className="block font-black text-amber-400 text-[11px] uppercase tracking-wider mb-1">
                  Machete dice:
                </span>
                {macheteDialogue}
                {/* Speech Arrow */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#10080b] border-b-2 border-r-2 border-amber-400 rotate-45" />
              </div>
            </div>
          )}

          {/* ---------------- HOTSPOTS OVER TABLE OBJECTS ---------------- */}

          {/* 1. CARDS HOTSPOT: BLACKJACK 21 (Table Left Shoe) */}
          <button
            type="button"
            onClick={() => handleGameClick('cards')}
            onMouseEnter={() => setHoveredObject('cards')}
            onMouseLeave={() => setHoveredObject(null)}
            aria-label="Jugar Blackjack 21 en la mesa de cartas"
            className={`absolute z-25 cursor-pointer rounded-2xl group transition-all duration-300 ${
              highlightedObject === 'cards' || hoveredObject === 'cards' ? 'scale-105' : ''
            }`}
            style={{
              left: '16%',
              top: '67%',
              width: '18%',
              height: '24%',
            }}
          >
            <div className="w-full h-full rounded-2xl border-2 border-amber-400/40 group-hover:border-amber-300 group-hover:bg-amber-400/10 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all flex items-end justify-center pb-2">
              <span className="bg-neutral-950/90 text-amber-300 border border-amber-400/80 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                🃏 Blackjack 21
              </span>
            </div>
          </button>

          {/* 2. WHITE BALL HOTSPOT: PLINKO ARCADE (Table Center-Left) */}
          <button
            type="button"
            onClick={() => handleGameClick('white-ball')}
            onMouseEnter={() => setHoveredObject('white-ball')}
            onMouseLeave={() => setHoveredObject(null)}
            aria-label="Jugar Plinko Arcade en la bola blanca"
            className={`absolute z-25 cursor-pointer rounded-full group transition-all duration-300 ${
              highlightedObject === 'white-ball' || hoveredObject === 'white-ball' ? 'scale-110' : ''
            }`}
            style={{
              left: '35%',
              top: '76%',
              width: '9%',
              height: '16%',
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-cyan-400/50 group-hover:border-cyan-300 group-hover:bg-cyan-400/15 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] transition-all flex items-center justify-center">
              <span className="absolute -top-7 whitespace-nowrap bg-neutral-950/90 text-cyan-300 border border-cyan-400/80 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                ⚪ Plinko Arcade
              </span>
            </div>
          </button>

          {/* 3. ROULETTE HOTSPOT: RULETA CLÁSICA (Table Right) */}
          <button
            type="button"
            onClick={() => handleGameClick('roulette')}
            onMouseEnter={() => setHoveredObject('roulette')}
            onMouseLeave={() => setHoveredObject(null)}
            aria-label="Jugar Ruleta Clásica"
            className={`absolute z-25 cursor-pointer rounded-full group transition-all duration-300 ${
              highlightedObject === 'roulette' || hoveredObject === 'roulette' ? 'scale-105' : ''
            }`}
            style={{
              left: '63%',
              top: '60%',
              width: '26%',
              height: '31%',
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-amber-400/40 group-hover:border-amber-300 group-hover:bg-amber-400/10 group-hover:shadow-[0_0_35px_rgba(251,191,36,0.7)] transition-all flex items-center justify-center">
              <span className="bg-neutral-950/90 text-amber-300 border border-amber-400/80 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                🎡 Ruleta Clásica
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* 3. BOTTOM ACCESSIBILITY ACTION BAR: Clear quick access buttons */}
      <footer className="relative z-30 pb-3 pt-1 px-3 sm:px-8 shrink-0">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => handleGameClick('cards')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/30 hover:border-amber-400 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer text-center"
          >
            <span className="text-base sm:text-lg">🃏</span>
            <div>
              <span className="block text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                Blackjack 21
              </span>
              <span className="hidden sm:block text-[10px] text-neutral-400">Mesa de cartas</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleGameClick('white-ball')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-cyan-500/30 hover:border-cyan-400 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer text-center"
          >
            <span className="text-base sm:text-lg">⚪</span>
            <div>
              <span className="block text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wide">
                Plinko Arcade
              </span>
              <span className="hidden sm:block text-[10px] text-neutral-400">Bola blanca</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleGameClick('roulette')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/30 hover:border-amber-400 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer text-center"
          >
            <span className="text-base sm:text-lg">🎡</span>
            <div>
              <span className="block text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                Ruleta Clásica
              </span>
              <span className="hidden sm:block text-[10px] text-neutral-400">Con retiro</span>
            </div>
          </button>
        </div>
      </footer>

      {/* 4. HELP / INSTRUCTIONS MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fade-in font-sans overflow-hidden">
          <div className="w-full max-w-lg max-h-[90vh] bg-[#140b0f] border border-amber-500/50 rounded-2xl shadow-2xl flex flex-col text-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2d1219] p-4 sm:p-5 shrink-0 bg-[#190d13]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐕</span>
                <h3 className="font-bold text-base sm:text-lg text-amber-300">Instrucciones: Juegos Interactivos</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-neutral-400 hover:text-white font-bold p-1 cursor-pointer"
                aria-label="Cerrar instrucciones"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed custom-scrollbar">
              <p>
                🪙 <strong>Inicio con $0 Créditos:</strong> Todos los jugadores inician en cero. Toca el botón <strong>CRÉDITOS</strong> en la barra superior para responder preguntas educativas. Cada acierto suma créditos progresivos en racha: <strong>$20, $40, $60, $80 y hasta $100</strong> por respuesta correcta.
              </p>
              <p>
                🃏 <strong>Blackjack 21:</strong> Toca la <strong>baraja de cartas</strong> a la izquierda de la mesa o el botón inferior. Haz tu apuesta y acércate al 21 sin pasarte. ¡El crupier Machete se planta en 17!
              </p>
              <p>
                ⚪ <strong>Plinko Arcade:</strong> Toca la <strong>bola blanca</strong> al centro de la mesa. Elige tu apuesta y responde preguntas educativas para mantener tu multiplicador sin penalizaciones.
              </p>
              <p>
                🎡 <strong>Ruleta Clásica & Retiro:</strong> Toca la <strong>ruleta</strong> a la derecha. Gana tus apuestas; al presionar <strong>RETIRAR</strong> deberás contestar una pregunta del banco de retiro para abonar las ganancias a tu saldo real.
              </p>
              <p>
                📊 <strong>Sincronización en Segundo Plano:</strong> Tus respuestas, rachas y créditos se guardan en tiempo real en segundo plano en Google Sheets para análisis pedagógico del docente.
              </p>
              <p>
                🐕 <strong>Interacción con Machete:</strong> ¡Toca al crupier o a su etiqueta de nombre de Minecraft en cualquier momento para recibir consejos y comentarios con sonido interactivo!
              </p>
            </div>

            <div className="p-4 bg-[#10070b] border-t border-[#2d1219] shrink-0">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
              >
                ¡Entendido, a jugar!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
