/**
 * 微信云存储多媒体 URL 解析与音频播放工具
 */

// 云存储默认下载 CDN 域名
export const CLOUD_STORAGE_BASE_URL = 'https://636c-cloud1-d7g21hml5aeb8a3ed-1483906248.tcb.qcloud.la';

/**
 * 将多媒体相对路径解析为完整可访问的 CDN URL
 * 自动处理末尾斜杠、中文路径 encodeURI，以及缓存击穿版本号 ?v=...
 */
export function resolveMediaUrl(
  relativePath: string,
  version?: string | number
): string {
  if (!relativePath) return '';

  let fullUrl = '';
  // 如果已经是完整外部网络地址或 blob/data 协议，直接使用
  if (/^(https?:|blob:|data:|cloud:)/.test(relativePath)) {
    fullUrl = relativePath;
  } else {
    const cleanBase = CLOUD_STORAGE_BASE_URL.replace(/\/+$/, '');
    const cleanKey = relativePath.trim().replace(/^\/+/, '');
    fullUrl = `${cleanBase}/${cleanKey}`;
  }

  // 对中文字符进行安全的 URL 编码，防止特殊网关/iOS 400
  const encodedUrl = encodeURI(fullUrl);

  // 拼接版本戳（防 CDN 强缓存不刷新）
  if (version && !encodedUrl.startsWith('blob:') && !encodedUrl.startsWith('data:')) {
    const separator = encodedUrl.includes('?') ? '&' : '?';
    return `${encodedUrl}${separator}v=${version}`;
  }

  return encodedUrl;
}

let activeAudio: HTMLAudioElement | null = null;

/**
 * 播放音频文件工具函数（单例模式，自动停止上一首）
 * 严格按照规范：点击播放音频必须获取对应的音频文件进行播放，严禁调用浏览器语音合成
 */
export function playAudio(
  url: string,
  _fallbackText?: string,
  onEnded?: () => void,
  onError?: (err: any) => void
): () => void {
  // 停止当前正在播放的音频
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }

  const cleanUrl = (url || '').trim();
  if (!cleanUrl) {
    onError?.(new Error('未配置音频文件，请先上传音频'));
    return () => {};
  }

  try {
    const audio = new Audio(cleanUrl);
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      onEnded?.();
    };

    audio.onerror = (e) => {
      activeAudio = null;
      console.warn('Audio playback error:', cleanUrl, e);
      onError?.(new Error('音频文件加载失败或文件不存在，请检查或重新上传'));
    };

    audio.play().catch((err) => {
      console.warn('Audio play rejected:', cleanUrl, err);
      onError?.(new Error('播放被阻止或音频格式不支持: ' + (err.message || '未知原因')));
    });

    return () => {
      audio.pause();
      if (activeAudio === audio) activeAudio = null;
    };
  } catch (err: any) {
    onError?.(new Error('初始化音频播放器异常: ' + (err.message || '未知错误')));
    return () => {};
  }
}
