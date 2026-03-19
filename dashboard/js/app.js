'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const DATA_URL = './data/dashboard_data.json';

const DOMAIN_META = {
  housing: {
    label: 'Housing',
    color: '#f59e0b',
    colors: ['#f59e0b', '#fb923c', '#fbbf24', '#d97706', '#f97316', '#b45309', '#fde68a', '#78350f'],
  },
  labor: {
    label: 'Labor',
    color: '#06b6d4',
    colors: ['#06b6d4', '#0ea5e9', '#38bdf8', '#0284c7', '#7dd3fc', '#0369a1', '#bae6fd', '#075985'],
  },
  rates: {
    label: 'Rates',
    color: '#22c55e',
    colors: ['#22c55e', '#4ade80', '#86efac', '#16a34a', '#bbf7d0', '#15803d', '#a3e635', '#166534'],
  },
  gdp_income: {
    label: 'GDP & Income',
    color: '#a855f7',
    colors: ['#a855f7', '#c084fc', '#d8b4fe', '#9333ea', '#e9d5ff', '#7c3aed', '#ddd6fe', '#6d28d9'],
  },
  regional: {
    label: 'Portland',
    color: '#f43f5e',
    colors: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#fecdd3', '#be123c', '#ffe4e6', '#9f1239'],
  },
};

// Default series highlighted per domain (by series ID)
const DEFAULT_SELECTED = {
  housing:    ['MORTGAGE30US', 'MORTGAGE15US'],
  labor:      ['UNRATE', 'CPIAUCSL'],
  rates:      ['DGS10', 'DGS2'],
  gdp_income: ['GDP', 'GDPC1'],
  regional:   ['LAUMT413892000000003', 'CUURS49ASA0'],
};

const WINDOW_DAYS = { '2yr': 730, '5yr': 1825, 'all': Infinity };

// ─── Glossary data ────────────────────────────────────────────────────────────

