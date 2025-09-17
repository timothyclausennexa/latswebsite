import { FaqItem, LeaderboardEntry, LiveEvent, Milestone, Mission, TokenomicItem } from './types';

export const MOCK_TICKER_ITEMS: string[] = [
    "TIMER IS REAL",
    "BUY TO ADD TIME",
    "SELL TO REDUCE TIME",
    "NFA",
    "DYOR",
    "24/7 STREAM LIVE",
    "COMMUNITY CONTROLS THE TIMER",
    "10,000X POTENTIAL",
];

export const FAQ_DATA: FaqItem[] = [
    { question: "What the hell is this?", answer: "It's a live social experiment. SLURP is bound to a 24/7 entertainment livestream. The community controls the length of his 'sentence' by buying and selling the $SLURP token. Buying adds time, selling reduces it. Freedom is when the timer hits zero." },
    { question: "Is this real?", answer: "The timer, the stream, and the tokenomics are 100% real. The consequences are real. This is not a simulation." },
    { question: "What happens when the timer runs out?", answer: "The stream immediately ends. The token's utility (controlling the timer) ceases, and it becomes a relic of the experiment. The only way to win is for the timer to reach zero." },
    { question: "Is this a good investment?", answer: "This is not financial advice. This is a high-risk, high-reward memecoin and social experiment. Its value is derived entirely from community participation and narrative. Participate for the entertainment and the story. Any financial gain is a byproduct of a successful experiment." },
    { question: "What happens at $1B MCAP? Is he free?", answer: "No. Reaching $1B doesn't grant freedom—it triggers Season 2. The game gets harder, but the community's power to fight back increases: sells will remove TRIPLE the amount of time. The only escape is the timer hitting zero." },
    { question: "Is the LP burnt?", answer: "Yes. The liquidity is automatically burnt at launch on pump.fun. This is standard for pump.fun launches and secures the project from the start." },
];


