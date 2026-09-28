import React, { useState } from 'react';
import { RefreshCw, User, ShieldCheck, LogOut, KeyRound, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const { activePage, refreshData, totalChars, isLoading, currentUser, logoutAdmin, showToast } = useAdmin();

  // 修改密码弹窗状态
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [changeError, setChangeError] = useState<string>('');

  const getPageTitle = () => {
    switch (activePage) {
      case 'chars':
        return { title: '字库与汉字管理', desc: `管理 4 大分级阶段与字库资源 · 当前字库共 ${totalChars} 字` };
      case 'analytics':
        return { title: '学情数据看板', desc: '儿童学习进度、打卡留存与薄弱字统计大盘' };
      case 'memberships':
        return { title: '会员商业化管理', desc: '全功能 VIP 与 5 项专项特权开通管理' };
      case 'feedback':
        return { title: '用户工单与客服', desc: '处理家长反馈、汉字纠错与客服沟通' };
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出当前管理员登录吗？')) {
      logoutAdmin();
      showToast('已安全退出系统', 'info');
    }
  };

  const handleOpenPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangeError('');
    setIsPasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setChangeError('请输入当前原密码');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setChangeError('新密码长度不能少于 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('两次输入的新密码不一致');
      return;
    }

    setChangeError('');
    setIsChangingPassword(true);

    try {
      const username = currentUser?.username || 'admin';
      await api.changePassword(username, oldPassword, newPassword);
      showToast('管理员密码修改成功，请牢记新密码', 'success');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setChangeError(err.message || '密码修改失败，请检查原密码是否正确');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const pageInfo = getPageTitle();

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
        {/* 左侧：当前路由面包屑与说明 */}
        <div>
          <h2 className="text-sm font-black text-slate-900 leading-none">{pageInfo.title}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">{pageInfo.desc}</p>
        </div>

        {/* 右侧：快捷工具与管理员信息 */}
        <div className="flex items-center gap-3">
          {/* 手动刷新拉取数据按钮 (带 Loading 动画与禁用状态) */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isLoading
                ? 'bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed opacity-90'
                : 'text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200 active:scale-95'
            }`}
            title={isLoading ? '正在从云端拉取数据...' : '手动从云端拉取/刷新数据'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span>{isLoading ? '拉取中...' : '刷新数据'}</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* 管理员身份信息卡片 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>{currentUser?.nickname || currentUser?.username || '教研管理员'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                账号: {currentUser?.username || 'admin'}
              </div>
            </div>

            {/* 修改密码按钮 */}
            <button
              onClick={handleOpenPasswordModal}
              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer ml-1"
              title="修改管理员密码"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* 退出登录按钮 */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="退出当前管理员登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 修改密码弹窗 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">修改管理员密码</h3>
                  <p className="text-[11px] text-slate-400 font-mono">账号: {currentUser?.username || 'admin'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changeError && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">当前原密码</label>
                <input
                  type="password"
                  required
                  placeholder="请输入当前原密码"
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    setChangeError('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">新密码 (不少于6位)</label>
                <input
                  type="password"
                  required
                  placeholder="请输入新密码"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setChangeError('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">确认新密码</label>
                <input
                  type="password"
                  required
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setChangeError('');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>正在保存...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>确认修改</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
