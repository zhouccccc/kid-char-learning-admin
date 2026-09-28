import { CharLibItem, StageLibrary } from '../types';

export const DEFAULT_STAGES_SEED: StageLibrary[] = [
  {
    id: 1,
    sort: 1,
    stage_code: 'enlighten',
    stage_name: '启蒙阶段',
    desc: '极简象形、生活基础字',
    target_age: '适合 2.5-4 岁',
    theme_color: 'from-amber-400 to-orange-500',
    icon_name: 'Sparkles',
    is_published: true
  },
  {
    id: 2,
    sort: 2,
    stage_code: 'primary',
    stage_name: '初级阶段',
    desc: '日常高频常用字',
    target_age: '适合 4-5 岁',
    theme_color: 'from-emerald-400 to-teal-500',
    icon_name: 'BookOpen',
    is_published: true
  },
  {
    id: 3,
    sort: 3,
    stage_code: 'middle',
    stage_name: '中级阶段',
    desc: '幼小衔接核心生字',
    target_age: '适合 5-6 岁',
    theme_color: 'from-sky-400 to-blue-600',
    icon_name: 'GraduationCap',
    is_published: true
  },
  {
    id: 4,
    sort: 4,
    stage_code: 'senior',
    stage_name: '高级阶段',
    desc: '学前拔高、小学预备生字',
    target_age: '适合 6 岁以上',
    theme_color: 'from-purple-400 to-indigo-600',
    icon_name: 'Award',
    is_published: true
  }
];

