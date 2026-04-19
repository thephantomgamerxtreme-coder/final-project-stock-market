// StockQuest — all game data lives here.
// Tweak companies, hints, level configs, dictionary terms, investor types here.

export type Sector =
  | "Energy"
  | "Healthcare"
  | "Tech"
  | "Oil"
  | "Agriculture"
  | "Travel"
  | "Pharma"
  | "Finance"
  | "Construction"
  | "Cybersecurity"
  | "Luxury";

export interface Company {
  ticker: string;
  name: string;
  description: string;
  sector: Sector;
}

export interface NewsHint {
  id: string;
  emoji: string;
  headline: string;
  category: string; // pill text
  explanation: string; // shown on hover
  // Each hint impacts certain sectors with a multiplier (e.g. +0.18 = +18%)
  impacts: { sector: Sector; pct: number }[];
  realWorld: string; // for Real-World Connection sentence (one of these is picked)
}

export interface LevelConfig {
  level: number;
  subtitle: string; // short adventure-style title for the map
  tickers: string[]; // companies offered
  hintIds: string[]; // 5 hint cards
  isBoss?: boolean;
  bossNews?: NewsHint; // surprise breaking news
  newspaper: { headline: string; subhead: string };
  unlockTerms: string[]; // keys from MARKET_DICTIONARY
}

export interface RankTier {
  title: string;
  minStars: number;
  maxStars: number;
  emoji: string;
}

export const RANK_TIERS: RankTier[] = [
  { title: "Intern",            minStars: 0,  maxStars: 5,  emoji: "🎓" },
  { title: "Junior Analyst",    minStars: 6,  maxStars: 10, emoji: "📊" },
  { title: "Market Watcher",    minStars: 11, maxStars: 15, emoji: "🔍" },
  { title: "Fund Manager",      minStars: 16, maxStars: 20, emoji: "💼" },
  { title: "Portfolio Pro",     minStars: 21, maxStars: 25, emoji: "🏆" },
  { title: "Market Guru",       minStars: 26, maxStars: 29, emoji: "🧙" },
  { title: "Wall Street Legend",minStars: 30, maxStars: 30, emoji: "👑" },
];

export function getRank(stars: number): RankTier {
  return RANK_TIERS.find((r) => stars >= r.minStars && stars <= r.maxStars) ?? RANK_TIERS[0];
}

// Vault unlocks at this level. Before this, players must invest 100% of their pool.
export const VAULT_UNLOCK_LEVEL = 5;
export const MAX_STARS = 30;

export interface InvestorType {
  id: "risk" | "strategist" | "safe";
  name: string;
  tagline: string;
  emoji: string;
  description: string;
}

export const INVESTOR_TYPES: InvestorType[] = [
  {
    id: "risk",
    name: "The Risk-Taker",
    tagline: "Goes big or goes home",
    emoji: "🚀",
    description: "You love big bets. Big wins, big lessons.",
  },
  {
    id: "strategist",
    name: "The Strategist",
    tagline: "Reads every signal carefully",
    emoji: "🧠",
    description: "You connect the news to the numbers.",
  },
  {
    id: "safe",
    name: "The Safe Player",
    tagline: "Slow and steady",
    emoji: "🛡️",
    description: "You spread your money and protect the downside.",
  },
];

export const COMPANIES: Record<string, Company> = {
  NRGX:    { ticker: "NRGX",    name: "NovaSolar Energy",   description: "Solar panels and clean power.",          sector: "Energy" },
  HLTH:    { ticker: "HLTH",    name: "PulseHealth Inc",    description: "Hospital supplies and equipment.",        sector: "Healthcare" },
  TECHX:   { ticker: "TECHX",   name: "TechNova Systems",   description: "AI cloud software for businesses.",       sector: "Tech" },
  FUELX:   { ticker: "FUELX",   name: "Crudo Oil Corp",     description: "Crude oil drilling and refining.",        sector: "Oil" },
  AGRIX:   { ticker: "AGRIX",   name: "HarvestX Foods",     description: "Global grain exports.",                   sector: "Agriculture" },
  AIRX:    { ticker: "AIRX",    name: "SkyLink Airlines",   description: "International aviation.",                 sector: "Travel" },
  MEDX:    { ticker: "MEDX",    name: "BioShield Pharma",   description: "Vaccines and treatments.",                sector: "Pharma" },
  BANKX:   { ticker: "BANKX",   name: "CapVault Bank",      description: "Investment banking & lending.",           sector: "Finance" },
  BRIX:    { ticker: "BRIX",    name: "SteelCore Infra",    description: "Construction & infrastructure.",          sector: "Construction" },
  CLOUDX:  { ticker: "CLOUDX",  name: "DataVault Tech",     description: "Cybersecurity SaaS platform.",            sector: "Cybersecurity" },
  GRAINX:  { ticker: "GRAINX",  name: "GreenField Agro",    description: "Organic farming co-operative.",           sector: "Agriculture" },
  LUXEX:   { ticker: "LUXEX",   name: "Prestige Brands",    description: "Luxury goods and fashion.",               sector: "Luxury" },
};

