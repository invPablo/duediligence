const FH_KEY = 'd8he51pr01qgcfbpbuo0d8he51pr01qgcfbpbuog';

export async function GET() {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FH_KEY}`);
    const data = await res.json();
    const tickers = data.filter(s =>
      s.type === 'Common Stock' &&
      s.symbol &&
      !s.symbol.includes('.') &&
      !s.symbol.includes('-') &&
      s.symbol.length <= 5 &&
      (s.mic === 'XNYS' || s.mic === 'XNAS')
    ).map(s => s.symbol);
    const random = tickers[Math.floor(Math.random() * tickers.length)];
    return Response.json({ ticker: random });
  } catch (e) {
    return Response.json({ ticker: 'AAPL' });
  }
}