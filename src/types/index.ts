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
