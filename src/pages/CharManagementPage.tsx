import React, { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  Square,
  Volume2,
  Edit2,
  Trash2,
  BookOpen,
  Sparkles,
  GraduationCap,
  Award,
  X,
  CheckCircle2,
  Upload
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { playAudio } from '../utils/mediaUrl';
import { CharEditModal } from '../components/CharEditModal';
import { BatchImportModal } from '../components/BatchImportModal';
import { StageLibrary } from '../types';

export const CharManagementPage: React.FC = () => {
  const {
    stages,
    searchKeyword,
    setSearchKeyword,
    chars,
    isLoading,
    refreshData,
    openCreateChar,
    openEditChar,
    deleteCharItem,
    isBatchImportModalOpen,
    batchImportStageId,
    openBatchImport,
    closeBatchImport,
    resolveAudioUrl,
    showToast
  } = useAdmin();

  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  // 播放音频
  const handlePlay = (key: string, relativePath: string, fallbackText: string) => {
    if (playingAudioKey === key) {
      stopFn?.();
      setPlayingAudioKey(null);
      setStopFn(null);
      return;
    }

    const fullUrl = resolveAudioUrl(relativePath);
    const stop = playAudio(
      fullUrl,
      fallbackText,
      () => {
        setPlayingAudioKey(null);
        setStopFn(null);
      },
      (err) => {
        setPlayingAudioKey(null);
        setStopFn(null);
        showToast(`播放失败: ${err.message}`, 'error');
      }
    );
    setStopFn(() => stop);
    setPlayingAudioKey(key);
  };

  const getStageIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-sky-500" />;
      case 'Award':
      default:
        return <Award className="w-5 h-5 text-purple-500" />;
    }
  };

  const getStageName = (stageId: number) => {
    const s = stages.find((item) => item.id === stageId);
    return s ? s.stage_name : `阶段 ${stageId}`;
  };

  // 是否处于汉字搜索检查模式
  const isSearching = Boolean(searchKeyword && searchKeyword.trim().length > 0);

  // 按 Enter 键执行手动搜索
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      refreshData(searchKeyword);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    refreshData('');
  };

  return (
    <div className="space-y-5">
      {/* 顶部工具栏：汉字搜索检查输入框 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* 搜索框：手动输入关键词后回车或点击按钮搜索，杜绝按键频繁刷新 */}
        <div className="relative w-full max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="精确搜索汉字 (输入单个汉字按回车或点击搜索)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-20 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchKeyword && (
              <button
                onClick={handleClearSearch}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="清空搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => refreshData(searchKeyword)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '...' : '搜索'}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 场景 A: 汉字精确搜索模式 (输入单个汉字后展示匹配汉字)            */}
      {/* ------------------------------------------------------------- */}
      {isSearching ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/80 px-4 py-2.5 rounded-xl text-xs">
            <span className="font-bold text-amber-900">
              汉字精确检索模式：已精确匹配 <b className="font-mono text-amber-700">{chars.length}</b> 个结果
            </span>
            <button
              onClick={handleClearSearch}
              className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
            >
              清空搜索，返回字库概览
            </button>
          </div>

          {chars.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">未检索到匹配的汉字</p>
              <p className="text-[11px] text-slate-400 mt-0.5">请确认输入的是单个汉字（如: 日）</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">汉字 / 拼音</th>
                      <th className="py-3 px-4">所属阶段</th>
                      <th className="py-3 px-4">笔画</th>
                      <th className="py-3 px-4">幼儿释义与例句 (可试听)</th>
                      <th className="py-3 px-4 text-center">单字发音</th>
                      <th className="py-3 px-4">常用组词 (点击可试听)</th>
                      <th className="py-3 px-4 text-right pr-5">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {chars.map((char) => {
                      const charAudioKey = `char_${char.id}`;
                      const isPlayingChar = playingAudioKey === charAudioKey;

                      const senText = typeof char.sentence === 'string'
                        ? char.sentence
                        : ((char.sentence as any)?.sentence || char.sentance || '');
                      const senAudio = char.sentence_audio_url || (typeof char.sentence === 'object' ? (char.sentence as any)?.audio_url : '');
                      const senKey = `sen_${char.id}`;
                      const isPlayingSen = playingAudioKey === senKey;

                      return (
                        <tr key={char.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                            {char.sort}
                          </td>

                          {/* 汉字与注音 */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-center text-lg font-black text-amber-950 shadow-xs">
                                {char.char_text}
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-black text-slate-900 text-sm">{char.pinyin_with_tone}</span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                    {char.pinyin}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">ID: {char.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* 所属阶段 */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {getStageName(char.stage_id)}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-600">{char.strokes} 画</td>

                          {/* 幼儿释义与情景例句 */}
                          <td className="py-3 px-4 max-w-sm">
                            <p className="text-xs text-slate-600 line-clamp-1" title={char.simple_desc}>
                              {char.simple_desc || '-'}
                            </p>
                            {senText && (
                              <div className="flex items-center gap-1 mt-1 bg-amber-50/70 border border-amber-100 px-2 py-1 rounded-lg">
                                <span className="text-[11px] text-amber-900 font-medium line-clamp-1 flex-1" title={`情景例句: ${senText}`}>
                                  💬 {senText}
                                </span>
                                {senAudio ? (
                                  <button
                                    type="button"
                                    onClick={() => handlePlay(senKey, senAudio, senText)}
                                    className={`cursor-pointer p-0.5 rounded transition-all flex-shrink-0 ${
                                      isPlayingSen
                                        ? 'text-rose-500 animate-pulse'
                                        : 'text-amber-700 hover:text-amber-950'
                                    }`}
                                    title="播放生活情景例句音频"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 flex-shrink-0" title="该例句尚未上传音频">无音频</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 单字发音 (仅读取真实音频文件，绝不调用浏览器语音合成) */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                if (!char.audio_url) {
                                  showToast('该汉字尚未上传录音文件', 'info');
                                  return;
                                }
                                handlePlay(charAudioKey, char.audio_url, char.char_text);
                              }}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                isPlayingChar
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : char.audio_url
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-300'
                              }`}
                              title={char.audio_url ? '点击试听真人生字发音' : '未上传录音'}
                            >
                              {isPlayingChar ? (
                                <Square className="w-3 h-3 fill-current" />
                              ) : (
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              )}
                            </button>
                          </td>

                          {/* 常用组词 (仅读取真实音频文件) */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {char.words && char.words.length > 0 ? (
                                char.words.map((w, wIdx) => {
                                  const wordKey = `w_${char.id}_${wIdx}`;
                                  const isPlayingWord = playingAudioKey === wordKey;
                                  return (
                                    <span
                                      key={w.id || wIdx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                                    >
                                      <span>{w.word}</span>
                                      {w.audio_url ? (
                                        <button
                                          type="button"
                                          onClick={() => handlePlay(wordKey, w.audio_url, w.word)}
                                          className={`cursor-pointer ${
                                            isPlayingWord
                                              ? 'text-rose-500 animate-spin'
                                              : 'text-slate-400 hover:text-emerald-600'
                                          }`}
                                          title="播放组词音频"
                                        >
                                          <Volume2 className="w-3 h-3" />
                                        </button>
                                      ) : null}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[11px] text-slate-300">-</span>
                              )}
                            </div>
                          </td>

                          {/* 操作 */}
                          <td className="py-3 px-4 text-right pr-5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditChar(char)}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                                title="编辑汉字"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`确定删除汉字「${char.char_text}」吗？`)) {
                                    deleteCharItem(char.id, char._id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="删除汉字"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 场景 B: 默认字库概览模式 (展示 4 大字库类别与字数)             */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                分级字库列表 (4 大预置阶段)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                预置字库作为核心教学基础，默认均为已发布状态
              </p>
            </div>
          </div>

          {/* 4 大阶段字库卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stages.map((stage) => {
              const charCount = stage.total_chars_count ?? 0;

              return (
                <div
                  key={stage.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4"
                >
                  {/* 卡片头部 */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                        {getStageIcon(stage.icon_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">{stage.stage_name}</h4>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {stage.stage_code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{stage.target_age}</p>
                      </div>
                    </div>

                    {/* 预置字库固定状态：仅展示“已发布”，不支持切换 */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已发布 (预置)</span>
                    </div>
                  </div>

                  {/* 字库描述 */}
                  <p className="text-xs text-slate-600 line-clamp-1">{stage.desc}</p>

                  {/* 卡片底栏：字库字数展示与快捷录入/导入按钮 */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">{charCount}</span>
                      <span className="text-xs font-bold text-slate-400">个汉字</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openBatchImport(Number(stage.id))}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50/60 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title={`批量导入至 ${stage.stage_name}`}
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>批量导入</span>
                      </button>

                      <button
                        onClick={() => openCreateChar(Number(stage.id))}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>录入字</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 单个汉字录入/编辑抽屉 */}
      <CharEditModal />

      {/* 批量导入 JSON 汉字库弹窗 */}
      <BatchImportModal
        key={`batch_import_modal_${batchImportStageId}`}
        isOpen={isBatchImportModalOpen}
        onClose={closeBatchImport}
        defaultStageId={batchImportStageId}
      />
    </div>
  );
};
