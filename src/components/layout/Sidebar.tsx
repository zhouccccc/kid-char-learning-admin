import React from 'react';
import { BookOpen, BarChart3, Users, MessageSquare, Cloud, CloudOff, Sparkles } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageKey } from '../../types';

interface MenuItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'chars',
    label: '字库与汉字管理',
    icon: <BookOpen className="w-4 h-4" />
  },
  {
    key: 'memberships',
    label: '会员数据看板',
    icon: <Users className="w-4 h-4" />
  },
  {
    key: 'feedback',
    label: '用户工单与客服',
    icon: <MessageSquare className="w-4 h-4" />
  },
  {
    key: 'analytics',
    label: '学情数据看板',
    icon: <BarChart3 className="w-4 h-4" />,
    badge: '规划中'
  }
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, config, toggleMockMode } = useAdmin();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 select-none border-r border-slate-800">
      {/* 顶部 Brand 标志 */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-black text-white tracking-tight leading-none">识字小达人</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">管理后台系统</div>
        </div>
      </div>

      {/* 导航菜单区 */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          业务功能模块
        </div>
        {MENU_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-amber-600/80 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 底部环境状态栏 */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate" title={config.envId}>
            环境: <span className="font-mono text-slate-300">{config.envId.slice(0, 10)}...</span>
          </span>
          <span className="text-[10px] text-slate-500">v1.0.0</span>
        </div>

        {/* 模式切换按钮 */}
        <button
          onClick={toggleMockMode}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
            config.useMockLocal
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
              : 'bg-blue-950/40 text-blue-400 border-blue-800 hover:bg-blue-900/50'
          }`}
          title="点击在离线沙箱与真实微信云开发间切换"
        >
          {config.useMockLocal ? (
            <>
              <CloudOff className="w-3.5 h-3.5" />
              <span>模式: 离线沙箱 (Mock)</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              <span>模式: 微信云环境 (Live)</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
