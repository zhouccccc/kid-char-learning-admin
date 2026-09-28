import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-800 selection:bg-amber-500 selection:text-white">
      {/* 左侧常规 SPA 导航边栏 */}
      <Sidebar />

      {/* 右侧主工作区 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 顶部栏 */}
        <Header />

        {/* 页面内容区 */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
