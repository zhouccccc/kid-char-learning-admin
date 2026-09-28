import cloudbase from '@cloudbase/js-sdk';

export const ENV_ID = 'cloud1-d7g21hml5aeb8a3ed';

export const app = cloudbase.init({
  env: ENV_ID
});

export const auth = app.auth({
  persistence: 'local'
});

let loginPromise: Promise<any> | null = null;

/**
 * 确保已建立云开发登录态（优先复用本地凭证，若无则使用匿名登录）
 */
export async function ensureAuth() {
  if (loginPromise) return loginPromise;

  loginPromise = (async () => {
    try {
      const state = await auth.getLoginState();
      if (!state) {
        // 使用匿名登录凭证与云开发建立连接
        await auth.anonymousAuthProvider().signIn();
      }
      return auth.getLoginState();
    } catch (err: any) {
      console.warn('CloudBase 认证状态初始化提示:', err);
      return null;
    } finally {
      loginPromise = null;
    }
  })();

  return loginPromise;
}

export interface CloudFunctionResponse<T = any> {
  code?: number;
  message?: string;
  data?: T;
  statusCode?: number;
  body?: string;
}

/**
 * 统一通过 @cloudbase/js-sdk 调用 admin-api 云函数
 */
export async function callAdminApi<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  await ensureAuth();

  const res = await app.callFunction({
    name: 'admin-api',
    data: {
      action,
      ...payload
    }
  });

  const result = res.result as CloudFunctionResponse<T> | undefined;
  if (!result) {
    throw new Error('云函数无返回数据');
  }

  // 1. 兼容直接结构返回 { code: 0, data: ... }
  if (typeof result.code === 'number') {
    if (result.code !== 0) {
      throw new Error(result.message || `操作失败 (code: ${result.code})`);
    }
    return result.data as T;
  }

  // 2. 兼容 HTTP 格式封装返回 { body: '{"code":0,...}' }
  if (result.body && typeof result.body === 'string') {
    try {
      const parsed = JSON.parse(result.body);
      if (parsed.code !== 0) {
        throw new Error(parsed.message || '操作失败');
      }
      return parsed.data as T;
    } catch (e: any) {
      throw new Error(`解析响应异常: ${e.message}`);
    }
  }

  return (result as any) as T;
}

const tempUrlCache = new Map<string, string>();

/**
 * 获取云存储 FileID 的临时访问 HTTPS 链接（增加内存缓存，减少云API配额调用）
 */
export async function getTempFileUrlCached(fileId: string): Promise<string> {
  if (!fileId) return '';
  if (!fileId.startsWith('cloud://')) return fileId;
  if (tempUrlCache.has(fileId)) return tempUrlCache.get(fileId)!;

  try {
    await ensureAuth();
    const res = await app.getTempFileURL({ fileList: [fileId] });
    const item = res.fileList?.[0];
    if (item && item.tempFileURL) {
      tempUrlCache.set(fileId, item.tempFileURL);
      return item.tempFileURL;
    }
  } catch (e) {
    console.warn('获取临时链接失败:', e);
  }
  return '';
}

/**
 * 真实上传文件至微信云开发存储
 * 严格按照规范：上传前将文件重新包装为指定的规范文件名，同名覆盖上传
 */
export async function uploadFileToCloud(
  cloudPath: string,
  file: File
): Promise<{ fileID: string }> {
  await ensureAuth();

  // 提取标准目标文件名（例如 c_65e5_ri.mp3）
  const cleanCloudPath = cloudPath.trim().replace(/^\/+/, '');
  const targetFileName = cleanCloudPath.split('/').pop() || 'audio.mp3';

  // 重新包装 File 对象，确保上传时的文件名符合规范，杜绝原本地中文文件名导致的乱码
  const renamedFile = new File([file], targetFileName, {
    type: file.type || 'audio/mpeg'
  });

  const uploadResult = await app.uploadFile({
    cloudPath: cleanCloudPath,
    filePath: renamedFile
  });

  if (!uploadResult || !uploadResult.fileID) {
    throw new Error('云存储上传响应异常');
  }

  return { fileID: uploadResult.fileID };
}
