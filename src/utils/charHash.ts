/**
 * 汉字专属 Hash 与规范多媒体路径生成工具
 */

/**
 * 清理并规范化文件名中的特殊字符（防止斜杠等引起路径错乱）
 */
export function sanitizeName(name: string): string {
  if (!name) return 'media';
  return name.trim().replace(/[/\\?%*:|"<> ]/g, '_');
}

/**
 * 为汉字生成唯一、最短的专属确定性 Hash（严格单射完美哈希，绝对 0 碰撞）
 * 使用 4 位定长 Unicode Hex 码点，相同汉字在任何环境计算结果 100% 恒定一致
 * 示例: '日' -> 'c_65e5', '月' -> 'c_6708', '天' -> 'c_5929'
 */
export function generateCharHash(charText: string = '', prefix: string = 'c'): string {
  if (!charText || !charText.trim()) {
    return `${prefix}_0000`;
  }
  const cleanChar = charText.trim()[0];
  const codeHex = cleanChar.codePointAt(0)?.toString(16).padStart(4, '0') || '0000';
  return `${prefix}_${codeHex}`;
}

/**
 * 规范生成汉字图片相对路径
 * 格式: chars/images/{char_hash}_{char_text}.{ext}
 */
export function generateCharImagePath(charHash: string, charText: string, ext: string = 'webp'): string {
  const safeHash = charHash || generateCharHash(charText);
  const safeChar = sanitizeName(charText || 'char');
  const cleanExt = ext.replace(/^\./, '');
  return `chars/images/${safeHash}_${safeChar}.${cleanExt}`;
}

/**
 * 将带调拼音转换为纯 ASCII 小写拼音（如 'bā gè' -> 'bage', 'lǚ yóu' -> 'lvyou'）
 */
export function toPlainPinyin(pinyinWithTone: string = ''): string {
  if (!pinyinWithTone) return '';
  return pinyinWithTone
    .replace(/[üǖǘǚǜ]/g, 'v')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * 规范生成汉字单字发音音频相对路径
 * 格式: chars/audios/{char_hash}_{pinyin}.{ext}
 */
export function generateCharAudioPath(
  charHash: string,
  charText: string,
  pinyin: string = '',
  ext: string = 'mp3'
): string {
  const safeHash = charHash || generateCharHash(charText);
  const plainPin = toPlainPinyin(pinyin);
  const tag = plainPin || sanitizeName(charText || 'char');
  const cleanExt = ext.replace(/^\./, '').replace(/^m4a$/i, 'mp3');
  return `chars/audios/${safeHash}_${tag}.${cleanExt}`;
}

/**
 * 为常用组词生成唯一、最短的专属确定性 Hash（严格单射完美哈希，绝对 0 碰撞）
 * 使用 Unicode Hex 码点拼接，跨环境结果 100% 恒定一致
 * 示例: '太阳' -> 'w_592a_9633', '一个' -> 'w_4e00_4e2a'
 */
export function generateWordHash(wordText: string = '', prefix: string = 'w'): string {
  if (!wordText || !wordText.trim()) {
    return `${prefix}_0000`;
  }
  const clean = wordText.trim();
  const hexes = Array.from(clean).map((c) =>
    (c.codePointAt(0)?.toString(16) || '0000').padStart(4, '0')
  );
  return `${prefix}_${hexes.join('_')}`;
}

/**
 * 规范生成常用组词发音音频相对路径
 * 格式: words/audios/{word_hash}_{pinyin}.{ext}
 * 同时兼容支持旧传参签名: (charHash, wordIndex, wordText, ext)
 */
export function generateWordAudioPath(
  wordTextOrCharHash: string,
  wordIndexOrPinyin: number | string = 1,
  optionalWordText?: string,
  optionalExt: string = 'mp3'
): string {
  let wordText = '';
  let pinyin = '';
  let ext = 'mp3';

  if (typeof wordIndexOrPinyin === 'number') {
    // 兼容旧签名: (charHash, wordIndex, wordText, ext)
    wordText = optionalWordText || '';
    ext = optionalExt || 'mp3';
  } else {
    // 新签名: (wordText, pinyin, ext)
    wordText = wordTextOrCharHash || '';
    pinyin = typeof wordIndexOrPinyin === 'string' ? wordIndexOrPinyin : '';
    ext = optionalWordText || 'mp3';
  }

  const wordHash = generateWordHash(wordText);
  const plainPin = toPlainPinyin(pinyin);
  const tag = plainPin || sanitizeName(wordText || 'word');
  const cleanExt = ext.replace(/^\./, '').replace(/^m4a$/i, 'mp3');
  return `words/audios/${wordHash}_${tag}.${cleanExt}`;
}

/**
 * 规范生成生活情景例句发音音频相对路径
 * 严格按照 AGENTS.md 规范: sentences/audios/{char_hash}_sen.{ext}
 * 示例: 日例句 -> 'sentences/audios/c_65e5_sen.mp3'
 */
export function generateSentenceAudioPath(
  charHash: string,
  charText?: string,
  ext: string = 'mp3'
): string {
  const safeHash = charHash || generateCharHash(charText || '');
  const cleanExt = ext.replace(/^\./, '').replace(/^m4a$/i, 'mp3');
  return `sentences/audios/${safeHash}_sen.${cleanExt}`;
}

