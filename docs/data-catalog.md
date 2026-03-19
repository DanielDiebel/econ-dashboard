# Data Catalog

This catalog documents all 40 economic indicators tracked by the econ-dashboard. Each entry includes the data source, frequency, reporting lag, a plain-language description, and why the indicator matters for understanding the U.S. (and Portland regional) economy.

Series IDs link to their primary source. FRED series can also be explored at [fred.stlouisfed.org](https://fred.stlouisfed.org). BLS regional series can be found at [beta.bls.gov/dataQuery](https://beta.bls.gov/dataQuery).

---

## Housing (8 series)

### MORTGAGE30US — 30-Year Fixed Mortgage Rate

| Field | Value |
|---|---|
| Source | Freddie Mac PMMS |
| Frequency | Weekly (Thursdays) |
| Units | Percent (%) |
| Lag | Current week |
| FRED | [MORTGAGE30US](https://fred.stlouisfed.org/series/MORTGAGE30US) |
| Related | MORTGAGE15US, HOUST, HSN1F |

The average interest rate on a 30-year fixed-rate mortgage in the US, based on Freddie Mac's Primary Mortgage Market Survey (PMMS). Released every Thursday. One of the most widely watched housing affordability indicators.

**Why it matters:** Directly determines housing affordability. A 1% rise on a $400K mortgage adds roughly $250/month to payments.

---

### MORTGAGE15US — 15-Year Fixed Mortgage Rate

| Field | Value |
|---|---|
| Source | Freddie Mac PMMS |
| Frequency | Weekly (Thursdays) |
| Units | Percent (%) |
| Lag | Current week |
| FRED | [MORTGAGE15US](https://fred.stlouisfed.org/series/MORTGAGE15US) |
| Related | MORTGAGE30US, EXHOSLUSM495S |

The average interest rate on a 15-year fixed-rate mortgage. Typically 0.5–0.75% below the 30-year rate. Lower rate, higher monthly payment. Often chosen by refinancers who want to build equity faster.

**Why it matters:** Signals refinance demand. When the spread between 30Y and 15Y narrows, refinancing becomes more attractive relative to buying.

---

### HOUST — Housing Starts

| Field | Value |
|---|---|
| Source | Census Bureau / HUD |
| Frequency | Monthly |
| Units | Thousands (SAAR) |
| Lag | ~1 month |
| FRED | [HOUST](https://fred.stlouisfed.org/series/HOUST) |
| Related | PERMIT, HSN1F, MORTGAGE30US |

The number of new privately-owned residential housing units for which construction has begun, seasonally adjusted at an annual rate. Covers single-family, 2–4 unit, and 5+ unit buildings.

**Why it matters:** A leading indicator of construction employment and housing supply. Sustained weakness signals future inventory tightness, putting upward pressure on prices.

---

### PERMIT — Building Permits

| Field | Value |
|---|---|
| Source | Census Bureau / HUD |
| Frequency | Monthly |
| Units | Thousands (SAAR) |
| Lag | ~1 month |
| FRED | [PERMIT](https://fred.stlouisfed.org/series/PERMIT) |
| Related | HOUST, HSN1F |

The number of new privately-owned housing units authorized by building permits, seasonally adjusted at an annual rate. Permits must be issued before construction begins.

**Why it matters:** Better forward indicator than starts — a permit can be pulled months before breaking ground. A 1–3 month lead on housing starts.

---

### HSN1F — New Single-Family Home Sales

| Field | Value |
|---|---|
| Source | Census Bureau / HUD |
| Frequency | Monthly |
| Units | Thousands (SAAR) |
| Lag | ~1 month |
| FRED | [HSN1F](https://fred.stlouisfed.org/series/HSN1F) |
| Related | EXHOSLUSM495S, HOUST, CSUSHPISA |

The number of newly constructed single-family houses sold or for sale, seasonally adjusted at an annual rate. Covers only new homes — roughly 10% of total home sales. Very volatile month-to-month.

**Why it matters:** Timely demand signal for new construction. Builders use it to calibrate production. A sustained drop triggers cancellations and inventory pullbacks.

---

### EXHOSLUSM495S — Existing Home Sales

| Field | Value |
|---|---|
| Source | National Association of Realtors (NAR) |
| Frequency | Monthly |
| Units | Millions (SAAR) |
| Lag | ~1 month |
| FRED | [EXHOSLUSM495S](https://fred.stlouisfed.org/series/EXHOSLUSM495S) |
| Related | HSN1F, MORTGAGE30US, CSUSHPISA |

Completed transactions on existing single-family homes, townhomes, condominiums, and co-ops, seasonally adjusted at an annual rate. Accounts for approximately 90% of all U.S. home sales.

**Why it matters:** The broadest measure of housing market activity. Each sale generates downstream spending on furniture, appliances, and professional services.

---

### CSUSHPISA — Case-Shiller National Home Price Index

| Field | Value |
|---|---|
| Source | S&P / Case-Shiller |
| Frequency | Monthly |
| Units | Index (Jan 2000 = 100, SA) |
| Lag | ~2 months |
| FRED | [CSUSHPISA](https://fred.stlouisfed.org/series/CSUSHPISA) |
| Related | HPIPONM226S, EXHOSLUSM495S, MORTGAGE30US |

The S&P CoreLogic Case-Shiller U.S. National Home Price Index, seasonally adjusted. Uses a repeat-sales methodology — comparing sale prices of the same properties over time. Published with roughly a 2-month lag.

**Why it matters:** The gold standard of home price measurement. Uses a 3-month moving average of repeat sales to smooth volatility and capture broad national price trends accurately.

---

### HPIPONM226S — FHFA Purchase-Only House Price Index

| Field | Value |
|---|---|
| Source | Federal Housing Finance Agency (FHFA) |
| Frequency | Monthly |
| Units | Index (Jan 1991 = 100, SA) |
| Lag | ~2 months |
| FRED | [HPIPONM226S](https://fred.stlouisfed.org/series/HPIPONM226S) |
| Related | CSUSHPISA, EXHOSLUSM495S |

The FHFA House Price Index for purchase-only transactions, seasonally adjusted. Based on repeat sales of homes financed with conforming mortgages backed by Fannie Mae or Freddie Mac.

**Why it matters:** Broader geographic coverage than Case-Shiller (includes rural markets) but limited to conforming loan properties. Useful for tracking affordability outside major coastal metros.

---

## Labor (10 series)

### PAYEMS — Total Nonfarm Payrolls

| Field | Value |
|---|---|
| Source | BLS Current Employment Statistics (CES) |
| Frequency | Monthly |
| Units | Thousands (SA) |
| Lag | ~1 month |
| FRED | [PAYEMS](https://fred.stlouisfed.org/series/PAYEMS) |
| Related | UNRATE, U6RATE, ICSA |

Total nonfarm payroll employment, seasonally adjusted, in thousands. Released on the first Friday of the following month in the BLS Employment Situation report. Covers approximately 80% of workers who produce GDP.

**Why it matters:** The single most market-moving labor statistic. A miss vs. consensus by even 50K jobs can move equity markets, bond yields, and the dollar within seconds of release.

---

### UNRATE — Unemployment Rate (U-3)

| Field | Value |
|---|---|
| Source | BLS Current Population Survey (CPS) |
| Frequency | Monthly |
| Units | Percent (%) |
| Lag | ~1 month |
| FRED | [UNRATE](https://fred.stlouisfed.org/series/UNRATE) |
| Related | U6RATE, PAYEMS, LAUMT413892000000003 |

The U-3 unemployment rate — the percentage of the civilian labor force that is jobless, actively seeking work, and currently available for work, seasonally adjusted.

**Why it matters:** One of the Fed's two primary mandates (maximum employment). The FOMC watches this against NAIRU (~4–4.5%). Falling below NAIRU signals inflationary wage pressure.

---

### U6RATE — Underemployment Rate (U-6)

| Field | Value |
|---|---|
| Source | BLS Current Population Survey (CPS) |
| Frequency | Monthly |
| Units | Percent (%) |
| Lag | ~1 month |
| FRED | [U6RATE](https://fred.stlouisfed.org/series/U6RATE) |
| Related | UNRATE, PAYEMS |

The U-6 underemployment rate includes the officially unemployed plus marginally attached workers plus part-time workers who want full-time employment but cannot find it, seasonally adjusted.

**Why it matters:** Captures hidden unemployment the headline U-3 misses. The U-6/U-3 spread widens in recessions and narrows in strong labor markets.

---

### CPIAUCSL — CPI — All Items

| Field | Value |
|---|---|
| Source | BLS Consumer Price Index (CPI-U) |
| Frequency | Monthly |
| Units | Index (1982–84 = 100, SA) |
| Lag | ~1 month |
| FRED | [CPIAUCSL](https://fred.stlouisfed.org/series/CPIAUCSL) |
| Related | CPILFESL, PCEPI, PCEPILFE, CUURS49ASA0 |

The Consumer Price Index for All Urban Consumers, seasonally adjusted, all items. Measures the average change in prices paid by urban consumers for a representative basket of goods and services.

**Why it matters:** Used for Social Security COLA adjustments, Treasury TIPS pricing, wage negotiations, and calculating real wages. The most widely reported inflation number in the U.S.

---

### CPILFESL — Core CPI (ex. Food & Energy)

| Field | Value |
|---|---|
| Source | BLS Consumer Price Index (CPI-U) |
| Frequency | Monthly |
| Units | Index (1982–84 = 100, SA) |
| Lag | ~1 month |
| FRED | [CPILFESL](https://fred.stlouisfed.org/series/CPILFESL) |
| Related | CPIAUCSL, PCEPILFE, PPIFIS |

CPI excluding food and energy, seasonally adjusted. Strips out volatile components to reveal underlying inflation trends.

**Why it matters:** A more stable signal of underlying price pressure. The Fed historically watched this but now weights core PCE more heavily for policy decisions.

---

### PPIFIS — PPI Final Demand

| Field | Value |
|---|---|
| Source | BLS Producer Price Index (PPI) |
| Frequency | Monthly |
| Units | Index (Nov 2009 = 100, SA) |
| Lag | ~1 month |
| FRED | [PPIFIS](https://fred.stlouisfed.org/series/PPIFIS) |
| Related | CPIAUCSL, CPILFESL, PCEPI |

The Producer Price Index for Final Demand, seasonally adjusted. Measures the average change in selling prices received by domestic producers for goods, services, and construction.

**Why it matters:** Leads CPI by 1–3 months. When producers face higher input costs, they eventually pass them on to consumers. A pipeline inflation indicator.

---

### PCEPI — PCE Price Index

| Field | Value |
|---|---|
| Source | BEA Personal Income and Outlays |
| Frequency | Monthly |
| Units | Index (2017 = 100) |
| Lag | ~1 month |
| FRED | [PCEPI](https://fred.stlouisfed.org/series/PCEPI) |
| Related | PCEPILFE, CPIAUCSL, CPILFESL |

The Personal Consumption Expenditures Price Index. Broader than CPI — covers all goods and services consumed by individuals including employer-provided healthcare. Uses chain-weighting to capture consumer substitution behavior.

**Why it matters:** The Fed's PREFERRED inflation measure. The FOMC's 2% inflation target is defined in terms of PCE, not CPI. Tends to run 0.3–0.5% below CPI.

---

### PCEPILFE — Core PCE Price Index

| Field | Value |
|---|---|
| Source | BEA Personal Income and Outlays |
| Frequency | Monthly |
| Units | Index (2017 = 100) |
| Lag | ~1 month |
| FRED | [PCEPILFE](https://fred.stlouisfed.org/series/PCEPILFE) |
| Related | PCEPI, CPILFESL, DFF |

PCE Price Index excluding food and energy. The Federal Reserve's primary inflation gauge for monetary policy decisions.

**Why it matters:** THIS is the specific series the Fed's 2% inflation target is measured against. When this exceeds 2% on a sustained basis, rate hikes become more likely.

---

### ICSA — Initial Jobless Claims

| Field | Value |
|---|---|
| Source | Dept. of Labor (DOL) |
| Frequency | Weekly |
| Units | Number (SA) |
| Lag | ~5 days |
| FRED | [ICSA](https://fred.stlouisfed.org/series/ICSA) |
| Related | PAYEMS, UNRATE, JTSJOL |

The number of initial claims for unemployment insurance filed in the reference week, seasonally adjusted. Released every Thursday at 8:30 AM ET covering the previous week.

**Why it matters:** The most timely labor market signal — only a 5-day lag. Sustained readings above 300K historically signal deteriorating labor conditions. A key early warning before monthly payroll data arrives.

---

### JTSJOL — JOLTS Job Openings

| Field | Value |
|---|---|
| Source | BLS Job Openings and Labor Turnover Survey (JOLTS) |
| Frequency | Monthly |
| Units | Thousands (SA) |
| Lag | ~2 months |
| FRED | [JTSJOL](https://fred.stlouisfed.org/series/JTSJOL) |
| Related | UNRATE, PAYEMS, ICSA |

The number of job openings on the last business day of the reference month, seasonally adjusted. Measures the demand side of the labor market — how many positions employers are actively trying to fill.

**Why it matters:** The ratio of job openings to unemployed workers is a key Fed indicator. When openings far exceed unemployed workers, employers bid up wages — signaling inflation risk. The Beveridge Curve plots this relationship.

---

## Rates (10 series)

### DFF — Effective Federal Funds Rate

| Field | Value |
|---|---|
| Source | Federal Reserve Board |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [DFF](https://fred.stlouisfed.org/series/DFF) |
| Related | FEDFUNDS, SOFR, DTB3, DGS2 |

The effective federal funds rate — the actual overnight rate at which commercial banks lend reserve balances to each other, volume-weighted. The FOMC sets a target range; the effective rate reflects actual market transactions.

**Why it matters:** The most important short-term interest rate in the world. Every other rate — mortgages, auto loans, credit cards, corporate bonds — is ultimately anchored to this rate.

---

### FEDFUNDS — Federal Funds Rate (Monthly Average)

| Field | Value |
|---|---|
| Source | Federal Reserve Board |
| Frequency | Monthly |
| Units | Percent (%) |
| Lag | ~1 month |
| FRED | [FEDFUNDS](https://fred.stlouisfed.org/series/FEDFUNDS) |
| Related | DFF, DGS2, DGS10 |

The monthly average of the effective federal funds rate. Provides a smoothed trend view of Fed policy for historical analysis and long-run charting of the Fed's rate cycle.

**Why it matters:** Better for visualizing rate cycles and trends than daily data. The monthly average captures the full impact of an FOMC decision without daily noise.

---

### DGS10 — 10-Year Treasury Yield

| Field | Value |
|---|---|
| Source | Federal Reserve Board (H.15) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [DGS10](https://fred.stlouisfed.org/series/DGS10) |
| Related | DGS2, T10Y2Y, T10Y3M, MORTGAGE30US |

The constant maturity yield on 10-year U.S. Treasury notes, published daily by the Federal Reserve. The global benchmark risk-free rate, reflecting long-run inflation expectations, real growth, and the term premium.

**Why it matters:** The single most important long-term rate in global finance. Used to price mortgages, corporate bonds, and equities via discounted cash flow models.

---

### DGS2 — 2-Year Treasury Yield

| Field | Value |
|---|---|
| Source | Federal Reserve Board (H.15) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [DGS2](https://fred.stlouisfed.org/series/DGS2) |
| Related | DGS10, T10Y2Y, DFF |

The constant maturity yield on 2-year U.S. Treasury notes. Highly sensitive to near-term Fed policy expectations — moves in anticipation of FOMC decisions and reacts sharply to economic data surprises.

**Why it matters:** The most policy-sensitive point on the yield curve. A rising 2-year often leads to higher mortgage rates before the Fed even acts.

---

### DGS5 — 5-Year Treasury Yield

| Field | Value |
|---|---|
| Source | Federal Reserve Board (H.15) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [DGS5](https://fred.stlouisfed.org/series/DGS5) |
| Related | DGS2, DGS10, DGS30 |

The constant maturity yield on 5-year U.S. Treasury notes. The mid-point of the yield curve between the policy-sensitive short end and the inflation-driven long end.

**Why it matters:** Key input for 5/1 ARM mortgages, some auto loans, and commercial real estate financing. Used to extract market-implied inflation expectations through TIPS comparison.

---

### DGS30 — 30-Year Treasury Yield

| Field | Value |
|---|---|
| Source | Federal Reserve Board (H.15) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [DGS30](https://fred.stlouisfed.org/series/DGS30) |
| Related | DGS10, DGS5, MORTGAGE30US |

The constant maturity yield on 30-year U.S. Treasury bonds (the "long bond"). Reflects long-run inflation expectations, fiscal sustainability concerns, and long-duration risk appetite.

**Why it matters:** Benchmark for long-term fixed income. When the 30-year rises, pension funds and insurance companies face mark-to-market losses. Also constrains 30-year fixed mortgage rates.

---

### DTB3 — 3-Month T-Bill Yield

| Field | Value |
|---|---|
| Source | Federal Reserve Board (H.15) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [DTB3](https://fred.stlouisfed.org/series/DTB3) |
| Related | DFF, T10Y3M, SOFR |

The discount yield on 3-month U.S. Treasury bills. The closest market proxy to the theoretically risk-free rate. Reflects the market's expectation of where the Fed funds rate will average over the next 3 months.

**Why it matters:** The standard risk-free rate input for Sharpe ratio calculations, Black-Scholes option pricing, and CAPM.

---

### T10Y2Y — 10Y–2Y Treasury Spread

| Field | Value |
|---|---|
| Source | St. Louis Fed (FRED) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [T10Y2Y](https://fred.stlouisfed.org/series/T10Y2Y) |
| Related | T10Y3M, DGS10, DGS2 |

The difference between the 10-year and 2-year U.S. Treasury yields. Negative = inverted yield curve = historically precedes U.S. recessions.

**Why it matters:** THE yield curve inversion indicator. Every U.S. recession since 1955 was preceded by a 10Y–2Y inversion. Average lead time from inversion to recession start is 6–18 months.

---

### T10Y3M — 10Y–3M Treasury Spread

| Field | Value |
|---|---|
| Source | St. Louis Fed (FRED) |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [T10Y3M](https://fred.stlouisfed.org/series/T10Y3M) |
| Related | T10Y2Y, DGS10, DTB3 |

The difference between the 10-year Treasury yield and the 3-month T-bill yield. An alternative yield curve inversion measure used in the NY Fed's recession probability model.

**Why it matters:** The Federal Reserve Bank of New York uses this specific spread in its recession probability model. A sustained inversion has preceded all U.S. recessions since 1968.

---

### SOFR — Secured Overnight Financing Rate

| Field | Value |
|---|---|
| Source | Federal Reserve Bank of New York |
| Frequency | Daily |
| Units | Percent (%) |
| Lag | 1 day |
| FRED | [SOFR](https://fred.stlouisfed.org/series/SOFR) |
| Related | DFF, DTB3, DGS2 |

The Secured Overnight Financing Rate. Based on actual transactions in the overnight Treasury repurchase agreement (repo) market. Replaced LIBOR as the primary benchmark rate for dollar-denominated derivatives and loans in 2023.

**Why it matters:** The new global benchmark for trillions in floating-rate contracts. SOFR-linked loans, derivatives, and adjustable-rate mortgages are now the standard.

---

## GDP & Income (6 series)

### GDP — Nominal GDP

| Field | Value |
|---|---|
| Source | BEA National Income and Product Accounts (NIPA) |
| Frequency | Quarterly |
| Units | Billions $ (SAAR) |
| Lag | ~1 month after quarter end |
| FRED | [GDP](https://fred.stlouisfed.org/series/GDP) |
| Related | GDPC1, A191RL1Q225SBEA, PCE |

U.S. Gross Domestic Product in current dollars, seasonally adjusted at an annual rate. Published in three successive estimates: Advance, Second, and Third/Final.

**Why it matters:** The broadest measure of economic output in current dollars. Used for debt-to-GDP ratios and comparing the size of economies across countries and time periods.

---

### GDPC1 — Real GDP

| Field | Value |
|---|---|
| Source | BEA National Income and Product Accounts (NIPA) |
| Frequency | Quarterly |
| Units | Billions $ chained 2017 (SAAR) |
| Lag | ~1 month after quarter end |
| FRED | [GDPC1](https://fred.stlouisfed.org/series/GDPC1) |
| Related | GDP, A191RL1Q225SBEA, PCEPI |

U.S. Gross Domestic Product adjusted for inflation using chained 2017 dollars. The primary measure of economic growth — strips out inflation to show whether the economy is actually producing more.

**Why it matters:** The gold standard measure of economic growth. Two consecutive quarters of negative Real GDP growth is the informal definition of a recession.

---

### A191RL1Q225SBEA — Real GDP Growth Rate

| Field | Value |
|---|---|
| Source | BEA National Income and Product Accounts (NIPA) |
| Frequency | Quarterly |
| Units | Percent change (SAAR) |
| Lag | ~1 month after quarter end |
| FRED | [A191RL1Q225SBEA](https://fred.stlouisfed.org/series/A191RL1Q225SBEA) |
| Related | GDPC1, GDP, PCE |

The percent change in Real GDP from the previous quarter, seasonally adjusted at an annual rate. The headline "GDP growth rate" number reported in the financial media.

**Why it matters:** The single most widely reported economic statistic. NBER uses this — combined with other indicators — to officially date recessions. The Advance estimate moves markets.

---

### PI — Personal Income

| Field | Value |
|---|---|
| Source | BEA Personal Income and Outlays |
| Frequency | Monthly |
| Units | Billions $ (SAAR) |
| Lag | ~1 month |
| FRED | [PI](https://fred.stlouisfed.org/series/PI) |
| Related | DSPI, PCE, PAYEMS |

Total income received by persons from all sources — wages and salaries, proprietors' income, rental income, dividends, interest, and government transfer payments, seasonally adjusted at an annual rate.

**Why it matters:** A leading indicator of consumer spending (PCE). When income rises, spending typically follows within 1–3 months. Also determines the personal savings rate.

---

### PCE — Personal Consumption Expenditures

| Field | Value |
|---|---|
| Source | BEA Personal Income and Outlays |
| Frequency | Monthly |
| Units | Billions $ (SAAR) |
| Lag | ~1 month |
| FRED | [PCE](https://fred.stlouisfed.org/series/PCE) |
| Related | PI, DSPI, GDP, PCEPI |

The total value of goods and services consumed by individuals, seasonally adjusted at an annual rate. The largest component of GDP, accounting for approximately 70% of economic output.

**Why it matters:** Consumer spending IS the U.S. economy. If PCE weakens, GDP growth nearly always follows. The most direct measure of whether households are spending or pulling back.

---

### DSPI — Disposable Personal Income

| Field | Value |
|---|---|
| Source | BEA Personal Income and Outlays |
| Frequency | Monthly |
| Units | Billions $ (SAAR) |
| Lag | ~1 month |
| FRED | [DSPI](https://fred.stlouisfed.org/series/DSPI) |
| Related | PI, PCE, CPIAUCSL |

Personal income after deducting personal taxes and nontax payments, seasonally adjusted at an annual rate. The "take-home" income available for spending or saving.

**Why it matters:** Determines actual consumer spending capacity. When DPI falls, households must draw down savings or reduce spending. The savings rate derived from DPI and PCE signals future spending sustainability.

---

## Portland / Regional (6 BLS series)

These series are fetched directly from the BLS API (not via FRED) and cover the Portland-Vancouver-Hillsboro, OR-WA Metropolitan Statistical Area. They require a `BLS_API_KEY` to fetch. See [data.bls.gov/registrationEngine](https://data.bls.gov/registrationEngine/) for a free key.

To find additional BLS series IDs, use the [BLS Series ID Formats](https://www.bls.gov/help/hlpforma.htm) guide or the [BLS Data Finder](https://beta.bls.gov/dataQuery).

---

### OESM41102300 — Portland MSA Mean Annual Wage

| Field | Value |
|---|---|
| Source | BLS Occupational Employment Statistics (OES) |
| Frequency | Annual |
| Units | Dollars ($) |
| Lag | ~6 months |
| BLS | [OESM41102300](https://beta.bls.gov/dataQuery/find?st=0&r=20&q=OESM41102300) |
| Related | SMU41389200000000001, CUURS49ASA0, PAYEMS |

The mean (average) annual wage across all occupations in the Portland-Vancouver-Hillsboro MSA, from the BLS Occupational Employment and Wage Statistics (OEWS) survey. Published annually, covering May of the reference year.

**Why it matters:** The benchmark for local labor market compensation. Use this to gauge whether wage growth is keeping pace with regional inflation (West CPI) or housing costs.

---

### SMU41389200000000001 — Portland MSA Nonfarm Employment

| Field | Value |
|---|---|
| Source | BLS Current Employment Statistics (CES) |
| Frequency | Monthly |
| Units | Thousands (SA) |
| Lag | ~1 month |
| BLS | [SMU41389200000000001](https://beta.bls.gov/dataQuery/find?st=0&r=20&q=SMU41389200000000001) |
| Related | OESM41102300, SMU41389200600000001, LAUMT413892000000003, PAYEMS |

Total nonfarm payroll employment in the Portland-Vancouver-Hillsboro, OR-WA Metropolitan Statistical Area, seasonally adjusted, in thousands. The local equivalent of the national PAYEMS series.

**Why it matters:** Tracks Portland metro economic health. Compare trend to national PAYEMS growth to assess regional outperformance or underperformance.

---

### SMU41389200600000001 — Portland MSA Government Employment

| Field | Value |
|---|---|
| Source | BLS Current Employment Statistics (CES) |
| Frequency | Monthly |
| Units | Thousands (SA) |
| Lag | ~1 month |
| BLS | [SMU41389200600000001](https://beta.bls.gov/dataQuery/find?st=0&r=20&q=SMU41389200600000001) |
| Related | SMU41389200000000001, LAUMT413892000000003 |

Government sector employment in the Portland-Vancouver-Hillsboro MSA, seasonally adjusted, in thousands. Includes federal, state, and local government workers.

**Why it matters:** Government employment is the countercyclical anchor of the local labor market. When private sector hiring slows, government employment often holds steady, cushioning regional job losses.

---

### LAUMT413892000000003 — Portland MSA Unemployment Rate

| Field | Value |
|---|---|
| Source | BLS Local Area Unemployment Statistics (LAUS) |
| Frequency | Monthly |
| Units | Percent (%) |
| Lag | ~1 month |
| BLS | [LAUMT413892000000003](https://beta.bls.gov/dataQuery/find?st=0&r=20&q=LAUMT413892000000003) |
| Related | UNRATE, SMU41389200000000001, SMU41389200600000001 |

The unemployment rate for the Portland-Vancouver-Hillsboro, OR-WA Metropolitan Statistical Area, seasonally adjusted. Published monthly through the BLS LAUS program.

**Why it matters:** Compare to the national UNRATE to assess Portland's relative labor market strength. Persistently higher local unemployment signals local economic stress not captured by national figures.

---

### CUURS49ASA0 — West Region CPI — All Items

| Field | Value |
|---|---|
| Source | BLS Consumer Price Index (CPI-U) |
| Frequency | Monthly |
| Units | Index (1982–84 = 100, NSA) |
| Lag | ~1 month |
| BLS | [CUURS49ASA0](https://beta.bls.gov/dataQuery/find?st=0&r=20&q=CUURS49ASA0) |
| Related | CPIAUCSL, CUURS49ASA0L1E, OESM41102300 |

The Consumer Price Index for All Urban Consumers (CPI-U) for the West census region, all items, not seasonally adjusted. Covers urban areas including Portland, Seattle, Los Angeles, Denver, and Phoenix.

**Why it matters:** Regional CPI captures West Coast-specific price dynamics that differ from the national average. Compare to national CPI (CPIAUCSL) to see if Portland is experiencing above or below average inflation.

---

### CUURS49ASA0L1E — West Region Core CPI

| Field | Value |
|---|---|
| Source | BLS Consumer Price Index (CPI-U) |
| Frequency | Monthly |
| Units | Index (1982–84 = 100, NSA) |
| Lag | ~1 month |
| BLS | [CUURS49ASA0L1E](https://beta.bls.gov/dataQuery/find?st=0&r=20&q=CUURS49ASA0L1E) |
| Related | CPILFESL, CUURS49ASA0, OESM41102300 |

CPI-U for the West region less food and energy, not seasonally adjusted. Strips out volatile components to reveal the underlying inflation trend in the Western United States.

**Why it matters:** Core regional CPI shows persistent inflation trends in the West. Compare to national core CPI (CPILFESL) to assess whether the West is experiencing structurally different inflation dynamics.
