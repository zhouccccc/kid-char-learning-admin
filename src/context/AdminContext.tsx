import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AdminUser, AppConfig, CharLibItem, PageKey, StageLibrary, ToastInfo } from '../types';
import { api, getLocalConfig } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { DEFAULT_STAGES_SEED } from '../services/seedData';

const AUTH_STORAGE_KEY = 'kid_literacy_admin_auth_user_v1';

interface AdminContextType {
  // 微信管理员登录态
  currentUser: AdminUser | null;
  loginAdmin: (user: AdminUser) => void;
  logoutAdmin: () => void;

  // 页面导航
  activePage: PageKey;
  setActivePage: (page: PageKey) => void;

  // 全局配置与环境
  config: AppConfig;
  toggleMockMode: () => void;

  // 阶段与汉字数据
  stages: StageLibrary[];
  selectedStageId: number | 'all';
  setSelectedStageId: (id: number | 'all') => void;
  updateStagePublishStatus: (stageId: number, is_published: boolean) => Promise<void>;
  searchKeyword: string;
  setSearchKeyword: (kw: string) => void;
  chars: CharLibItem[];
  totalChars: number;
  isLoading: boolean;
  refreshData: (customKeyword?: string, customStageId?: number | 'all') => Promise<void>;

  // 汉字录入/编辑抽屉
  isEditModalOpen: boolean;
  editingChar: CharLibItem | null;
  openCreateChar: (defaultStageId?: number) => void;
  openEditChar: (char: CharLibItem) => void;
  closeEditModal: () => void;
  saveCharItem: (char: CharLibItem) => Promise<void>;
  deleteCharItem: (id: number, _id?: string) => Promise<void>;

  // 批量导入弹窗
  isBatchImportModalOpen: boolean;
  batchImportStageId: number;
  openBatchImport: (defaultStageId?: number) => void;
  closeBatchImport: () => void;
  batchImportChars: (list: CharLibItem[], overwrite: boolean) => Promise<number>;

  // 全局轻量通知
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // URL 解析
  resolveImageUrl: (relativePath: string, version?: string | number) => string;
  resolveAudioUrl: (relativePath: string, version?: string | number) => string;
}

const AdminContext = createContext<AdminContextType | null>(null);