const GLOSSARY = {

  // ── HOUSING ─────────────────────────────────────────────────────────────────

  "MORTGAGE30US": {
    name: "30-Year Fixed Mortgage Rate",
    category: "housing",
    source: "Freddie Mac PMMS",
    frequency: "Weekly (Thursdays)",
    units: "Percent (%)",
    lag: "Current week",
    fred_id: "MORTGAGE30US",
    fred_url: "https://fred.stlouisfed.org/series/MORTGAGE30US",
    description: "The average interest rate on a 30-year fixed-rate mortgage in the US, based on Freddie Mac's Primary Mortgage Market Survey (PMMS). Released every Thursday. One of the most widely watched housing affordability indicators — when this rises, monthly payments on new mortgages increase, reducing buyer purchasing power.",
    why_it_matters: "Directly determines housing affordability. A 1% rise on a $400K mortgage adds roughly $250/month to payments.",
    related: ["MORTGAGE15US", "HOUST", "HSN1F"],
  },

  "MORTGAGE15US": {
    name: "15-Year Fixed Mortgage Rate",
    category: "housing",
    source: "Freddie Mac PMMS",
    frequency: "Weekly (Thursdays)",
    units: "Percent (%)",
    lag: "Current week",
    fred_id: "MORTGAGE15US",
    fred_url: "https://fred.stlouisfed.org/series/MORTGAGE15US",
    description: "The average interest rate on a 15-year fixed-rate mortgage in the US, from the Freddie Mac PMMS. Typically 0.5–0.75% below the 30-year rate. Offers a lower interest rate at the cost of higher monthly payments. Often chosen by refinancers who want to build equity faster.",
    why_it_matters: "Signals refinance demand. When the spread between 30Y and 15Y narrows, refinancing becomes more attractive relative to buying.",
    related: ["MORTGAGE30US", "EXHOSLUSM495S"],
  },

  "HOUST": {
    name: "Housing Starts",
    category: "housing",
    source: "Census Bureau / HUD",
    frequency: "Monthly",
    units: "Thousands (SAAR)",
    lag: "~1 month",
    fred_id: "HOUST",
    fred_url: "https://fred.stlouisfed.org/series/HOUST",
    description: "The number of new privately-owned residential housing units for which construction has begun, seasonally adjusted at an annual rate. Covers single-family, 2–4 unit, and 5+ unit buildings. Released monthly by the Census Bureau and HUD.",
    why_it_matters: "A leading indicator of construction employment and housing supply. Sustained weakness signals future inventory tightness, putting upward pressure on home prices.",
    related: ["PERMIT", "HSN1F", "MORTGAGE30US"],
  },

  "PERMIT": {
    name: "Building Permits",
    category: "housing",
    source: "Census Bureau / HUD",
    frequency: "Monthly",
    units: "Thousands (SAAR)",
    lag: "~1 month",
    fred_id: "PERMIT",
    fred_url: "https://fred.stlouisfed.org/series/PERMIT",
    description: "The number of new privately-owned housing units authorized by building permits, seasonally adjusted at an annual rate. Permits must be issued before construction begins, making this a 1–3 month leading indicator of housing starts.",
    why_it_matters: "Better forward indicator than starts because it precedes actual construction. A permit can be pulled months before breaking ground, giving an earlier read on supply pipeline.",
    related: ["HOUST", "HSN1F"],
  },

  "HSN1F": {
    name: "New Single-Family Home Sales",
    category: "housing",
    source: "Census Bureau / HUD",
    frequency: "Monthly",
    units: "Thousands (SAAR)",
    lag: "~1 month",
    fred_id: "HSN1F",
    fred_url: "https://fred.stlouisfed.org/series/HSN1F",
    description: "The number of newly constructed single-family houses sold or for sale, seasonally adjusted at an annual rate. Covers only new homes — roughly 10% of total home sales. Very volatile month-to-month due to small sample size.",
    why_it_matters: "Timely demand signal for new construction. Builders use it to calibrate production. A sustained drop triggers cancellations and inventory pullbacks.",
    related: ["EXHOSLUSM495S", "HOUST", "CSUSHPISA"],
  },

  "EXHOSLUSM495S": {
    name: "Existing Home Sales",
    category: "housing",
    source: "National Association of Realtors (NAR)",
    frequency: "Monthly",
    units: "Millions (SAAR)",
    lag: "~1 month",
    fred_id: "EXHOSLUSM495S",
    fred_url: "https://fred.stlouisfed.org/series/EXHOSLUSM495S",
    description: "Completed transactions on existing single-family homes, townhomes, condominiums, and co-ops, seasonally adjusted at an annual rate. Accounts for approximately 90% of all U.S. home sales. Primarily driven by mortgage rates and available inventory.",
    why_it_matters: "The broadest measure of housing market activity. Each sale generates downstream spending on furniture, appliances, and professional services.",
    related: ["HSN1F", "MORTGAGE30US", "CSUSHPISA"],
  },

  "CSUSHPISA": {
    name: "Case-Shiller National Home Price Index",
    category: "housing",
    source: "S&P / Case-Shiller",
    frequency: "Monthly",
    units: "Index (Jan 2000 = 100, SA)",
    lag: "~2 months",
    fred_id: "CSUSHPISA",
    fred_url: "https://fred.stlouisfed.org/series/CSUSHPISA",
    description: "The S&P CoreLogic Case-Shiller U.S. National Home Price Index, seasonally adjusted. Measures the change in residential real estate values using a repeat-sales methodology — comparing sale prices of the same properties over time. Published with roughly a 2-month lag.",
    why_it_matters: "The gold standard of home price measurement. Uses a 3-month moving average of repeat sales to smooth volatility and capture broad national price trends more accurately than median price statistics.",
    related: ["HPIPONM226S", "EXHOSLUSM495S", "MORTGAGE30US"],
  },

  "HPIPONM226S": {
    name: "FHFA Purchase-Only House Price Index",
    category: "housing",
    source: "Federal Housing Finance Agency (FHFA)",
    frequency: "Monthly",
    units: "Index (Jan 1991 = 100, SA)",
    lag: "~2 months",
    fred_id: "HPIPONM226S",
    fred_url: "https://fred.stlouisfed.org/series/HPIPONM226S",
    description: "The FHFA House Price Index for purchase-only transactions, seasonally adjusted. Based on repeat sales of homes financed with conforming mortgages backed by Fannie Mae or Freddie Mac. Covers a broader geographic area than Case-Shiller but excludes cash sales and jumbo loans.",
    why_it_matters: "Broader geographic coverage than Case-Shiller (includes rural markets) but limited to conforming loan properties. Useful for tracking affordability in markets outside major coastal metros.",
    related: ["CSUSHPISA", "EXHOSLUSM495S"],
  },

  // ── LABOR ────────────────────────────────────────────────────────────────────

  "PAYEMS": {
    name: "Total Nonfarm Payrolls",
    category: "labor",
    source: "BLS Current Employment Statistics (CES)",
    frequency: "Monthly",
    units: "Thousands (SA)",
    lag: "~1 month",
    fred_id: "PAYEMS",
    fred_url: "https://fred.stlouisfed.org/series/PAYEMS",
    description: "Total nonfarm payroll employment, seasonally adjusted, in thousands. Released on the first Friday of the following month in the BLS Employment Situation report. Covers approximately 80% of workers who produce GDP. Excludes farm workers, private household workers, and the self-employed.",
    why_it_matters: "The single most market-moving labor statistic. A miss vs. consensus by even 50K jobs can move equity markets, bond yields, and the dollar within seconds of release.",
    related: ["UNRATE", "U6RATE", "ICSA"],
  },

  "UNRATE": {
    name: "Unemployment Rate (U-3)",
    category: "labor",
    source: "BLS Current Population Survey (CPS)",
    frequency: "Monthly",
    units: "Percent (%)",
    lag: "~1 month",
    fred_id: "UNRATE",
    fred_url: "https://fred.stlouisfed.org/series/UNRATE",
    description: "The U-3 unemployment rate — the percentage of the civilian labor force that is jobless, actively seeking work, and currently available for work, seasonally adjusted. Released monthly in the BLS Employment Situation report alongside nonfarm payrolls.",
    why_it_matters: "One of the Fed's two primary mandates (maximum employment). The FOMC watches this against NAIRU of roughly 4–4.5%. Falling below NAIRU signals inflationary wage pressure.",
    related: ["U6RATE", "PAYEMS", "LAUMT413892000000003"],
  },

  "U6RATE": {
    name: "Underemployment Rate (U-6)",
    category: "labor",
    source: "BLS Current Population Survey (CPS)",
    frequency: "Monthly",
    units: "Percent (%)",
    lag: "~1 month",
    fred_id: "U6RATE",
    fred_url: "https://fred.stlouisfed.org/series/U6RATE",
    description: "The U-6 underemployment rate includes the officially unemployed (U-3) plus marginally attached workers (discouraged + others) plus part-time workers who want full-time employment but cannot find it, seasonally adjusted. A broader measure of labor slack.",
    why_it_matters: "Captures hidden unemployment the headline U-3 rate misses. The U-6/U-3 spread widens in recessions and narrows in strong labor markets — a key signal of actual labor market slack.",
    related: ["UNRATE", "PAYEMS"],
  },

  "CPIAUCSL": {
    name: "CPI — All Items",
    category: "labor",
    source: "BLS Consumer Price Index (CPI-U)",
    frequency: "Monthly",
    units: "Index (1982–84 = 100, SA)",
    lag: "~1 month",
    fred_id: "CPIAUCSL",
    fred_url: "https://fred.stlouisfed.org/series/CPIAUCSL",
    description: "The Consumer Price Index for All Urban Consumers, seasonally adjusted, all items. Measures the average change in prices paid by urban consumers for a representative basket of goods and services including food, energy, shelter, medical care, and transportation. Released monthly by the BLS.",
    why_it_matters: "Used for Social Security COLA adjustments, Treasury TIPS pricing, wage negotiations, and calculating real (inflation-adjusted) wages. The most widely reported inflation number in the U.S.",
    related: ["CPILFESL", "PCEPI", "PCEPILFE", "CUURS49ASA0"],
  },

  "CPILFESL": {
    name: "Core CPI (ex. Food & Energy)",
    category: "labor",
    source: "BLS Consumer Price Index (CPI-U)",
    frequency: "Monthly",
    units: "Index (1982–84 = 100, SA)",
    lag: "~1 month",
    fred_id: "CPILFESL",
    fred_url: "https://fred.stlouisfed.org/series/CPILFESL",
    description: "The Consumer Price Index for All Urban Consumers excluding food and energy, seasonally adjusted. Food and energy prices are volatile and affected by supply shocks beyond the Fed's control. Core CPI strips them out to reveal underlying inflation trends.",
    why_it_matters: "A more stable signal of underlying price pressure than headline CPI. The Fed historically watched core CPI but now places primary weight on core PCE for monetary policy decisions.",
    related: ["CPIAUCSL", "PCEPILFE", "PPIFIS"],
  },

  "PPIFIS": {
    name: "PPI Final Demand",
    category: "labor",
    source: "BLS Producer Price Index (PPI)",
    frequency: "Monthly",
    units: "Index (Nov 2009 = 100, SA)",
    lag: "~1 month",
    fred_id: "PPIFIS",
    fred_url: "https://fred.stlouisfed.org/series/PPIFIS",
    description: "The Producer Price Index for Final Demand, seasonally adjusted. Measures the average change in selling prices received by domestic producers for their output, covering goods, services, and construction. Released by the BLS roughly 2 weeks before the CPI report.",
    why_it_matters: "Leads CPI by 1–3 months — when producers face higher input costs, they eventually pass them on to consumers. A useful pipeline inflation indicator.",
    related: ["CPIAUCSL", "CPILFESL", "PCEPI"],
  },

  "PCEPI": {
    name: "PCE Price Index",
    category: "labor",
    source: "BEA Personal Income and Outlays",
    frequency: "Monthly",
    units: "Index (2017 = 100)",
    lag: "~1 month",
    fred_id: "PCEPI",
    fred_url: "https://fred.stlouisfed.org/series/PCEPI",
    description: "The Personal Consumption Expenditures Price Index, the Federal Reserve's preferred measure of inflation. Broader than CPI — covers all goods and services consumed by individuals including employer-provided healthcare. Uses chain-weighting to capture consumer substitution behavior.",
    why_it_matters: "The Fed's PREFERRED inflation measure. The FOMC's 2% inflation target is defined in terms of PCE, not CPI. Tends to run 0.3–0.5% below CPI due to different weights and methodology.",
    related: ["PCEPILFE", "CPIAUCSL", "CPILFESL"],
  },

  "PCEPILFE": {
    name: "Core PCE Price Index",
    category: "labor",
    source: "BEA Personal Income and Outlays",
    frequency: "Monthly",
    units: "Index (2017 = 100)",
    lag: "~1 month",
    fred_id: "PCEPILFE",
    fred_url: "https://fred.stlouisfed.org/series/PCEPILFE",
    description: "The Personal Consumption Expenditures Price Index excluding food and energy, the Federal Reserve's primary inflation gauge for monetary policy decisions. Released monthly by the BEA alongside personal income and spending data.",
    why_it_matters: "THIS is the specific series the Fed's 2% inflation target is measured against. When this exceeds 2% on a sustained basis, rate hikes become more likely.",
    related: ["PCEPI", "CPILFESL", "DFF"],
  },

  "ICSA": {
    name: "Initial Jobless Claims",
    category: "labor",
    source: "Dept. of Labor (DOL)",
    frequency: "Weekly",
    units: "Number (SA)",
    lag: "~5 days",
    fred_id: "ICSA",
    fred_url: "https://fred.stlouisfed.org/series/ICSA",
    description: "The number of initial claims for unemployment insurance filed in the reference week, seasonally adjusted. Released every Thursday at 8:30 AM ET covering the previous week. The highest-frequency labor market health indicator available. Spikes sharply at the onset of layoff waves.",
    why_it_matters: "The most timely labor market signal — only a 5-day lag. Sustained readings above 300K historically signal deteriorating labor conditions. A key early warning before monthly payroll data arrives.",
    related: ["PAYEMS", "UNRATE", "JTSJOL"],
  },

  "JTSJOL": {
    name: "JOLTS Job Openings",
    category: "labor",
    source: "BLS Job Openings and Labor Turnover Survey (JOLTS)",
    frequency: "Monthly",
    units: "Thousands (SA)",
    lag: "~2 months",
    fred_id: "JTSJOL",
    fred_url: "https://fred.stlouisfed.org/series/JTSJOL",
    description: "The number of job openings on the last business day of the reference month, seasonally adjusted, in thousands. From the BLS JOLTS survey, released with roughly a 2-month lag. Measures the demand side of the labor market.",
    why_it_matters: "The ratio of job openings to unemployed workers is a key Fed indicator. When openings far exceed unemployed workers, employers bid up wages — signaling inflation risk. The Beveridge Curve plots this relationship.",
    related: ["UNRATE", "PAYEMS", "ICSA"],
  },

  // ── RATES ────────────────────────────────────────────────────────────────────

  "DFF": {
    name: "Effective Federal Funds Rate",
    category: "rates",
    source: "Federal Reserve Board",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "DFF",
    fred_url: "https://fred.stlouisfed.org/series/DFF",
    description: "The effective federal funds rate — the actual overnight rate at which commercial banks lend reserve balances to each other, volume-weighted. Calculated and published daily by the Federal Reserve Bank of New York. The FOMC sets a target range; the effective rate reflects actual transactions within that range.",
    why_it_matters: "The most important short-term interest rate in the world. Every other rate — mortgages, auto loans, credit cards, corporate bonds — is ultimately anchored to this rate.",
    related: ["FEDFUNDS", "SOFR", "DTB3", "DGS2"],
  },

  "FEDFUNDS": {
    name: "Federal Funds Rate (Monthly Avg)",
    category: "rates",
    source: "Federal Reserve Board",
    frequency: "Monthly",
    units: "Percent (%)",
    lag: "~1 month",
    fred_id: "FEDFUNDS",
    fred_url: "https://fred.stlouisfed.org/series/FEDFUNDS",
    description: "The monthly average of the effective federal funds rate. Provides a smoothed trend view of Fed policy compared to the daily DFF. Used for historical analysis and long-run charting of the Fed's rate cycle.",
    why_it_matters: "Better for visualizing rate cycles and trends than daily data. The monthly average captures the full impact of an FOMC decision without day-to-day noise.",
    related: ["DFF", "DGS2", "DGS10"],
  },

  "DGS10": {
    name: "10-Year Treasury Yield",
    category: "rates",
    source: "Federal Reserve Board (H.15)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "DGS10",
    fred_url: "https://fred.stlouisfed.org/series/DGS10",
    description: "The constant maturity yield on 10-year U.S. Treasury notes, published daily by the Federal Reserve in its H.15 statistical release. The global benchmark risk-free rate. Reflects market expectations for long-run inflation, real growth, and the term premium.",
    why_it_matters: "The single most important long-term rate in global finance. Used to price mortgages, corporate bonds, and equities via discounted cash flow models. When this rises, long-duration asset valuations fall.",
    related: ["DGS2", "T10Y2Y", "T10Y3M", "MORTGAGE30US"],
  },

  "DGS2": {
    name: "2-Year Treasury Yield",
    category: "rates",
    source: "Federal Reserve Board (H.15)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "DGS2",
    fred_url: "https://fred.stlouisfed.org/series/DGS2",
    description: "The constant maturity yield on 2-year U.S. Treasury notes, published daily by the Federal Reserve. Highly sensitive to near-term Fed policy expectations — moves in anticipation of FOMC decisions and reacts sharply to economic data surprises.",
    why_it_matters: "The most policy-sensitive point on the yield curve. The 2Y/10Y spread (T10Y2Y) is the most widely watched inversion signal. A rising 2-year often leads to higher mortgage rates before the Fed even acts.",
    related: ["DGS10", "T10Y2Y", "DFF"],
  },

  "DGS5": {
    name: "5-Year Treasury Yield",
    category: "rates",
    source: "Federal Reserve Board (H.15)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "DGS5",
    fred_url: "https://fred.stlouisfed.org/series/DGS5",
    description: "The constant maturity yield on 5-year U.S. Treasury notes, published daily by the Federal Reserve. The mid-point of the yield curve between the policy-sensitive short end and the inflation-driven long end. Influences 5-year auto loan and ARM mortgage pricing.",
    why_it_matters: "Key input for 5/1 ARM mortgages, some auto loans, and commercial real estate financing. Also used to extract market-implied inflation expectations through comparison with TIPS.",
    related: ["DGS2", "DGS10", "DGS30"],
  },

  "DGS30": {
    name: "30-Year Treasury Yield",
    category: "rates",
    source: "Federal Reserve Board (H.15)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "DGS30",
    fred_url: "https://fred.stlouisfed.org/series/DGS30",
    description: "The constant maturity yield on 30-year U.S. Treasury bonds (the 'long bond'), published daily by the Federal Reserve. The longest maturity regularly auctioned by the Treasury. Reflects long-run inflation expectations, fiscal sustainability concerns, and long-duration risk appetite.",
    why_it_matters: "Benchmark for long-term fixed income. When the 30-year rises, pension funds and insurance companies face mark-to-market losses on their bond portfolios. Also constrains 30-year fixed mortgage rates.",
    related: ["DGS10", "DGS5", "MORTGAGE30US"],
  },

  "DTB3": {
    name: "3-Month T-Bill Yield",
    category: "rates",
    source: "Federal Reserve Board (H.15)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "DTB3",
    fred_url: "https://fred.stlouisfed.org/series/DTB3",
    description: "The discount yield on 3-month (13-week) U.S. Treasury bills, published daily by the Federal Reserve. The closest market proxy to the theoretically risk-free rate. Reflects the market's expectation of where the Fed funds rate will average over the next 3 months.",
    why_it_matters: "The standard risk-free rate input for Sharpe ratio calculations, Black-Scholes option pricing, and CAPM. Institutional investors compare all short-term yields against this benchmark.",
    related: ["DFF", "T10Y3M", "SOFR"],
  },

  "T10Y2Y": {
    name: "10Y–2Y Treasury Spread",
    category: "rates",
    source: "St. Louis Fed (FRED)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "T10Y2Y",
    fred_url: "https://fred.stlouisfed.org/series/T10Y2Y",
    description: "The difference between the 10-year and 2-year U.S. Treasury constant maturity yields, published daily. A positive value means the yield curve is normal. A negative value means the curve is inverted — short rates exceed long rates — which has historically preceded U.S. recessions.",
    why_it_matters: "THE yield curve inversion indicator. Every U.S. recession since 1955 was preceded by a 10Y–2Y inversion. Average lead time from inversion to recession start is 6–18 months.",
    related: ["T10Y3M", "DGS10", "DGS2"],
  },

  "T10Y3M": {
    name: "10Y–3M Treasury Spread",
    category: "rates",
    source: "St. Louis Fed (FRED)",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "T10Y3M",
    fred_url: "https://fred.stlouisfed.org/series/T10Y3M",
    description: "The difference between the 10-year Treasury yield and the 3-month T-bill yield, published daily. An alternative yield curve inversion measure that some economists argue is a more accurate recession predictor than the 10Y–2Y spread.",
    why_it_matters: "The Federal Reserve Bank of New York uses this specific spread in its recession probability model. A sustained inversion here has preceded all U.S. recessions since 1968.",
    related: ["T10Y2Y", "DGS10", "DTB3"],
  },

  "SOFR": {
    name: "Secured Overnight Financing Rate",
    category: "rates",
    source: "Federal Reserve Bank of New York",
    frequency: "Daily",
    units: "Percent (%)",
    lag: "1 day",
    fred_id: "SOFR",
    fred_url: "https://fred.stlouisfed.org/series/SOFR",
    description: "The Secured Overnight Financing Rate, published daily by the Federal Reserve Bank of New York. Based on actual transactions in the overnight Treasury repurchase agreement (repo) market. Replaced LIBOR as the primary benchmark rate for dollar-denominated derivatives and loans in 2023.",
    why_it_matters: "The new global benchmark replacing LIBOR for trillions in floating-rate contracts. SOFR-linked loans, derivatives, and adjustable-rate mortgages are now the standard. Tracks closely with the Fed funds rate.",
    related: ["DFF", "DTB3", "DGS2"],
  },

  // ── GDP & INCOME ─────────────────────────────────────────────────────────────

  "GDP": {
    name: "Nominal GDP",
    category: "gdp_income",
    source: "BEA National Income and Product Accounts (NIPA)",
    frequency: "Quarterly",
    units: "Billions $ (SAAR)",
    lag: "~1 month after quarter end",
    fred_id: "GDP",
    fred_url: "https://fred.stlouisfed.org/series/GDP",
    description: "U.S. Gross Domestic Product in current dollars, seasonally adjusted at an annual rate, from the BEA. The total market value of all goods and services produced in the U.S. during the quarter. Published in three successive estimates: Advance (1st month after quarter), Second (2nd month), Third/Final (3rd month).",
    why_it_matters: "The broadest measure of economic output in current dollars. Used for calculating debt-to-GDP ratios and comparing the size of economies across countries and time periods.",
    related: ["GDPC1", "A191RL1Q225SBEA", "PCE"],
  },

  "GDPC1": {
    name: "Real GDP",
    category: "gdp_income",
    source: "BEA National Income and Product Accounts (NIPA)",
    frequency: "Quarterly",
    units: "Billions $ chained 2017 (SAAR)",
    lag: "~1 month after quarter end",
    fred_id: "GDPC1",
    fred_url: "https://fred.stlouisfed.org/series/GDPC1",
    description: "U.S. Gross Domestic Product adjusted for inflation using chained 2017 dollars, seasonally adjusted at an annual rate. The primary measure of economic growth — stripping out inflation reveals whether the economy is producing more goods and services, not just paying more for the same output.",
    why_it_matters: "The gold standard measure of economic growth. Two consecutive quarters of negative Real GDP growth is the informal (though not official) definition of a recession.",
    related: ["GDP", "A191RL1Q225SBEA", "PCEPI"],
  },

  "A191RL1Q225SBEA": {
    name: "Real GDP Growth Rate",
    category: "gdp_income",
    source: "BEA National Income and Product Accounts (NIPA)",
    frequency: "Quarterly",
    units: "Percent change (SAAR)",
    lag: "~1 month after quarter end",
    fred_id: "A191RL1Q225SBEA",
    fred_url: "https://fred.stlouisfed.org/series/A191RL1Q225SBEA",
    description: "The percent change in Real GDP from the previous quarter, seasonally adjusted at an annual rate. This is the headline 'GDP growth rate' number reported in the financial media (e.g., 'economy grew at a 2.4% annual rate'). Published in three successive estimates by the BEA.",
    why_it_matters: "The single most widely reported economic statistic. NBER uses this — combined with other indicators — to officially date recessions. The Advance estimate moves markets significantly.",
    related: ["GDPC1", "GDP", "PCE"],
  },

  "PI": {
    name: "Personal Income",
    category: "gdp_income",
    source: "BEA Personal Income and Outlays",
    frequency: "Monthly",
    units: "Billions $ (SAAR)",
    lag: "~1 month",
    fred_id: "PI",
    fred_url: "https://fred.stlouisfed.org/series/PI",
    description: "Total income received by persons from all sources, seasonally adjusted at an annual rate, from the BEA. Includes wages and salaries, proprietors' income, rental income, dividends, interest, and government transfer payments. A comprehensive measure of household income flow.",
    why_it_matters: "A leading indicator of consumer spending (PCE). When income rises, spending typically follows within 1–3 months. Also determines the personal savings rate when compared to disposable income.",
    related: ["DSPI", "PCE", "PAYEMS"],
  },

  "PCE": {
    name: "Personal Consumption Expenditures",
    category: "gdp_income",
    source: "BEA Personal Income and Outlays",
    frequency: "Monthly",
    units: "Billions $ (SAAR)",
    lag: "~1 month",
    fred_id: "PCE",
    fred_url: "https://fred.stlouisfed.org/series/PCE",
    description: "The total value of goods and services consumed by individuals, seasonally adjusted at an annual rate. The largest component of GDP, accounting for approximately 70% of economic output. Covers durable goods (cars, appliances), nondurables (food, clothing), and services (healthcare, housing).",
    why_it_matters: "Consumer spending IS the U.S. economy. If PCE weakens, GDP growth nearly always follows. The most direct measure of whether households are spending or pulling back.",
    related: ["PI", "DSPI", "GDP", "PCEPI"],
  },

  "DSPI": {
    name: "Disposable Personal Income",
    category: "gdp_income",
    source: "BEA Personal Income and Outlays",
    frequency: "Monthly",
    units: "Billions $ (SAAR)",
    lag: "~1 month",
    fred_id: "DSPI",
    fred_url: "https://fred.stlouisfed.org/series/DSPI",
    description: "Personal income after deducting personal taxes and nontax payments, seasonally adjusted at an annual rate. This is the 'take-home' income available for spending or saving. The ratio of personal savings to DPI gives the personal savings rate.",
    why_it_matters: "Determines actual consumer spending capacity. When DPI falls, households must draw down savings or reduce spending. The savings rate derived from DPI and PCE signals future spending sustainability.",
    related: ["PI", "PCE", "CPIAUCSL"],
  },

  // ── PORTLAND / REGIONAL ──────────────────────────────────────────────────────

  "OESM41102300": {
    name: "Portland MSA Mean Annual Wage",
    category: "regional",
    source: "BLS Occupational Employment Statistics (OES)",
    frequency: "Annual",
    units: "Dollars ($)",
    lag: "~6 months",
    bls_id: "OESM41102300",
    bls_url: "https://beta.bls.gov/dataQuery/find?st=0&r=20&q=OESM41102300",
    description: "The mean (average) annual wage across all occupations in the Portland-Vancouver-Hillsboro MSA, from the BLS Occupational Employment and Wage Statistics (OEWS) survey. Published annually, covering May of the reference year. Includes full-time and part-time workers across all industries.",
    why_it_matters: "The benchmark for local labor market compensation in the Portland metro. Use this to gauge whether wage growth is keeping pace with regional inflation (West CPI) or housing costs.",
    related: ["SMU41389200000000001", "CUURS49ASA0", "PAYEMS"],
  },

  "SMU41389200000000001": {
    name: "Portland MSA Nonfarm Employment",
    category: "regional",
    source: "BLS Current Employment Statistics (CES)",
    frequency: "Monthly",
    units: "Thousands (SA)",
    lag: "~1 month",
    bls_id: "SMU41389200000000001",
    bls_url: "https://beta.bls.gov/dataQuery/find?st=0&r=20&q=SMU41389200000000001",
    description: "Total nonfarm payroll employment in the Portland-Vancouver-Hillsboro, OR-WA Metropolitan Statistical Area, seasonally adjusted, in thousands. The local equivalent of the national PAYEMS series. Published monthly by the BLS alongside national employment data.",
    why_it_matters: "Tracks Portland metro economic health. Compare trend to national PAYEMS growth to assess regional outperformance or underperformance — useful for local business, real estate, and policy decisions.",
    related: ["OESM41102300", "SMU41389200600000001", "LAUMT413892000000003", "PAYEMS"],
  },

  "SMU41389200600000001": {
    name: "Portland MSA Government Employment",
    category: "regional",
    source: "BLS Current Employment Statistics (CES)",
    frequency: "Monthly",
    units: "Thousands (SA)",
    lag: "~1 month",
    bls_id: "SMU41389200600000001",
    bls_url: "https://beta.bls.gov/dataQuery/find?st=0&r=20&q=SMU41389200600000001",
    description: "Government sector employment in the Portland-Vancouver-Hillsboro MSA, seasonally adjusted, in thousands. Includes federal, state, and local government workers — a sector that tends to be countercyclical, remaining stable or growing during private sector downturns.",
    why_it_matters: "Government employment is the countercyclical anchor of the local labor market. When private sector hiring slows, government employment often holds steady, cushioning regional job losses.",
    related: ["SMU41389200000000001", "LAUMT413892000000003"],
  },

  "LAUMT413892000000003": {
    name: "Portland MSA Unemployment Rate",
    category: "regional",
    source: "BLS Local Area Unemployment Statistics (LAUS)",
    frequency: "Monthly",
    units: "Percent (%)",
    lag: "~1 month",
    bls_id: "LAUMT413892000000003",
    bls_url: "https://beta.bls.gov/dataQuery/find?st=0&r=20&q=LAUMT413892000000003",
    description: "The unemployment rate for the Portland-Vancouver-Hillsboro, OR-WA Metropolitan Statistical Area, seasonally adjusted. Published monthly by the BLS through the Local Area Unemployment Statistics (LAUS) program, which models local unemployment using unemployment insurance data and the Current Population Survey.",
    why_it_matters: "Compare to the national UNRATE to assess Portland's relative labor market strength. Persistently higher local unemployment signals local economic stress not captured by national figures.",
    related: ["UNRATE", "SMU41389200000000001", "SMU41389200600000001"],
  },

  "CUURS49ASA0": {
    name: "West Region CPI — All Items",
    category: "regional",
    source: "BLS Consumer Price Index (CPI-U)",
    frequency: "Monthly",
    units: "Index (1982–84 = 100, NSA)",
    lag: "~1 month",
    bls_id: "CUURS49ASA0",
    bls_url: "https://beta.bls.gov/dataQuery/find?st=0&r=20&q=CUURS49ASA0",
    description: "The Consumer Price Index for All Urban Consumers (CPI-U) for the West census region, all items, not seasonally adjusted. Covers urban areas in the Western United States including Portland, Seattle, Los Angeles, Denver, and Phoenix. The closest regional inflation proxy for Portland.",
    why_it_matters: "Regional CPI captures West Coast-specific price dynamics (e.g., energy costs, rent) that differ from the national average. Compare to national CPI to see if Portland is experiencing above or below average inflation.",
    related: ["CPIAUCSL", "CUURS49ASA0L1E", "OESM41102300"],
  },

  "CUURS49ASA0L1E": {
    name: "West Region Core CPI",
    category: "regional",
    source: "BLS Consumer Price Index (CPI-U)",
    frequency: "Monthly",
    units: "Index (1982–84 = 100, NSA)",
    lag: "~1 month",
    bls_id: "CUURS49ASA0L1E",
    bls_url: "https://beta.bls.gov/dataQuery/find?st=0&r=20&q=CUURS49ASA0L1E",
    description: "The Consumer Price Index for All Urban Consumers (CPI-U) for the West region, less food and energy, not seasonally adjusted. Strips out volatile food and energy prices to reveal the underlying inflation trend in the Western United States.",
    why_it_matters: "Core regional CPI shows persistent inflation trends in the West. Compare to national core CPI (CPILFESL) to assess whether the West is experiencing structurally different inflation dynamics.",
    related: ["CPILFESL", "CUURS49ASA0", "OESM41102300"],
  },
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  data:           null,
  tab:            'housing',
  selected:       new Set(),
  window:         '2yr',
  chart:          null,
  glossarySearch: '',
  glossaryDomain: 'all',
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtValue(s) {
  const v = s.latest_value;
  switch (s.unit) {
    case '%':
      return v.toFixed(2) + '%';
    case '$':
      if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
      if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
      return '$' + v.toLocaleString('en-US');
    case 'billions $':
      return '$' + (v / 1000).toFixed(2) + 'T';
    case 'thousands':
      if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
      return v.toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'K';
    case 'number':
      if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
      if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
      return v.toLocaleString('en-US');
    case 'index':
      return v.toFixed(2);
    default:
      return v.toLocaleString('en-US');
  }
}

function fmtChange(s) {
  // YoY preferred for inflation / home-price index series
  if (s.yoy_change_pct != null) {
    const sign = s.yoy_change_pct >= 0 ? '+' : '';
    return `${sign}${s.yoy_change_pct.toFixed(2)}% YoY`;
  }
  // Basis points for rate series
  if (s.unit === '%' && s.change_bps != null) {
    const sign = s.change_bps >= 0 ? '+' : '';
    return `${sign}${s.change_bps.toFixed(0)} bps`;
  }
  // Dollar change for annual wage
  if (s.unit === '$' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    const abs = Math.abs(s.change);
    if (abs >= 1e3) return `${sign}$${(s.change / 1e3).toFixed(0)}K`;
    return `${sign}$${s.change.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  // Dollar change for GDP / income
  if (s.unit === 'billions $' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    return `${sign}$${Math.abs(s.change).toFixed(1)}B`;
  }
  // Thousands (payrolls, housing starts, employment)
  if (s.unit === 'thousands' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    const abs  = Math.abs(s.change);
    return abs >= 1000
      ? `${sign}${(s.change / 1000).toFixed(1)}M`
      : `${sign}${s.change.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }
  // Raw number
  if (s.unit === 'number' && s.change != null) {
    const sign = s.change >= 0 ? '+' : '';
    const abs  = Math.abs(s.change);
    return abs >= 1000 ? `${sign}${(s.change / 1000).toFixed(0)}K` : `${sign}${s.change}`;
  }
  // Fallback: percentage change
  if (s.change_pct != null) {
    const sign = s.change_pct >= 0 ? '+' : '';
    return `${sign}${s.change_pct.toFixed(2)}%`;
  }
  return '—';
}

function changeDir(s) {
  const v = s.yoy_change_pct ?? s.change;
  if (v == null) return 'neutral';
  return v > 0 ? 'up' : v < 0 ? 'down' : 'neutral';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function freqLabel(f) {
  return { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }[f] ?? f;
}

function fmtChartY(v, unit) {
  switch (unit) {
    case '%':          return v.toFixed(2) + '%';
    case '$':
      if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
      if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
      return '$' + v.toFixed(0);
    case 'billions $': return '$' + (v / 1000).toFixed(1) + 'T';
    case 'thousands':
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
      return v.toFixed(0) + 'K';
    case 'number':
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
      if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + 'K';
      return v.toFixed(0);
    case 'index':      return v.toFixed(1);
    default:           return v.toFixed(2);
  }
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function filterHistory(history, windowKey) {
  if (!history?.length) return [];
  if (windowKey === 'all') return history;
  const cutoff = Date.now() - WINDOW_DAYS[windowKey] * 86400000;
  return history.filter(pt => new Date(pt.date).getTime() >= cutoff);
}

function normalizeToIndex(history) {
  if (!history.length) return history;
  const base = history[0].value;
  if (base === 0) return history;
  return history.map(pt => ({ date: pt.date, value: (pt.value / base) * 100 }));
}

function needsNormalization(series) {
  return new Set(series.map(s => s.unit)).size > 1;
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderHeader() {
  const d   = new Date(state.data.meta.updated_at);
  const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  document.getElementById('updated-at').textContent = fmt;
}

function renderTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const d = btn.dataset.domain;
    btn.classList.toggle('active', d === state.tab);
    const color = DOMAIN_META[d]?.color ?? '#6b7280';
    btn.style.setProperty('--tab-color', color);
  });
}

function renderKpiCards() {
  const el     = document.getElementById('kpi-cards');
  const series = Object.values(state.data.series).filter(s => s.category === state.tab);
  const color  = DOMAIN_META[state.tab].color;

  el.innerHTML = series.map(s => {
    const active = state.selected.has(s.id);
    const dir    = changeDir(s);
    const arrow  = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–';

    return `
      <div class="kpi-card ${active ? 'active' : ''}" data-id="${s.id}" style="--card-color:${color}">
        <div class="kpi-name">${s.name}</div>
        <div class="kpi-value">${fmtValue(s)}</div>
        <div class="kpi-change ${dir}"><span>${arrow}</span><span>${fmtChange(s)}</span></div>
        <div class="kpi-meta">
          <span class="kpi-date">${fmtDate(s.latest_date)}</span>
          <span class="freq-badge">${freqLabel(s.frequency)}</span>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (state.selected.has(id)) {
        if (state.selected.size > 1) state.selected.delete(id);
      } else {
        state.selected.add(id);
      }
      syncAndRender();
    });
  });
}

function renderCheckboxes() {
  const el     = document.getElementById('series-checkboxes');
  const series = Object.values(state.data.series).filter(s => s.category === state.tab);
  const colors = DOMAIN_META[state.tab].colors;

  el.innerHTML = series.map((s, i) => `
    <label class="series-cb ${state.selected.has(s.id) ? 'active' : ''}" style="--cb-color:${colors[i % colors.length]}">
      <input type="checkbox" value="${s.id}" ${state.selected.has(s.id) ? 'checked' : ''}>
      <span class="cb-dot"></span>
      <span>${s.name}</span>
    </label>`).join('');

  el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked && state.selected.size === 1) { cb.checked = true; return; }
      if (cb.checked) state.selected.add(cb.value);
      else            state.selected.delete(cb.value);
      syncAndRender();
    });
  });
}

function renderChart() {
  const sel = [...state.selected].map(id => state.data.series[id]).filter(Boolean);
  if (!sel.length) return;

  const domainSeries = Object.values(state.data.series).filter(s => s.category === state.tab);
  const colors       = DOMAIN_META[state.tab].colors;
  const normalize    = needsNormalization(sel);

  const datasets = sel.map((s) => {
    const idx   = domainSeries.findIndex(ds => ds.id === s.id);
    const color = colors[(idx >= 0 ? idx : 0) % colors.length];

    let hist = filterHistory(s.history, state.window);
    if (normalize) hist = normalizeToIndex(hist);

    return {
      label:           s.name,
      data:            hist.map(pt => ({ x: pt.date, y: pt.value })),
      borderColor:     color,
      backgroundColor: color + '14',
      borderWidth:     1.75,
      pointRadius:     0,
      pointHoverRadius: 4,
      tension:         0.3,
      fill:            sel.length === 1,
    };
  });

  const yUnitLabel = normalize ? 'Index (100 = window start)' : sel[0].unit;
  const sourceLabel = sel[0].category === 'regional' ? 'BLS' : 'FRED';

  document.getElementById('chart-note').textContent = normalize
    ? 'Different units — normalized to 100 at window start for comparison'
    : `Source: ${sourceLabel}  ·  Unit: ${sel[0].unit}`;

  const opts = {
    responsive:           true,
    maintainAspectRatio:  false,
    animation:            { duration: 220 },
    interaction:          { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: sel.length > 1,
        labels: {
          color:           '#8b949e',
          font:            { family: "'IBM Plex Sans', sans-serif", size: 12 },
          boxWidth:        10,
          padding:         18,
          usePointStyle:   true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1c2128',
        titleColor:      '#c9d1d9',
        bodyColor:       '#8b949e',
        borderColor:     '#30363d',
        borderWidth:     1,
        titleFont: { family: "'IBM Plex Sans', sans-serif", size: 12 },
        bodyFont:  { family: "'IBM Plex Mono', monospace", size: 12 },
        padding:   12,
        callbacks: {
          title: items => {
            const d = new Date(items[0].parsed.x);
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          },
          label: ctx => {
            const v    = ctx.parsed.y;
            const s    = sel[ctx.datasetIndex];
            const fmtd = normalize ? v.toFixed(2) : fmtChartY(v, s.unit);
            return `  ${ctx.dataset.label}: ${fmtd}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: inferTimeUnit(), tooltipFormat: 'yyyy-MM-dd' },
        grid:   { color: '#21262d' },
        border: { color: '#30363d' },
        ticks:  {
          color:        '#8b949e',
          font:         { family: "'IBM Plex Sans', sans-serif", size: 11 },
          maxTicksLimit: 9,
        },
      },
      y: {
        grid:   { color: '#21262d' },
        border: { color: '#30363d' },
        ticks:  {
          color:         '#8b949e',
          font:          { family: "'IBM Plex Mono', monospace", size: 11 },
          maxTicksLimit:  7,
          callback:      v => normalize ? v.toFixed(0) : fmtChartY(v, sel[0].unit),
        },
        title: {
          display: true,
          text:    yUnitLabel,
          color:   '#8b949e',
          font:    { family: "'IBM Plex Sans', sans-serif", size: 11 },
        },
      },
    },
  };

  if (state.chart) {
    state.chart.data.datasets = datasets;
    state.chart.options       = opts;
    state.chart.update('active');
  } else {
    const ctx   = document.getElementById('main-chart').getContext('2d');
    state.chart = new Chart(ctx, { type: 'line', data: { datasets }, options: opts });
  }
}

