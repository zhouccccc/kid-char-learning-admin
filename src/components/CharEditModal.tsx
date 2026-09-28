import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, BookOpen } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { CharLibItem, WordItem } from '../types';
import { AudioUploader } from './AudioUploader';

export const CharEditModal: React.FC = () => {
  const { isEditModalOpen, editingChar, closeEditModal, saveCharItem, stages, showToast } = useAdmin();

  const [formData, setFormData] = useState<CharLibItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingChar) {
      setFormData({
        ...editingChar,
        stage_id: Number(editingChar.stage_id) || 1
      });
    } else {
      setFormData(null);
    }
  }, [editingChar]);

  if (!isEditModalOpen || !formData) return null;

  const isCreating = !formData.id || formData.id === 0;

  const handleChange = (field: keyof CharLibItem, val: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: val } : null));
  };

  // 添加常用组词 (最多3个)
  const addWord = () => {
    if ((formData.words?.length || 0) >= 3) {
      showToast('常用组词最多添加 3 个', 'info');
      return;
    }
    const nextIdx = (formData.words?.length || 0) + 1;
    const newWord: WordItem = {
      id: `w_${Date.now()}_${nextIdx}`,
      word: '',
      pinyin: '',
      audio_url: '',
      is_primary: nextIdx === 1
    };
    setFormData((prev) => (prev ? { ...prev, words: [...(prev.words || []), newWord] } : null));
  };

  // 更新常用组词
  const updateWord = (index: number, patch: Partial<WordItem>) => {
    setFormData((prev) => {
      if (!prev) return null;
      const updatedWords = [...(prev.words || [])];
      updatedWords[index] = { ...updatedWords[index], ...patch };
      return { ...prev, words: updatedWords };
    });
  };

  // 移除常用组词
  const removeWord = (index: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      const updatedWords = (prev.words || []).filter((_, i) => i !== index);
      return { ...prev, words: updatedWords };
    });
  };

  // 保存提交
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.char_text.trim()) {
      showToast('请填写汉字字符', 'error');
      return;
    }
    if (!formData.pinyin_with_tone.trim()) {
      showToast('请填写带调拼音 (如 rì)', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 自动衍生纯拼音 (去除声调)，供后台/数据库搜索索引，无需用户手动输入
      const autoPinyin = formData.pinyin_with_tone
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const sentenceText = typeof formData.sentence === 'string'
        ? formData.sentence.trim()
        : (typeof (formData.sentence as any)?.sentence === 'string'
            ? (formData.sentence as any).sentence.trim()
            : (formData.sentance || '').trim());

      const toSave: CharLibItem = {
        ...formData,
        pinyin: autoPinyin,
        sentence: sentenceText,
        sentance: sentenceText,
        sentence_audio_url: formData.sentence_audio_url || '',
        words: (formData.words || []).slice(0, 3)
      };

      await saveCharItem(toSave);
    } catch (err) {
      // 错误提示已在 context 处理
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* 顶部栏 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                {isCreating ? '录入新汉字' : `编辑汉字: ${formData.char_text}`}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                所属字库：{stages.find((s) => Number(s.id) === Number(formData.stage_id))?.stage_name || `阶段 ${formData.stage_id}`}
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {formData.char_hash}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              新增汉字直接生效发布，排序默认置于该阶段末尾
            </p>
          </div>
          <button
            onClick={closeEditModal}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 核心录入表单 (已移除纯字母拼音、排序、Emoji、发布状态) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 基础汉字信息 */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" /> 1. 基础汉字信息
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {/* 所属阶段 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">所属字库阶段</label>
                <select
                  value={Number(formData.stage_id) || 1}
                  onChange={(e) => handleChange('stage_id', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none cursor-pointer"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={Number(s.id)}>
                      {s.stage_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 汉字字符 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  汉字 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="如: 日"
                  value={formData.char_text}
                  onChange={(e) => handleChange('char_text', e.target.value.trim())}
                  className="w-full px-3 py-2 text-base font-black text-center bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>

              {/* 带调拼音 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  带调拼音 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: rì"
                  value={formData.pinyin_with_tone}
                  onChange={(e) => handleChange('pinyin_with_tone', e.target.value.trim())}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* 笔画数 */}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">笔画数</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={formData.strokes}
                  onChange={(e) => handleChange('strokes', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold text-center text-slate-800 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                />
              </div>

              {/* 幼儿简明释义口诀 */}
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">幼儿简明释义口诀</label>
                <input
                  type="text"
                  placeholder="如: 太阳圆圆照大地，带来光明的一天"
                  value={formData.simple_desc}
                  onChange={(e) => handleChange('simple_desc', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. 汉字单字发音音频 */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> 2. 汉字单字发音音频 (自动规范重命名)
            </h3>

            <AudioUploader
              audioType="char_audio"
              label="汉字单字音频 (MP3/M4A)"
              charHash={formData.char_hash}
              charText={formData.char_text}
              pinyin={formData.pinyin || formData.pinyin_with_tone}
              currentPath={formData.audio_url}
              onPathChange={(path) => handleChange('audio_url', path)}
            />
          </div>

          <hr className="border-slate-100" />

          {/* 3. 常用组词 (每个词语带独立发音，最多3个) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> 3. 常用组词与发音 (自动规范重命名)
                </h3>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {formData.words?.length || 0} / 3
                </span>
              </div>
              <button
                type="button"
                onClick={addWord}
                disabled={(formData.words?.length || 0) >= 3}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  (formData.words?.length || 0) >= 3
                    ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{(formData.words?.length || 0) >= 3 ? '已满3个' : '添加组词'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.words?.map((wordItem, wIdx) => (
                <div key={wordItem.id || wIdx} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">
                        {wIdx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="词语 (如: 日光)"
                        value={wordItem.word}
                        onChange={(e) => updateWord(wIdx, { word: e.target.value.trim() })}
                        className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="拼音 (如: rì guāng)"
                        value={wordItem.pinyin || ''}
                        onChange={(e) => updateWord(wIdx, { pinyin: e.target.value.trim() })}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWord(wIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="移除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <AudioUploader
                    audioType="word_audio"
                    label={`组词「${wordItem.word || wIdx + 1}」发音`}
                    charHash={formData.char_hash}
                    wordText={wordItem.word}
                    pinyin={wordItem.pinyin}
                    currentPath={wordItem.audio_url}
                    onPathChange={(path) => updateWord(wIdx, { audio_url: path })}
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 4. 生活情景例句 (贴合儿童日常生活与音频上传) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" /> 4. 生活情景例句与音频 (儿童化日常短句)
              </h3>
              <span className="text-[11px] text-slate-400">仅需1句</span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-3">
              <textarea
                rows={2}
                placeholder="如: 我和好朋友一起去上学。(要求包含上方某个组词，贴合幼儿生活情景)"
                value={typeof formData.sentence === 'string' ? formData.sentence : (formData.sentence?.sentence || formData.sentance || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('sentence', val);
                  handleChange('sentance', val);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white rounded-xl border border-amber-200 focus:border-amber-500 outline-none resize-none leading-relaxed"
              />
              <p className="text-[11px] text-amber-800/80 leading-tight">
                💡 提示：句子中包含上方组词中的词语；用字尽量不超过当前学习阶段；适合4-6岁幼小衔接儿童生活情景。
              </p>

              {/* 例句音频上传/替换 */}
              <div className="pt-2 border-t border-amber-200/60">
                <AudioUploader
                  audioType="sentence_audio"
                  label="情景例句朗读音频 (自动命名为 sentences/audios/...)"
                  charHash={formData.char_hash}
                  charText={formData.char_text}
                  currentPath={formData.sentence_audio_url || ''}
                  onPathChange={(path) => handleChange('sentence_audio_url', path)}
                />
              </div>
            </div>
          </div>
        </form>

        {/* 底部保存按钮 */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeEditModal}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '保存中...' : '确认保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
