import React from 'react';
import { AdminLayout } from './components/layout/AdminLayout';
import { CharManagementPage } from './pages/CharManagementPage';
import { FeedbackManagementPage } from './pages/FeedbackManagementPage';
import { MembershipDashboardPage } from './pages/MembershipDashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { LoginPage } from './pages/LoginPage';
import { useAdmin } from './context/AdminContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const App: React.FC = () => {
  const { activePage, toast, currentUser } = useAdmin();

  // 若未登录微信管理员，阻断并展示微信登录页
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-bold ${
                toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : toast.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-blue-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <AdminLayout>
      {/* 核心业务主视图调度 */}
      {activePage === 'chars' ? (
        <CharManagementPage />
      ) : activePage === 'memberships' ? (
        <MembershipDashboardPage />
      ) : activePage === 'feedback' ? (
        <FeedbackManagementPage />
      ) : (
        <PlaceholderPage pageKey={activePage} />
      )}

      {/* 全局轻量 Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
