import { AdminUser, AppConfig, CharLibItem, FeedbackItem, FeedbackStats, FeedbackStatus, StageLibrary } from '../types';
import { DEFAULT_STAGES_SEED } from './seedData';
import { callAdminApi, ENV_ID } from './cloudbase';

const CONFIG_STORAGE_KEY = 'kid_literacy_admin_app_config_v3';

export const DEFAULT_APP_CONFIG: AppConfig = {
  envId: ENV_ID,
  apiBaseUrl: '', // 现已全面接入 @cloudbase/js-sdk，无需配置 HTTP 网关地址
  useMockLocal: false
};

export function getLocalConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_APP_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_APP_CONFIG;
}

export function saveLocalConfig(cfg: Partial<AppConfig>): AppConfig {
  const current = getLocalConfig();
  const next = { ...current, ...cfg };
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn(e);
  }
  return next;
}

// ---------------- API 服务接口 (@cloudbase/js-sdk 直连) ----------------
export const api = {
  /**
   * 获取 4 大阶段字库列表与各阶段字数
   */
  async getStages(): Promise<StageLibrary[]> {
    try {
      const data = await callAdminApi<any[]>('getStages');
      if (Array.isArray(data)) {
        return data.map((st: any, idx: number) => {
          let stageId = Number(st.id);
          if (isNaN(stageId) || stageId <= 0) {
            if (st.stage_code === 'enlighten') stageId = 1;
            else if (st.stage_code === 'primary') stageId = 2;
            else if (st.stage_code === 'middle') stageId = 3;
            else if (st.stage_code === 'senior') stageId = 4;
            else stageId = Number(st.sort) || idx + 1;
          }
          return {
            id: stageId,
            sort: Number(st.sort) || stageId,
            stage_code: st.stage_code || (stageId === 1 ? 'enlighten' : stageId === 2 ? 'primary' : stageId === 3 ? 'middle' : 'senior'),
            stage_name: st.stage_name,
            desc: st.desc,
            target_age: st.target_age,
            theme_color: st.theme_color,
            icon_name: st.icon_name,
            is_published: typeof st.is_published === 'boolean' ? st.is_published : true,
            total_chars_count: st.total_chars_count ?? (st.stats?.total ?? 0)
          };
        });
      }
    } catch (err) {
      console.warn('获取阶段列表接口异常:', err);
    }
    // 接口未就绪时的兜底默认定义（默认均为已发布）
    return DEFAULT_STAGES_SEED.map((s) => ({ ...s, is_published: true }));
  },

  /**
   * 更新字库阶段的发布状态 (已发布 / 未发布)
   */
  async updateStageStatus(stageId: number, is_published: boolean): Promise<boolean> {
    try {
      await callAdminApi('updateStageStatus', { id: stageId, is_published });
      return true;
    } catch (err) {
      console.warn('更新字库状态失败:', err);
      return false;
    }
  },

  /**
   * 查询汉字列表 (通过 @cloudbase/js-sdk 查询后端，无 mock 数据)
   */
  async getChars(params: {
    stageId?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: CharLibItem[]; total: number }> {
    try {
      const data = await callAdminApi<{ list: CharLibItem[]; total: number }>('getChars', params);
      if (data) {
        return {
          list: data.list || [],
          total: data.total || 0
        };
      }
    } catch (err) {
      console.warn('查询汉字接口异常:', err);
    }
    return { list: [], total: 0 };
  },

  /**
   * 保存或编辑汉字
   */
  async saveChar(char: CharLibItem): Promise<CharLibItem> {
    const nowIso = new Date().toISOString();
    const charToSave = {
      ...char,
      update_time: nowIso
    };

    await callAdminApi('saveChar', charToSave);
    return charToSave;
  },

  /**
   * 删除汉字
   */
  async deleteChar(id: number, _id?: string): Promise<boolean> {
    await callAdminApi('deleteChar', { id, _id });
    return true;
  },

  /**
   * 批量导入字库数据
   */
  async batchImport(list: CharLibItem[], overwrite: boolean = false): Promise<number> {
    const res = await callAdminApi<{ imported: number; total: number }>('batchImport', { list, overwrite });
    return res?.imported || list.length;
  },

  /**
   * 获取用户问题与意见反馈列表
   */
  async getFeedbackList(params: {
    status?: string;
    type?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: FeedbackItem[]; total: number; stats: FeedbackStats }> {
    try {
      const data = await callAdminApi<{ list: FeedbackItem[]; total: number; stats: FeedbackStats }>('getFeedbackList', params);
      if (data) {
        return {
          list: data.list || [],
          total: data.total || 0,
          stats: data.stats || { total: 0, pending: 0, processing: 0, replied: 0, resolved: 0 }
        };
      }
    } catch (err) {
      console.warn('获取反馈列表失败:', err);
    }
    return {
      list: [],
      total: 0,
      stats: { total: 0, pending: 0, processing: 0, replied: 0, resolved: 0 }
    };
  },

  /**
   * 更新用户反馈状态与客服答复
   */
  async updateFeedbackStatus(params: {
    id: string;
    status: FeedbackStatus;
    reply_content?: string;
  }): Promise<boolean> {
    try {
      await callAdminApi('updateFeedbackStatus', params);
      return true;
    } catch (err) {
      console.warn('更新反馈状态失败:', err);
      return false;
    }
  },

  /**
   * 删除工单
   */
  async deleteFeedback(id: string): Promise<boolean> {
    try {
      await callAdminApi('deleteFeedback', { id });
      return true;
    } catch (err) {
      console.warn('删除反馈工单失败:', err);
      return false;
    }
  },

  /**
   * 管理员独立账号密码登录
   */
  async login(username: string, password: string): Promise<{ token: string; adminUser: AdminUser }> {
    return callAdminApi('adminLogin', { username, password });
  },

  /**
   * 修改管理员密码
   */
  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
    await callAdminApi('changePassword', { username, oldPassword, newPassword });
    return true;
  }
};
