import { FaqItem, LeaderboardEntry, LiveEvent, Milestone, Mission, TokenomicItem } from './types';

export const MOCK_TICKER_ITEMS: string[] = [
    "MAYO TIMER IS REAL",
    "BUY = +2 HOURS",
    "SELL = -0.5 HOURS",
    "100 HOURS TO START",
    "MAYO CHALLENGES EVERY HOUR",
    "$1B = MAYO MEN BRAND LAUNCH",
    "YOU CONTROL THE MAYO",
    "GET SAUCY OR DIE TRYING",
];

export const FAQ_DATA: FaqItem[] = [
    { question: "What the hell is this?", answer: "I'm trapped doing mayo challenges until the timer ends! Starting at 100 hours, every BUY adds 2 hours of mayo torture, every SELL removes 0.5 hours. At every market cap milestone, I get covered in more mayo!" },
    { question: "Is this real?", answer: "100% real mayo, 100% real timer, 100% real challenges. Every hour that passes could mean more mayo dumped on me. This is not a simulation - this is mayo madness!" },
    { question: "What happens when the timer runs out?", answer: "The mayo challenges finally end! I'm free from the sauce! The timer hitting zero means no more mayo torture." },
    { question: "Is this a good investment?", answer: "This is not financial advice. This is a mayo-fueled memecoin experiment. You're buying into the most ridiculous mayo challenges ever attempted. Participate for the mayo madness!" },
    { question: "What happens at $1B MCAP?", answer: "At $1B we launch our OWN Mayo Men brand! We go from doing mayo challenges to BECOMING the mayo. We'll create the world's first memecoin mayo brand!" },
    { question: "Is the LP burnt?", answer: "Yes. The liquidity is automatically burnt at launch on pump.fun. This is standard for pump.fun launches and secures the Mayo Men project from the start." },
];