// Master hint library — referenced by levels.
export const HINTS: Record<string, NewsHint> = {
  pandemic: {
    id: "pandemic", emoji: "🦠", headline: "New virus spreads fast", category: "Health",
    explanation: "A new respiratory virus is spreading worldwide. Travel slows down and demand for vaccines spikes.",
    impacts: [{ sector: "Pharma", pct: 0.55 }, { sector: "Healthcare", pct: 0.30 }, { sector: "Travel", pct: -0.45 }, { sector: "Luxury", pct: -0.15 }],
    realWorld: "When COVID-19 hit in 2020, vaccine maker Pfizer's stock gained over 60% in a year while airlines fell ~50%.",
  },
  opec_cut: {
    id: "opec_cut", emoji: "🛢️", headline: "OPEC cuts oil supply", category: "Commodities",
    explanation: "The OPEC group of countries is producing less oil. Less supply usually means higher oil prices.",
    impacts: [{ sector: "Oil", pct: 0.22 }, { sector: "Travel", pct: -0.12 }, { sector: "Construction", pct: -0.05 }],
    realWorld: "In October 2022, OPEC+ cut output by 2 million barrels/day and oil prices jumped over 10% within days.",
  },
  rate_hike: {
    id: "rate_hike", emoji: "📈", headline: "Central bank raises rates", category: "Economy",
    explanation: "Interest rates went up. Borrowing costs more, which is tough for tech and great for banks.",
    impacts: [{ sector: "Finance", pct: 0.18 }, { sector: "Tech", pct: -0.20 }, { sector: "Construction", pct: -0.10 }, { sector: "Luxury", pct: -0.08 }],
    realWorld: "When the US Fed raised rates fast in 2022, the Nasdaq fell 33% while bank stocks held up much better.",
  },
  rate_cut: {
    id: "rate_cut", emoji: "📉", headline: "Rates cut to boost economy", category: "Economy",
    explanation: "Interest rates went down. Money is cheaper to borrow — usually a boost for tech and growth.",
    impacts: [{ sector: "Tech", pct: 0.22 }, { sector: "Cybersecurity", pct: 0.18 }, { sector: "Construction", pct: 0.10 }, { sector: "Finance", pct: -0.08 }],
    realWorld: "After 2008, near-zero interest rates helped power a decade-long bull run in tech stocks like Apple and Amazon.",
  },
  drought: {
    id: "drought", emoji: "🌾", headline: "Massive drought hits farms", category: "Climate",
    explanation: "A long dry spell is destroying crops. Grain becomes scarce, and food prices climb.",
    impacts: [{ sector: "Agriculture", pct: -0.30 }, { sector: "Energy", pct: 0.10 }],
    realWorld: "The 2012 US Midwest drought sent corn prices to record highs and hurt grain exporters worldwide.",
  },
  ai_breakthrough: {
    id: "ai_breakthrough", emoji: "🤖", headline: "Major AI breakthrough", category: "Tech",
    explanation: "A new AI model is dramatically smarter and cheaper. Cloud and AI software companies are buzzing.",
    impacts: [{ sector: "Tech", pct: 0.40 }, { sector: "Cybersecurity", pct: 0.18 }, { sector: "Finance", pct: 0.05 }],
    realWorld: "After ChatGPT launched in late 2022, Nvidia's stock rose more than 200% in 2023 thanks to AI demand.",
  },
  geopolitics: {
    id: "geopolitics", emoji: "⚔️", headline: "Conflict disrupts trade", category: "Geopolitics",
    explanation: "A new conflict is blocking shipping routes. Energy and food costs go up, travel gets risky.",
    impacts: [{ sector: "Oil", pct: 0.18 }, { sector: "Agriculture", pct: 0.12 }, { sector: "Travel", pct: -0.18 }, { sector: "Luxury", pct: -0.10 }],
    realWorld: "When the Russia-Ukraine war began in 2022, oil and wheat prices spiked while European airlines tumbled.",
  },
  green_subsidy: {
    id: "green_subsidy", emoji: "☀️", headline: "Big green energy bill passes", category: "Policy",
    explanation: "The government will pay subsidies for solar and clean energy. Renewable companies get a boost.",
    impacts: [{ sector: "Energy", pct: 0.35 }, { sector: "Oil", pct: -0.12 }],
    realWorld: "After the 2022 US Inflation Reduction Act, solar stocks like First Solar jumped over 40% within months.",
  },
  cyber_attack: {
    id: "cyber_attack", emoji: "🛡️", headline: "Massive cyber attack", category: "Cyber",
    explanation: "Big companies got hacked. Everyone is rushing to buy cybersecurity software.",
    impacts: [{ sector: "Cybersecurity", pct: 0.32 }, { sector: "Finance", pct: -0.08 }],
    realWorld: "After the 2017 NotPetya attack, cybersecurity company CrowdStrike later IPO'd and rose over 400% by 2021.",
  },
  travel_boom: {
    id: "travel_boom", emoji: "✈️", headline: "Travel demand explodes", category: "Travel",
    explanation: "People are booking trips like crazy after staying home. Airlines and luxury brands win.",
    impacts: [{ sector: "Travel", pct: 0.30 }, { sector: "Luxury", pct: 0.20 }, { sector: "Oil", pct: 0.10 }],
    realWorld: "In 2023, post-pandemic 'revenge travel' helped global airline revenues hit a record $850 billion.",
  },
  recession: {
    id: "recession", emoji: "🐻", headline: "Recession warning issued", category: "Economy",
    explanation: "Economists fear the economy is shrinking. People spend less on luxuries and travel.",
    impacts: [{ sector: "Luxury", pct: -0.25 }, { sector: "Travel", pct: -0.18 }, { sector: "Construction", pct: -0.15 }, { sector: "Healthcare", pct: 0.05 }],
    realWorld: "In the 2008 financial crisis, luxury brand LVMH fell ~45% from its peak before recovering years later.",
  },
  infra_bill: {
    id: "infra_bill", emoji: "🏗️", headline: "Trillion-dollar infrastructure plan", category: "Policy",
    explanation: "Government will spend big on roads, bridges and grids. Construction companies cheer.",
    impacts: [{ sector: "Construction", pct: 0.28 }, { sector: "Energy", pct: 0.10 }, { sector: "Oil", pct: 0.05 }],
    realWorld: "After the 2021 US Infrastructure Act, construction-related stocks like Caterpillar gained over 30%.",
  },
  hospital_funding: {
    id: "hospital_funding", emoji: "🏥", headline: "Hospitals get record funding", category: "Health",
    explanation: "New budget pours money into hospitals. Suppliers see more orders.",
    impacts: [{ sector: "Healthcare", pct: 0.22 }, { sector: "Pharma", pct: 0.10 }],
    realWorld: "After COVID, US hospital spending hit a record $1.4 trillion in 2022, helping medical suppliers.",
  },
  organic_trend: {
    id: "organic_trend", emoji: "🥬", headline: "Organic food goes mainstream", category: "Consumer",
    explanation: "Shoppers want organic. Specialty farmers grow fast, while industrial grain feels pressure.",
    impacts: [{ sector: "Agriculture", pct: 0.15 }],
    realWorld: "The global organic food market grew from $90B in 2017 to over $230B by 2024.",
  },
  bank_crisis: {
    id: "bank_crisis", emoji: "🏦", headline: "Mid-size bank collapses", category: "Finance",
    explanation: "A bank failed. Investors are nervous about all banks, even the safe ones.",
    impacts: [{ sector: "Finance", pct: -0.30 }, { sector: "Construction", pct: -0.08 }],
    realWorld: "When Silicon Valley Bank failed in March 2023, the KBW bank index fell over 25% in two weeks.",
  },
};

