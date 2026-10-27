import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Sparkles,
  Calendar,
  Coins,
  Flame,
  Award,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  X,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Eye,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import {
  MemberDetail,
  MemberFilterParams,
  MemberItem,
  MemberOverviewStats,
  StageMasteryItem
} from '../types';
import { useAdmin } from '../context/AdminContext';

const STAGE_THEMES: Record<number, { name: string; bg: string; text: string; border: string; bar: string }> = {
  1: { name: '启蒙阶段', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
  2: { name: '初级阶段', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  3: { name: '中级阶段', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', bar: 'bg-sky-500' },
  4: { name: '高级阶段', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500' }
};

export const MembershipDashboardPage: React.FC = () => {
  const { showToast } = useAdmin();

  // 1. 数据概览状态
  const [stats, setStats] = useState<MemberOverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // 2. 学员列表与分页状态
  const [list, setList] = useState<MemberItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'today_active' | 'active_7d' | 'sleeping'>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // 3. 复制 OpenID 提示状态
  const [copiedOpenId, setCopiedOpenId] = useState<string | null>(null);

  // 4. 学情画像抽屉状态
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // 5. 调整爱心星币弹窗
  const [isCoinModalOpen, setIsCoinModalOpen] = useState<boolean>(false);
  const [coinTargetUser, setCoinTargetUser] = useState<MemberItem | null>(null);
  const [coinDelta, setCoinDelta] = useState<number>(20);
  const [coinNote, setCoinNote] = useState<string>('积极识字打卡奖励');
  const [isAdjustingCoins, setIsAdjustingCoins] = useState<boolean>(false);

  // 6. 调整阶段弹窗
  const [isStageModalOpen, setIsStageModalOpen] = useState<boolean>(false);
  const [stageTargetUser, setStageTargetUser] = useState<MemberItem | null>(null);
  const [newStageId, setNewStageId] = useState<number>(1);
  const [unlockPrevious, setUnlockPrevious] = useState<boolean>(true);
  const [isUpdatingStage, setIsUpdatingStage] = useState<boolean>(false);

  // 7. 测试数据同步
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // 加载大盘统计数据
  const fetchOverviewStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await api.getMemberOverviewStats();
      setStats(data);
    } catch (err: any) {
      console.warn('获取学员看板概览异常:', err);
      showToast('获取学员看板统计失败，已回退为基准数据', 'info');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // 加载学员列表数据
  const fetchMemberList = useCallback(async (p: number = page) => {
    setLoadingList(true);
    try {
      const res = await api.getMemberList({
        keyword,
        stage: selectedStage,
        status: selectedStatus,
        page: p,
        pageSize
      });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.warn('获取学员列表异常:', err);
      showToast('获取学员列表失败', 'error');
    } finally {
      setLoadingList(false);
    }
  }, [keyword, selectedStage, selectedStatus, page, showToast]);

  // 初始化
  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  useEffect(() => {
    fetchMemberList(page);
  }, [fetchMemberList, page]);

  // 复制 OpenID
  const handleCopyOpenId = (openid: string) => {
    navigator.clipboard.writeText(openid);
    setCopiedOpenId(openid);
    showToast('OpenID 已复制到剪贴板', 'info');
    setTimeout(() => setCopiedOpenId(null), 2000);
  };

  // 打开学情画像抽屉
  const handleOpenDetail = async (member: MemberItem) => {
    setSelectedMember(member);
    setIsDetailDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const detail = await api.getMemberDetail(member._openid);
      setMemberDetail(detail);
    } catch (err: any) {
      console.warn('获取学员学情画像失败:', err);
      showToast('获取学员详情失败', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 打开星币调整弹窗
  const handleOpenCoinModal = (member: MemberItem) => {
    setCoinTargetUser(member);
    setCoinDelta(20);
    setCoinNote('积极识字打卡奖励');
    setIsCoinModalOpen(true);
  };

  // 提交星币调整
  const handleConfirmAdjustCoins = async () => {
    if (!coinTargetUser) return;
    if (coinDelta === 0) {
      showToast('调整数额不能为 0', 'error');
      return;
    }
    setIsAdjustingCoins(true);
    try {
      const res = await api.adjustMemberCoins(coinTargetUser._openid, coinDelta, coinNote);
      showToast(`星币调整成功！学员当前余额：${res.star_coins} ⭐`, 'success');
      setIsCoinModalOpen(false);
      // 本地刷新列表与抽屉数据
      setList((prev) =>
        prev.map((item) =>
          item._openid === coinTargetUser._openid ? { ...item, star_coins: res.star_coins } : item
        )
      );
      if (selectedMember && selectedMember._openid === coinTargetUser._openid) {
        setSelectedMember((prev) => prev ? { ...prev, star_coins: res.star_coins } : null);
      }
      fetchOverviewStats();
    } catch (err: any) {
      showToast(`星币调整失败: ${err.message}`, 'error');
    } finally {
      setIsAdjustingCoins(false);
    }
  };

  // 打开阶段调整弹窗
  const handleOpenStageModal = (member: MemberItem) => {
    setStageTargetUser(member);
    setNewStageId(member.active_stage || 1);
    setUnlockPrevious(true);
    setIsStageModalOpen(true);
  };

  // 提交阶段调整
  const handleConfirmUpdateStage = async () => {
    if (!stageTargetUser) return;
    setIsUpdatingStage(true);
    try {
      const res = await api.updateMemberStage(stageTargetUser._openid, newStageId, unlockPrevious);
      const stageName = STAGE_THEMES[newStageId]?.name || '启蒙阶段';
      showToast(`已成功将学员切换至「${stageName}」！`, 'success');
      setIsStageModalOpen(false);
      setList((prev) =>
        prev.map((item) =>
          item._openid === stageTargetUser._openid
            ? { ...item, active_stage: res.active_stage, stage_name: stageName }
            : item
        )
      );
      if (selectedMember && selectedMember._openid === stageTargetUser._openid) {
        setSelectedMember((prev) =>
          prev ? { ...prev, active_stage: res.active_stage, stage_name: stageName } : null
        );
      }
      fetchOverviewStats();
    } catch (err: any) {
      showToast(`阶段变更失败: ${err.message}`, 'error');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // 一键同步演示测试数据
  const handleSeedMockData = async () => {
    if (!window.confirm('是否同步/初始化一组演示学员数据到数据库？这将方便您快速测试各阶段与学情指标。')) {
      return;
    }
    setIsSeeding(true);
    try {
      const res = await api.seedMockMemberData();
      showToast(`初始化完成！已同步 ${res.seeded_count} 名测试学员数据`, 'success');
      fetchOverviewStats();
      fetchMemberList(1);
    } catch (err: any) {
      showToast(`数据同步失败: ${err.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // 计算趋势图 SVG 坐标
  const renderTrendSvg = () => {
    if (!stats || !stats.trend30Days || stats.trend30Days.length === 0) return null;
    const data = stats.trend30Days;
    const width = 640;
    const height = 180;
    const paddingX = 35;
    const paddingY = 25;

    const maxVal = Math.max(...data.map((d) => Math.max(d.activeUsers, d.newUsers, d.checkins, 10)), 12);
    const stepX = (width - paddingX * 2) / (data.length - 1);

    const getX = (i: number) => paddingX + i * stepX;
    const getY = (val: number) => height - paddingY - (val / maxVal) * (height - paddingY * 2);

    const activePoints = data.map((d, i) => `${getX(i)},${getY(d.activeUsers)}`).join(' ');
    const newPoints = data.map((d, i) => `${getX(i)},${getY(d.newUsers)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        {/* 背景辅助网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = height - paddingY - pct * (height - paddingY * 2);
          const v = Math.round(pct * maxVal);
          return (
            <g key={idx}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x={paddingX - 6} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                {v}
              </text>
            </g>
          );
        })}

        {/* 打卡人数柱状图 */}
        {data.map((d, i) => {
          const x = getX(i) - 4;
          const barHeight = (d.checkins / maxVal) * (height - paddingY * 2);
          const y = height - paddingY - barHeight;
          return (
            <rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={8}
              height={Math.max(2, barHeight)}
              rx={2}
              className="fill-amber-400/50 hover:fill-amber-500 transition-colors"
            >
              <title>{`${d.date}: 打卡 ${d.checkins} 人次`}</title>
            </rect>
          );
        })}

        {/* 活跃学员折线 */}
        <polyline
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={activePoints}
        />

        {/* 新增学员折线 */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={newPoints}
        />

        {/* 关键节点圆点 */}
        {data.map((d, i) => {
          if (i % 5 !== 0 && i !== data.length - 1) return null;
          return (
            <g key={`pt-${i}`}>
              <circle cx={getX(i)} cy={getY(d.activeUsers)} r="3" className="fill-sky-500 stroke-white stroke-2" />
              <text
                x={getX(i)}
                y={height - 6}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {d.date}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 顶部标题栏操作区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>会员与学情成长数据看板</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                全免费生态
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              全量学员识字进度、打卡留存、阶梯进阶与爱心星币资产大盘
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchOverviewStats();
              fetchMemberList(1);
            }}
            disabled={loadingStats || loadingList}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="刷新看板全部数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingList ? 'animate-spin text-amber-500' : ''}`} />
            <span>刷新数据</span>
          </button>

          <button
            onClick={handleSeedMockData}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
            title="一键在数据库生成测试学员样本"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isSeeding ? '同步中...' : '同步测试学员'}</span>
          </button>
        </div>
      </div>

      {/* 模块一：核心学员与活跃 KPI 大盘 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. 累计注册学员 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">累计注册学员</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {loadingStats ? '--' : stats?.totalMembers || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">人</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <span>基础学习盘</span>
          </div>
        </div>

        {/* 2. 今日新增学员 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">今日新增学员</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {loadingStats ? '--' : `+${stats?.todayNewMembers || 0}`}
            <span className="text-xs font-normal text-emerald-700 ml-1">人</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-700/80">今日启蒙入驻</div>
        </div>

        {/* 3. 今日活跃学员 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">今日活跃 (DAU)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {loadingStats ? '--' : stats?.activeToday || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">人</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            近7天活跃: <span className="font-bold text-slate-700">{stats?.active7Days || 0}</span>
          </div>
        </div>

        {/* 4. 今日打卡完成率 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">今日打卡完成率</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 tracking-tight">
            {loadingStats ? '--' : `${stats?.checkinRate || 0}%`}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">活跃学员打卡比</div>
        </div>

        {/* 5. 爱心星币总池 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">全站星币总池</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {loadingStats ? '--' : (stats?.totalStarCoins || 0).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">⭐</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">
            人均持币: <span className="font-bold text-slate-700">{stats?.avgStarCoins || 0}</span>
          </div>
        </div>

        {/* 6. 沉睡学员预警 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">沉睡学员 (&gt;14天)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
            {loadingStats ? '--' : stats?.sleepingMembers || 0}
            <span className="text-xs font-normal text-rose-700 ml-1">人</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">待召回提醒</div>
        </div>
      </div>

      {/* 模块二与三：近30天走势图 + 阶段分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 2 栏：30 天活跃与打卡走势 */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-500" />
                <span>近 30 天学员活跃与学习打卡走势</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                每日新增学员、活跃会话与打卡完成人次趋势
              </p>
            </div>
            {/* 图例 */}
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                活跃学员
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                新增注册
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                打卡人次
              </span>
            </div>
          </div>

          {/* SVG 趋势图 */}
          <div className="pt-2">
            {loadingStats ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                正在加载趋势图...
              </div>
            ) : (
              renderTrendSvg()
            )}
          </div>
        </div>

        {/* 右侧 1 栏：4 大分级阶段学员分布 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>4 大阶段学员进阶分布</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">学员所处字库阶段比重</p>
          </div>

          <div className="space-y-3 pt-1">
            {stats?.stageDistribution.map((st) => (
              <div key={st.stage_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.stage_name}
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {st.count} 人{' '}
                    <span className="text-[11px] font-normal text-slate-400">({st.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, st.percent)}%`, backgroundColor: st.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 模块四：汉字掌握梯队 + 连续打卡分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. 汉字掌握梯队分层 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>汉字掌握量梯队分层</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">全站小朋友识字规模进阶分布</p>
          </div>

          <div className="space-y-3 pt-1">
            {stats?.masteryTiers.map((tier, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{tier.tier}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tier.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black font-mono text-slate-900">{tier.count} 人</div>
                  <div className="text-[10px] font-bold text-emerald-600">{tier.percent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 连续打卡天数分布 (Streak) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>学员打卡粘性分布 (Streak)</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">习惯养成阶段与核心留存</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {stats?.streakDistribution.map((streak, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-20 font-bold text-slate-600 flex-shrink-0">{streak.label}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(3, streak.percent)}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono font-bold text-slate-700">
                  {streak.count}人 <span className="text-[10px] text-slate-400 font-normal">({streak.percent}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 模块五：学员全景档案与运营管理表格 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>全量学员档案与精细运营</span>
              <span className="text-xs font-mono font-normal text-slate-400">共 {total} 名学员</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              可根据昵称、OpenID检索，或按阶段和活跃状态筛选，支持星币增减与阶段跳转
            </p>
          </div>

          {/* 筛选与搜索 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 搜索框 */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索昵称或 OpenID..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* 阶段筛选 */}
            <select
              value={selectedStage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedStage(val);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">全阶段</option>
              <option value="1">启蒙阶段</option>
              <option value="2">初级阶段</option>
              <option value="3">中级阶段</option>
              <option value="4">高级阶段</option>
            </select>

            {/* 活跃状态筛选 */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">全状态</option>
              <option value="today_active">今日活跃</option>
              <option value="active_7d">近7日活跃</option>
              <option value="sleeping">沉睡学员(&gt;14天)</option>
            </select>
          </div>
        </div>

        {/* 表格区 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3">学员信息</th>
                <th className="py-2.5 px-3">当前学习阶段</th>
                <th className="py-2.5 px-3">识字量与掌握</th>
                <th className="py-2.5 px-3">打卡与粘性</th>
                <th className="py-2.5 px-3">爱心星币</th>
                <th className="py-2.5 px-3">状态与最近活跃</th>
                <th className="py-2.5 px-3 text-right">运营管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                    正在拉取学员列表...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    未找到符合条件的学员
                  </td>
                </tr>
              ) : (
                list.map((member) => {
                  const stageTheme = STAGE_THEMES[member.active_stage] || STAGE_THEMES[1];
                  return (
                    <tr key={member._openid} className="hover:bg-slate-50/70 transition-colors">
                      {/* 学员信息 */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.nickname}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs shadow-xs">
                              {member.nickname.slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{member.nickname}</span>
                              {member.badges_count > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                  <Award className="w-2.5 h-2.5" />
                                  {member.badges_count}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{member._openid.slice(0, 14)}...</span>
                              <button
                                onClick={() => handleCopyOpenId(member._openid)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                title="复制完整 OpenID"
                              >
                                {copiedOpenId === member._openid ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 学习阶段 */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${stageTheme.bg} ${stageTheme.text} ${stageTheme.border}`}
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{stageTheme.name}</span>
                        </span>
                      </td>

                      {/* 识字量与掌握 */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span>{member.total_learned_chars}</span>
                            <span className="text-[10px] text-slate-400 font-normal">字已学</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-emerald-600">{member.mastered_chars_count}</span>
                            <span className="text-[10px] text-slate-400 font-normal">字精通</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${
                                  member.total_learned_chars > 0
                                    ? Math.min(100, (member.mastered_chars_count / member.total_learned_chars) * 100)
                                    : 0
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 打卡与粘性 */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-bold text-orange-600">
                            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                            <span>{member.current_streak}</span>
                            <span className="text-[10px] font-normal text-slate-400">天连胜</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (累计{member.checkin_days}天)
                          </span>
                        </div>
                      </td>

                      {/* 爱心星币 */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-lg text-xs">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{member.star_coins}</span>
                        </div>
                      </td>

                      {/* 状态与最近活跃 */}
                      <td className="py-3 px-3">
                        <div>
                          {member.status === 'new' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              今日萌新
                            </span>
                          ) : member.status === 'sleeping' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              沉睡学员
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              活跃中
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {member.last_login_at.slice(0, 10)}
                          </div>
                        </div>
                      </td>

                      {/* 操作 */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(member)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="查看学员学情画像抽屉"
                          >
                            画像
                          </button>
                          <button
                            onClick={() => handleOpenCoinModal(member)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            title="增减或发放爱心星币"
                          >
                            发星币
                          </button>
                          <button
                            onClick={() => handleOpenStageModal(member)}
                            className="px-2.5 py-1 text-xs font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                            title="调整学习阶段"
                          >
                            调阶段
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制 */}
        {total > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div>
              显示第 {(page - 1) * pageSize + 1} 至 {Math.min(page * pageSize, total)} 条，共 {total} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-bold cursor-pointer"
              >
                上一页
              </button>
              <span className="font-mono font-bold text-slate-700">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-bold cursor-pointer"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 弹窗一：学员学情画像全景抽屉 */}
      {isDetailDrawerOpen && selectedMember && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {selectedMember.avatar_url ? (
                    <img
                      src={selectedMember.avatar_url}
                      alt={selectedMember.nickname}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-black flex items-center justify-center text-base shadow-md">
                      {selectedMember.nickname.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>{selectedMember.nickname}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        ⭐ {selectedMember.star_coins} 星币
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      OpenID: {selectedMember._openid}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 核心成长摘要 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[11px] text-slate-400 font-bold">累计打卡</div>
                  <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                    {selectedMember.checkin_days}
                    <span className="text-[10px] font-normal text-slate-400 ml-0.5">天</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[11px] text-slate-400 font-bold">当前连胜</div>
                  <div className="text-lg font-black font-mono text-orange-600 mt-0.5">
                    {selectedMember.current_streak}
                    <span className="text-[10px] font-normal text-slate-400 ml-0.5">天</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[11px] text-slate-400 font-bold">易错字数</div>
                  <div className="text-lg font-black font-mono text-rose-600 mt-0.5">
                    {memberDetail?.mistakes_count ?? 0}
                    <span className="text-[10px] font-normal text-slate-400 ml-0.5">字</span>
                  </div>
                </div>
              </div>

              {/* 4 大阶段进阶掌握度明细 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>4 大阶段识字进阶画像</span>
                </h4>

                <div className="space-y-2.5">
                  {memberDetail?.stage_mastery?.map((sm) => {
                    const theme = STAGE_THEMES[sm.stage_id];
                    return (
                      <div
                        key={sm.stage_id}
                        className={`p-3 rounded-xl border transition-all ${
                          sm.is_unlocked
                            ? 'bg-white border-slate-200/80 shadow-xs'
                            : 'bg-slate-50/60 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span className={`w-2 h-2 rounded-full ${theme.bar}`} />
                            <span>{sm.stage_name}</span>
                            {!sm.is_unlocked && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-normal">
                                未解锁
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500">
                            已学 <span className="font-bold text-slate-800">{sm.learned_count}</span> / {sm.total_chars} 字
                          </span>
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${theme.bar} rounded-full transition-all`}
                            style={{ width: `${Math.min(100, (sm.learned_count / sm.total_chars) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 最近 30 天打卡足迹 */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>最近打卡足迹 (近 30 天打卡记录)</span>
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {memberDetail?.recent_checkins && memberDetail.recent_checkins.length > 0 ? (
                      memberDetail.recent_checkins.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold"
                        >
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">近期暂无打卡数据</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 获得成就勋章 */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>点亮的成长勋章</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {memberDetail?.unlocked_badges && Object.keys(memberDetail.unlocked_badges).length > 0 ? (
                    Object.keys(memberDetail.unlocked_badges).map((badgeKey) => (
                      <span
                        key={badgeKey}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {badgeKey === 'streak_3'
                          ? '坚持打卡 3 天'
                          : badgeKey === 'streak_7'
                          ? '打卡周冠军 7 天'
                          : badgeKey === 'stage_1_pass'
                          ? '启蒙通关勇士'
                          : badgeKey}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">暂无解锁勋章</span>
                  )}
                </div>
              </div>
            </div>

            {/* 抽屉底部快捷操作 */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  handleOpenCoinModal(selectedMember);
                }}
                className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
              >
                发放爱心星币
              </button>
              <button
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  handleOpenStageModal(selectedMember);
                }}
                className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
              >
                调整学习阶段
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗二：爱心星币发放 / 增减弹窗 */}
      {isCoinModalOpen && coinTargetUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">调整学员爱心星币</h3>
                  <p className="text-[11px] text-slate-400">学员: {coinTargetUser.nickname}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCoinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span className="text-amber-800">当前持有星币</span>
              <span className="font-mono text-base text-amber-600">⭐ {coinTargetUser.star_coins}</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">快捷增减预设</label>
              <div className="grid grid-cols-4 gap-2">
                {[+20, +50, +100, -20].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCoinDelta(val)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      coinDelta === val
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">自定义调整额度 (负数扣减)</label>
              <input
                type="number"
                value={coinDelta}
                onChange={(e) => setCoinDelta(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">调整备注说明</label>
              <input
                type="text"
                value={coinNote}
                onChange={(e) => setCoinNote(e.target.value)}
                placeholder="例如：积极识字打卡奖励、客服关怀补发"
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCoinModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isAdjustingCoins}
                onClick={handleConfirmAdjustCoins}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAdjustingCoins ? '正在保存...' : '确认调整'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗三：学习阶段调整 / 解锁弹窗 */}
      {isStageModalOpen && stageTargetUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">调整学员学习阶段</h3>
                  <p className="text-[11px] text-slate-400">学员: {stageTargetUser.nickname}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">目标学习阶段</label>
              <div className="space-y-2">
                {[
                  { id: 1, name: '启蒙阶段', desc: '适合 2.5-4 岁，极简象形生活基础字' },
                  { id: 2, name: '初级阶段', desc: '适合 4-5 岁，日常高频常用字' },
                  { id: 3, name: '中级阶段', desc: '适合 5-6 岁，幼小衔接核心生字' },
                  { id: 4, name: '高级阶段', desc: '适合 6 岁以上，学前拔高与小学预备生字' }
                ].map((st) => (
                  <label
                    key={st.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      newStageId === st.id
                        ? 'bg-purple-50/70 border-purple-300 text-purple-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stageSelect"
                      checked={newStageId === st.id}
                      onChange={() => setNewStageId(st.id)}
                      className="mt-0.5 accent-purple-600"
                    />
                    <div>
                      <div className="text-xs font-bold">{st.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={unlockPrevious}
                  onChange={(e) => setUnlockPrevious(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>同时解锁之前的所有前置阶段</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isUpdatingStage}
                onClick={handleConfirmUpdateStage}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdatingStage ? '正在保存...' : '确认切换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
