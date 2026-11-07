import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  BookOpen,
  GraduationCap,
  Flame,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  X,
  ChevronRight,
  Eye,
  Info,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import {
  AnalyticsAlertItem,
  AnalyticsFilterParams,
  AnalyticsOverviewKPIs,
  AnalyticsTimeRange,
  EbbinghausRetentionRound,
  EbbinghausReviewStats,
  EbbinghausTrendPoint,
  HourlyActivityPoint,
  LearningAnalyticsData,
  LearningHabitStats,
  StageProgressionItem,
  ToughCharItem
} from '../types';
import { useAdmin } from '../context/AdminContext';

const STAGE_CONFIGS: Record<number, { name: string; age: string; color: string; badgeBg: string; text: string }> = {
  1: { name: '启蒙阶段', age: '2.5-4岁', color: '#f59e0b', badgeBg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  2: { name: '初级阶段', age: '4-5岁', color: '#10b981', badgeBg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  3: { name: '中级阶段', age: '5-6岁', color: '#0ea5e9', badgeBg: 'bg-sky-50 border-sky-200', text: 'text-sky-700' },
  4: { name: '高级阶段', age: '6岁以上', color: '#8b5cf6', badgeBg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' }
};

export const LearningAnalyticsPage: React.FC = () => {
  const { showToast } = useAdmin();

  // 1. 过滤状态
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 2. 学情聚合数据
  const [data, setData] = useState<LearningAnalyticsData | null>(null);

  // 3. 错字榜筛选与搜索
  const [toughCategoryFilter, setToughCategoryFilter] = useState<string>('all');
  const [toughSearchKeyword, setToughSearchKeyword] = useState<string>('');

  // 4. 错字下钻弹窗
  const [selectedToughChar, setSelectedToughChar] = useState<ToughCharItem | null>(null);

  // 5. 导出菜单下拉状态
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // 加载数据
  const fetchAnalytics = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params: AnalyticsFilterParams = {
          timeRange,
          stageId: selectedStage
        };
        const res = await api.getLearningAnalytics(params);
        setData(res);
        if (isManualRefresh) {
          showToast('学情数据已成功刷新！', 'success');
        }
      } catch (err: any) {
        console.warn('获取学情数据失败:', err);
        showToast('获取学情数据异常，已展示教学基准模型', 'info');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange, selectedStage, showToast]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // 过滤后的高频错字列表
  const filteredToughChars = useMemo(() => {
    if (!data?.toughChars) return [];
    let list = data.toughChars;

    if (toughCategoryFilter !== 'all') {
      list = list.filter((item) => item.mistake_category === toughCategoryFilter);
    }

    if (toughSearchKeyword.trim()) {
      const kw = toughSearchKeyword.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.char_text.toLowerCase().includes(kw) ||
          item.pinyin.toLowerCase().includes(kw) ||
          item.stage_name.toLowerCase().includes(kw)
      );
    }

    return list;
  }, [data?.toughChars, toughCategoryFilter, toughSearchKeyword]);

  // 导出 CSV 报表 1：学情综合概览报表
  const handleExportComprehensiveReport = () => {
    if (!data) return;
    setIsExportMenuOpen(false);

    const rows: string[][] = [
      ['识字小达人 - 全网儿童学情综合分析月报'],
      ['统计周期', timeRange === 'today' ? '今日' : timeRange === '7d' ? '近7天' : timeRange === '30d' ? '近30天' : '全部历史'],
      ['导出时间', new Date().toLocaleString()],
      [''],
      ['【核心学情指标】', '数值', '行业基准/环比'],
      ['累计认字总量 (人次)', String(data.kpis.totalLearnedCount), `+${data.kpis.totalLearnedGrowth}%`],
      ['人均掌握汉字量 (字/人)', String(data.kpis.avgCharsPerUser), `+${data.kpis.avgCharsGrowth}%`],
      ['今日新学字次', String(data.kpis.todayNewChars), `在学儿童: ${data.kpis.todayLearnersCount}人`],
      ['艾宾浩斯复习遵循率', `${data.kpis.ebbinghausReviewRate}%`, `环比: +${data.kpis.ebbinghausReviewRateDiff}%`],
      ['全网测验综合正确率', `${data.kpis.quizAccuracyRate}%`, `环比: +${data.kpis.quizAccuracyDiff}%`],
      ['每日人均学习时长', `${data.kpis.avgStudyDurationMin} 分钟`, '建议保持10~15分钟'],
      ['单字平均学习耗时', `${data.kpis.avgCharLearnSec} 秒`, '正常区间: 35~50秒'],
      ['手写描红临摹完成率', `${data.kpis.handwriteFinishRate}%`, '书写认知坚持度'],
      [''],
      ['【四大阶段字库推进情况】', '字库总字数', '在学学员数', '完课率', '完课中位天数', '未学字数(Level 0)', '初识(Level 1)', '熟悉(Level 2)', '完全掌握(Level 3)'],
      ...data.stages.map((st) => [
        st.stage_name,
        String(st.total_chars),
        String(st.active_learners),
        `${st.completion_rate}%`,
        `${st.median_days_to_complete}天`,
        String(st.level0_count),
        String(st.level1_count),
        String(st.level2_count),
        String(st.level3_count)
      ]),
      [''],
      ['【艾宾浩斯遗忘曲线多轮复习留存】', '复习周期', '记忆留存率', '测验样本量', '健康状态评估'],
      ...data.ebbinghaus.retentionMatrix.map((r) => [
        r.label,
        r.interval,
        `${r.retentionRate}%`,
        String(r.sampleCount),
        r.status === 'optimal' ? '优异' : r.status === 'normal' ? '正常' : '需重点关注'
      ])
    ];

    const csvContent = '\uFEFF' + rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `识字小达人_学情综合报表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('学情综合分析报表导出成功！', 'success');
  };

  // 导出 CSV 报表 2：高频易错字教研攻坚清单
  const handleExportToughCharsReport = () => {
    if (!data) return;
    setIsExportMenuOpen(false);

    const rows: string[][] = [
      ['高频易错汉字教研攻坚清单与错因归因分析'],
      ['生成时间', new Date().toLocaleString()],
      ['当前筛选阶段', selectedStage === 'all' ? '全部阶段' : STAGE_CONFIGS[selectedStage]?.name || ''],
      [''],
      ['排名', '汉字', '拼音', '所属阶段', '笔画数', '测验人次', '做错人次', '错误率', '错因归因', '常见混淆字', '教研优化建议'],
      ...data.toughChars.map((c, idx) => [
        String(idx + 1),
        c.char_text,
        c.pinyin,
        c.stage_name,
        String(c.strokes),
        String(c.total_attempts),
        String(c.wrong_count),
        `${c.error_rate}%`,
        c.mistake_category_label,
        c.common_confusions.join('、'),
        c.teaching_suggestion
      ])
    ];

    const csvContent = '\uFEFF' + rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `识字小达人_高频错字教研清单_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('高频错字教研清单导出成功！', 'success');
  };

  // 渲染艾宾浩斯复习双轴趋势 SVG
  const renderEbbinghausTrendSvg = (trendData: EbbinghausTrendPoint[]) => {
    if (!trendData || trendData.length === 0) return null;
    const width = 640;
    const height = 180;
    const padX = 40;
    const padY = 25;

    const maxDue = Math.max(...trendData.map((d) => d.dueCount), 50);
    const stepX = (width - padX * 2) / (trendData.length - 1 || 1);

    const getX = (i: number) => padX + i * stepX;
    const getYDue = (val: number) => height - padY - (val / maxDue) * (height - padY * 2);
    const getYRate = (rate: number) => height - padY - (rate / 100) * (height - padY * 2);

    const ratePoints = trendData.map((d, i) => `${getX(i)},${getYRate(d.rate)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        {/* 背景辅助线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = height - padY - pct * (height - padY * 2);
          const vLeft = Math.round(pct * maxDue);
          const vRight = Math.round(pct * 100);
          return (
            <g key={idx}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x={padX - 6} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                {vLeft}
              </text>
              <text x={width - padX + 6} y={y + 3} textAnchor="start" className="text-[9px] fill-emerald-500 font-mono">
                {vRight}%
              </text>
            </g>
          );
        })}

        {/* 应复习字数柱形 (灰蓝背景柱) */}
        {trendData.map((d, i) => {
          const x = getX(i) - 6;
          const barHeight = (d.dueCount / maxDue) * (height - padY * 2);
          const y = height - padY - barHeight;
          return (
            <rect
              key={`due-${i}`}
              x={x}
              y={y}
              width={12}
              height={Math.max(2, barHeight)}
              rx={3}
              className="fill-slate-200/80 hover:fill-slate-300 transition-colors"
            >
              <title>{`${d.date} 应复习: ${d.dueCount}字`}</title>
            </rect>
          );
        })}

        {/* 实际复习字数柱形 (主色柱) */}
        {trendData.map((d, i) => {
          const x = getX(i) - 4;
          const barHeight = (d.reviewedCount / maxDue) * (height - padY * 2);
          const y = height - padY - barHeight;
          return (
            <rect
              key={`rev-${i}`}
              x={x}
              y={y}
              width={8}
              height={Math.max(2, barHeight)}
              rx={2}
              className="fill-amber-500/90 hover:fill-amber-600 transition-colors"
            >
              <title>{`${d.date} 实际复习: ${d.reviewedCount}字 (达成率: ${d.rate}%)`}</title>
            </rect>
          );
        })}

        {/* 达成率折线 */}
        <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={ratePoints} />

        {/* 折线数据圆点 */}
        {trendData.map((d, i) => (
          <circle
            key={`dot-${i}`}
            cx={getX(i)}
            cy={getYRate(d.rate)}
            r={3}
            className="fill-white stroke-emerald-500 stroke-2 hover:r-4 transition-all cursor-pointer"
          >
            <title>{`${d.date} 复习遵循率: ${d.rate}%`}</title>
          </circle>
        ))}

        {/* X 轴日期刻度 */}
        {trendData.map((d, i) => {
          if (trendData.length > 15 && i % 4 !== 0 && i !== trendData.length - 1) return null;
          return (
            <text key={`txt-${i}`} x={getX(i)} y={height - 6} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
              {d.date}
            </text>
          );
        })}
      </svg>
    );
  };

  // 渲染 24 小时活跃时段分布柱状图
  const renderHourlyDistributionSvg = (hours: HourlyActivityPoint[]) => {
    if (!hours || hours.length === 0) return null;
    const width = 640;
    const height = 140;
    const padX = 20;
    const padY = 20;

    const maxCount = Math.max(...hours.map((h) => h.activity_count), 20);
    const colWidth = (width - padX * 2) / 24;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
        {/* 背景虚线 */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = height - padY - pct * (height - padY * 2);
          return <line key={idx} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />;
        })}

        {/* 24 小时各柱子 */}
        {hours.map((h, i) => {
          const x = padX + i * colWidth + 2;
          const barW = Math.max(colWidth - 4, 4);
          const barH = (h.activity_count / maxCount) * (height - padY * 2);
          const y = height - padY - barH;

          return (
            <g key={`hour-${i}`} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(3, barH)}
                rx={2}
                className={
                  h.is_peak
                    ? 'fill-amber-500 hover:fill-amber-600 transition-colors shadow-sm'
                    : 'fill-slate-300 hover:fill-slate-400 transition-colors'
                }
              >
                <title>{`${h.hour_label} 活跃学习: ${h.activity_count}人次 ${h.is_peak ? '(晚间高峰)' : ''}`}</title>
              </rect>
              {/* 每隔 3 小时标注一次标签 */}
              {h.hour % 3 === 0 && (
                <text x={x + barW / 2} y={height - 4} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
                  {h.hour}:00
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 顶部主标题与综合控制器栏 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* 左侧标题与概括 */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">学情数据看板</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  全网大数据教研分析
                </span>
                {data && (
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    更新时间: {new Date(data.updated_at).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                监控四大阶梯字库掌握深度、艾宾浩斯记忆留存、全网高频错字攻坚榜与儿童学习行为习惯
              </p>
            </div>
          </div>

          {/* 右侧过滤器与动作组 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 时间范围切换 */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-600">
              {(
                [
                  { key: 'today', label: '今日' },
                  { key: '7d', label: '近7天' },
                  { key: '30d', label: '近30天' },
                  { key: 'all', label: '全部' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTimeRange(tab.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeRange === tab.key ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 阶梯阶段快速选择 */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer outline-none focus:border-blue-500"
            >
              <option value="all">全部阶段字库</option>
              <option value="1">阶段 1: 启蒙阶段 (2.5-4岁)</option>
              <option value="2">阶段 2: 初级阶段 (4-5岁)</option>
              <option value="3">阶段 3: 中级阶段 (5-6岁)</option>
              <option value="4">阶段 4: 高级阶段 (6岁+)</option>
            </select>

            {/* 刷新数据按钮 */}
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="刷新最新学情"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>刷新</span>
            </button>

            {/* 报表导出下拉菜单 */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出报表</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={handleExportComprehensiveReport}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>导出学情综合分析报表</div>
                      <div className="text-[10px] text-slate-400 font-normal">含KPI、四大阶段与复习留存</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportToughCharsReport}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer border-t border-slate-100"
                  >
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <div>
                      <div>导出高频错字教研清单</div>
                      <div className="text-[10px] text-slate-400 font-normal">全网高频错题与教学优化建议</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 学情预警横幅栏 (Alerts Banner) */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border text-xs gap-3 ${
                alert.level === 'danger'
                  ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                  : alert.level === 'warning'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : 'bg-blue-50/90 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    alert.level === 'danger' ? 'text-rose-600' : alert.level === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`}
                />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{alert.title}</span>
                    {alert.affected_count && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/70 font-mono font-bold">
                        影响样本: {alert.affected_count}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">{alert.message}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                <span className="text-[11px] font-semibold bg-white/60 px-2.5 py-1 rounded-lg border border-black/5">
                  💡 建议: {alert.suggestion}
                </span>
                {alert.char_id && (
                  <button
                    onClick={() => {
                      const found = data.toughChars.find((c) => c.id === alert.char_id);
                      if (found) setSelectedToughChar(found);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-lg font-bold text-[11px] border border-black/10 shadow-xs cursor-pointer transition-colors"
                  >
                    查看汉字
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 模块 1：六大核心学情指标卡 (Macro KPIs Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 卡片 1: 累计识字人次 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">累计认字总量</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {data ? data.kpis.totalLearnedCount.toLocaleString() : '--'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <span className="text-emerald-600 font-bold flex items-center">
              +{data ? data.kpis.totalLearnedGrowth : 0}%
            </span>
            <span className="truncate">人均 {data ? data.kpis.avgCharsPerUser : '--'} 字</span>
          </div>
        </div>

        {/* 卡片 2: 今日新学字次 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">今日新学字次</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
            {data ? data.kpis.todayNewChars : '--'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <span className="font-bold text-slate-700">{data ? data.kpis.todayLearnersCount : 0}</span>
            <span>位学员今日在学</span>
          </div>
        </div>

        {/* 卡片 3: 艾宾浩斯复习遵循率 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">复习遵循率</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight font-mono">
            {data ? `${data.kpis.ebbinghausReviewRate}%` : '--'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <span className="text-emerald-600 font-bold">+{data ? data.kpis.ebbinghausReviewRateDiff : 0}%</span>
            <span>按时闭环复习</span>
          </div>
        </div>

        {/* 卡片 4: 全网测验综合正确率 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">测验综合正确率</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight font-mono">
            {data ? `${data.kpis.quizAccuracyRate}%` : '--'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <span className="text-emerald-600 font-bold">+{data ? data.kpis.quizAccuracyDiff : 0}%</span>
            <span>测验与消消乐</span>
          </div>
        </div>

        {/* 卡片 5: 人均每日学习时长 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">每日人均时长</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {data ? `${data.kpis.avgStudyDurationMin}m` : '--'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <span>单字耗时</span>
            <span className="font-bold text-slate-700">{data ? `${data.kpis.avgCharLearnSec}s` : '--'}</span>
          </div>
        </div>

        {/* 卡片 6: 手写描红临摹完成率 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">手写临摹率</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight font-mono">
            {data ? `${data.kpis.handwriteFinishRate}%` : '--'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <span>第四步描红书写</span>
          </div>
        </div>
      </div>

      {/* 模块 2：四大阶梯字库推进漏斗与掌握深度分布 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 tracking-tight">四大阶梯字库推进漏斗与掌握深度分布</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              各阶段学员在读推进分布，以及汉字掌握等级（Level 0未学 / Level 1初识 / Level 2熟悉 / Level 3完全掌握）堆叠透视
            </p>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
              <span>Level 0 未学</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span>Level 1 初识入门</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
              <span>Level 2 基本熟悉</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Level 3 牢固掌握</span>
            </div>
          </div>
        </div>

        {/* 阶段卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.stages.map((stage) => {
            const conf = STAGE_CONFIGS[stage.stage_id] || STAGE_CONFIGS[1];
            const sumChars = stage.total_chars || 1;
            const p0 = Math.round((stage.level0_count / sumChars) * 100);
            const p1 = Math.round((stage.level1_count / sumChars) * 100);
            const p2 = Math.round((stage.level2_count / sumChars) * 100);
            const p3 = Math.max(0, 100 - p0 - p1 - p2);

            return (
              <div
                key={stage.stage_id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3.5"
              >
                {/* 头部阶段名与目标年龄 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.color }} />
                    <span className="text-xs font-black text-slate-800">{stage.stage_name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${conf.badgeBg} ${conf.text}`}>
                    {stage.target_age}
                  </span>
                </div>

                {/* 关键推进指标 */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">字库体量</div>
                    <div className="text-xs font-black text-slate-800 font-mono mt-0.5">{stage.total_chars}字</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">在学学员</div>
                    <div className="text-xs font-black text-blue-600 font-mono mt-0.5">{stage.active_learners}人</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">完课率</div>
                    <div className="text-xs font-black text-emerald-600 font-mono mt-0.5">{stage.completion_rate}%</div>
                  </div>
                </div>

                {/* 堆叠掌握进度条 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>字库掌握深度</span>
                    <span className="font-mono">已掌握 {stage.level3_count} / {stage.total_chars}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${p3}%` }} className="h-full bg-emerald-500" title={`Level 3 完全掌握: ${stage.level3_count}字 (${p3}%)`} />
                    <div style={{ width: `${p2}%` }} className="h-full bg-sky-500" title={`Level 2 基本熟悉: ${stage.level2_count}字 (${p2}%)`} />
                    <div style={{ width: `${p1}%` }} className="h-full bg-amber-400" title={`Level 1 初识入门: ${stage.level1_count}字 (${p1}%)`} />
                    <div style={{ width: `${p0}%` }} className="h-full bg-slate-200" title={`Level 0 未学: ${stage.level0_count}字 (${p0}%)`} />
                  </div>
                </div>

                {/* 完课中位数天数 & 瓶颈预警 */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>完课中位数: <b className="font-mono text-slate-700">{stage.median_days_to_complete}天</b></span>
                  {stage.bottleneck_alert && (
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1" title={stage.bottleneck_alert}>
                      <AlertTriangle className="w-3 h-3" />
                      <span>教研提示</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 模块 3：艾宾浩斯复习闭环监控与多轮记忆留存 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 2 栏：30 天应复习 vs 实际复习双轴趋势图 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black text-slate-900 tracking-tight">艾宾浩斯复习计划达成度趋势</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">每日应复习字数 (灰蓝柱) vs 实际复习字数 (橙黄柱) 与复习遵循率 (绿折线)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> 应复习
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> 实际复习
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-500" /> 达成率 %
              </span>
            </div>
          </div>

          {/* SVG 趋势走势 */}
          {data ? renderEbbinghausTrendSvg(data.ebbinghaus.trend30Days) : <div className="h-44 flex items-center justify-center text-slate-400">加载趋势数据...</div>}

          {/* 艾宾浩斯核心宏观指标 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 font-bold">晋级Level 3平均轮次</div>
              <div className="text-base font-black text-slate-800 font-mono mt-0.5">{data?.ebbinghaus.avgRoundsToMaster || 4.2} 轮</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 font-bold">完全掌握平均天数</div>
              <div className="text-base font-black text-slate-800 font-mono mt-0.5">{data?.ebbinghaus.avgDaysToMaster || 18.5} 天</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 font-bold">全网待复习字字池</div>
              <div className="text-base font-black text-blue-600 font-mono mt-0.5">{data?.ebbinghaus.pendingReviewCharsCount || 0} 字</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-center">
              <div className="text-[10px] text-rose-500 font-bold">临界遗忘池 (&gt;7天)</div>
              <div className="text-base font-black text-rose-600 font-mono mt-0.5">{data?.ebbinghaus.criticalAtRiskCharsCount || 0} 字</div>
            </div>
          </div>
        </div>

        {/* 右侧 1 栏：五轮艾宾浩斯复习记忆留存矩阵 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-black text-slate-900 tracking-tight">五轮复习记忆留存矩阵</h2>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              统计各轮复习后的测验正答留存率，监控遗忘衰减曲线是否符合认知科学规律
            </p>

            {/* 留存轮次列表 */}
            <div className="space-y-3 mt-4">
              {data?.ebbinghaus.retentionMatrix.map((item) => (
                <div key={item.round} className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.label}</span>
                    <span className="font-mono font-black text-emerald-600">{item.retentionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.retentionRate}%` }}
                      className={`h-full rounded-full ${
                        item.retentionRate >= 85
                          ? 'bg-emerald-500'
                          : item.retentionRate >= 75
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>周期: {item.interval}</span>
                    <span>样本: {item.sampleCount} 人次</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 遗忘干预小贴士 */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              <b>教研提示</b>：第 4~5 轮复习（第 7~15 天）是儿童产生长期记忆的关键窗口，若留存率跌破 70%，建议缩短复习间隔。
            </div>
          </div>
        </div>
      </div>

      {/* 模块 4：全网高频易错字排行榜与认知难点攻坚 (教研重点) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-black text-slate-900 tracking-tight">全网高频易错汉字排行榜与认知难点攻坚</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              点击具体汉字可下钻查看详尽教学错因归类（形近字、笔画复杂、音近混淆）与教研优化方案
            </p>
          </div>

          {/* 分类过滤器与搜索框 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 分类 Tag */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              {[
                { key: 'all', label: '全部易错字' },
                { key: 'shape', label: '形近混淆' },
                { key: 'strokes', label: '笔画繁复' },
                { key: 'meaning', label: '音近字义' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setToughCategoryFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    toughCategoryFilter === tab.key ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索错字或拼音..."
                value={toughSearchKeyword}
                onChange={(e) => setToughSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-colors w-40"
              />
            </div>
          </div>
        </div>

        {/* 错字列表表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                <th className="py-2.5 px-3 w-14">排名</th>
                <th className="py-2.5 px-3">汉字与拼音</th>
                <th className="py-2.5 px-3">所属阶段</th>
                <th className="py-2.5 px-3">笔画</th>
                <th className="py-2.5 px-3">测验样本</th>
                <th className="py-2.5 px-3">做错人次</th>
                <th className="py-2.5 px-3">错误率</th>
                <th className="py-2.5 px-3">错误归因</th>
                <th className="py-2.5 px-3">常见干扰混淆项</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredToughChars.length > 0 ? (
                filteredToughChars.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedToughChar(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* 排名徽章 */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-black ${
                          idx === 0
                            ? 'bg-amber-500 text-white shadow-xs'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                            ? 'bg-amber-700/80 text-white'
                            : 'bg-slate-100 text-slate-500 font-mono'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* 汉字与拼音 */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center text-lg font-black shadow-xs group-hover:scale-105 transition-transform">
                          {item.char_text}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 font-mono">{item.pinyin}</div>
                          <div className="text-[10px] text-slate-400">单字ID: {item.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* 阶段 */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.stage_name}
                      </span>
                    </td>

                    {/* 笔画 */}
                    <td className="py-3 px-3 font-mono text-slate-600">{item.strokes} 画</td>

                    {/* 测验人次 */}
                    <td className="py-3 px-3 font-mono text-slate-600">{item.total_attempts}</td>

                    {/* 做错人次 */}
                    <td className="py-3 px-3 font-mono font-bold text-rose-600">{item.wrong_count}</td>

                    {/* 错误率 */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-rose-600">{item.error_rate}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${item.error_rate}%` }} className="h-full bg-rose-500 rounded-full" />
                        </div>
                      </div>
                    </td>

                    {/* 错误归因 */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.mistake_category === 'shape'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.mistake_category === 'strokes'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {item.mistake_category_label}
                      </span>
                    </td>

                    {/* 常见混淆干扰项 */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.common_confusions.map((c) => (
                          <span
                            key={c}
                            className="w-5 h-5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black inline-flex items-center justify-center"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 操作按钮 */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedToughChar(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>教研下钻</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    未找到符合条件的易错汉字
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 模块 5：儿童学习习惯与 24 小时活跃时段画像 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 2 栏：24 小时学情活跃分布 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-black text-slate-900 tracking-tight">24小时亲子共读时段热力分布</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">识别家庭启蒙高峰时段，为推送学习打卡提醒（订阅消息）提供黄金时间参考</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
              ✨ 黄金期: {data?.habits.peakPeriodLabel || '19:30 - 21:00'}
            </span>
          </div>

          {/* 24 小时柱图 */}
          {data ? renderHourlyDistributionSvg(data.habits.hourlyDistribution) : <div className="h-32 flex items-center justify-center text-slate-400">加载时段数据...</div>}

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>🌅 早幼教早高峰: 08:00 - 09:30</span>
            <span>🌙 晚间睡前识字高峰: 19:30 - 21:00 (橙黄高亮)</span>
          </div>
        </div>

        {/* 右侧 1 栏：学习模式偏好与反应敏捷度 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 tracking-tight">学习模式偏好与答题敏捷度</h2>
            <p className="text-xs text-slate-500 mt-0.5">对比计划学与随心学、答题耗时反应分层</p>
          </div>

          {/* 计划学 vs 随心学 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>计划学习模式 ({data?.habits.planModeUsersPercent || 64}%)</span>
              <span className="text-emerald-600 font-mono">完课率 {data?.habits.planModeCompletionRate || 83.5}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${data?.habits.planModeUsersPercent || 64}%` }} className="h-full bg-blue-600" />
              <div style={{ width: `${data?.habits.freeModeUsersPercent || 36}%` }} className="h-full bg-slate-300" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>随心自由学 ({data?.habits.freeModeUsersPercent || 36}%)</span>
              <span>完课率 {data?.habits.freeModeCompletionRate || 59.2}%</span>
            </div>
          </div>

          {/* 答题反应耗时分布 */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700">测验答题敏捷度分布</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-[10px] text-emerald-700 font-bold">秒答 (&lt;2秒)</div>
                <div className="text-sm font-black text-emerald-800 font-mono mt-0.5">
                  {data?.habits.responseSpeedBreakdown.quickPercent || 58}%
                </div>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-[10px] text-blue-700 font-bold">思考 (2-6秒)</div>
                <div className="text-sm font-black text-blue-800 font-mono mt-0.5">
                  {data?.habits.responseSpeedBreakdown.thinkingPercent || 31}%
                </div>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-[10px] text-amber-700 font-bold">犹豫 (&gt;6秒)</div>
                <div className="text-sm font-black text-amber-800 font-mono mt-0.5">
                  {data?.habits.responseSpeedBreakdown.hesitantPercent || 11}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 错字教研下钻弹窗 (Char Drill-Down Modal) */}
      {selectedToughChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">汉字教研下钻与认知归因</h3>
              </div>
              <button
                onClick={() => setSelectedToughChar(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 汉字卡片主视觉 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl font-black text-amber-400 shadow-inner">
                {selectedToughChar.char_text}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-wide font-mono">{selectedToughChar.pinyin}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20">
                    {selectedToughChar.stage_name}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  笔画数: {selectedToughChar.strokes} 画 | 错误率:{' '}
                  <b className="text-rose-400 font-mono">{selectedToughChar.error_rate}%</b>
                </div>
              </div>
            </div>

            {/* 错题数据指标 */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold">测验总做题</div>
                <div className="text-sm font-black text-slate-800 font-mono mt-0.5">{selectedToughChar.total_attempts}次</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <div className="text-[10px] text-rose-500 font-bold">做错学员人次</div>
                <div className="text-sm font-black text-rose-600 font-mono mt-0.5">{selectedToughChar.wrong_count}人</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-[10px] text-amber-700 font-bold">错因归因</div>
                <div className="text-sm font-black text-amber-800 mt-0.5">{selectedToughChar.mistake_category_label}</div>
              </div>
            </div>

            {/* 常见混淆干扰字 */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">全网学员做错时的常见混淆选型：</div>
              <div className="flex items-center gap-2">
                {selectedToughChar.common_confusions.map((ch) => (
                  <div
                    key={ch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold"
                  >
                    <span className="w-5 h-5 rounded bg-rose-200 text-rose-900 inline-flex items-center justify-center font-black">
                      {ch}
                    </span>
                    <span>高频误选项</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 教研优化建议 */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 space-y-1">
              <div className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>教研团队优化建议</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">{selectedToughChar.teaching_suggestion}</p>
            </div>

            {/* 底部按钮 */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedToughChar(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                我知道了，返回学情看板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
