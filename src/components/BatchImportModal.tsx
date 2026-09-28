import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { CharLibItem, StageLibrary } from '../types';
import { generateCharHash, generateWordAudioPath } from '../utils/charHash';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStageId?: number;
}

/**
 * 将输入的媒体标识/路径规范化为标准云存储相对路径
 * - 支持纯文件名（如 c_ri_8f2a_日.png -> chars/images/c_ri_8f2a_日.png）
 * - 支持标准相对路径（如 chars/images/c_ri_8f2a_日.png）
 * - 自动剥离误传的完整 cloud://<env>.<bucket>/ 或 https:// 前缀，彻底消除环境耦合
 */
function normalizeMediaPath(
  rawPath: any,
  defaultDir: 'chars/images' | 'chars/audios' | 'words/audios'
): string {
  if (!rawPath || typeof rawPath !== 'string') return '';
  let clean = rawPath.trim();

  // 剥离 cloud://<env>.<bucket>/ 前缀
  if (clean.startsWith('cloud://')) {
    const afterScheme = clean.replace('cloud://', '');
    const slashIdx = afterScheme.indexOf('/');
    clean = slashIdx !== -1 ? afterScheme.substring(slashIdx + 1) : afterScheme;
  } else if (/^https?:\/\//i.test(clean)) {
    // 剥离 http://.../ 或 https://.../ 前缀
    try {
      const parsed = new URL(clean);
      clean = parsed.pathname.replace(/^\/+/, '');
    } catch {
      // 保持原样
    }
  }

  // 去除多余斜杠
  clean = clean.replace(/^\/+/, '');
  if (!clean) return '';

  // 若仅传入了文件名（不含任何子目录斜杠），自动拼装对应规范子目录
  if (!clean.includes('/')) {
    return `${defaultDir}/${clean}`;
  }

  return clean;
}