function generateCharHash(prefix: string = 'c'): string {
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${prefix}_${rand}`;
}

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 微信管理员登录态
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('解析管理员凭证失败:', e);
    }
    return null;
  });

  const loginAdmin = useCallback((user: AdminUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  }, []);
  // 页面导航（支持监听 hash）
  const [activePage, setActivePageState] = useState<PageKey>(() => {
    const hash = window.location.hash.replace('#', '') as PageKey;
    if (['chars', 'analytics', 'memberships', 'feedback'].includes(hash)) {
      return hash;
    }
    return 'chars';
  });

  const setActivePage = (page: PageKey) => {
    setActivePageState(page);
    window.location.hash = page;
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageKey;
      if (['chars', 'analytics', 'memberships', 'feedback'].includes(hash)) {
        setActivePageState(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [config, setConfig] = useState<AppConfig>(getLocalConfig);
  // 初始预置阶段数据（避免初始界面空白，实际数据由手动点击刷新拉取）
  const [stages, setStages] = useState<StageLibrary[]>(() =>
    DEFAULT_STAGES_SEED.map((s) => ({ ...s, is_published: true, total_chars_count: 0 }))
  );
  const [selectedStageId, setSelectedStageId] = useState<number | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [chars, setChars] = useState<CharLibItem[]>([]);
  const [totalChars, setTotalChars] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 抽屉与通知
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingChar, setEditingChar] = useState<CharLibItem | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // 批量导入弹窗状态
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState<boolean>(false);
  const [batchImportStageId, setBatchImportStageId] = useState<number>(1);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  }, []);

  // 手动拉取/刷新数据核心函数
  const refreshData = useCallback(async (customKeyword?: string, customStageId?: number | 'all') => {
    setIsLoading(true);
    try {
      const kw = customKeyword !== undefined ? customKeyword : searchKeyword;
      const stId = customStageId !== undefined ? customStageId : selectedStageId;
      const [fetchedStages, charsResult] = await Promise.all([
        api.getStages(),
        api.getChars({
          stageId: stId === 'all' ? undefined : stId,
          keyword: kw
        })
      ]);
      setStages(fetchedStages);
      setChars(charsResult.list);
      setTotalChars(charsResult.total);
      showToast('数据拉取成功', 'success');
    } catch (err: any) {
      showToast(`数据拉取失败: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStageId, searchKeyword, showToast]);

  // 注：根据用户要求，已彻底移除自动刷新 useEffect 逻辑，全部改为由用户点击刷新按钮或主动交互拉取

  // 切换沙箱模式
  const toggleMockMode = () => {
    const next = { ...config, useMockLocal: !config.useMockLocal };
    setConfig(next);
    localStorage.setItem('kid_literacy_admin_app_config_v2', JSON.stringify(next));
    showToast(next.useMockLocal ? '已切换为离线沙箱 (Mock)' : '已切换为直连微信云环境', 'info');
  };

  // 打开创建新字抽屉
  const openCreateChar = (defaultStageId?: number) => {
    const rawStageId = defaultStageId !== undefined ? defaultStageId : (selectedStageId === 'all' ? 1 : selectedStageId);
    const stageId = Number(rawStageId) || 1;
    const newChar: CharLibItem = {
      id: 0,
      char_hash: generateCharHash('c'),
      char_text: '',
      pinyin: '',
      pinyin_with_tone: '',
      simple_desc: '',
      strokes: 4,
      stage_id: stageId,
      sort: chars.filter((c) => Number(c.stage_id) === stageId).length + 1,
      image_url: '',
      audio_url: '',
      words: [
        { id: `w_${Date.now()}_1`, word: '', pinyin: '', audio_url: '', is_primary: true },
        { id: `w_${Date.now()}_2`, word: '', pinyin: '', audio_url: '', is_primary: false }
      ]
    };
    setEditingChar(newChar);
    setIsEditModalOpen(true);
  };

  const openEditChar = (char: CharLibItem) => {
    const charToEdit = {
      ...char,
      char_hash: char.char_hash || generateCharHash('c'),
      words: char.words && char.words.length > 0
        ? char.words
        : [{ id: `w_${Date.now()}_1`, word: '', pinyin: '', audio_url: '', is_primary: true }]
    };
    setEditingChar(charToEdit);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingChar(null);
  };

  const saveCharItem = async (char: CharLibItem) => {
    try {
      await api.saveChar(char);
      showToast(`汉字「${char.char_text}」保存成功`, 'success');
      closeEditModal();
      refreshData();
    } catch (err: any) {
      showToast(`保存失败: ${err.message}`, 'error');
      throw err;
    }
  };

  const deleteCharItem = async (id: number, _id?: string) => {
    try {
      await api.deleteChar(id, _id);
      showToast('汉字已删除', 'success');
      refreshData();
    } catch (err: any) {
      showToast(`删除失败: ${err.message}`, 'error');
    }
  };

  // 批量导入弹窗控制
  const openBatchImport = (defaultStageId?: number) => {
    const rawStageId = defaultStageId !== undefined ? defaultStageId : (selectedStageId === 'all' ? 1 : selectedStageId);
    setBatchImportStageId(Number(rawStageId) || 1);
    setIsBatchImportModalOpen(true);
  };

  const closeBatchImport = () => {
    setIsBatchImportModalOpen(false);
  };

  const batchImportChars = async (list: CharLibItem[], overwrite: boolean): Promise<number> => {
    const count = await api.batchImport(list, overwrite);
    await refreshData();
    return count;
  };

  const resolveImageUrl = useCallback((relativePath: string, version?: string | number) => {
    return resolveMediaUrl(relativePath, version);
  }, []);

  const resolveAudioUrl = useCallback((relativePath: string, version?: string | number) => {
    return resolveMediaUrl(relativePath, version);
  }, []);

  const updateStagePublishStatus = async (stageId: number, is_published: boolean) => {
    try {
      await api.updateStageStatus(stageId, is_published);
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, is_published } : s))
      );
      showToast(is_published ? '字库已发布' : '字库已设为未发布', 'success');
    } catch (err: any) {
      showToast(`更新字库状态失败: ${err.message}`, 'error');
    }
  };

  return (
    <AdminContext.Provider
      value={{
        currentUser,
        loginAdmin,
        logoutAdmin,
        activePage,
        setActivePage,
        config,
        toggleMockMode,
        stages,
        selectedStageId,
        setSelectedStageId,
        updateStagePublishStatus,
        searchKeyword,
        setSearchKeyword,
        chars,
        totalChars,
        isLoading,
        refreshData,
        isEditModalOpen,
        editingChar,
        openCreateChar,
        openEditChar,
        closeEditModal,
        saveCharItem,
        deleteCharItem,
        isBatchImportModalOpen,
        batchImportStageId,
        openBatchImport,
        closeBatchImport,
        batchImportChars,
        toast,
        showToast,
        resolveImageUrl,
        resolveAudioUrl
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
