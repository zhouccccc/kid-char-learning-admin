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

// ---------------- 学情数据看板核心类型 ----------------
export type AnalyticsTimeRange = 'today' | '7d' | '30d' | 'all';

export interface AnalyticsFilterParams {
  timeRange?: AnalyticsTimeRange;
  stageId?: number | 'all';
}

export interface AnalyticsOverviewKPIs {
  totalLearnedCount: number;         // 累计识字人次
  totalLearnedGrowth: number;        // 环比增长百分比
  avgCharsPerUser: number;          // 人均掌握汉字数
  avgCharsGrowth: number;
  todayNewChars: number;            // 今日新学字次
  todayLearnersCount: number;       // 今日新学学员数
  ebbinghausReviewRate: number;     // 艾宾浩斯复习遵循率 %
  ebbinghausReviewRateDiff: number; // 相比上周期变化 %
  quizAccuracyRate: number;         // 全网测验综合正确率 %
  quizAccuracyDiff: number;
  avgStudyDurationMin: number;      // 人均每日学习时长(分钟)
  avgCharLearnSec: number;          // 单字平均学习耗时(秒)
  handwriteFinishRate: number;      // 手写描红临摹完成率 %
}

export interface StageProgressionItem {
  stage_id: number;
  stage_name: string;
  target_age: string;
  theme_color: string;
  total_chars: number;
  active_learners: number;
  completion_rate: number;          // 阶段完课率 %
  median_days_to_complete: number;  // 完课中位数天数
  level0_count: number;            // 未学字数
  level1_count: number;            // 初识入门字数
  level2_count: number;            // 基本熟悉字数
  level3_count: number;            // 熟练掌握字数
  bottleneck_alert?: string;       // 瓶颈提示
}

export interface EbbinghausTrendPoint {
  date: string;                    // 'MM-DD'
  dueCount: number;                // 应复习字数
  reviewedCount: number;           // 实际复习字数
  rate: number;                    // 达成率 %
}

export interface EbbinghausRetentionRound {
  round: number;
  label: string;                   // '第1轮 (5~30分钟)'
  interval: string;                // '第1天'
  retentionRate: number;           // 记忆留存率 %
  sampleCount: number;             // 样本量
  status: 'optimal' | 'normal' | 'attention';
}

export interface EbbinghausReviewStats {
  trend30Days: EbbinghausTrendPoint[];
  retentionMatrix: EbbinghausRetentionRound[];
  avgRoundsToMaster: number;        // 晋升到 Level 3 平均复习轮次
  avgDaysToMaster: number;          // 晋升到 Level 3 平均天数
  pendingReviewCharsCount: number;  // 全网待复习汉字堆积
  criticalAtRiskCharsCount: number; // 临界遗忘池汉字量 (>7天未复习)
}

export interface ToughCharItem {
  id: number;
  char_text: string;
  pinyin: string;
  pinyin_with_tone?: string;
  stage_id: number;
  stage_name: string;
  strokes: number;
  total_attempts: number;          // 累计测验答题人次
  wrong_count: number;             // 做错人次
  error_rate: number;              // 错误率 %
  mistake_category: 'shape' | 'sound' | 'strokes' | 'meaning'; // 形近/音近/笔画/字义
  mistake_category_label: string;
  common_confusions: string[];     // 常见混淆干扰项
  teaching_suggestion: string;     // 教研优化建议
}

export interface HourlyActivityPoint {
  hour: number;                    // 0..23
  hour_label: string;              // '19:00'
  activity_count: number;
  percent: number;
  is_peak: boolean;
}

export interface LearningHabitStats {
  hourlyDistribution: HourlyActivityPoint[];
  peakPeriodLabel: string;         // '19:30 - 21:00 (晚间亲子黄金时段)'
  planModeUsersPercent: number;    // 计划学习用户占比 %
  freeModeUsersPercent: number;    // 随心学用户占比 %
  planModeCompletionRate: number;  // 计划学习完课率 %
  freeModeCompletionRate: number;  // 随心学完课率 %
  responseSpeedBreakdown: {
    quickPercent: number;          // 秒答 (<2s)
    thinkingPercent: number;       // 思考作答 (2-6s)
    hesitantPercent: number;       // 犹豫 (>6s)
  };
}

export interface AnalyticsAlertItem {
  id: string;
  level: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  affected_count?: number;
  suggestion: string;
  char_id?: number;
}

export interface LearningAnalyticsData {
  timeRange: AnalyticsTimeRange;
  stageId: number | 'all';
  updated_at: string;
  kpis: AnalyticsOverviewKPIs;
  stages: StageProgressionItem[];
  ebbinghaus: EbbinghausReviewStats;
  toughChars: ToughCharItem[];
  habits: LearningHabitStats;
  alerts: AnalyticsAlertItem[];
}


