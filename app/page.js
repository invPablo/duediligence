'use client';
import { useState } from 'react';

const DIMENSIONS = [
  { key: 'Gestión', short: 'GES', color: '#1D9E75' },
  { key: 'Concentración', short: 'CON', color: '#378ADD' },
  { key: 'Tendencia Operativa', short: 'OPE', color: '#1D9E75' },
  { key: 'Calidad de Beneficios', short: 'CAL', color: '#378ADD' },
  { key: 'Transparencia', short: 'TRA', color: '#1D9E75' },
];

const QUESTIONS = [
  { dim: 0, text: '¿El equipo directivo cumplió su guidance trimestral?' },
  { dim: 0, text: '¿La compensación ejecutiva está alineada con métricas de largo plazo?' },
  { dim: 0, text: '¿Hubo cambios significativos en el C-suite en los últimos 12 meses?' },
  { dim: 1, text: '¿El top-3 de clientes representa menos del 30% de ingresos?' },
  { dim: 1, text: '¿Opera en más de un segmento geográfico relevante?' },
  { dim: 1, text: '¿El producto principal representa menos del 50% de ingresos?' },
  { dim: 2, text: '¿El margen operativo mejoró en los últimos 3 años?' },
  { dim: 2, text: '¿El FCF/share creció >8% CAGR en los últimos 5 años?' },
  { dim: 2, text: '¿El ROIC supera el WACC estimado?' },
  { dim: 3, text: '¿El ratio FCF/Net Income supera 0.8x promedio de 3 años?' },
  { dim: 3, text: '¿Las accruals como % de activos son inferiores al 5%?' },
  { dim: 3, text: '¿El crecimiento de receivables no dobla el de revenues?' },
  { dim: 4, text: '¿La empresa provee guidance cuantitativo trimestral?' },
  { dim: 4, text: '¿El 10-K incluye riesgos materiales específicos del negocio?' },
  { dim: 4, text: '¿Los segmentos permiten calcular márgenes por unidad de negocio?' },
];

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [view, setView] = useState('landing');
  const [answers, setAnswers] = useState({});
  const [evidence, setEvidence] = useState({});
  const [currentTicker, setCurrentTicker] = useState('');

  function startAnalysis(t) {
    const tk = t || ticker.toUpperCase();
    if (!tk) return;
    setCurrentTicker(tk);
    setAnswers({});
    setEvidence({});
    setView('form');
  }

  function setAnswer(i, val) {
    setAnswers(prev => ({ ...prev, [i]: val }));
  }

  function setEv(i, val) {
    setEvidence(prev => ({ ...prev, [i]: val }));
  }

  function getDimScore(dimIndex) {
    const qs = QUESTIONS.filter((q, i) => q.dim === dimIndex);
    const indices = QUESTIONS.map((q, i) => q.dim === dimIndex ? i : -1).filter(i => i >= 0);
    const answered = indices.filter(i => answers[i] === 'SI' || answers[i] === 'NO');
    if (answered.length === 0) return null;
    const yes = answered.filter(i => answers[i] === 'SI').length;
    return Math.round((yes / answered.length) * 100);
  }

  function getTotalScore() {
    const scores = DIMENSIONS.map((_, i) => getDimScore(i)).filter(s => s !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;
  const total = getTotalScore();

  if (view === 'landing') return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm font-medium">DD</div>
          <span className="text-xl font-medium tracking-tight">Due<span className="text-emerald-400">Diligence</span></span>
        </div>
        <h1 className="text-5xl font-medium tracking-tight mb-4 leading-tight">
          Análisis fundamental<br />sin <span className="text-emerald-400">opiniones</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          15 preguntas. 5 dimensiones. Respuestas binarias desde los propios filings.
        </p>
        <div className="flex gap-3 max-w-sm mx-auto mb-6">
          <input
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white uppercase placeholder:normal-case placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 text-base"
            placeholder="Ingresa un ticker..."
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && startAnalysis()}
            maxLength={6}
          />
          <button
            onClick={() => startAnalysis()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-lg font-medium transition-colors"
          >
            Analizar
          </button>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {['AAPL','MSFT','NVDA','ASML','VISA'].map(t => (
            <button key={t} onClick={() => startAnalysis(t)}
              className="px-3 py-1 border border-zinc-700 rounded-full text-sm text-zinc-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
              {t}
            </button>
          ))}
        </div>
      </div>
    </main>
  );

  if (view === 'form') return (
    <main className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-medium tracking-tight">{currentTicker}</h2>
            <p className="text-zinc-400 text-sm mt-1">{answeredCount} de 15 preguntas respondidas</p>
          </div>
          <div className="flex gap-3 items-center">
            {total !== null && (
              <div className="text-right">
                <div className="text-2xl font-medium text-emerald-400">{total}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide">Score DD</div>
              </div>
            )}
            <button onClick={() => setView('landing')} className="text-zinc-500 hover:text-white text-sm transition-colors">← Volver</button>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {DIMENSIONS.map((d, i) => {
            const s = getDimScore(i);
            return (
              <div key={i} className="flex-1 bg-zinc-900 rounded-lg p-2 text-center">
                <div className="text-xs text-zinc-500 mb-1">{d.short}</div>
                <div className={`text-sm font-medium ${s === null ? 'text-zinc-600' : s >= 67 ? 'text-emerald-400' : s >= 34 ? 'text-amber-400' : 'text-red-400'}`}>
                  {s === null ? '—' : s}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          {DIMENSIONS.map((dim, di) => (
            <div key={di}>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3 pb-2 border-b border-zinc-800">
                {di + 1}. {dim.key}
              </div>
              <div className="space-y-4">
                {QUESTIONS.map((q, qi) => q.dim !== di ? null : (
                  <div key={qi} className="bg-zinc-900 rounded-xl p-4">
                    <p className="text-sm text-zinc-200 mb-3 leading-relaxed">P{qi + 1}. {q.text}</p>
                    <div className="flex gap-2 mb-3">
                      {['SI', 'NO', 'N/A'].map(opt => (
                        <button key={opt} onClick={() => setAnswer(qi, opt)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                            answers[qi] === opt
                              ? opt === 'SI' ? 'bg-emerald-500 border-emerald-500 text-white'
                              : opt === 'NO' ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-zinc-600 border-zinc-600 text-white'
                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {answers[qi] && (
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                        placeholder="Evidencia del filing (cita exacta)..."
                        value={evidence[qi] || ''}
                        onChange={e => setEv(qi, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {answeredCount === 15 && (
          <div className="mt-8 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
            <div className="text-4xl font-medium text-emerald-400 mb-1">{total}/100</div>
            <div className="text-zinc-400 text-sm">Score de Due Diligence — {currentTicker}</div>
          </div>
        )}
      </div>
    </main>
  );
}