function inferTimeUnit() {
  return state.window === 'all' ? 'quarter' : 'month';
}

// ─── Glossary renderer ────────────────────────────────────────────────────────

function renderGlossary() {
  const search = state.glossarySearch.toLowerCase().trim();
  const domain = state.glossaryDomain;

  const entries = Object.entries(GLOSSARY).filter(([id, g]) => {
    const matchesDomain = domain === 'all' || g.category === domain;
    if (!matchesDomain) return false;
    if (!search) return true;
    return (
      id.toLowerCase().includes(search) ||
      g.name.toLowerCase().includes(search) ||
      g.description.toLowerCase().includes(search) ||
      g.why_it_matters.toLowerCase().includes(search) ||
      g.source.toLowerCase().includes(search) ||
      (g.units ?? '').toLowerCase().includes(search)
    );
  });

  const grid = document.getElementById('glossary-grid');

  if (!entries.length) {
    grid.innerHTML = '<p class="glossary-empty">No series match your search.</p>';
    return;
  }

  grid.innerHTML = entries.map(([id, g]) => {
    const color        = DOMAIN_META[g.category]?.color ?? '#6b7280';
    const sourceUrl    = g.fred_url ?? g.bls_url ?? '#';
    const sourceLinkTx = g.fred_id ? 'View on FRED →' : 'View on BLS →';

    const chips = (g.related ?? []).map(relId =>
      `<button class="glossary-chip" data-target="${relId}">${relId}</button>`
    ).join('');

    return `
      <div class="glossary-card" id="glossary-card-${id}">
        <div class="glossary-card-header">
          <div class="glossary-card-name" style="color:${color}">${g.name}</div>
          <code class="glossary-card-id">${id}</code>
        </div>
        <div class="glossary-card-meta">
          <span>${g.source}</span>
          <span class="glossary-meta-sep">·</span>
          <span>${g.frequency}</span>
          <span class="glossary-meta-sep">·</span>
          <span>${g.units}</span>
        </div>
        <span class="glossary-lag-badge">${g.lag}</span>
        <p class="glossary-desc">${g.description}</p>
        <p class="glossary-why"><em>Why it matters:</em> ${g.why_it_matters}</p>
        ${chips ? `<div class="glossary-related">${chips}</div>` : ''}
        <div class="glossary-card-footer">
          <a class="glossary-source-link" href="${sourceUrl}" target="_blank" rel="noopener">${sourceLinkTx}</a>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.glossary-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetId = chip.dataset.target;
      // Reset filters so the target card is visible
      state.glossarySearch = '';
      state.glossaryDomain = 'all';
      document.getElementById('glossary-search').value = '';
      document.querySelectorAll('.gfilter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === 'all')
      );
      renderGlossary();
      setTimeout(() => {
        document.getElementById(`glossary-card-${targetId}`)?.scrollIntoView({
          behavior: 'smooth', block: 'center',
        });
      }, 50);
    });
  });
}

function initGlossary() {
  document.getElementById('glossary-search').addEventListener('input', e => {
    state.glossarySearch = e.target.value;
    renderGlossary();
  });

  document.querySelectorAll('.gfilter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.glossaryDomain = btn.dataset.filter;
      document.querySelectorAll('.gfilter-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      renderGlossary();
    });
  });
}

// ─── State transitions ────────────────────────────────────────────────────────

function syncAndRender() {
  renderTabs();
  const isGlossary = state.tab === 'glossary';
  document.getElementById('kpi-section').hidden    = isGlossary;
  document.getElementById('chart-section').hidden  = isGlossary;
  document.getElementById('glossary-section').hidden = !isGlossary;
  if (isGlossary) {
    renderGlossary();
  } else {
    renderKpiCards();
    renderCheckboxes();
    renderChart();
  }
}

function setTab(domain) {
  state.tab = domain;
  if (domain !== 'glossary') {
    state.selected = new Set(DEFAULT_SELECTED[domain] ?? []);
    if (state.chart) { state.chart.destroy(); state.chart = null; }
  }
  syncAndRender();
}

function setWindow(win) {
  state.window = win;
  document.querySelectorAll('.win-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.window === win);
  });
  renderChart();
}

// ─── Release calendar ─────────────────────────────────────────────────────────

const CAL_URL = './data/release_calendar.json';

const CATEGORY_COLORS = {
  housing:    '#f59e0b',
  labor:      '#06b6d4',
  rates:      '#22c55e',
  gdp_income: '#a855f7',
  regional:   '#f43f5e',
};

async function loadReleaseCalendar() {
  const el = document.getElementById('release-list');
  try {
    const res = await fetch(CAL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cal = await res.json();

    const now    = new Date();
    const cutoff = new Date(now.getTime() + 7 * 86400000);

    const upcoming = cal.releases.filter(ev => {
      const d = new Date(ev.datetime_utc);
      return d >= now && d <= cutoff;
    });

    if (!upcoming.length) {
      el.innerHTML = '<p style="font-size:0.78rem;color:var(--text-4);padding:0.5rem 0">No releases in the next 7 days.</p>';
      return;
    }

    el.innerHTML = upcoming.map(ev => {
      const color   = CATEGORY_COLORS[ev.category] ?? '#8b949e';
      const dt      = new Date(ev.datetime_utc);
      const isToday = dt.toDateString() === now.toDateString();
      const dayStr  = isToday
        ? 'Today'
        : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      const whenCls = isToday ? 'release-today' : 'release-soon';

      return `
        <div class="release-item" style="--rel-color:${color}">
          <div class="release-dot"></div>
          <div class="release-info">
            <div class="release-name">${ev.name}</div>
            <div class="release-when ${whenCls}">${dayStr} · ${timeStr}</div>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    el.innerHTML = `<p style="font-size:0.72rem;color:var(--text-4)">Could not load release calendar.</p>`;
  }
}

// ─── About modal ──────────────────────────────────────────────────────────────

function initAboutModal() {
  const overlay  = document.getElementById('about-modal');
  const trigger  = document.getElementById('about-trigger');
  const closeBtn = document.getElementById('modal-close');
  const copyBtn  = document.getElementById('copy-cal-url');
  const copyLbl  = document.getElementById('copy-label');
  const calUrl   = document.getElementById('cal-url-text');

  function openModal()  { overlay.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { overlay.hidden = true;  document.body.style.overflow = ''; }

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(calUrl.textContent.trim()).then(() => {
      copyLbl.textContent = 'Copied!';
      setTimeout(() => { copyLbl.textContent = 'Copy'; }, 2000);
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${DATA_URL}`);
    state.data = await res.json();

    renderHeader();

    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.addEventListener('click', () => setTab(btn.dataset.domain))
    );
    document.querySelectorAll('.win-btn').forEach(btn =>
      btn.addEventListener('click', () => setWindow(btn.dataset.window))
    );

    // Mark 2yr window active on load
    document.querySelector('.win-btn[data-window="2yr"]').classList.add('active');

    // Keyboard shortcut: press 'g' anywhere to jump to Glossary tab
    document.addEventListener('keydown', e => {
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        if (!document.getElementById('about-modal').hidden) return;
        setTab('glossary');
      }
    });

    initGlossary();
    setTab('housing');
    loadReleaseCalendar();
    initAboutModal();

  } catch (err) {
    document.getElementById('app').innerHTML = `
      <div class="error-state">
        <p class="err-title">Failed to load dashboard data</p>
        <p class="err-detail">${err.message}</p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
