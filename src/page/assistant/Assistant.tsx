import Header from "../../shared/Header"
import { Link } from "react-router-dom";


import React, { useState, useRef, useEffect } from 'react';
import {useCompanyAI} from './function/UseAi'
import type{ MatchResult} from './function/UseAi'

/** 公司匹配卡片 */
function MatchCard({ match }: { match: MatchResult }) {
  return (
  <Link to="/companies">
   

    <div className="border rounded-lg p-3 mb-2 bg-white shadow-sm hover:shadow-md transition-shadow cursor-default">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-bold text-gray-900 text-sm">{match.company.name}</h3>
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
          匹配度 {(match.score * 100).toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{match.company.product}</p>
      <p className="text-xs text-gray-700 mt-1.5 line-clamp-2">{match.company.describe}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {match.company.tags.map((tag) => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
    </Link>
  );
}

export default function CompanyMatcher() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isReady, status, progress, error } = useCompanyAI();

  // 自动滚动
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isReady) return;
    sendMessage(input.trim());
    setInput('');
  };

  // 加载中状态
  if (!isReady && status !== 'error') {
    return (
    


      <div className="flex flex-col items-center justify-center h-125 gap-4 bg-white rounded-xl border shadow-sm">
        <div className="w-72 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 font-medium">
          {status === 'loading-embedder' && '正在加载语义理解模型...'}
          {status === 'loading-llm' && '正在加载对话模型...'}
          {status === 'indexing' && '正在建立企业索引...'}
        </p>
        <p className="text-xs text-gray-400">首次加载约 450MB,之后从浏览器缓存读取</p>
      </div>
    );
  }

  // 错误状态
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-125 bg-white rounded-xl border shadow-sm">
        <div className="text-center px-6">
          <p className="text-lg font-medium text-red-500">初始化失败</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>1. 请使用 Chrome 126+ 或 Edge 126+</p>
            <p>2. 确保显卡驱动已更新 WebGPU 需要</p>
            <p>3. 检查网络是否能访问 HuggingFace / MLC 模型仓库</p>
          </div>
        </div>
      </div>
    );
  }

  return (<>
    <Header />
    <div className="flex flex-col h-175 w-full max-w-3xl mx-auto  border rounded-xl shadow-lg bg-gray-50 overflow-hidden mt-30">
      {/* 头部 */}
      <div className="px-5 py-3 border-b bg-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">🏢 AI 企业匹配助手</h2>
          <p className="text-xs text-gray-500">纯前端运行 · 语义匹配 + 本地大模型</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">模型就绪</span>
        </div>
      </div>

      {/* 消息区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-24 space-y-3">
            <p className="text-2xl">👋</p>
            <p className="text-base font-medium">告诉我你的需求，我来匹配公司</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-400">"想找一家人工智能公司做视觉识别"</p>
              <p className="text-gray-400">"推荐新能源汽车产业链上的公司"</p>
              <p className="text-gray-400">"做芯片设计的硬科技企业有哪些"</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {/* AI 消息：先展示匹配卡片 */}
              {msg.role === 'assistant' && msg.matches && msg.matches.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    语义匹配结果
                  </p>
                  {msg.matches.map((match) => (
                    <MatchCard key={match.company.id} match={match} />
                  ))}
                </div>
              )}

              {/* 文本内容 */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle rounded-sm" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述你的需求，例如：想找做 AI 芯片的公司..."
          className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
        />
        <button
          type="submit"
          disabled={!isReady || !input.trim()}
          className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors"
        >
          发送
        </button>
      </form>
    </div>
    </>
  );
}