export const DETAILED_ROADMAP_DATA: Milestone[] = [
    // --- ACT I: THE GRIND ---
    { marketCap: "$30k MCAP", description: "SLURP eats 50 Warheads candies with NO water on stream. The pain begins." },
    { marketCap: "$50k MCAP", description: "SLURP drinks an ENTIRE bottle of hot sauce on stream. Choose your poison, community." },
    { marketCap: "$100k MCAP", description: "DEX fee paid. The token is officially on Raydium." },
    { marketCap: "$125k MCAP", description: "SLURP attempts to eat 10 ghost peppers in under 5 minutes." },
    { marketCap: "$150k MCAP", description: "We go up to Iowa and do IRL streaming." },
    { marketCap: "$200k MCAP", description: "Second wave of 100 paid boosts are launched." },
    { marketCap: "$300k MCAP", description: "Ice bath challenge: Must stay submerged for 10 minutes." },
    { marketCap: "$250k MCAP", description: "Going to Minnesota and gambling a bunch live." },
    { marketCap: "$350k MCAP", description: "SLURP shaves his head completely on stream." },
    { marketCap: "$400k MCAP", description: "Community Giveaway Round 1: MacBook Pro & 2 iPhones (live wheel)." },
    { marketCap: "$450k MCAP", description: "48 hours awake or add 100k to the timer." },
    { marketCap: "$500k MCAP", description: "SLURP prints and places 1,500 QR codes across his city for a scavenger hunt." },
    { marketCap: "$550k MCAP", description: "Buy the biggest IKEA furniture piece, bring it to a desert, and build it fully there with water." },
    { marketCap: "$600k MCAP", description: "Community controls SLURP's diet for 48 hours via polls." },
    { marketCap: "$650k MCAP", description: "SLURP learns and performs a stand-up comedy routine live." },
    { marketCap: "$700k MCAP", description: "Community Giveaway Round 2: Another MacBook Pro & 3 iPads (live wheel)." },
    { marketCap: "$750k MCAP", description: "24-hour dance marathon - must dance to every song requested." },
    { marketCap: "$800k MCAP", description: "10 mile run with training beforehand." },
    { marketCap: "$850k MCAP", description: "Mystery box challenge: Eat whatever the community sends (within reason)." },
    { marketCap: "$900k MCAP", description: "Give a random person on the street $10,000." },
    { marketCap: "$950k MCAP", description: "Get a flight to Miami to meet the subathon meme coin creator." },
    { marketCap: "$1M MCAP", description: "Have to wear a clown suit everywhere for 1 week straight." },
    { marketCap: "$3M MCAP", description: "64 hours of no sleep." },
    { marketCap: "$5M MCAP", description: "Major influencer marketing campaign begins." },
    { marketCap: "$7M MCAP", description: "24-hour street-IRL stream in a major city." },
    { marketCap: "$10M MCAP", description: "First major charity donation to a cause chosen by the community." },
    { marketCap: "$15M MCAP", description: "Professional audit of the contract to build further trust." },
    { marketCap: "$20M MCAP", description: "Go to Latvia and start a 24/7 stream house with cameras in all angles." },
    { marketCap: "$30M MCAP", description: "Community Tournament: Top 3 'Cell Break' players of the week win SOL." },
    { marketCap: "$50M MCAP", description: "First Tier-2 CEX listing push." },
    { marketCap: "$75M MCAP", description: "Fund a community-led marketing campaign with a $50k budget." },
    { marketCap: "$100M MCAP", description: "Attempt a Times Square Takeover: Buy as many billboards as possible." },
    { marketCap: "$200M MCAP", description: "SLURP must learn and perform a full magic show on stream." },
    { marketCap: "$300M MCAP", description: "'The Cell' merch line is launched. Profits are used for buybacks." },
    { marketCap: "$500M MCAP", description: "Major Tier-1 CEX listing." },
    { marketCap: "$750M MCAP", description: "SLURP has to build a full-scale IKEA furniture set on stream, blindfolded." },

    // --- ACT II: EXPANSION & POWER ---
    { marketCap: "$1B MCAP", description: "SEASON 2 BEGINS. Sells are now 3x more effective. The game changes." },
    { marketCap: "$1.2B MCAP", description: "Billboard Campaign Across America. We attempt to get $SLURP in every major US city." },
    { marketCap: "$1.5B MCAP", description: "World Tour Part 1: SLURP travels to meet other memecoin creators and communities." },
    { marketCap: "$1.8B MCAP", description: "The 'SLURP Millionaire' event: A random token holder with over $1000 worth is sent enough to become a millionaire." },
    { marketCap: "$2.1B MCAP", description: "Sponsor a UFC fighter or a professional esports team." },
    { marketCap: "$2.4B MCAP", description: "Purchase the first 'SLURP Community Estate', a property for holders to visit." },
    { marketCap: "$2.8B MCAP", description: "The American Talaria Run: SLURP travels from California to New York on an e-bike, with community challenges along the way." },
    { marketCap: "$3B MCAP", description: "Purchase a Lamborghini Huracan, wrap it in $SLURP branding, and give it away to a random holder." },
    { marketCap: "$3.5B MCAP", description: "Global Billboard Campaign: We target London, Tokyo, and Dubai." },

    // --- THE GRIND TO THE ENDGAME ---
    { marketCap: "$3.8B MCAP", description: "Host a music festival sponsored by $SLURP." },
    { marketCap: "$4.1B MCAP", description: "Launch a community-governed treasury (DAO) to fund holder ideas." },
    { marketCap: "$4.4B MCAP", description: "Second 'SLURP Millionaire' event." },
    { marketCap: "$4.7B MCAP", description: "Attempt to break a Guinness World Record on stream." },
    { marketCap: "$5B MCAP", description: "Fund a feature-length documentary about the social experiment." },
    { marketCap: "$6B MCAP", description: "Purchase a second Lamborghini (Aventador) for another holder giveaway." },
    { marketCap: "$7B MCAP", description: "Third 'SLURP Millionaire' event." },
    { marketCap: "$8B MCAP", description: "Acquire a private island to be renamed 'The Cellblock', for holder events." },
    { marketCap: "$9B MCAP", description: "Final multi-million dollar charity donation, live-streamed." },

    // --- SEASON 3: THE ENDGAME ---
    { marketCap: "$10B MCAP", description: "SEASON 3 BEGINS. The rules are shattered. Sells are 20x more effective. Buys are half as effective. The penalty for sleep is halved. The final push for freedom begins." },
    { marketCap: "$10.1B MCAP", description: "Live from Latvia: The future of the project beyond the timer is revealed." },
    
    // --- LEGENDARY STATUS ---
    { marketCap: "$50B MCAP", description: "The story is optioned for a Hollywood movie." },
    { marketCap: "$100B MCAP", description: "A permanent, physical monument to the experiment is commissioned." },
    { marketCap: "$500B MCAP", description: "We attempt to buy a professional sports team." },
    { marketCap: "$1T MCAP", description: "We have changed the world. What's next is up to the community." },
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
    { id: 4, type: 'event', description: 'SLURP fell asleep!', timestamp: '5m ago', amount: 166.7 }, // 10,000/60
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