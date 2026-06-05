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

    const company = Object.values(tickerData).find(
      c => c.ticker.toUpperCase() === ticker
    );

    if (!company) {
      return Response.json({ error: 'Ticker no encontrado' }, { status: 404 });
    }

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
        const annual = units
          .filter(u => u.form === '10-K' && u.frame)
          .sort((a, b) => b.end.localeCompare(a.end));
        if (annual.length > 0) return annual;
      }
      return null;
    };

    const revenues = getMetric(['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet']);
    const netIncome = getMetric(['NetIncomeLoss']);
    const operatingIncome = getMetric(['OperatingIncomeLoss']);
    const cashFlow = getMetric(['NetCashProvidedByUsedInOperatingActivities']);
    const assets = getMetric(['Assets']);

    const latest = (arr) => arr?.[0]?.val ?? null;
    const prev = (arr) => arr?.[1]?.val ?? null;

    const revVal = latest(revenues);
    const revPrev = prev(revenues);
    const niVal = latest(netIncome);
    const oiVal = latest(operatingIncome);
    const fcfVal = latest(cashFlow);
    const assetsVal = latest(assets);

    const opMargin = revVal && oiVal ? +((oiVal / revVal) * 100).toFixed(1) : null;
    const netMargin = revVal && niVal ? +((niVal / revVal) * 100).toFixed(1) : null;
    const revGrowth = revVal && revPrev ? +(((revVal - revPrev) / Math.abs(revPrev)) * 100).toFixed(1) : null;

    const revHistory = revenues?.slice(0, 5).reverse().map(r => ({
      year: r.end.slice(0, 4),
      val: r.val
    })) || [];

    return Response.json({
      name: company.title,
      ticker,
      cik,
      revVal, niVal, oiVal, fcfVal, assetsVal,
      opMargin, netMargin, revGrowth,
      revHistory,
    });

  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Error al conectar con SEC EDGAR' }, { status: 500 });
  }
}