export const DETAILED_ROADMAP_DATA: Milestone[] = [
    // --- ACT I: THE MAYO CHALLENGES BEGIN ---
    { marketCap: "$10k MCAP", description: "I drop 1 POUND of mayo on myself live on stream. The madness begins!" },
    { marketCap: "$20k MCAP", description: "2 POUNDS of mayo dumped on my head. Getting saucy now!" },
    { marketCap: "$30k MCAP", description: "10 POUNDS of mayo bath! I'm swimming in the sauce!" },
    { marketCap: "$50k MCAP", description: "Eat mayo with EVERY meal for 24 hours straight. Mayo cereal anyone?" },
    { marketCap: "$67k MCAP", description: "MENTOS IN 10 LITERS OF COKE EXPLOSION! Maximum chaos mode activated!" },
    { marketCap: "$100k MCAP", description: "20 POUNDS of mayo challenge! Friend from Iowa arrives for IRL mayo madness!" },
    { marketCap: "$150k MCAP", description: "IRL streaming in Iowa begins! Mayo challenges on the streets!" },
    { marketCap: "$180k MCAP", description: "FIREWORKS ROADTRIP TO IOWA! Epic pyrotechnics and mayo combined!" },
    { marketCap: "$200k MCAP", description: "Mayo slip-n-slide in my backyard. Full send!" },
    { marketCap: "$250k MCAP", description: "Mayo food eating contest with viewers. Who can stomach the most?" },
    { marketCap: "$300k MCAP", description: "IRL streaming continues - we head to Miami for beach mayo challenges!" },
    { marketCap: "$350k MCAP", description: "Mayo wrestling match with professional wrestler. Getting physical!" },
    { marketCap: "$400k MCAP", description: "Community Giveaway: Winner gets lifetime supply of mayo + crypto prizes!" },
    { marketCap: "$450k MCAP", description: "48-hour mayo marathon - mayo challenges every hour on the hour!" },
    { marketCap: "$500k MCAP", description: "Mayo fountain installation in my room. It never stops flowing!" },
    { marketCap: "$550k MCAP", description: "Build furniture while covered in mayo. IKEA nightmare mode!" },
    { marketCap: "$600k MCAP", description: "Community controls my mayo intake for 48 hours. You decide my fate!" },
    { marketCap: "$650k MCAP", description: "Mayo stand-up comedy routine. Slippery jokes only!" },
    { marketCap: "$700k MCAP", description: "Mayo Olympics: Multiple mayo-themed challenges in one day!" },
    { marketCap: "$750k MCAP", description: "24-hour dance marathon while covered in mayo. Slippery moves!" },
    { marketCap: "$800k MCAP", description: "10 mile run covered in mayo. The ultimate endurance test!" },
    { marketCap: "$850k MCAP", description: "Mystery mayo mix: Community sends different mayo flavors to try!" },
    { marketCap: "$900k MCAP", description: "Give away $10,000 worth of mayo and crypto to random person!" },
    { marketCap: "$950k MCAP", description: "Fly to meet other memecoin creators for mayo collaboration!" },
    { marketCap: "$1M MCAP", description: "Mayo suit challenge: Wear suit made of mayo packets for a week!" },
    { marketCap: "$3M MCAP", description: "64 hours of continuous mayo challenges. No sleep, all sauce!" },
    { marketCap: "$5M MCAP", description: "Major mayo brand partnership discussions begin!" },
    { marketCap: "$7M MCAP", description: "24-hour mayo stream in Times Square. Taking it public!" },
    { marketCap: "$10M MCAP", description: "First donation to food banks - thousands of mayo jars!" },
    { marketCap: "$15M MCAP", description: "Professional mayo factory tour and custom batch creation!" },
    { marketCap: "$20M MCAP", description: "Mayo mansion setup - every room has mayo theme!" },
    { marketCap: "$30M MCAP", description: "Mayo gaming tournament - winners get crypto and lifetime mayo!" },
    { marketCap: "$50M MCAP", description: "First major exchange listing celebration with mayo pool party!" },
    { marketCap: "$75M MCAP", description: "Fund community mayo art contest with $50k in prizes!" },
    { marketCap: "$100M MCAP", description: "Times Square mayo takeover - billboards everywhere!" },
    { marketCap: "$200M MCAP", description: "Mayo magic show - disappearing mayo tricks live!" },
    { marketCap: "$300M MCAP", description: "Launch official Mayo Men merch line. All mayo themed!",
    { marketCap: "$500M MCAP", description: "Major exchange listing with mayo-themed celebration event!" },
    { marketCap: "$750M MCAP", description: "Build entire room of furniture while swimming in mayo pool!" },

    // --- ACT II: MAYO MEN BRAND LAUNCH ---
    { marketCap: "$1B MCAP", description: "WE CREATE OUR OWN MAYO BRAND: MAYO MEN! Official product launch begins!" },
    { marketCap: "$1.2B MCAP", description: "Mayo Men products in stores nationwide! Billboard campaign begins!" },
    { marketCap: "$1.5B MCAP", description: "World Mayo Tour: Visit every major mayo factory globally!" },
    { marketCap: "$1.8B MCAP", description: "The 'Mayo Millionaire' event: Random holder wins mayo factory tour + $1M!" },
    { marketCap: "$2.1B MCAP", description: "Sponsor UFC fighter to wear Mayo Men shorts in the ring!" },
    { marketCap: "$2.4B MCAP", description: "Purchase Mayo Men headquarters for community events!" },
    { marketCap: "$2.8B MCAP", description: "Cross-country mayo truck tour delivering free mayo nationwide!" },
    { marketCap: "$3B MCAP", description: "Mayo-wrapped Lamborghini giveaway to lucky holder!" },
    { marketCap: "$3.5B MCAP", description: "Global Mayo Men campaign: London, Tokyo, Dubai get sauced!" },

    // --- THE MAYO EMPIRE RISES ---
    { marketCap: "$3.8B MCAP", description: "MayoFest: World's first mayo-themed music festival!" },
    { marketCap: "$4.1B MCAP", description: "Launch Mayo DAO to fund community mayo innovations!" },
    { marketCap: "$4.4B MCAP", description: "Second 'Mayo Millionaire' event with factory tour!" },
    { marketCap: "$4.7B MCAP", description: "Break Guinness World Record for largest mayo pool!" },
    { marketCap: "$5B MCAP", description: "Fund Mayo Men documentary: The Sauciest Story Ever Told!" },
    { marketCap: "$6B MCAP", description: "Second mayo-mobile Lamborghini for holder giveaway!" },
    { marketCap: "$7B MCAP", description: "Third 'Mayo Millionaire' event with lifetime mayo supply!" },
    { marketCap: "$8B MCAP", description: "Buy private island, rename it 'Mayo Island' for events!" },
    { marketCap: "$9B MCAP", description: "Donate millions of mayo jars to food banks worldwide!" },

    // --- THE MAYO REVOLUTION ---
    { marketCap: "$10B MCAP", description: "MAYO MEN GOES GLOBAL! We're now the #1 mayo brand worldwide!" },
    { marketCap: "$10.1B MCAP", description: "Reveal next phase: Mayo Men restaurants opening globally!" },

    // --- LEGENDARY MAYO STATUS ---
    { marketCap: "$50B MCAP", description: "Mayo Men: The Movie gets greenlit by Hollywood!" },
    { marketCap: "$100B MCAP", description: "Giant mayo jar monument erected in every major city!" },
    { marketCap: "$500B MCAP", description: "Buy professional sports team, rename them Mayo Men!" },
    { marketCap: "$1T MCAP", description: "Mayo has conquered the world. We ARE the sauce!" },
];


export const TOKENOMICS_DATA: TokenomicItem[] = [
    { icon: 'tax', title: "0/0 Tax", description: "No taxes on buys or sells. What you trade is what you get." },
    { icon: 'fire', title: "Burnt LP", description: "Liquidity is 100% burnt. The rug cannot be pulled." },
    { icon: 'ghost', title: "Renounced", description: "Contract ownership will be renounced when the timer hits zero." },
    { icon: 'coin-stack', title: "1B Supply", description: "A fixed total supply of 1,000,000,000 tokens." },
];


export const MOCK_LIVE_EVENTS: LiveEvent[] = [
    { id: 1, type: 'buy', description: 'Guard...fG7h bought', timestamp: '1m ago', amount: 0.5 },
    { id: 2, type: 'buy', description: 'Warden...jK9p bought', timestamp: '2m ago', amount: 0.5 },
    { id: 3, type: 'sell', description: 'Fighter...aB3c sold', timestamp: '3m ago', amount: -1.5 },
    { id: 4, type: 'event', description: 'Mayo challenge completed!', timestamp: '5m ago', amount: 2 },
    { id: 5, type: 'buy', description: 'NewInmate...Lq2r bought', timestamp: '6m ago', amount: 0.5 },
    { id: 6, type: 'buy', description: 'OG...xY8z bought', timestamp: '7m ago', amount: 0.5 },
    { id: 7, type: 'sell', description: 'Paperhand...9uVw sold', timestamp: '8m ago', amount: -1.5 },
];

// FIX: Added mock data for MOCK_WARDENS to be used in the Leaderboard component.
export const MOCK_WARDENS: LeaderboardEntry[] = [
    { rank: 1, address: 'Guard1x5fG7hYzab', amount: 50.5, isCurrentUser: false },
    { rank: 2, address: 'WardenA2jK9pCde', amount: 45.0, isCurrentUser: false },
    { rank: 3, address: 'SentryB3aB3cfGhi', amount: 33.0, isCurrentUser: false },
    { rank: 4, address: 'KeeperC4Lq2rjKlm', amount: 28.5, isCurrentUser: false },
    { rank: 5, address: 'HolderD5xY8znOpq', amount: 21.0, isCurrentUser: false },
    { rank: 6, address: 'TopDogE69uVwpQrs', amount: 15.0, isCurrentUser: false },
    { rank: 7, address: 'EnforcerF71234tUv', amount: 12.5, isCurrentUser: false },
];

// FIX: Added mock data for MOCK_FIGHTERS to be used in the Leaderboard component.
export const MOCK_FIGHTERS: LeaderboardEntry[] = [
    { rank: 1, address: 'Fightr1X5fG7hYzab', amount: -75.0, isCurrentUser: false },
    { rank: 2, address: 'RebelA2jK9pCde', amount: -68.5, isCurrentUser: false },
    { rank: 3, address: 'FreeB3aB3cfGhi', amount: -55.0, isCurrentUser: false },
    { rank: 4, address: 'MyWalletC4Lq2rjKlm', amount: -42.0, isCurrentUser: true },
    { rank: 5, address: 'EscapeD5xY8znOpq', amount: -30.5, isCurrentUser: false },
    { rank: 6, address: 'InmateE69uVwpQrs', amount: -22.0, isCurrentUser: false },
    { rank: 7, address: 'BreakerF71234tUv', amount: -18.5, isCurrentUser: false },
];


const ALL_MISSIONS: Mission[] = [
  { id: 1, description: "Survive for 60 seconds in Cell Break.", reward: 1000 },
  { id: 2, description: "Achieve a score of 120,000.", reward: 2500 },
  { id: 3, description: "Submit a song to the Community Playlist.", reward: 500 },
  { id: 4, description: "Vote in the Daily Song Poll.", reward: 250 },
  { id: 5, description: "Collect 5 power-ups in a single run.", reward: 750 },
  { id: 6, description: "Play 5 games of Cell Break.", reward: 500 },
  { id: 7, description: "Reach the 'SURVIVE!' phase.", reward: 1250 },
];

// Function to get a deterministic-random set of 3 missions for the day
export const getDailyMissions = (): Mission[] => {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const shuffled = [...ALL_MISSIONS].sort((a, b) => {
        const x = Math.sin(a.id * seed) * 10000;
        const y = Math.sin(b.id * seed) * 10000;
        return (x - Math.floor(x)) - (y - Math.floor(y));
    });
    return shuffled.slice(0, 3);
};