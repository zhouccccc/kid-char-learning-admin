export type PageKey = 'chars' | 'analytics' | 'memberships' | 'feedback';

export interface AdminUser {
  username?: string;
  openid?: string;
  nickname: string;
  avatar_url?: string;
  role: 'admin' | string;
  token?: string;
  login_at?: string;
}

export type StageCode = 'enlighten' | 'primary' | 'middle' | 'senior';

export interface StageLibrary {
  id: number;
  sort: number;
  stage_code: StageCode;
  stage_name: string;
  desc: string;
  target_age: string;
  theme_color: string;
  icon_name: string;
  is_published: boolean;
  total_chars_count?: number;
}

export interface WordItem {
  word: string;
  pinyin?: string;
  audio_url: string; // 相对存储路径或完整 URL
  is_primary?: boolean;
}

export interface SentenceItem {
  sentence: string;
  pinyin_guide?: string;
  audio_url?: string;
  highlight_word: string;
  scene_tag?: string;
}

export interface CharLibItem {
  _id?: string;
  id: number;
  char_hash: string; // 汉字专属唯一 Hash，随字一同持久化
  char_text: string;
  pinyin: string;
  pinyin_with_tone: string;
  simple_desc: string;
  strokes: number;
  stage_id: number;
  sort: number;
  image_url: string; // 汉字图片路径: chars/images/{char_hash}_{char_text}.{ext}
  audio_url: string; // 汉字单字发音路径: chars/audios/{char_hash}_{char_text}.{ext}
  words: WordItem[]; // 常用组词列表 (最多3个)
  sentence?: string | SentenceItem; // 生活情景例句
  sentence_audio_url?: string; // 例句音频相对路径 URL
  create_time?: string;
  update_time?: string;
}

export interface AppConfig {
  envId: string;
  apiBaseUrl: string;
  useMockLocal: boolean;
}

export type FeedbackStatus = 'pending' | 'processing' | 'replied' | 'resolved' | 'closed';

export interface FeedbackStats {
  total: number;
  pending: number;
  processing: number;
  replied: number;
  resolved: number;
  closed?: number;
  by_type?: Record<string, number>;
}

export interface FeedbackItem {
  _id: string;
  _openid?: string;
  type: string; // 'bug' | 'suggestion' | 'content' | 'other'
  content: string;
  images: string[];
  contact?: string;
  user_info?: {
    nickName?: string;
    avatarUrl?: string;
  } | null;
  status: FeedbackStatus;
  reply_content?: string;
  replied_at?: string | null;
  created_at: string;
  updated_at?: string;
}

// ---------------- 会员与学情成长数据看板相关类型 ----------------
export interface StageDistributionItem {
  stage_id: number;
  stage_name: string;
  count: number;
  percent: number;
  color: string;
}

export interface MasteryTierItem {
  tier: string;
  desc: string;
  count: number;
  percent: number;
  color: string;
}

export interface StreakDistributionItem {
  label: string;
  count: number;
  percent: number;
}

export interface TrendDayItem {
  date: string; // 'MM-DD'
  newUsers: number;
  activeUsers: number;
  checkins: number;
}

export interface MemberOverviewStats {
  totalMembers: number;
  todayNewMembers: number;
  activeToday: number;
  active7Days: number;
  checkinRate: number;
  sleepingMembers: number;
  totalStarCoins: number;
  avgStarCoins: number;
  stageDistribution: StageDistributionItem[];
  masteryTiers: MasteryTierItem[];
  streakDistribution: StreakDistributionItem[];
  trend30Days: TrendDayItem[];
  badgesTotalUnlocked: number;
}

export interface MemberItem {
  _id: string;
  _openid: string;
  nickname: string;
  avatar_url?: string;
  star_coins: number;
  active_stage: number;
  stage_name: string;
  total_learned_chars: number;
  mastered_chars_count: number;
  checkin_days: number;
  current_streak: number;
  badges_count: number;
  created_at: string;
  last_login_at: string;
  status: 'active' | 'sleeping' | 'new';
}

export interface StageMasteryItem {
  stage_id: number;
  stage_name: string;
  learned_count: number;
  total_chars: number;
  mastered_count: number;
  is_unlocked: boolean;
}

export interface MemberDetail {
  user: MemberItem;
  stage_progress: Record<string, { is_unlock: boolean; unlock_time?: string | null }>;
  stage_mastery: StageMasteryItem[];
  recent_checkins: string[];
  mistakes_count: number;
  unlocked_badges: Record<string, boolean>;
}

export interface MemberFilterParams {
  keyword?: string;
  stage?: number | 'all';
  status?: 'all' | 'today_active' | 'active_7d' | 'sleeping';
  page?: number;
  pageSize?: number;
}

