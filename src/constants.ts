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
    { marketCap: "$10k MCAP", description: "🥫 1 POUND of mayo dumped on my head LIVE! The journey begins!" },
    { marketCap: "$20k MCAP", description: "👅 MAYO SHOTS! Taking shots of mayo every hour for 12 hours!" },
    { marketCap: "$30k MCAP", description: "🏊 10 POUND MAYO BATH! Full body submersion in mayo tub!" },
    { marketCap: "$50k MCAP", description: "🍳 MAYO BREAKFAST CHALLENGE! Eggs, bacon, cereal - ALL with mayo!" },
    { marketCap: "$67k MCAP", description: "💥 MENTOS + 10L COKE EXPLOSION! Then mayo shower right after!" },
    { marketCap: "$75k MCAP", description: "🤼 MAYO ARM WRESTLING! Tournament with viewers, loser gets mayo'd!" },
    { marketCap: "$100k MCAP", description: "🎆 20 POUNDS MAYO DROP! Friend from Iowa arrives - double mayo chaos!" },
    { marketCap: "$125k MCAP", description: "🎪 STREET PERFORMER! Mayo juggling in Times Square for tips!" },
    { marketCap: "$150k MCAP", description: "✈️ IOWA ROADTRIP BEGINS! IRL mayo challenges across America!" },
    { marketCap: "$180k MCAP", description: "🎆 FIREWORKS + MAYO SHOW! Launching fireworks covered in mayo!" },
    { marketCap: "$200k MCAP", description: "🎹 MAYO SLIP-N-SLIDE! 100ft mayo slide in the backyard!" },
    { marketCap: "$250k MCAP", description: "🏃 MAYO MARATHON! Running 5K while getting mayo'd at every checkpoint!" },
    { marketCap: "$300k MCAP", description: "🏖️ MIAMI BEACH MAYO PARTY! Public mayo wrestling on South Beach!" },
    { marketCap: "$350k MCAP", description: "🤼 PRO WRESTLER MAYO MATCH! Real WWE wrestler, real mayo, real pain!" },
    { marketCap: "$400k MCAP", description: "💰 $25K GIVEAWAY! Winner gets money + lifetime mayo + exclusive NFT!" },
    { marketCap: "$450k MCAP", description: "🅰️ 48-HOUR MAYO PRISON! Mayo challenge every hour, no sleep!" },
    { marketCap: "$500k MCAP", description: "⛲ MAYO FOUNTAIN INSTALLED! 24/7 mayo fountain in my room!" },
    { marketCap: "$600k MCAP", description: "🌐 VIEWERS CONTROL EVERYTHING! Chat decides all mayo challenges for 48hrs!" },
    { marketCap: "$700k MCAP", description: "🏅 MAYO OLYMPICS BEGIN! 10 events, 10 contestants, infinite mayo!" },
    { marketCap: "$750k MCAP", description: "🕺 DANCE TILL YOU DROP! 24hr dance marathon in mayo suit!" },
    { marketCap: "$800k MCAP", description: "🚗 MAYO CAR WRAP! Driving cross-country in mayo-mobile!" },
    { marketCap: "$900k MCAP", description: "🎁 $50K RANDOM GIVEAWAY! Knock on doors, give strangers money + mayo!" },
    { marketCap: "$950k MCAP", description: "🤝 COLLAB WITH TOP STREAMERS! Flying to LA for mayo content with influencers!" },
    { marketCap: "$1M MCAP", description: "🎯 MAYO SUIT WEEK BEGINS! Wearing mayo packet suit 24/7 for entire week!" },
    { marketCap: "$2M MCAP", description: "🏠 RENT MAYO MANSION IN MIAMI! 30-day party house with daily mayo events!" },
    { marketCap: "$3M MCAP", description: "🎪 MAYOFEST 2025! Three-day festival with major influencers and mayo Olympics!" },
    { marketCap: "$5M MCAP", description: "✈️ WORLD MAYO TOUR! Visit top 10 holders worldwide with mayo challenges!" },
    { marketCap: "$7M MCAP", description: "🏟️ RENT ENTIRE STADIUM! Host massive mayo wrestling event, 10,000 free tickets!" },
    { marketCap: "$10M MCAP", description: "🎮 PARTNER WITH MAJOR STREAMER! MrBeast collab - Mayo challenge video!" },
    { marketCap: "$15M MCAP", description: "🏪 MAYO MEN POP-UP STORES! Launch in LA, NYC, Miami with exclusive merch!" },
    { marketCap: "$20M MCAP", description: "🚁 MAYO HELICOPTER DROP! Literally drop mayo from helicopters in major cities!" },
    { marketCap: "$25M MCAP", description: "🎬 MAYO MEN DOCUMENTARY! Professional Netflix-quality production begins!" },
    { marketCap: "$30M MCAP", description: "⚽ SPONSOR SPORTS TEAM! Mayo Men jersey sponsorship for full season!" },
    { marketCap: "$40M MCAP", description: "🏖️ BUY PRIVATE ISLAND! Mayo Island for exclusive holder events and parties!" },
    { marketCap: "$50M MCAP", description: "💎 BINANCE LISTING PARTY! When we list, massive Vegas mayo party for holders!" },
    { marketCap: "$75M MCAP", description: "🏢 MAYO MEN HEADQUARTERS! Buy actual office building, hire full team!" },
    { marketCap: "$100M MCAP", description: "📺 SUPER BOWL COMMERCIAL! 30-second Mayo Men ad during the big game!" },
    { marketCap: "$150M MCAP", description: "🎸 MAYO MEN MUSIC FESTIVAL! Book A-list artists for holder-exclusive festival!" },
    { marketCap: "$200M MCAP", description: "🏎️ NASCAR MAYO CAR! Full season sponsorship with Mayo Men race car!" },
    { marketCap: "$300M MCAP", description: "🏭 BUILD MAYO FACTORY! Start actual mayo production facility for Mayo Men brand!" },
    { marketCap: "$500M MCAP", description: "🌍 MAYO MEN GOES GLOBAL! Launch in 50 countries with local mayo flavors!" },
    { marketCap: "$750M MCAP", description: "🚀 SPACE MAYO! Send mayo to International Space Station with SpaceX!" },

    // --- ACT II: MAYO EMPIRE ESTABLISHED ---
    { marketCap: "$1B MCAP", description: "🏆 MAYO MEN BRAND LAUNCHES WORLDWIDE! In stores everywhere, we become the official mayo of crypto!" },
    { marketCap: "$1.5B MCAP", description: "💰 $10M HOLDER REWARDS! Distribute profits from Mayo Men sales to all diamond hands!" },
    { marketCap: "$2B MCAP", description: "🏟️ BUY NFL TEAM! Attempt to purchase professional sports franchise - Mayo Men FC!" },
    { marketCap: "$3B MCAP", description: "🎰 MAYO MEN CASINO IN VEGAS! Full casino with mayo-themed games and restaurants!" },
    { marketCap: "$4B MCAP", description: "🛩️ MAYO FORCE ONE! Custom Boeing 747 for Mayo Men world tours!" },
    { marketCap: "$5B MCAP", description: "🌆 MAYO MEN TIMES SQUARE! Buy permanent billboard space in NYC!" },
    { marketCap: "$7B MCAP", description: "🎬 MAYO MEN MOVIE! Hollywood blockbuster with A-list actors!" },
    { marketCap: "$10B MCAP", description: "🌍 MAYO MEN CHANGES THE WORLD! Become top 3 mayo brand globally!" },

    // --- LEGENDARY STATUS UNLOCKED ---
    { marketCap: "$20B MCAP", description: "🏛️ MAYO MEN IN HISTORY! Smithsonian exhibit on the greatest crypto story ever told!" },
    { marketCap: "$50B MCAP", description: "👑 WE BEAT HELLMANN'S! Become world's #1 mayo brand by market share!" },
    { marketCap: "$100B MCAP", description: "🌍 MAYO MEN DAY! UN declares international Mayo Men Day - we made history!" },
    { marketCap: "$500B MCAP", description: "🚀 MARS COLONY MAYO! First condiment on Mars with SpaceX partnership!" },
    { marketCap: "$1T MCAP", description: "🏆 ULTIMATE VICTORY! Mayo Men becomes first meme to $1T - documentary in every school!" },
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