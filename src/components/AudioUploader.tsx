import React, { useRef, useState } from 'react';
import { Upload, Play, Square, Volume2, CheckCircle, RefreshCw, X, Loader2 } from 'lucide-react';
import {
  generateCharAudioPath,
  generateWordAudioPath,
  generateSentenceAudioPath
} from '../utils/charHash';
import { playAudio } from '../utils/mediaUrl';
import { uploadFileToCloud } from '../services/cloudbase';
import { useAdmin } from '../context/AdminContext';

export interface AudioUploaderProps {
  audioType: 'char_audio' | 'word_audio' | 'sentence_audio';
  charHash: string;
  charText?: string;
  wordText?: string;
  pinyin?: string;
  currentPath: string;
  onPathChange: (newCloudPath: string) => void;
  label?: string;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  audioType,
  charHash,
  charText = '',
  wordText = '',
  pinyin = '',
  currentPath,
  onPathChange,
  label
}) => {
  const { resolveAudioUrl, showToast } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);

  // 解析完整可访问的 CDN 播放链接，追加最新时间戳以防同名替换后浏览器缓存旧音频
  const fullUrl = currentPath ? resolveAudioUrl(currentPath, Date.now()) : '';

  // 计算指定标准重命名路径（严格符合 AGENTS.md 规范与零中文约束）
  const getStandardTargetCloudPath = (): string => {
    if (audioType === 'char_audio') {
      return generateCharAudioPath(charHash, charText, pinyin, 'mp3');
    } else if (audioType === 'word_audio') {
      return generateWordAudioPath(wordText, pinyin, 'mp3');
    } else {
      return generateSentenceAudioPath(charHash, charText, 'mp3');
    }
  };

  // 用户选择本地文件，执行强制重命名并真实上传到云存储
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 格式与体积校验
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    if (!['mp3', 'm4a', 'wav'].includes(ext)) {
      showToast('音频格式建议为 MP3 或 M4A（微信各端完美兼容）', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('音频体积过大（已超过 2MB），建议控制在 500KB 以内', 'info');
    }

    const targetCloudPath = getStandardTargetCloudPath();

    setIsUploading(true);
    try {
      showToast(`正在重命名并上传至: ${targetCloudPath}...`, 'info');
      // 真实上传至微信云存储（强制同名覆盖）
      await uploadFileToCloud(targetCloudPath, file);

      // 上传成功，将重命名后的规范路径通知父表单
      onPathChange(targetCloudPath);
      showToast(`音频上传成功并已规范重命名: ${targetCloudPath}`, 'success');
    } catch (err: any) {
      showToast(`音频上传失败: ${err.message || '网络异常'}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 播放试听（仅读取真实音频文件，绝不调用浏览器合成）
  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopAudioFn?.();
      setIsPlaying(false);
      setStopAudioFn(null);
      return;
    }

    if (!currentPath || !fullUrl) {
      showToast('未配置音频文件，请先上传音频', 'error');
      return;
    }

    const stop = playAudio(
      fullUrl,
      undefined,
      () => {
        setIsPlaying(false);
        setStopAudioFn(null);
      },
      (err) => {
        setIsPlaying(false);
        setStopAudioFn(null);
        showToast(err.message || '音频播放失败', 'error');
      }
    );

    setStopAudioFn(() => stop);
    setIsPlaying(true);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stopAudioFn) stopAudioFn();
    setIsPlaying(false);
    onPathChange('');
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold text-slate-700">{label}</label>}

      {/* 隐藏的真实 File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 已配置或已上传音频的预览卡片 */}
      {currentPath ? (
        <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all">
          {/* 左侧音频播放/停止按钮 */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={isUploading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-xs ${
              isPlaying
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
            title={isPlaying ? '停止试听' : '点击试听真实录音'}
          >
            {isPlaying ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* 中间信息：重命名后的标准存储路径 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3 h-3" /> 标准重命名
              </span>
              <span className="text-xs font-mono text-slate-700 truncate font-semibold" title={currentPath}>
                {currentPath}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={fullUrl}>
              {fullUrl}
            </p>
          </div>

          {/* 右侧操作按钮：替换上传 / 清除 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              title="选择本地新文件并同名覆盖替换"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">{isUploading ? '上传中...' : '替换'}</span>
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={clearFile}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              title="清除移除"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 未配置时的上传入口按钮 */
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:text-amber-700 transition-all cursor-pointer group disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          ) : (
            <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
          )}
          <span className="text-xs font-bold">
            {isUploading ? '正在上传重命名音频中...' : '点击上传音频 (.mp3/.m4a)'}
          </span>
          <span className="text-[10px] text-slate-400 group-hover:text-amber-600/80 font-mono">
            (自动重命名为 {getStandardTargetCloudPath()})
          </span>
        </button>
      )}
    </div>
  );
};