// 示例 JSON 模板内容（采用 4 位定长 Unicode 十六进制确定性哈希，绝对 0 碰撞，任意环境自由迁移）
const JSON_TEMPLATE = [
  {
    stage_id: 1,
    char_text: "日",
    char_hash: "c_65e5",
    pinyin_with_tone: "rì",
    pinyin: "ri",
    simple_desc: "太阳，白昼，一天",
    strokes: 4,
    image_url: "chars/images/c_65e5_日.webp",
    audio_url: "chars/audios/c_65e5_日.mp3",
    words: [
      {
        word: "日光",
        pinyin: "rì guāng",
        audio_url: "words/audios/w_65e5_5149_日光.mp3"
      },
      {
        word: "红日",
        pinyin: "hóng rì",
        audio_url: "words/audios/w_7ea2_65e5_红日.mp3"
      }
    ],
    sentence: "一轮红日从东方慢慢升起来了。"
  },
  {
    stage_id: 1,
    char_text: "月",
    char_hash: "c_6708",
    pinyin_with_tone: "yuè",
    pinyin: "yue",
    simple_desc: "月亮，月份",
    strokes: 4,
    image_url: "chars/images/c_6708_月.webp",
    audio_url: "chars/audios/c_6708_月.mp3",
    words: [
      {
        word: "月亮",
        pinyin: "yuè liang",
        audio_url: "words/audios/w_6708_4eae_月亮.mp3"
      }
    ],
    sentence: "夜晚的月亮像弯弯的小船。"
  }
];

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  defaultStageId = 1
}) => {
  const { stages, batchImportChars, showToast } = useAdmin();

  const [targetStageId, setTargetStageId] = useState<number>(Number(defaultStageId) || 1);
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('');
  const [parsedList, setParsedList] = useState<CharLibItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 每次打开弹窗或切换目标阶段时，自动将选定字库同步为卡片对应的 stageId 并重置上传状态
  useEffect(() => {
    if (isOpen) {
      const initialStageId = Number(defaultStageId) || 1;
      setTargetStageId(initialStageId);
      setParsedList([]);
      setFileName('');
      setParseError(null);
    }
  }, [isOpen, defaultStageId]);

  if (!isOpen) return null;

  // 处理文件解析
  const handleProcessFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('文件格式不正确，仅支持上传 .json 格式文件');
      setParsedList([]);
      setFileName('');
      return;
    }

    setFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rawJson = JSON.parse(text);

        // 兼容直接数组与包含 list / chars / data 字段的对象
        let list: any[] = [];
        if (Array.isArray(rawJson)) {
          list = rawJson;
        } else if (rawJson && typeof rawJson === 'object') {
          if (Array.isArray(rawJson.list)) list = rawJson.list;
          else if (Array.isArray(rawJson.chars)) list = rawJson.chars;
          else if (Array.isArray(rawJson.data)) list = rawJson.data;
        }

        if (!list || list.length === 0) {
          setParseError('JSON 文件中未找到有效的汉字列表数据（应为数组或包含 list 字段）');
          setParsedList([]);
          return;
        }

        // 数据清洗与格式校验
        const validItems: CharLibItem[] = [];
        const invalidErrors: string[] = [];

        list.forEach((item: any, idx: number) => {
          if (!item.char_text || typeof item.char_text !== 'string' || item.char_text.trim().length === 0) {
            invalidErrors.push(`第 ${idx + 1} 条数据缺少必填汉字字段 char_text`);
            return;
          }

          const charText = item.char_text.trim();
          const pinyinWithTone = (item.pinyin_with_tone || item.pinyin || '').trim();
          const plainPinyin = (item.pinyin || pinyinWithTone.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).trim();

          // 规范化媒体文件标识与相对路径（自动清洗前缀与目录）
          const imagePath = normalizeMediaPath(item.image_url, 'chars/images');
          const audioPath = normalizeMediaPath(item.audio_url, 'chars/audios');

          // 规范化组词列表
          let words: any[] = [];
          if (Array.isArray(item.words)) {
            words = item.words.map((w: any, wIdx: number) => {
              if (typeof w === 'string') {
                const cleanWord = w.trim();
                const wordAudio = generateWordAudioPath(cleanWord, 'mp3');
                return {
                  id: `w_${Date.now()}_${wIdx + 1}`,
                  word: cleanWord,
                  pinyin: '',
                  audio_url: wordAudio,
                };
              }
              const cleanWord = String(w.word || '').trim();
              const wordAudio = normalizeMediaPath(w.audio_url, 'words/audios') || generateWordAudioPath(cleanWord, 'mp3');
              return {
                id: w.id || `w_${Date.now()}_${wIdx + 1}`,
                word: cleanWord,
                pinyin: String(w.pinyin || '').trim(),
                audio_url: wordAudio,
              };
            });
          }

          const stageId = Number(item.stage_id || targetStageId || 1);

          const sentenceText = typeof item.sentence === 'string'
            ? item.sentence.trim()
            : (typeof item.sentence?.sentence === 'string'
                ? item.sentence.sentence.trim()
                : '');

          validItems.push({
            id: item.id ? Number(item.id) : 0,
            char_hash: item.char_hash || generateCharHash(charText),
            char_text: charText,
            pinyin: plainPinyin,
            pinyin_with_tone: pinyinWithTone,
            simple_desc: item.simple_desc || '',
            strokes: Number(item.strokes) || 4,
            stage_id: stageId,
            sort: item.sort ? Number(item.sort) : validItems.length + 1,
            image_url: imagePath,
            audio_url: audioPath,
            words: words.slice(0, 3),
            sentence: sentenceText,
          });
        });

        if (validItems.length === 0) {
          setParseError(`解析失败：未提取到符合规范的汉字数据。${invalidErrors[0] || ''}`);
          setParsedList([]);
          return;
        }

        setParsedList(validItems);
        if (invalidErrors.length > 0) {
          setParseError(`提示：成功识别 ${validItems.length} 个汉字，但有 ${invalidErrors.length} 条数据格式不全被忽略。`);
        } else {
          setParseError(null);
        }
      } catch (err: any) {
        setParseError(`JSON 语法解析错误: ${err.message}`);
        setParsedList([]);
      }
    };
    reader.onerror = () => {
      setParseError('读取文件失败，请检查文件权限');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // 下载示例模板文件
  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(JSON_TEMPLATE, null, 2)], {
      type: 'application/json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '字库汉字批量导入模板.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 提交批量导入
  const handleSubmit = async () => {
    if (parsedList.length === 0) return;
    setIsSubmitting(true);
    try {
      // 若用户在导入前统一指定了阶段，且项目未单独声明，应用当前 targetStageId
      const finalItems = parsedList.map((item) => ({
        ...item,
        stage_id: item.stage_id || targetStageId
      }));

      const count = await batchImportChars(finalItems, overwrite);
      showToast(`批量导入成功，共处理 ${count} 个汉字`, 'success');
      onClose();
    } catch (err: any) {
      showToast(`批量导入失败: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 leading-none">批量导入汉字库</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  目标阶段：{stages.find((s) => Number(s.id) === Number(targetStageId))?.stage_name || `阶段 ${targetStageId}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                上传包含汉字列表的 JSON 文件，一键批量入库并持久化
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 导入配置表单与上传区 */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 配置项 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/75 p-4 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                默认归属阶段 (若条目未单独指定)
              </label>
              <select
                value={Number(targetStageId) || 1}
                onChange={(e) => {
                  const newStageId = Number(e.target.value);
                  setTargetStageId(newStageId);
                  setParsedList((prev) =>
                    prev.map((item) => ({
                      ...item,
                      stage_id: newStageId
                    }))
                  );
                }}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none cursor-pointer"
              >
                {stages.map((st: StageLibrary) => (
                  <option key={st.id} value={Number(st.id)}>
                    {st.stage_name} (ID: {st.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                重复汉字处理策略
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">若汉字已存在，覆盖更新原有数据</span>
              </label>
            </div>
          </div>

          {/* 文件拖拽/选择区域 */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50'
                  : fileName
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-100 text-amber-500 flex items-center justify-center mx-auto mb-2.5">
                <FileText className="w-6 h-6" />
              </div>
              {fileName ? (
                <div>
                  <p className="text-xs font-black text-slate-800">{fileName}</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已加载文件，点击可重新更换
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    点击选择文件，或将 JSON 文件拖拽到此处
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">支持标准 UTF-8 编码的 .json 格式文件</p>
                </div>
              )}
            </div>
          </div>

          {/* 模板下载提示 */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
            <span className="text-amber-900 font-medium">
              尚未准备数据？可先下载官方标准 JSON 模板参考格式。
            </span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              下载模板
            </button>
          </div>

          {/* 错误或警告提示 */}
          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{parseError}</span>
            </div>
          )}

          {/* 识别预览区域 */}
          {parsedList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  成功解析待导入汉字 (共 <b className="text-amber-600">{parsedList.length}</b> 字)
                </span>
                <span className="text-slate-400 text-[11px]">预览前 12 个条目</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {parsedList.slice(0, 12).map((item, i) => (
                  <div
                    key={i}
                    className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-100/70 border border-amber-200 font-black text-slate-900 text-sm flex items-center justify-center">
                        {item.char_text}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 leading-tight">
                          {item.pinyin_with_tone || item.pinyin}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.strokes} 画 · {stages.find((s) => Number(s.id) === Number(item.stage_id))?.stage_name || `阶段${item.stage_id}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {parsedList.length > 0 ? `就绪：准备导入 ${parsedList.length} 个汉字` : '请先选择待导入的 JSON 文件'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={parsedList.length === 0 || isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? '正在批量写入...' : `确认导入 (${parsedList.length} 字)`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
