const AV_KEY = 'HQ3HYMDJQK4QBM4I';
const FH_KEY = 'd8he51pr01qgcfbpbuo0d8he51pr01qgcfbpbuog';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return Response.json({ error: 'Ticker requerido' }, { status: 400 });
  }

  try {
    const tickerRes = await fetch(
      'https://www.sec.gov/files/company_tickers.json',
      { headers: { 'User-Agent': 'DueDiligenceApp contact@example.com' } }
    );
    const tickerData = await tickerRes.json();
    const company = Object.values(tickerData).find(c => c.ticker.toUpperCase() === ticker);
    if (!company) return Response.json({ error: 'Ticker no encontrado' }, { status: 404 });

    const cik = String(company.cik_str).padStart(10, '0');

    const factsRes = await fetch(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: { 'User-Agent': 'DueDiligenceApp contact@example.com' } }
    );
    const facts = await factsRes.json();
    const usgaap = facts.facts?.['us-gaap'] || {};

    const getMetric = (keys) => {
      for (const key of keys) {
        const metric = usgaap[key];
        if (!metric) continue;
        const units = metric.units?.USD || metric.units?.shares || metric.units?.pure;
        if (!units) continue;
        const annual = units.filter(u => u.form === '10-K' && u.frame).sort((a, b) => b.end.localeCompare(a.end));
        if (annual.length > 0) return annual;
      }
      return null;
    };

    const revenues = getMetric(['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet']);
    const netIncomes = getMetric(['NetIncomeLoss']);
    const operatingIncomes = getMetric(['OperatingIncomeLoss']);
    const cashFlows = getMetric(['NetCashProvidedByUsedInOperatingActivities']);
    const assets = getMetric(['Assets']);
    const equity = getMetric(['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest']);
    const debt = getMetric(['LongTermDebt', 'LongTermDebtNoncurrent']);
    const cash = getMetric(['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsAndShortTermInvestments']);
    const shares = getMetric(['CommonStockSharesOutstanding']);
    const grossProfit = getMetric(['GrossProfit']);
    const rd = getMetric(['ResearchAndDevelopmentExpense']);

    const latest = (arr) => arr?.[0]?.val ?? null;
    const prev = (arr) => arr?.[1]?.val ?? null;

    const revVal = latest(revenues);
    const revPrev = prev(revenues);
    const niVal = latest(netIncomes);
    const oiVal = latest(operatingIncomes);
    const fcfVal = latest(cashFlows);
    const assetsVal = latest(assets);
    const equityVal = latest(equity);
    const debtVal = latest(debt);
    const cashVal = latest(cash);
    const sharesVal = latest(shares);
    const gpVal = latest(grossProfit);
    const rdVal = latest(rd);

    const opMargin = revVal && oiVal ? +((oiVal / revVal) * 100).toFixed(1) : null;
    const netMargin = revVal && niVal ? +((niVal / revVal) * 100).toFixed(1) : null;
    const grossMargin = revVal && gpVal ? +((gpVal / revVal) * 100).toFixed(1) : null;
    const revGrowth = revVal && revPrev ? +(((revVal - revPrev) / Math.abs(revPrev)) * 100).toFixed(1) : null;
    const roe = equityVal && niVal ? +((niVal / equityVal) * 100).toFixed(1) : null;
    const roa = assetsVal && niVal ? +((niVal / assetsVal) * 100).toFixed(1) : null;
    const debtToEquity = equityVal && debtVal ? +(debtVal / equityVal).toFixed(2) : null;
    const netDebt = debtVal && cashVal ? debtVal - cashVal : null;

    const buildHistory = (arr) => arr?.slice(0, 5).reverse().map(r => ({ year: r.end.slice(0, 4), val: r.val })) || [];
    const revHistory = buildHistory(revenues);
    const niHistory = buildHistory(netIncomes);
    const fcfHistory = buildHistory(cashFlows);
    const oiHistory = buildHistory(operatingIncomes);
    const sharesHistory = buildHistory(shares);
    const gpHistory = buildHistory(grossProfit);

    const marginHistory = revHistory.map((r, i) => {
      const oi = oiHistory[i];
      if (!oi || !r.val) return { year: r.year, margin: null };
      return { year: r.year, margin: +((oi.val / r.val) * 100).toFixed(1) };
    });

    const sharesLatest = sharesHistory[sharesHistory.length - 1]?.val;
    const sharesOldest = sharesHistory[0]?.val;
    const shareDilution = sharesLatest && sharesOldest
      ? +(((sharesLatest - sharesOldest) / sharesOldest) * 100).toFixed(1)
      : null;

    const avRes = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${AV_KEY}`
    );
    const av = await avRes.json();

    const fhRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FH_KEY}`
    );
    const fh = await fhRes.json();

    const currentPrice = fh.c || null;
    const priceChange = fh.d || null;
    const priceChangePct = fh.dp || null;
    const prevClose = fh.pc || null;
    const high = fh.h || null;
    const low = fh.l || null;

    return Response.json({
      name: company.title,
      ticker,
      cik,
      revVal, niVal, oiVal, fcfVal, assetsVal, equityVal, debtVal, cashVal, sharesVal, rdVal,
      opMargin, netMargin, grossMargin, revGrowth, roe, roa, debtToEquity, netDebt,
      revHistory, niHistory, fcfHistory, oiHistory,
      sharesHistory, gpHistory, marginHistory, shareDilution,
      currentPrice, priceChange, priceChangePct, prevClose, high, low,
      marketCap: av.MarketCapitalization ? +av.MarketCapitalization : null,
      pe: av.PERatio && av.PERatio !== 'None' ? +av.PERatio : null,
      forwardPE: av.ForwardPE && av.ForwardPE !== 'None' ? +av.ForwardPE : null,
      eps: av.EPS && av.EPS !== 'None' ? +av.EPS : null,
      beta: av.Beta && av.Beta !== 'None' ? +av.Beta : null,
      high52: av['52WeekHigh'] && av['52WeekHigh'] !== 'None' ? +av['52WeekHigh'] : null,
      low52: av['52WeekLow'] && av['52WeekLow'] !== 'None' ? +av['52WeekLow'] : null,
      dividendYield: av.DividendYield && av.DividendYield !== 'None' ? +(+av.DividendYield * 100).toFixed(2) : null,
      priceToBook: av.PriceToBookRatio && av.PriceToBookRatio !== 'None' ? +av.PriceToBookRatio : null,
      evEbitda: av.EVToEBITDA && av.EVToEBITDA !== 'None' ? +av.EVToEBITDA : null,
      sector: av.Sector || null,
      industry: av.Industry || null,
      description: av.Description || null,
      employees: av.FullTimeEmployees || null,
      exchange: av.Exchange || null,
      country: av.Country || null,
      analystTarget: av.AnalystTargetPrice && av.AnalystTargetPrice !== 'None' ? +av.AnalystTargetPrice : null,
      sharesOutstanding: av.SharesOutstanding && av.SharesOutstanding !== 'None' ? +av.SharesOutstanding : null,
      sharesFloat: av.SharesFloat && av.SharesFloat !== 'None' ? +av.SharesFloat : null,
      shortRatio: av.ShortRatio && av.ShortRatio !== 'None' ? +av.ShortRatio : null,
    });

  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Error al conectar con las fuentes de datos' }, { status: 500 });
  }
}