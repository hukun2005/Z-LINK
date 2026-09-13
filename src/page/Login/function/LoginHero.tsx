import React from 'react';

/**
 * LoginHero - 智链采登录页动态插图
 * 
 * 纯 SVG + Tailwind CSS 实现，零图片依赖。
 * 展示 "需求方 → AI 智能中枢 → 供应方" 核心链路。
 * 
 * 使用方式：
 * <LoginHero className="w-full max-w-lg" />
 */
interface LoginHeroProps {
  className?: string;
}

const LoginHero: React.FC<LoginHeroProps> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-sky-300 ${className}`}>
      {/* 背景层 */}
      <div className="absolute inset-0 bg-linear-to-br from-sky-300 via-sky-200 to-sky-300" />

      {/* 网格底纹 */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* SVG 主场景 */}
      <svg
        className="relative z-10 w-full h-auto"
        viewBox="0 0 400 420"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* 渐变定义 */}
          <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>

          {/* 发光滤镜 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 连接线 */}
        <path d="M80,200 C160,120 240,280 320,200" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.5" />
        <path d="M80,200 C140,260 260,140 320,200" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.5" />
        <path d="M80,200 C180,180 220,220 320,200" fill="none" stroke="#334155" strokeWidth="1.5" opacity="0.5" />

        {/* 流动数据粒子 */}
        <circle className="data-particle" r="2.5" fill="#60a5fa" filter="url(#glow)" />
        <circle className="data-particle p2" r="2" fill="#22d3ee" filter="url(#glow)" />
        <circle className="data-particle p3" r="2" fill="#a78bfa" filter="url(#glow)" />

        {/* 左侧节点：需求方 */}
        <g className="node-group left" transform="translate(80,200)">
         
        </g>

        {/* 右侧节点：供应方 */}
        <g className="node-group right" transform="translate(320,200)">
         
        </g>

        {/* 中心节点：AI 智能中枢 */}
        <g className="node-group center" transform="translate(200,200)">
        </g>

       

        {/* 标签文字 */}
        <text className="hero-label l1" x="80" y="255" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">需求方</text>
        <text className="hero-label l2" x="200" y="255" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="500">AI 智能中枢</text>
        <text className="hero-label l3" x="320" y="255" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="500">供应方</text>
        <text className="hero-label l4" x="200" y="380" textAnchor="middle" fill="#475569" fontSize="12" letterSpacing="0.1em">
          AI 问答采集 · 智能精准匹配 · 实时推送触达
        </text>
      </svg>

      {/* 动画样式（SVG 动画无法直接用 Tailwind 实现） */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ring-expand {
          0% { r: 0; opacity: 0.6; }
          100% { r: 28; opacity: 0; }
        }
        @keyframes node-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes data-flow-1 {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes data-flow-2 {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes data-flow-3 {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .node-group {
          animation: node-breathe 3s ease-in-out infinite;
          transform-origin: center;
        }
        .node-group.left { animation-delay: 0s; }
        .node-group.center { animation-delay: 0.5s; }
        .node-group.right { animation-delay: 1s; }

        .data-particle {
          offset-path: path('M80,200 C160,120 240,280 320,200');
          animation: data-flow-1 3s linear infinite;
        }
        .data-particle.p2 {
          offset-path: path('M80,200 C140,260 260,140 320,200');
          animation-name: data-flow-2;
          animation-delay: 1s;
        }
        .data-particle.p3 {
          offset-path: path('M80,200 C180,180 220,220 320,200');
          animation-name: data-flow-3;
          animation-delay: 2s;
        }

        .ring { animation: ring-expand 2.5s ease-out infinite; }
        .ring.r2 { animation-delay: 0.8s; }

        .floating-card { animation: float 4s ease-in-out infinite; }
        .floating-card.c1 { animation-delay: 0s; }
        .floating-card.c2 { animation-delay: 1.3s; }
        .floating-card.c3 { animation-delay: 2.6s; }

        .hero-label {
          animation: fade-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .hero-label.l1 { animation-delay: 0.3s; }
        .hero-label.l2 { animation-delay: 0.6s; }
        .hero-label.l3 { animation-delay: 0.9s; }
        .hero-label.l4 { animation-delay: 1.2s; }
      `}</style>
    </div>
  );
};

export default LoginHero;