// 10 levels — companies, hints, optional boss event, newspaper headline, dictionary unlocks.
export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    tickers: ["NRGX", "FUELX"],
    hintIds: ["green_subsidy", "opec_cut", "rate_cut", "drought", "travel_boom"],
    newspaper: { headline: "GREEN ENERGY GETS A GOVERNMENT BOOST", subhead: "Solar shines, but oil holds steady on supply cuts." },
    unlockTerms: ["portfolio", "diversification"],
  },
  {
    level: 2,
    tickers: ["TECHX", "HLTH"],
    hintIds: ["ai_breakthrough", "hospital_funding", "rate_hike", "recession", "cyber_attack"],
    newspaper: { headline: "AI MANIA SWEEPS WALL STREET", subhead: "Tech soars while hospitals get a quiet windfall." },
    unlockTerms: ["bull market"],
  },
  {
    level: 3,
    tickers: ["AIRX", "MEDX"],
    hintIds: ["travel_boom", "pandemic", "rate_cut", "geopolitics", "ai_breakthrough"],
    isBoss: true,
    bossNews: HINTS.pandemic,
    newspaper: { headline: "PANDEMIC SHOCK GROUNDS PLANES, LIFTS PHARMA", subhead: "Markets plunge then pivot as new virus spreads." },
    unlockTerms: ["volatility", "bear market"],
  },
  {
    level: 4,
    tickers: ["BANKX", "BRIX", "FUELX"],
    hintIds: ["rate_hike", "infra_bill", "opec_cut", "bank_crisis", "geopolitics"],
    newspaper: { headline: "RATES UP, BUILDERS BUSY, OIL FIRM", subhead: "Banks cheer higher yields as construction booms." },
    unlockTerms: ["interest rate"],
  },
  {
    level: 5,
    tickers: ["CLOUDX", "TECHX", "AGRIX"],
    hintIds: ["cyber_attack", "ai_breakthrough", "drought", "rate_cut", "organic_trend"],
    newspaper: { headline: "HACKERS STRIKE — CYBER STOCKS SURGE", subhead: "AI wave continues; grain markets fight a brutal drought." },
    unlockTerms: ["dividend", "commodity"],
  },
  {
    level: 6,
    tickers: ["LUXEX", "AIRX", "BANKX"],
    hintIds: ["travel_boom", "recession", "rate_hike", "geopolitics", "infra_bill"],
    isBoss: true,
    bossNews: HINTS.recession,
    newspaper: { headline: "RECESSION ALARM RATTLES LUXURY & TRAVEL", subhead: "Shoppers tighten belts as economists sound the warning." },
    unlockTerms: ["inflation"],
  },
  {
    level: 7,
    tickers: ["NRGX", "FUELX", "AGRIX", "GRAINX", "TECHX"],
    hintIds: ["green_subsidy", "opec_cut", "drought", "organic_trend", "ai_breakthrough"],
    newspaper: { headline: "DROUGHT CRUSHES GRAIN, ORGANIC FARMS RISE", subhead: "Solar subsidies and AI hype keep growth stocks alive." },
    unlockTerms: ["liquidity"],
  },
  {
    level: 8,
    tickers: ["MEDX", "HLTH", "CLOUDX", "BANKX", "BRIX"],
    hintIds: ["pandemic", "hospital_funding", "cyber_attack", "rate_hike", "infra_bill"],
    newspaper: { headline: "HEALTH AND CYBER LEAD A MIXED MARKET", subhead: "Bond yields rise, builders steady, vaccines back in focus." },
    unlockTerms: ["hedge", "IPO"],
  },
  {
    level: 9,
    tickers: ["AIRX", "LUXEX", "FUELX", "MEDX", "GRAINX"],
    hintIds: ["geopolitics", "travel_boom", "opec_cut", "pandemic", "drought"],
    isBoss: true,
    bossNews: HINTS.geopolitics,
    newspaper: { headline: "CONFLICT JOLTS GLOBAL TRADE", subhead: "Oil rockets, airlines stall, food prices climb worldwide." },
    unlockTerms: ["volatility"], // already unlocked? handled by Set
  },
  {
    level: 10,
    tickers: ["TECHX", "CLOUDX", "BANKX", "NRGX", "LUXEX"],
    hintIds: ["ai_breakthrough", "cyber_attack", "rate_cut", "green_subsidy", "recession"],
    newspaper: { headline: "FINAL BELL: AI BOOM MEETS RECESSION FEARS", subhead: "Traders weigh innovation against an uncertain economy." },
    unlockTerms: ["IPO", "hedge"],
  },
];

