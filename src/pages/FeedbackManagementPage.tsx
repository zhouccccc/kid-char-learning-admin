import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Send,
  Image as ImageIcon,
  User,
  Phone,
  Filter,
  X,
  ExternalLink,
  Sparkles,
  Check,
  Trash2,
  Copy,
  AlertTriangle,
  Layers,
  Inbox
} from 'lucide-react';
import { api } from '../services/api';
import { FeedbackItem, FeedbackStats, FeedbackStatus } from '../types';
import { useAdmin } from '../context/AdminContext';

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  bug: { label: '功能异常', bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', icon: '🐛' },
  suggestion: { label: '体验建议', bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', icon: '💡' },
  content: { label: '汉字纠错', bg: 'bg-indigo-50', text: 'text-indigo-700 border-indigo-200', icon: '✏️' },
  other: { label: '其它疑问', bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200', icon: '❓' }
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: '待处理', bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  processing: { label: '处理中', bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  replied: { label: '已回复', bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  resolved: { label: '已解决', bg: 'bg-purple-50', text: 'text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  closed: { label: '已关闭', bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200', dot: 'bg-slate-400' }
};

// 分类快捷回复短语库
const QUICK_REPLY_CATEGORIES: { name: string; icon: string; items: string[] }[] = [
  {
    name: '汉字教研纠错',
    icon: '✏️',
    items: [
      '收到汉字纠错！教研团队已复核并更新字库拼音/笔画/例句，感谢您的细致反馈！',
      '您反馈的汉字音频已重新完成录制与替换上线，可重新点读试听，感谢支持！',
      '非常感谢指正！该汉字字形与发音已校正，我们持续为孩子提供严谨规范的启蒙内容！'
    ]
  },
  {
    name: '功能异常修复',
    icon: '🐛',
    items: [
      '感谢您的反馈！技术团队已定位并在最新版本中完成修复，请重新进入小程序验证~',
      '收到反馈，我们正在排查此场景的偶发异常，修复后将第一时间发布更新！',
      '该问题已成功解决！如仍有异常，建议您下拉小程序刷新或重新打开体验。'
    ]
  },
  {
    name: '体验与功能建议',
    icon: '💡',
    items: [
      '非常宝贵的建议！已记录并纳入后续幼教功能迭代规划中，期待给宝宝更好的识字体验~',
      '您的想法非常有创意！我们正在规划更丰富的互动学字玩法，敬请期待新版本上线！',
      '感谢您陪伴孩子一起使用幼儿识字宝，您的反馈是我们持续进步的最大动力！'
    ]
  },
  {
    name: '补充信息询问',
    icon: '❓',
    items: [
      '您好，为了更准确地帮您定位问题，请问出现该问题时的手机型号与微信版本是什么呢？',
      '您好，方便补充一下发生该问题时的具体操作步骤或截图吗？我们将加急跟进处理！'
    ]
  }
];

export const FeedbackManagementPage: React.FC = () => {
  const { showToast } = useAdmin();

  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    pending: 0,
    processing: 0,
    replied: 0,
    resolved: 0,
    by_type: { bug: 0, suggestion: 0, content: 0, other: 0 }
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 答复/状态变更弹窗
  const [activeModalItem, setActiveModalItem] = useState<FeedbackItem | null>(null);
  const [modalStatus, setModalStatus] = useState<FeedbackStatus>('replied');
  const [modalReplyText, setModalReplyText] = useState<string>('');
  const [activeReplyCategory, setActiveReplyCategory] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 删除确认弹窗
  const [deletingItem, setDeletingItem] = useState<FeedbackItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 图片全屏大图预览灯箱
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 加载工单数据
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getFeedbackList({
        status: statusFilter,
        type: typeFilter,
        keyword: searchKeyword,
        page: 1,
        pageSize: 100
      });
      setList(res.list);
      setStats(res.stats);
    } catch (err: any) {
      console.warn('获取工单异常:', err);
      showToast('获取工单数据失败: ' + (err.message || '网络异常'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // 一键复制文本
  const copyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label}已复制到剪贴板`, 'success');
    }).catch(() => {
      showToast('复制失败', 'info');
    });
  };

  // 打开答复弹窗
  const openReplyModal = (item: FeedbackItem) => {
    setActiveModalItem(item);
    setModalStatus(item.status === 'pending' ? 'replied' : item.status);
    setModalReplyText(item.reply_content || '');
    // 智能定位默认推荐短语分类
    if (item.type === 'content') setActiveReplyCategory(0);
    else if (item.type === 'bug') setActiveReplyCategory(1);
    else if (item.type === 'suggestion') setActiveReplyCategory(2);
    else setActiveReplyCategory(3);
  };

  // 保存答复与工单状态
  const handleSaveReply = async () => {
    if (!activeModalItem) return;
    setSubmitting(true);
    try {
      const ok = await api.updateFeedbackStatus({
        id: activeModalItem._id,
        status: modalStatus,
        reply_content: modalReplyText
      });
      if (ok) {
        showToast('工单答复与状态已成功保存！', 'success');
        setActiveModalItem(null);
        await loadData();
      } else {
        showToast('更新失败，请重试', 'error');
      }
    } catch (err: any) {
      showToast('更新失败: ' + (err.message || '网络异常'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 快捷一键标为已解决
  const handleQuickResolve = async (item: FeedbackItem) => {
    try {
      const ok = await api.updateFeedbackStatus({
        id: item._id,
        status: 'resolved'
      });
      if (ok) {
        showToast('已快速将工单标记为【已解决】', 'success');
        loadData();
      }
    } catch (e: any) {
      showToast('操作失败: ' + (e.message || '未知错误'), 'error');
    }
  };

  // 确认删除工单
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const ok = await api.deleteFeedback(deletingItem._id);
      if (ok) {
        showToast('工单记录已成功删除', 'success');
        setDeletingItem(null);
        await loadData();
      } else {
        showToast('删除失败，请重试', 'error');
      }
    } catch (e: any) {
      showToast('删除失败: ' + (e.message || '网络错误'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 顶部指标统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80 flex items-center justify-between">
            <span>全部工单</span>
            <Inbox className="w-3.5 h-3.5 opacity-60" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.total}</div>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : stats.pending > 0
              ? 'bg-amber-50/80 text-amber-900 border-amber-200/80 hover:border-amber-300'
              : 'bg-white text-slate-700 border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>待处理</span>
            {stats.pending > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
                statusFilter === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'
              }`}>
                待办
              </span>
            )}
          </div>
          <div className="text-2xl font-black mt-1">{stats.pending}</div>
        </div>

        <div
          onClick={() => setStatusFilter('processing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'processing'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">处理中</div>
          <div className="text-2xl font-black mt-1">{stats.processing}</div>
        </div>

        <div
          onClick={() => setStatusFilter('replied')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'replied'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">已回复</div>
          <div className="text-2xl font-black mt-1">{stats.replied}</div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'resolved'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">已解决</div>
          <div className="text-2xl font-black mt-1">{stats.resolved}</div>
        </div>
      </div>

      {/* 搜索与多维过滤工具栏 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        {/* 第一行：状态筛选与搜索框 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> 状态:
            </span>
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待处理' },
              { key: 'processing', label: '处理中' },
              { key: 'replied', label: '已回复' },
              { key: 'resolved', label: '已解决' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索反馈内容 / 联系电话 / OpenID..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => { setSearchKeyword(''); loadData(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              搜索
            </button>

            <button
              type="button"
              onClick={loadData}
              title="刷新数据"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* 第二行：分类筛选 */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> 类型:
          </span>
          {[
            { key: 'all', label: '全部类型', icon: '📋' },
            { key: 'content', label: '汉字纠错', icon: '✏️', count: stats.by_type?.content },
            { key: 'bug', label: '功能异常', icon: '🐛', count: stats.by_type?.bug },
            { key: 'suggestion', label: '体验建议', icon: '💡', count: stats.by_type?.suggestion },
            { key: 'other', label: '其它疑问', icon: '❓', count: stats.by_type?.other }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTypeFilter(item.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === item.key
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-slate-700 font-mono shadow-2xs">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 工单列表视图 */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">正在拉取用户工单与客服答复记录...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="text-sm font-bold text-slate-700">暂无匹配的工单记录</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter !== 'all' || typeFilter !== 'all' || searchKeyword
              ? '当前筛选条件下没有找到匹配的用户反馈，可尝试调整过滤条件'
              : '用户在小程序提交问题或意见后，将实时在此展示并支持答复处理'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {list.map((item) => {
            const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
            const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
              >
                {/* 头部元信息 */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${typeConf.bg} ${typeConf.text}`}>
                      <span>{typeConf.icon}</span>
                      <span>{typeConf.label}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${statusConf.bg} ${statusConf.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}></span>
                      <span>{statusConf.label}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 联系方式 */}
                    {item.contact && (
                      <button
                        onClick={() => copyText(item.contact || '', '联系电话')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors cursor-pointer"
                        title="点击复制联系方式"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.contact}</span>
                        <Copy className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                      </button>
                    )}

                    {/* 用户 OpenID */}
                    {item._openid && (
                      <button
                        onClick={() => copyText(item._openid || '', 'OpenID')}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                        title={`点击复制完整 OpenID: ${item._openid}`}
                      >
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{item._openid.slice(-6)}</span>
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 反馈正文内容 */}
                <div className="text-slate-800 text-xs font-normal leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 select-text">
                  {item.content}
                </div>

                {/* 用户附带截图 */}
                {Array.isArray(item.images) && item.images.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>用户附带截图 ({item.images.length}张，点击可放大查看):</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 pt-0.5">
                      {item.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewImageUrl(img)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer hover:border-amber-400 transition-all flex items-center justify-center shadow-2xs"
                        >
                          <img
                            src={img}
                            alt={`截图${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 客服答复记录卡片 */}
                {item.reply_content && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>教研客服团队已答复:</span>
                      </span>
                      {item.replied_at && (
                        <span className="text-[10px] text-emerald-600 font-normal">
                          {formatDate(item.replied_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-wrap select-text">
                      {item.reply_content}
                    </p>
                  </div>
                )}

                {/* 底部操作工具栏 */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    工单编号: <span className="font-mono text-slate-600">{item._id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 删除工单 */}
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="删除此工单"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* 快捷已解决 */}
                    {item.status !== 'resolved' && (
                      <button
                        onClick={() => handleQuickResolve(item)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>快速标为已解决</span>
                      </button>
                    )}

                    {/* 答复/改状态 */}
                    <button
                      onClick={() => openReplyModal(item)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{item.reply_content ? '重新答复 / 改状态' : '答复工单'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 回复与状态处理工作台 Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">处理与答复工单</h3>
                  <p className="text-[11px] text-slate-400 font-mono">工单 #{activeModalItem._id}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 用户原问题预览 */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>用户反馈内容 ({TYPE_CONFIG[activeModalItem.type]?.label || '其它'}):</span>
                <span>{formatDate(activeModalItem.created_at)}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
                {activeModalItem.content}
              </p>
            </div>

            {/* 状态调整单选组 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">更新工单状态:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['pending', 'processing', 'replied', 'resolved', 'closed'] as FeedbackStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setModalStatus(st)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      modalStatus === st
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {STATUS_CONFIG[st].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 分类快捷回复模板短语库 */}
            <div className="space-y-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>快捷答复模板短语 (点击填入):</span>
                </span>
                <span className="text-[10px] text-amber-700/80">可点击直接套用并编辑</span>
              </div>

              {/* 短语分类 Tabs */}
              <div className="flex items-center gap-1 border-b border-amber-200/40 pb-1.5">
                {QUICK_REPLY_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveReplyCategory(idx)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      activeReplyCategory === idx
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 hover:bg-amber-100/70'
                    }`}
                  >
                    <span>{cat.icon} {cat.name}</span>
                  </button>
                ))}
              </div>

              {/* 该分类下的快捷短语按钮 */}
              <div className="space-y-1.5 pt-0.5">
                {QUICK_REPLY_CATEGORIES[activeReplyCategory].items.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setModalReplyText(phrase)}
                    className="w-full text-[11px] text-slate-700 bg-white hover:bg-amber-100/60 p-2 rounded-xl border border-amber-200/60 text-left transition-all cursor-pointer leading-snug line-clamp-2"
                    title={phrase}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* 答复输入框 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>客服/教研答复文本:</span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  实时同步到用户小程序「我的 $\to$ 反馈记录」
                </span>
              </div>
              <textarea
                rows={3}
                value={modalReplyText}
                onChange={(e) => setModalReplyText(e.target.value)}
                placeholder="请输入详细的答复说明或处理进展..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed resize-none font-normal"
              ></textarea>
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveReply}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>保存并同步答复</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除工单确认弹窗 */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">确认删除该工单？</h3>
                <p className="text-[11px] text-slate-400">工单 ID: {deletingItem._id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {deletingItem.content.slice(0, 60)}...
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片全屏预览大图灯箱 */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div className="max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl relative shadow-2xl">
            <img
              src={previewImageUrl}
              alt="截图大图"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
