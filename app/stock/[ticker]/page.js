'use client';
import { useState, useEffect, use } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PriceChart from './chart';

const fmt = (val) => {
  if (val === null || val === undefined) return 'N/A';
  if (Math.abs(val) >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
};
const fmtP = (v) => v !== null && v !== undefined ? `${v}%` : '—';
const fmtN = (v, d = 2) => v !== null && v !== undefined ? v.toFixed(d) : '—';
const green = 'text-emerald-400';
const red = 'text-red-400';
const muted = 'text-zinc-400';

const NAV = [
  { key: 'overview', label: 'Stock Overview' },
  { key: 'quality', label: 'Quality Scorecard' },
  { key: 'financials', label: 'Financials' },
  { key: 'dcf', label: 'Dynamic DCF' },
];

const QUESTIONS = [
  { dim: 'Management', text: 'Has the management team consistently met quarterly guidance?' },
  { dim: 'Management', text: 'Is executive compensation aligned with long-term metrics?' },
  { dim: 'Management', text: 'Were there significant C-suite changes in the last 12 months?' },
  { dim: 'Concentration', text: 'Does the top-3 customers represent less than 30% of revenue?' },
  { dim: 'Concentration', text: 'Does the company operate in more than one relevant geographic segment?' },
  { dim: 'Concentration', text: 'Does the main product represent less than 50% of revenue?' },
  { dim: 'Operational Trend', text: 'Did operating margin improve over the last 3 years?' },
  { dim: 'Operational Trend', text: 'Did FCF/share grow at >8% CAGR over the last 5 years?' },
  { dim: 'Operational Trend', text: 'Does ROIC exceed the estimated WACC?' },
  { dim: 'Earnings Quality', text: 'Does the FCF/Net Income ratio exceed 0.8x on a 3-year average?' },
  { dim: 'Earnings Quality', text: 'Are accruals as a % of assets below 5%?' },
  { dim: 'Earnings Quality', text: 'Does receivables growth not exceed twice revenue growth?' },
  { dim: 'Transparency', text: 'Does the company provide quantitative quarterly guidance?' },
  { dim: 'Transparency', text: 'Does the 10-K include detailed business-specific material risks?' },
  { dim: 'Transparency', text: 'Do reported segments allow margin calculation by business unit?' },
];
const DIMS = ['Management', 'Concentration', 'Operational Trend', 'Earnings Quality', 'Transparency'];

const Pill = ({ label, value, good }) => (
  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
    <span className="text-xs text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${good ? 'bg-emerald-500/15 text-emerald-400' : good === false ? 'bg-red-500/15 text-red-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
      {value}
    </span>
  </div>
);

const MetricCard = ({ label, value, delta, deltaGood, dot }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
    <div className="flex items-center gap-2 mb-2">
      {dot && <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-2xl font-medium mb-1">{value}</div>
    {delta && <div className={`text-xs ${deltaGood ? 'text-emerald-400' : 'text-red-400'}`}>{delta}</div>}
  </div>
);

const ScoreRing = ({ score, size = 80 }) => {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const fill = score !== null ? circ * (1 - score / 100) : circ;
  const c = score === null ? '#3f3f46' : score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={c} fontSize="16" fontWeight="500">
        {score ?? '—'}
      </text>
    </svg>
  );
};

export default function StockPage({ params }) {
  const { ticker: rawTicker } = use(params);
  const ticker = rawTicker.toUpperCase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [answers, setAnswers] = useState({});
  const [evidence, setEvidence] = useState({});

  useEffect(() => {
    fetch(`/api/stock?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error); return; } setData(d); })
      .catch(() => setError('Connection error'))
      .finally(() => setLoading(false));
  }, [ticker]);

  const getDimScore = (dim) => {
    const indices = QUESTIONS.map((q, i) => q.dim === dim ? i : -1).filter(i => i >= 0);
    const answered = indices.filter(i => answers[i] === 'YES' || answers[i] === 'NO');
    if (!answered.length) return null;
    return Math.round((answered.filter(i => answers[i] === 'YES').length / answered.length) * 100);
  };
  const totalScore = () => {
    const scores = DIMS.map(d => getDimScore(d)).filter(s => s !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  if (loading) return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-emerald-400 mb-1">Loading data...</div>
        <div className="text-zinc-500 text-sm">{ticker}</div>
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <a href="/" className="text-zinc-500 text-sm hover:text-white">← Back</a>
      </div>
    </main>
  );

  const score = totalScore();
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;
  const revChart = data.revHistory.map(r => ({ year: r.year, value: +(r.val / 1e9).toFixed(1) }));
  const fcfChart = data.fcfHistory.map(r => ({ year: r.year, value: +(r.val / 1e9).toFixed(1) }));

  const profLabel = data.grossMargin > 50 ? 'Strong margins' : data.grossMargin > 30 ? 'Solid margins' : 'Thin margins';
  const profGood = data.grossMargin > 40;
  const growthLabel = data.revGrowth > 20 ? 'Accelerating' : data.revGrowth > 5 ? 'Steady growth' : 'Slow growth';
  const growthGood = data.revGrowth > 10;
  const cashLabel = data.fcfVal > 0 ? 'Positive FCF' : 'Negative FCF';
  const cashGood = data.fcfVal > 0;
  const fcfPerSharePill = data.fcfVal && data.sharesOutstanding ? data.fcfVal / data.sharesOutstanding : null;
const intrinsicPill = fcfPerSharePill ? fcfPerSharePill * 20 : null;
const currentPricePill = data.currentPrice;
const valLabel = intrinsicPill && currentPricePill
  ? intrinsicPill > currentPricePill * 1.2 ? 'Undervalued'
  : intrinsicPill > currentPricePill ? 'Fair value'
  : intrinsicPill > currentPricePill * 0.8 ? 'Slightly rich'
  : 'Not cheap'
  : data.pe > 40 ? 'Not cheap' : data.pe > 20 ? 'Fair value' : data.pe > 0 ? 'Attractive' : 'N/A';
const valGood = intrinsicPill && currentPricePill ? intrinsicPill > currentPricePill : data.pe > 0 && data.pe < 25;

  const Row52 = () => {
    if (!data.low52 || !data.high52) return null;
    const pct = Math.min(100, Math.max(0, ((data.analystTarget - data.low52) / (data.high52 - data.low52)) * 100));
    return (
      <div className="mt-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">52-Week Range</div>
        <div className="relative h-1.5 bg-zinc-700 rounded-full mb-1">
          <div className="absolute h-1.5 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>${data.low52}</span>
          <span>${data.high52}</span>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4 sticky top-0 bg-zinc-950 z-10">
  <a href="/" className="flex items-center gap-2 shrink-0">
    <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-xs font-bold">DD</div>
    <span className="text-sm font-medium">DueDiligence</span>
  </a>
  <span className="text-zinc-700">/</span>
  <a href="/" className="text-zinc-500 text-sm hover:text-white shrink-0">Home</a>
  <span className="text-zinc-700">/</span>
  <span className="text-zinc-300 text-sm font-medium shrink-0">{ticker}</span>
  <div className="flex-1 max-w-xs ml-4">
    <form onSubmit={e => { e.preventDefault(); const t = e.target.search.value.toUpperCase().trim(); if (t) window.location.href = `/stock/${t}`; }}>
      <input
        name="search"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        placeholder="Search ticker: AAPL, MSFT..."
      />
    </form>
  </div>
</div>

      <div className="flex">
        <div className="w-52 shrink-0 border-r border-zinc-800 min-h-screen p-4 sticky top-12 self-start">
          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-3 px-2">Analysis</div>
          <div className="space-y-0.5">
            {NAV.map(n => (
              <button key={n.key} onClick={() => setTab(n.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  tab === n.key ? 'bg-emerald-500/15 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}>
                {n.label}
              </button>
            ))}
          </div>
          {score !== null && (
            <div className="mt-6 p-4 bg-zinc-900 rounded-xl text-center border border-zinc-800">
              <ScoreRing score={score} size={72} />
              <div className="text-xs text-zinc-500 mt-2">DD Score</div>
              <div className="text-xs text-zinc-600">{answeredCount}/15</div>
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          {tab === 'overview' && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-zinc-700">
  <img
    src={`https://logo.clearbit.com/${data.name
      .toLowerCase()
      .replace(/\binc\b|\bcorp\b|\bltd\b|\bplc\b|\bco\b|\bllc\b|\bgroup\b|\bholdings\b|\binternational\b|\bthe\b/g, '')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^a-z0-9]/g, '')}.com`}
    alt={data.name}
    className="w-10 h-10 object-contain"
    onError={e => {
      e.target.style.display = 'none';
      e.target.parentElement.innerHTML = `<span class="text-xl font-bold text-emerald-400">${ticker.slice(0, 2)}</span>`;
      e.target.parentElement.classList.remove('bg-white');
      e.target.parentElement.classList.add('bg-zinc-800');
    }}
  />
</div>
                  <div>
                    <h1 className="text-2xl font-medium tracking-tight">{data.name}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-zinc-500 text-sm font-medium">{ticker}</span>
                      {data.exchange && <span className="text-zinc-600 text-xs">/ {data.exchange}</span>}
                      {data.sector && <span className="text-xs text-zinc-500">/ {data.sector}</span>}
                    </div>
                    {data.description && (
                      <p className="text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
                        {data.description.slice(0, 200)}{data.description.length > 200 ? '...' : ''}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data.cik}&type=10-K`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs border border-zinc-700 px-3 py-1 rounded-lg text-zinc-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
                        SEC Filings ↗
                      </a>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-8 flex items-start gap-6">
  {(() => {
    const price = data.currentPrice;
    const change = data.priceChange;
    const changePct = data.priceChangePct;
    const fcfPerShare = data.fcfVal && data.sharesOutstanding ? data.fcfVal / data.sharesOutstanding : null;
    const intrinsicValue = fcfPerShare ? +(fcfPerShare * 20).toFixed(2) : null;
    const undervalued = intrinsicValue && price ? intrinsicValue > price : null;
    return (
      <>
        {/* Precio actual — grande */}
        <div className="text-right">
          {price ? (
            <>
              <div className="text-5xl font-medium text-white tracking-tight">${price.toFixed(2)}</div>
              {change !== null && (
                <div className={`text-base mt-1 font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct?.toFixed(2)}%)
                </div>
              )}
              <div className="text-xs text-zinc-600 mt-1">Live price · Finnhub</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-medium">{fmt(data.marketCap)}</div>
              <div className="text-xs text-zinc-500 mt-1">Market Cap</div>
            </>
          )}
        </div>

        {/* Intrinsic Value — compacto al lado */}
        {intrinsicValue && (
          <div className="border-l border-zinc-800 pl-6 text-right">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Intrinsic Value</div>
            <div className={`text-3xl font-medium tracking-tight ${undervalued ? 'text-emerald-400' : 'text-red-400'}`}>
              ${intrinsicValue}
            </div>
            <div className="text-xs text-zinc-600 mt-0.5">20x FCF/share</div>
            {price && (
              <div className={`text-xs mt-2 font-medium px-2 py-0.5 rounded-full inline-block ${undervalued ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {undervalued
                  ? `▲ +${(((intrinsicValue - price) / price) * 100).toFixed(1)}% upside`
                  : `▼ ${(((intrinsicValue - price) / price) * 100).toFixed(1)}% downside`}
              </div>
            )}
          </div>
        )}
      </>
    );
  })()}
</div>
              </div>

              <div className="flex gap-3 mb-6">
                <Pill label="Profitability" value={profLabel} good={profGood} />
                <Pill label="Growth" value={growthLabel} good={growthGood} />
                <Pill label="Cash Flow" value={cashLabel} good={cashGood} />
                <Pill label="Valuation" value={valLabel} good={valGood} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-emerald-400 uppercase tracking-widest mb-2">What stands out</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {data.grossMargin > 50
                      ? `Gross margin of ${data.grossMargin}% signals strong pricing power. Positive ROIC spread.`
                      : `Revenue grew ${data.revGrowth}% YoY with an operating margin of ${data.opMargin}%.`}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-blue-400 uppercase tracking-widest mb-2">What's changing</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {data.revGrowth > 0
                      ? `Revenue growing at ${data.revGrowth}% YoY. ${data.opMargin > 15 ? 'Operating margins remain solid.' : 'Margins showing expansion.'}`
                      : `Revenue contracting ${data.revGrowth}% YoY. Monitor margin evolution closely.`}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-amber-400 uppercase tracking-widest mb-2">What deserves caution</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {data.pe > 35
                      ? `P/E of ${data.pe}x leaves limited room for execution misses or growth deceleration.`
                      : data.debtToEquity > 2
                      ? `Debt/equity of ${data.debtToEquity}x warrants attention in a high-rate environment.`
                      : `Monitor margin evolution and free cash flow generation going forward.`}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Valuation context</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {data.pe
                      ? `${data.pe}x earnings. ${data.pe > 30 ? 'Quality is already priced in.' : 'Reasonable valuation given the business profile.'} ${data.analystTarget ? `Analyst target: $${data.analystTarget}.` : ''}`
                      : `No P/E available. Consider alternative valuation metrics such as EV/EBITDA (${fmtN(data.evEbitda)}x).`}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <PriceChart ticker={ticker} />
                </div>
                <div className="w-64 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Valuation & Multiples</div>
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        { label: 'Market Cap', val: fmt(data.marketCap) },
                        { label: 'EPS', val: data.eps ? `$${data.eps}` : '—' },
                        { label: 'P/E', val: fmtN(data.pe), color: data.pe > 30 ? red : green },
                        { label: 'P/FCF', val: data.fcfVal && data.marketCap ? fmtN(data.marketCap / data.fcfVal) : '—' },
                        { label: 'EV/EBITDA', val: fmtN(data.evEbitda) },
                        { label: 'FCF Yield', val: data.fcfVal && data.marketCap ? `${((data.fcfVal / data.marketCap) * 100).toFixed(1)}%` : '—' },
                        { label: 'Div. Yield', val: fmtP(data.dividendYield) },
                        { label: 'Net Debt/FCF', val: data.netDebt && data.fcfVal ? fmtN(data.netDebt / data.fcfVal) : '—', color: data.netDebt < 0 ? green : muted },
                      ].map(r => (
                        <tr key={r.label} className="border-b border-zinc-800/50">
                          <td className="py-2 text-zinc-500">{r.label}</td>
                          <td className={`py-2 text-right font-medium ${r.color || 'text-white'}`}>{r.val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Row52 />
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Profitability & Returns</div>
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard label="Revenue (TTM)" value={fmt(data.revVal)}
                    delta={data.revGrowth !== null ? `${data.revGrowth > 0 ? '+' : ''}${data.revGrowth}% YoY` : null}
                    deltaGood={data.revGrowth > 0} dot="bg-emerald-500" />
                  <MetricCard label="Net Income (TTM)" value={fmt(data.niVal)}
                    delta={data.netMargin !== null ? `${data.netMargin}% net margin` : null}
                    deltaGood={data.netMargin > 10} dot="bg-emerald-500" />
                  <MetricCard label="Op. Margin" value={fmtP(data.opMargin)}
                    delta={data.opMargin > 15 ? 'Above threshold' : 'Below threshold'}
                    deltaGood={data.opMargin > 15} dot={data.opMargin > 15 ? 'bg-emerald-500' : 'bg-amber-500'} />
                  <MetricCard label="ROE" value={fmtP(data.roe)}
                    delta={data.roe > 15 ? 'Strong return' : 'Moderate return'}
                    deltaGood={data.roe > 15} dot={data.roe > 15 ? 'bg-emerald-500' : 'bg-amber-500'} />
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Cash Flow & Balance Sheet</div>
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard label="Free Cash Flow" value={fmt(data.fcfVal)}
                    delta={data.fcfVal > 0 ? 'Positive FCF' : 'Negative FCF'}
                    deltaGood={data.fcfVal > 0} dot={data.fcfVal > 0 ? 'bg-emerald-500' : 'bg-red-500'} />
                  <MetricCard label="Op. Cash Flow (TTM)" value={fmt(data.fcfVal)}
                    delta={data.fcfVal > 0 ? `${((data.fcfVal / (data.revVal || 1)) * 100).toFixed(1)}% conversion` : null}
                    deltaGood={data.fcfVal > 0} dot="bg-emerald-500" />
                  <MetricCard label="Net Debt" value={fmt(data.netDebt)}
                    delta={data.netDebt < 0 ? 'Net Cash Position' : 'Net Debt Position'}
                    deltaGood={data.netDebt < 0} dot={data.netDebt < 0 ? 'bg-emerald-500' : 'bg-amber-500'} />
                  <MetricCard label="Cash & Equiv." value={fmt(data.cashVal)} dot="bg-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { title: 'Revenue', chart: revChart, c: '#10b981' },
                  { title: 'Free Cash Flow', chart: fcfChart, c: '#8b5cf6' },
                ].map(({ title, chart, c }) => (
                  <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="text-sm font-medium mb-4">{title}</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={chart} barSize={32}>
                        <XAxis dataKey="year" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
                        <Tooltip formatter={v => [`$${v}B`, title]} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                          {chart.map((_, i) => <Cell key={i} fill={i === chart.length - 1 ? c : `${c}55`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Continue Research</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'quality', title: 'Quality Scorecard', desc: 'Is this a high-quality business?' },
                    { key: 'financials', title: 'Financials', desc: 'Income, cash flow, balance sheet' },
                    { key: 'dcf', title: 'DCF Valuation', desc: "What's it really worth?" },
                  ].map(s => (
                    <button key={s.key} onClick={() => setTab(s.key)}
                      className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-colors group">
                      <div className="text-sm font-medium group-hover:text-emerald-400 transition-colors">{s.title}</div>
                      <div className="text-xs text-zinc-500 mt-1">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-zinc-600">Source: SEC EDGAR (XBRL) + Alpha Vantage. Not investment advice.</p>
            </div>
          )}

          {tab === 'quality' && (
  <div>
    {/* Header score */}
    <div className="flex items-center gap-6 mb-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <polygon points="50,5 95,25 95,75 50,95 5,75 5,25"
            fill="none" stroke={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3"/>
          <text x="50" y="38" textAnchor="middle" fill={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}
            fontSize="9" fontWeight="500">QUALITY</text>
          <text x="50" y="62" textAnchor="middle" fill={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}
            fontSize="22" fontWeight="600">{score ?? '—'}</text>
        </svg>
      </div>
      <div>
        <div className="text-xl font-medium mb-1">
          {score !== null
            ? score >= 70 ? 'High-quality business'
            : score >= 40 ? 'Moderate quality'
            : 'Red flags detected'
            : 'Calculating score...'}
        </div>
        <p className="text-zinc-400 text-sm max-w-lg">
          {score !== null
            ? `Score based on ${answeredCount} of 15 questions from SEC filings.`
            : 'Automated score based on SEC EDGAR fundamentals.'}
        </p>
        <div className="text-xs text-zinc-600 mt-1">Broad-market heuristics · Not a buy/sell signal</div>
      </div>
    </div>

    {/* VALUATION section */}
    <div className="mb-8">
      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Valuation</div>
      <div className="grid grid-cols-2 gap-4">
        {/* Earnings Multiple */}
        {(() => {
          const s = data.pe ? data.pe < 15 ? 100 : data.pe < 20 ? 80 : data.pe < 25 ? 60 : data.pe < 35 ? 40 : 20 : null;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          const desc = data.pe < 15 ? 'Below 15x, attractively priced' : data.pe < 20 ? 'Below 20x, reasonably priced' : data.pe < 25 ? '20-25x, fair value range' : data.pe < 35 ? '25-35x, paying a growth premium' : 'Above 35x, expensive';
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Earnings Multiple</span>
                </div>
                {s !== null && <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>}
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{data.pe ? `${data.pe}x` : 'N/A'}</div>
              <p className="text-xs text-zinc-500 mb-3">{desc}</p>
            </div>
          );
        })()}

        {/* FCF Multiple */}
        {(() => {
          const pfcf = data.fcfVal && data.marketCap ? +(data.marketCap / data.fcfVal).toFixed(1) : null;
          const s = pfcf ? pfcf < 15 ? 100 : pfcf < 20 ? 80 : pfcf < 25 ? 60 : pfcf < 35 ? 40 : 20 : null;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Cash Flow Multiple</span>
                </div>
                {s !== null && <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>}
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{pfcf ? `${pfcf}x` : 'N/A'}</div>
              <p className="text-xs text-zinc-500 mb-3">{pfcf < 15 ? 'Below 15x, strong FCF yield' : pfcf < 25 ? 'Reasonable cash flow multiple' : 'Above 25x, cash flow yield thin'}</p>
            </div>
          );
        })()}
      </div>
    </div>

    {/* GROWTH section */}
    <div className="mb-8">
      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Growth</div>
      <div className="grid grid-cols-2 gap-4">
        {/* Revenue Growth */}
        {(() => {
          const s = data.revGrowth > 20 ? 100 : data.revGrowth > 10 ? 80 : data.revGrowth > 5 ? 60 : data.revGrowth > 0 ? 40 : 20;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          const revChart = data.revHistory.map(r => ({ year: r.year, value: +(r.val / 1e9).toFixed(1) }));
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Revenue Growth</span>
                </div>
                <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{data.revGrowth !== null ? `${data.revGrowth > 0 ? '+' : ''}${data.revGrowth}%` : 'N/A'}</div>
              <p className="text-xs text-zinc-500 mb-3">{data.revGrowth > 10 ? 'Above 10% CAGR, strong compounder' : data.revGrowth > 0 ? 'Positive but below 10% threshold' : 'Revenue declining'}</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={revChart} barSize={24}>
                  <XAxis dataKey="year" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`$${v}B`]} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {revChart.map((_, i) => <Cell key={i} fill={i === revChart.length - 1 ? c : `${c}55`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* FCF Growth */}
        {(() => {
          const fcfChart = data.fcfHistory.map(r => ({ year: r.year, value: +(r.val / 1e9).toFixed(1) }));
          const fcfFirst = data.fcfHistory[0]?.val;
          const fcfLast = data.fcfHistory[data.fcfHistory.length - 1]?.val;
          const fcfGrowth = fcfFirst && fcfLast && data.fcfHistory.length > 1
            ? +(((fcfLast - fcfFirst) / Math.abs(fcfFirst)) * 100).toFixed(1) : null;
          const s = fcfGrowth > 20 ? 100 : fcfGrowth > 10 ? 80 : fcfGrowth > 0 ? 60 : fcfGrowth !== null ? 20 : null;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s !== null ? '#ef4444' : '#52525b';
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Cash Flow Growth</span>
                </div>
                {s !== null && <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>}
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{fcfGrowth !== null ? `${fcfGrowth > 0 ? '+' : ''}${fcfGrowth}%` : 'N/A'}</div>
              <p className="text-xs text-zinc-500 mb-3">{fcfGrowth > 10 ? 'Above 10% CAGR, healthy generation' : fcfGrowth > 0 ? 'Growing but below threshold' : 'FCF declining or negative'}</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={fcfChart} barSize={24}>
                  <XAxis dataKey="year" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`$${v}B`]} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {fcfChart.map((_, i) => <Cell key={i} fill={i === fcfChart.length - 1 ? c : `${c}55`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
      </div>
    </div>

    {/* BUSINESS QUALITY section */}
    <div className="mb-8">
      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Business Quality & Capital Allocation</div>
      <div className="grid grid-cols-2 gap-4">

        {/* Share Dilution */}
        {(() => {
          const d = data.shareDilution;
          const s = d === null ? null : d < -2 ? 100 : d < 0 ? 80 : d < 2 ? 60 : d < 5 ? 40 : 0;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s !== null ? '#ef4444' : '#52525b';
          const sharesChart = data.sharesHistory?.map(r => ({ year: r.year, value: +(r.val / 1e6).toFixed(0) })) || [];
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Share Dilution</span>
                </div>
                {s !== null && <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>}
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{d !== null ? `${d > 0 ? '+' : ''}${d}%` : 'N/A'}</div>
              <p className="text-xs text-zinc-500 mb-3">{d < -2 ? 'Shrinking >2%, active buybacks' : d < 0 ? 'Mild buybacks' : d < 2 ? 'Mild dilution, mostly stock comp' : d < 5 ? 'Moderate dilution' : 'Heavy dilution above 5%'}</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={sharesChart} barSize={24}>
                  <XAxis dataKey="year" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v}M shares`]} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {sharesChart.map((_, i) => <Cell key={i} fill={i === sharesChart.length - 1 ? '#f59e0b' : '#f59e0b55'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Margin Trend */}
        {(() => {
          const margins = data.marginHistory?.filter(m => m.margin !== null) || [];
          const first = margins[0]?.margin;
          const last = margins[margins.length - 1]?.margin;
          const trend = first !== null && last !== null ? +(last - first).toFixed(1) : null;
          const s = trend > 5 ? 100 : trend > 2 ? 80 : trend > 0 ? 60 : trend > -2 ? 40 : 20;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Margin Trend</span>
                </div>
                {trend !== null && <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>}
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{trend !== null ? `${trend > 0 ? '+' : ''}${trend}pp` : 'N/A'}</div>
              <p className="text-xs text-zinc-500 mb-3">{trend > 3 ? 'Expanded 3+pp, strong improvement' : trend > 0 ? 'Slight margin expansion' : trend > -3 ? 'Margins stable to slightly compressed' : 'Significant margin compression'}</p>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={margins}>
                  <XAxis dataKey="year" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v}%`]} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="margin" stroke={c} strokeWidth={2} dot={{ fill: c, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Capital Structure */}
        {(() => {
          const nd = data.netDebt;
          const fcf = data.fcfVal;
          const ratio = nd && fcf && fcf > 0 ? +(nd / fcf).toFixed(1) : null;
          const s = nd < 0 ? 100 : ratio < 1 ? 80 : ratio < 2 ? 60 : ratio < 3 ? 40 : 20;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          const debtChart = data.revHistory.map((r, i) => ({
            year: r.year,
            cash: data.fcfHistory[i] ? +(data.fcfHistory[i].val / 1e9).toFixed(1) : 0,
            debt: data.debtVal ? +(data.debtVal / 1e9 / data.revHistory.length).toFixed(1) : 0,
          }));
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Capital Structure</span>
                </div>
                <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{fmt(nd)}</div>
              <p className="text-xs text-zinc-500 mb-3">{nd < 0 ? 'Net cash position, no leverage concern' : ratio < 2 ? `Net debt/FCF of ${ratio}x, manageable` : 'High leverage, monitor closely'}</p>
              <div className="space-y-2 mt-2">
                {[
                  { label: 'Cash', val: data.cashVal, color: '#10b981' },
                  { label: 'LT Debt', val: data.debtVal, color: '#ef4444' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{item.label}</span>
                    <span style={{ color: item.color }} className="font-medium">{fmt(item.val)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Return on Capital */}
        {(() => {
          const roic = data.roe;
          const s = roic > 25 ? 100 : roic > 20 ? 80 : roic > 15 ? 60 : roic > 10 ? 40 : 20;
          const c = s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                  <span className="text-sm text-zinc-300">Return on Capital</span>
                </div>
                {roic !== null && <span className="text-sm font-medium" style={{ color: c }}>{s}<span className="text-zinc-600 text-xs">/100</span></span>}
              </div>
              <div className="text-3xl font-medium mt-2 mb-1" style={{ color: c }}>{roic !== null ? `${roic}%` : 'N/A'}</div>
              <p className="text-xs text-zinc-500">{roic > 20 ? 'Above 20%, exceptional capital efficiency' : roic > 15 ? '15-20%, strong returns' : roic > 10 ? '10-15%, respectable returns' : 'Below 10%, weak capital allocation'}</p>
            </div>
          );
        })()}
      </div>
    </div>

    {/* DD Questions */}
    <div className="border-t border-zinc-800 pt-8">
      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-6">Due Diligence Checklist</div>
      <div className="grid grid-cols-5 gap-3 mb-8">
        {DIMS.map(dim => (
          <div key={dim} className="bg-zinc-900 rounded-xl p-3 text-center border border-zinc-800">
            <ScoreRing score={getDimScore(dim)} size={60} />
            <div className="text-xs text-zinc-500 mt-2 leading-tight">{dim}</div>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        {DIMS.map((dim, di) => (
          <div key={dim}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <div className="text-xs uppercase tracking-widest text-zinc-500">{di + 1}. {dim}</div>
              {getDimScore(dim) !== null && (
                <div className={`text-sm font-medium ${getDimScore(dim) >= 70 ? 'text-emerald-400' : getDimScore(dim) >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {getDimScore(dim)}/100
                </div>
              )}
            </div>
            <div className="space-y-3">
              {QUESTIONS.map((q, qi) => q.dim !== dim ? null : (
                <div key={qi} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <p className="text-sm text-zinc-200 mb-3 leading-relaxed">Q{qi + 1}. {q.text}</p>
                  <div className="flex gap-2 mb-3">
                    {['YES', 'NO', 'N/A'].map(opt => (
                      <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [qi]: opt }))}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          answers[qi] === opt
                            ? opt === 'YES' ? 'bg-emerald-500 border-emerald-500 text-white'
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
                      placeholder="Evidence from filing (exact quote)..."
                      value={evidence[qi] || ''}
                      onChange={e => setEvidence(prev => ({ ...prev, [qi]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

          {tab === 'financials' && (
            <div>
              <h2 className="text-xl font-medium mb-6">Financials</h2>
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-5 py-3 text-zinc-500 font-medium">Metric</th>
                      {data.revHistory.map(r => <th key={r.year} className="text-right px-4 py-3 text-zinc-500 font-medium">{r.year}</th>)}
                      <th className="text-right px-4 py-3 text-emerald-500 font-medium">TTM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Revenue', history: data.revHistory, latest: data.revVal },
                      { label: 'Net Income', history: data.niHistory, latest: data.niVal },
                      { label: 'Operating Cash Flow', history: data.fcfHistory, latest: data.fcfVal },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-5 py-3 text-zinc-400">{row.label}</td>
                        {row.history.map((r, i) => <td key={i} className="text-right px-4 py-3 text-white">{fmt(r.val)}</td>)}
                        <td className="text-right px-4 py-3 text-emerald-400 font-medium">{fmt(row.latest)}</td>
                      </tr>
                    ))}
                    {[
                      { label: 'Gross Margin', ttm: fmtP(data.grossMargin) },
                      { label: 'Operating Margin', ttm: fmtP(data.opMargin) },
                      { label: 'Net Margin', ttm: fmtP(data.netMargin) },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-5 py-3 text-zinc-400">{row.label}</td>
                        {data.revHistory.map((_, i) => <td key={i} className="text-right px-4 py-3 text-zinc-600">—</td>)}
                        <td className="text-right px-4 py-3 text-emerald-400">{row.ttm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-zinc-600">Source: SEC EDGAR (XBRL) + Alpha Vantage. Not investment advice.</p>
            </div>
          )}

          {tab === 'dcf' && (
            <div>
              <h2 className="text-xl font-medium mb-6">Dynamic DCF</h2>
              <div className="bg-zinc-900 rounded-xl p-10 text-center border border-zinc-800">
                <div className="text-5xl mb-4 text-zinc-700">$</div>
                <p className="text-zinc-300 mb-2 font-medium">Automated DCF Valuation</p>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">Coming soon — will be calculated automatically using the latest 10-K data.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}