// Dictionary of financial terms — unlocked progressively.
export const MARKET_DICTIONARY: Record<string, { term: string; emoji: string; definition: string }> = {
  inflation:        { term: "Inflation",        emoji: "🔥", definition: "When prices for everyday things slowly go up over time." },
  diversification:  { term: "Diversification",  emoji: "🧺", definition: "Spreading money across different stocks so one bad pick doesn't sink you." },
  "bull market":    { term: "Bull Market",      emoji: "🐂", definition: "A long period when stock prices keep going up." },
  "bear market":    { term: "Bear Market",      emoji: "🐻", definition: "A long period when stock prices fall a lot." },
  portfolio:        { term: "Portfolio",        emoji: "💼", definition: "The full collection of stocks and investments you own." },
  dividend:         { term: "Dividend",         emoji: "💵", definition: "A small payment some companies share with their stock owners." },
  volatility:       { term: "Volatility",       emoji: "🎢", definition: "How wildly a stock's price jumps up and down." },
  "interest rate":  { term: "Interest Rate",    emoji: "🏦", definition: "The cost of borrowing money — set by central banks." },
  commodity:        { term: "Commodity",        emoji: "🌾", definition: "A raw material like oil, gold or wheat that's traded worldwide." },
  IPO:              { term: "IPO",              emoji: "🎉", definition: "A company's first day selling its shares to the public." },
  hedge:            { term: "Hedge",            emoji: "🛡️", definition: "An investment used to protect against losing money on another one." },
  liquidity:        { term: "Liquidity",        emoji: "💧", definition: "How quickly you can turn an investment back into cash." },
};

export const STARTING_CASH = 500;
export const TOTAL_LEVELS = 10;
export const LIFELINES = 3;
export const TIMER_LEVELS = [9, 10];
export const TIMER_SECONDS = 5 * 60;