export const INITIAL_CHARS_SEED: CharLibItem[] = [
  // 阶段 1：启蒙阶段
  {
    id: 1,
    char_hash: 'c_ri_8f2a',
    char_text: '日',
    pinyin: 'ri',
    pinyin_with_tone: 'rì',
    simple_desc: '太阳，白昼，一天',
    strokes: 4,
    stage_id: 1,
    sort: 1,
    image_url: 'chars/images/c_ri_8f2a_日.png',
    audio_url: 'chars/audios/c_ri_8f2a_日.mp3',
    words: [
      { id: 'w_1_1', word: '日光', pinyin: 'rì guāng', audio_url: 'words/audios/c_ri_8f2a_w1_日光.mp3', is_primary: true },
      { id: 'w_1_2', word: '红日', pinyin: 'hóng rì', audio_url: 'words/audios/c_ri_8f2a_w2_红日.mp3', is_primary: false },
      { id: 'w_1_3', word: '日子', pinyin: 'rì zi', audio_url: 'words/audios/c_ri_8f2a_w3_日子.mp3', is_primary: false }
    ],
    sentence: {
      sentence: '一轮红日从东方慢慢升起来了。',
      pinyin_guide: 'yī lún hóng rì cóng dōng fāng màn màn shēng qǐ lái le.',
      audio_url: 'chars/audios/c_ri_8f2a_sen.mp3',
      highlight_word: '日',
      scene_tag: '自然观察'
    },
    emoji: '☀️',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },
  {
    id: 2,
    char_hash: 'c_yue_7b1c',
    char_text: '月',
    pinyin: 'yue',
    pinyin_with_tone: 'yuè',
    simple_desc: '月亮，月份',
    strokes: 4,
    stage_id: 1,
    sort: 2,
    image_url: 'chars/images/c_yue_7b1c_月.png',
    audio_url: 'chars/audios/c_yue_7b1c_月.mp3',
    words: [
      { id: 'w_2_1', word: '月亮', pinyin: 'yuè liang', audio_url: 'words/audios/c_yue_7b1c_w1_月亮.mp3', is_primary: true },
      { id: 'w_2_2', word: '月光', pinyin: 'yuè guāng', audio_url: 'words/audios/c_yue_7b1c_w2_月光.mp3', is_primary: false },
      { id: 'w_2_3', word: '日月', pinyin: 'rì yuè', audio_url: 'words/audios/c_yue_7b1c_w3_日月.mp3', is_primary: false }
    ],
    emoji: '🌙',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },
  {
    id: 3,
    char_hash: 'c_shui_3e4d',
    char_text: '水',
    pinyin: 'shui',
    pinyin_with_tone: 'shuǐ',
    simple_desc: '无色无味的液体，喝的水',
    strokes: 4,
    stage_id: 1,
    sort: 3,
    image_url: 'chars/images/c_shui_3e4d_水.png',
    audio_url: 'chars/audios/c_shui_3e4d_水.mp3',
    words: [
      { id: 'w_3_1', word: '喝水', pinyin: 'hē shuǐ', audio_url: 'words/audios/c_shui_3e4d_w1_喝水.mp3', is_primary: true },
      { id: 'w_3_2', word: '流水', pinyin: 'liú shuǐ', audio_url: 'words/audios/c_shui_3e4d_w2_流水.mp3', is_primary: false }
    ],
    emoji: '💧',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },
  {
    id: 4,
    char_hash: 'c_huo_9a1e',
    char_text: '火',
    pinyin: 'huo',
    pinyin_with_tone: 'huǒ',
    simple_desc: '燃烧发光发热的火苗',
    strokes: 4,
    stage_id: 1,
    sort: 4,
    image_url: 'chars/images/c_huo_9a1e_火.png',
    audio_url: 'chars/audios/c_huo_9a1e_火.mp3',
    words: [
      { id: 'w_4_1', word: '大火', pinyin: 'dà huǒ', audio_url: 'words/audios/c_huo_9a1e_w1_大火.mp3', is_primary: true },
      { id: 'w_4_2', word: '火苗', pinyin: 'huǒ miáo', audio_url: 'words/audios/c_huo_9a1e_w2_火苗.mp3', is_primary: false }
    ],
    emoji: '🔥',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },
  {
    id: 5,
    char_hash: 'c_shan_5c8f',
    char_text: '山',
    pinyin: 'shan',
    pinyin_with_tone: 'shān',
    simple_desc: '高高耸立的大山',
    strokes: 3,
    stage_id: 1,
    sort: 5,
    image_url: 'chars/images/c_shan_5c8f_山.png',
    audio_url: 'chars/audios/c_shan_5c8f_山.mp3',
    words: [
      { id: 'w_5_1', word: '大山', pinyin: 'dà shān', audio_url: 'words/audios/c_shan_5c8f_w1_大山.mp3', is_primary: true },
      { id: 'w_5_2', word: '高山', pinyin: 'gāo shān', audio_url: 'words/audios/c_shan_5c8f_w2_高山.mp3', is_primary: false }
    ],
    emoji: '⛰️',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },

  // 阶段 2：初级阶段示例
  {
    id: 17,
    char_hash: 'c_hao_2e9a',
    char_text: '好',
    pinyin: 'hao',
    pinyin_with_tone: 'hǎo',
    simple_desc: '美好，优点多，身体棒',
    strokes: 6,
    stage_id: 2,
    sort: 1,
    image_url: 'chars/images/c_hao_2e9a_好.png',
    audio_url: 'chars/audios/c_hao_2e9a_好.mp3',
    words: [
      { id: 'w_17_1', word: '好看', pinyin: 'hǎo kàn', audio_url: 'words/audios/c_hao_2e9a_w1_好看.mp3', is_primary: true },
      { id: 'w_17_2', word: '好人', pinyin: 'hǎo rén', audio_url: 'words/audios/c_hao_2e9a_w2_好人.mp3', is_primary: false }
    ],
    emoji: '👍',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },
  {
    id: 18,
    char_hash: 'c_duo_4f1b',
    char_text: '多',
    pinyin: 'duo',
    pinyin_with_tone: 'duō',
    simple_desc: '数量大，不只一个',
    strokes: 6,
    stage_id: 2,
    sort: 2,
    image_url: 'chars/images/c_duo_4f1b_多.png',
    audio_url: 'chars/audios/c_duo_4f1b_多.mp3',
    words: [
      { id: 'w_18_1', word: '许多', pinyin: 'xǔ duō', audio_url: 'words/audios/c_duo_4f1b_w1_许多.mp3', is_primary: true },
      { id: 'w_18_2', word: '多少', pinyin: 'duō shao', audio_url: 'words/audios/c_duo_4f1b_w2_多少.mp3', is_primary: false }
    ],
    emoji: '🔢',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },

  // 阶段 3：中级阶段示例
  {
    id: 33,
    char_hash: 'c_shu_6d2e',
    char_text: '书',
    pinyin: 'shu',
    pinyin_with_tone: 'shū',
    simple_desc: '装订成册的书本',
    strokes: 4,
    stage_id: 3,
    sort: 1,
    image_url: 'chars/images/c_shu_6d2e_书.png',
    audio_url: 'chars/audios/c_shu_6d2e_书.mp3',
    words: [
      { id: 'w_33_1', word: '书本', pinyin: 'shū běn', audio_url: 'words/audios/c_shu_6d2e_w1_书本.mp3', is_primary: true },
      { id: 'w_33_2', word: '看书', pinyin: 'kàn shū', audio_url: 'words/audios/c_shu_6d2e_w2_看书.mp3', is_primary: false }
    ],
    emoji: '📖',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  },

  // 阶段 4：高级阶段示例
  {
    id: 49,
    char_hash: 'c_zhi_8e3c',
    char_text: '智',
    pinyin: 'zhi',
    pinyin_with_tone: 'zhì',
    simple_desc: '聪明，有见识与智谋',
    strokes: 12,
    stage_id: 4,
    sort: 1,
    image_url: 'chars/images/c_zhi_8e3c_智.png',
    audio_url: 'chars/audios/c_zhi_8e3c_智.mp3',
    words: [
      { id: 'w_49_1', word: '智慧', pinyin: 'zhì huì', audio_url: 'words/audios/c_zhi_8e3c_w1_智慧.mp3', is_primary: true },
      { id: 'w_49_2', word: '机智', pinyin: 'jī zhì', audio_url: 'words/audios/c_zhi_8e3c_w2_机智.mp3', is_primary: false }
    ],
    emoji: '🧠',
    status: 'published',
    create_time: '2026-09-09T10:00:00Z',
    update_time: '2026-09-09T10:00:00Z'
  }
];
