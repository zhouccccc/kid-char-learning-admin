import React from 'react';
import { BarChart3, Crown, MessageSquare, Construction, ArrowLeft } from 'lucide-react';
import { PageKey } from '../types';
import { useAdmin } from '../context/AdminContext';

interface PlaceholderPageProps {
  pageKey: PageKey;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ pageKey }) => {
  const { setActivePage } = useAdmin();

  const getDetails = () => {
    switch (pageKey) {
      case 'analytics':
        return {
          title: '学情数据看板',
          icon: <BarChart3 className="w-10 h-10 text-blue-500" />,
          desc: '聚合全量儿童识字学情：打卡留存趋势、各阶段字数掌握分布、高频易错汉字排行及艾宾浩斯复习完成率。',
          tags: ['每日打卡留存', '汉字掌握等级(0~4)', '高频错题词热力榜']
        };
      case 'memberships':
        return {
          title: '会员商业化管理',
          icon: <Crown className="w-10 h-10 text-amber-500" />,
          desc: '管理超级 VIP 权益与 5 项独立功能会员（语音私教、错题攻坚、极速竞技、阶梯字库跳选、勋章秘籍）的订单与开通状态。',
          tags: ['微信支付云调用', '单项特权鉴权', '限时体验试用期']
        };
      case 'feedback':
        return {
          title: '用户工单与客服',
          icon: <MessageSquare className="w-10 h-10 text-emerald-500" />,
          desc: '接收并处理家长提交的 5 大类问题反馈（功能异常、建议、汉字纠错、会员疑问等），提供客服答复与消息回执。',
          tags: ['文本敏感词过滤', '客服一键答复', '10星币奖励自动下发']
        };
      default:
        return {
          title: '功能建设中',
          icon: <Construction className="w-10 h-10 text-slate-400" />,
          desc: '该业务模块正在规划落地中，敬请期待。',
          tags: []
        };
    }
  };

  const details = getDetails();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner">
        {details.icon}
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-lg font-black text-slate-900">{details.title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{details.desc}</p>
      </div>

      {details.tags.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm mx-auto">
          {details.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={() => setActivePage('chars')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回字库管理</span>
        </button>
      </div>
    </div>
  );
};
