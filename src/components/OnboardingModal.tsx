import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, Check } from 'lucide-react';
import {
  signInWithGoogle,
  subscribeToSyncStatus,
  getCurrentSpreadsheetInfo,
} from '../utils/googleSheetsSync.ts';

interface OnboardingModalProps {
  onComplete: (name: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [consentAnalytics, setConsentAnalytics] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Background Google Sheets connection state
  const [syncStatus, setSyncStatus] = useState<string>('disconnected');
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((status, details) => {
      setSyncStatus(status);
      setGoogleUserEmail(details?.user?.email || null);
    });

    const info = getCurrentSpreadsheetInfo();
    if (info.user?.email) {
      setGoogleUserEmail(info.user.email);
      setSyncStatus('connected');
    }

    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningInGoogle(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google sign-in cancelled or error:', err);
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Por favor, ingresa tu nombre antes de entrar.');
      return;
    }
    setError('');
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete(trimmed);
    }, 800);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md font-sans text-white p-4 transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="bg-[#0c0d14] border border-[#2e3146] rounded-3xl w-full max-w-[760px] p-6 sm:p-10 flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-fade-in relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

        {/* Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Aviso Educativo Importante</span>
        </div>

        {/* Main Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-center text-white tracking-tight mb-2">
          Juegos Interactivos - Simulación Educativa
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 text-center max-w-lg mb-5 leading-relaxed">
          Una simulación formativa diseñada para concientizar mediante el análisis de riesgos, preguntas científicas y toma de decisiones.
        </p>

        {/* Educational Content Box */}
        <div className="w-full bg-[#151624] border border-[#272a3d] rounded-2xl p-4 sm:p-5 mb-5 space-y-2.5 text-xs sm:text-sm text-neutral-300 leading-relaxed text-center sm:text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Esta experiencia <strong>no promueve las apuestas</strong> ni el juego de azar comercial. Su propósito es <strong>estrictamente educativo</strong>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Todos los jugadores inician con <strong>0 créditos</strong>. Para conseguir saldo inicial deberás acudir al botón <strong>CRÉDITOS</strong> y responder preguntas sobre salud cerebral y prevención.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Los créditos son <strong>completamente virtuales</strong> y no tienen valor monetario. No se puede ingresar ni retirar dinero real.
            </p>
          </div>
        </div>

        {/* Form: Username Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col items-center">
          <label htmlFor="player-name-input" className="text-xs sm:text-sm font-bold text-neutral-300 mb-2 uppercase tracking-wider text-center">
            ¿Cuál es tu nombre o alias de jugador?
          </label>
          <input
            id="player-name-input"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Escribe tu nombre aquí..."
            className={`w-full bg-[#151624] text-white border-2 rounded-xl px-4 py-3 text-center text-base sm:text-lg font-semibold outline-none transition-all placeholder-neutral-500 mb-2 ${
              error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-neutral-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            }`}
          />
          {error && <p className="text-xs text-red-400 font-medium mb-2">{error}</p>}

          {/* Consent Checkbox */}
          <div className="w-full mt-2 p-3 rounded-xl bg-[#151624]/70 border border-[#272a3d] flex items-start gap-3 text-left">
            <input
              id="analytics-consent"
              type="checkbox"
              checked={consentAnalytics}
              onChange={(e) => setConsentAnalytics(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
            />
            <label htmlFor="analytics-consent" className="text-[11px] sm:text-xs text-neutral-300 leading-snug cursor-pointer select-none">
              Registrar mis respuestas y progreso en Google Sheets para análisis educativo y retroalimentación docente en segundo plano.
            </label>
          </div>

          {/* Background Google Sheets connection for Admin/Educator */}
          <div className="w-full mt-3 p-3 rounded-xl bg-[#11121d] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[11px] font-bold text-emerald-400 block">Sincronización en Tiempo Real con Google Sheets</span>
              <span className="text-[10px] text-neutral-400">
                {googleUserEmail
                  ? `Vinculado con ${googleUserEmail}`
                  : 'Crea automáticamente la hoja en tu cuenta de Google'}
              </span>
            </div>

            {googleUserEmail ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold">Conectado en segundo plano</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningInGoogle}
                className="gsi-material-button flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>{isSigningInGoogle ? 'Conectando...' : 'Conectar Google Sheets'}</span>
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-5 py-4 px-8 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-95 text-neutral-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-amber-500/25 transition-all cursor-pointer border border-amber-200/50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-neutral-950" />
            <span>ENTENDIDO, ENTRAR AL CASINO</span>
          </button>
        </form>
      </div>
    </div>
  );
};
