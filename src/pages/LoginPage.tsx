import React, { useState } from 'react';
import { Sparkles, ShieldCheck, User, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { api } from '../services/api';

const REMEMBERED_USER_KEY = 'kid_literacy_admin_remembered_username';

export const LoginPage: React.FC = () => {
  const { loginAdmin, showToast } = useAdmin();

  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(REMEMBERED_USER_KEY) || '';
  });
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(REMEMBERED_USER_KEY));
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('请输入管理员账号');
      return;
    }
    if (!password) {
      setErrorMessage('请输入登录密码');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      if (res && res.adminUser) {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
        } else {
          localStorage.removeItem(REMEMBERED_USER_KEY);
        }

        showToast(`欢迎回来，${res.adminUser.nickname || res.adminUser.username}！`, 'success');
        loginAdmin(res.adminUser);
      }
    } catch (err: any) {
      setErrorMessage(err.message || '用户名或密码错误，请核对后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 flex flex-col justify-center items-center p-4 selection:bg-amber-200">
      {/* 顶部 Logo 与系统标头 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20 mb-3 border-2 border-white">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>幼儿识字宝</span>
          <span className="text-xs font-mono font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
            ADMIN
          </span>
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          字库教研与多媒体中台管理系统
        </p>
      </div>

      {/* 核心登录表单卡片 */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/90 border border-slate-100 p-7 space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">管理员登录</h2>
          <p className="text-xs text-slate-500 mt-1">
            请输入系统教研管理账号与密码登录控制台
          </p>
        </div>

        {/* 错误提示横幅 */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入框 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              管理员账号
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="请输入管理员账号"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* 密码输入框 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              登录密码
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入登录密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 辅助选项 */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span>记住账号</span>
            </label>
          </div>

          {/* 登录提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在验证登录...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>立即登录控制台</span>
              </>
            )}
          </button>
        </form>

        {/* 底部系统信息 */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>微信云数据库权限隔离</span>
          </div>
          <span className="font-mono">v1.2.0</span>
        </div>
      </div>
    </div>
  );
};
