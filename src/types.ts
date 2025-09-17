export type IconType =
  | 'tax'
  | 'fire'
  | 'ghost'
  | 'coin-stack'
  | 'telegram'
  | 'x'
  | 'user'
  | 'check'
  | 'copy'
  | 'chevron-down'
  | 'x-close'
  | 'shop'
  | 'gamepad'
  | 'logout'
  | 'refresh'
  | 'star'
  | 'shopping-cart'
  | 'arrow-up'
  | 'arrow-down';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  amount: number;
  isCurrentUser: boolean;
}

export interface LiveEvent {
  id: number;
  type: 'buy' | 'sell' | 'event';
  description: string;
  timestamp: string;
  amount: number;
}

export interface Milestone {
  marketCap: string;
  description: string;
}

export interface Mission {
  id: number;
  description: string;
  reward: number; // Escape Points (EP)
}

export interface TokenomicItem {
  icon: IconType;
  title: string;
  description: string;
}

export interface UserProfile {
    id: string;
    username: string;
    display_name?: string;
    solana_address: string | null;
    escape_points: number;
    equipped_skin_id: string | null;
    coins: number;
    current_skin: string;
    owned_skins: string[];
}

export interface PlaylistSong {
    id: string;
    spotify_url: string;
    title: string;
    artist: string;
    thumbnail_url: string;
    submitted_by_username: string;
}

export interface DailyPollSong {
    id: string;
    title: string;
    artist: string;
    thumbnail_url: string;
    vote_count: number;
    user_has_voted: boolean;
}

export interface ShopItem {
    id: number;
    name: string;
    description: string;
    item_type: 'SKIN' | 'BOOSTER' | 'TITLE';
    cost: number;
    asset_id: string | null;
}

export interface UserInventoryItem {
    item_id: number;
}

export interface GameLeaderboardEntry {
    username: string;
    max_score: number;
    solana_address: string | null;
}

export interface UserRank {
    rank: number;
    username: string;
    max_score: number;
}
