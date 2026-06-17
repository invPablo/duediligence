'use client';
import Topbar from '../components/Topbar';

export default function About() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
      <Topbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ color: 'var(--accent)', fontSize: '10px', letterSpacing: '3px', marginBottom: '12px' }}>ABOUT</div>
          <h1 style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-1px', marginBottom: '24px' }}>
            Built for people<br />
            <span style={{ color: 'var(--accent)' }}>who just want facts.</span>
          </h1>
          <div style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: 1.9, maxWidth: '600px' }}>
            <p style={{ marginBottom: '16px' }}>
              Most stock tools are either super expensive, overwhelming with jargon, or designed to push you into trades that benefit them, not you.
            </p>
            <p style={{ marginBottom: '16px' }}>
              Traqcker is different. We pull real data from official company filings and turn it into a simple score. No complicated formulas. No noise. Just what matters.
            </p>
            <p>
              Built by someone who got frustrated with existing tools. For anyone who wants to understand stocks without a finance degree.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '48px' }} />

        {/* Team */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ color: 'var(--accent)', fontSize: '10px', letterSpacing: '3px', marginBottom: '24px' }}>THE TEAM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <img
              src="/pablo.jpg"
              alt="Pablo Rodriguez"
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', filter: 'grayscale(100%)', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Pablo Rodriguez</div>
              <div style={{ color: 'var(--accent)', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px' }}>FOUNDER</div>
              <a href="https://twitter.com/InvestingPablo" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--text-3)', fontSize: '11px', textDecoration: 'none', letterSpacing: '1px' }}>
                @InvestingPablo ↗
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '48px' }} />

        {/* Data sources */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ color: 'var(--accent)', fontSize: '10px', letterSpacing: '3px', marginBottom: '16px' }}>DATA SOURCES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
            {[
              { name: 'Official Data', desc: 'Real financial information from company filings' },
              { name: 'FINNHUB', desc: 'Live stock prices and market data' },
              { name: 'YAHOO FINANCE', desc: 'Historical price data' },
            ].map(s => (
              <div key={s.name} style={{ background: 'var(--bg-1)', padding: '16px' }}>
                <div style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>{s.name}</div>
                <div style={{ color: 'var(--text-3)', fontSize: '11px', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', color: 'var(--text-3)', fontSize: '10px', letterSpacing: '1px' }}>
          NOT INVESTMENT ADVICE · DATA FROM PUBLIC SOURCES · © 2026 TRAQCKER
        </div>
      </div>
    </div>
  );
}