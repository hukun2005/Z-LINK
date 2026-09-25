import Header from "../../shared/Header";
import { Link } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import { useCompanyAI } from "./function/UseAi";
import type { MatchResult } from "./function/UseAi";

const SUGGESTIONS = [
  "想找一家做精密机加工的供应商，要能通过 IATF16949 认证",
  "推荐做液压系统的企业，用于工程机械",
  "有没有擅长五轴加工、能做钛合金零件的厂家？",
  "找一家能做电镀和阳极氧化表面处理的工厂",
];

/** 匹配卡片 */
function MatchCard({ match }: { match: MatchResult }) {
  const pct = Math.min(Math.max(match.score, 0), 1) * 100;
  return (
    <Link to="/companies">
      <div className="border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50/60 hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">{match.company.name}</h3>
          <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
            {(match.score * 100).toFixed(1)}%
          </span>
        </div>
        {/* 匹配度进度条 */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">主营：{match.company.product}</p>
        <p className="text-xs text-gray-700 mt-1 line-clamp-2">{match.company.describe}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {match.company.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 text-gray-500 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

/** 头像 */
function Avatar({ role }: { role: "user" | "assistant" }) {
  return role === "user" ? (
    <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">我</div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-linear-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm shrink-0">AI</div>
  );
}

export default function CompanyMatcher() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    messages, sendMessage, stopStreaming, clearMessages,
    isReady, isGenerating, status, error, modelName,
  } = useCompanyAI();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !isReady || isGenerating) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (status === "error") {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center h-125 bg-white rounded-xl border shadow-sm mt-30 max-w-3xl mx-auto">
          <div className="text-center px-6">
            <p className="text-lg font-medium text-red-500">后端连接失败</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex flex-col h-175 w-full max-w-3xl mx-auto border rounded-2xl shadow-lg bg-white overflow-hidden mt-30">
        {/* 头部 */}
        <div className="px-5 py-3.5 border-b bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">🏢 AI 企业匹配助手</h2>
            <p className="text-xs text-blue-100 mt-0.5">语义检索 + 本地大模型 · {modelName || "Mistral-Nemo"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isReady ? "bg-green-300 animate-pulse" : "bg-yellow-300 animate-ping"}`} />
              <span className="text-xs text-blue-50">{isReady ? "就绪" : "连接中"}</span>
            </div>
            <button
              onClick={clearMessages}
              className="text-xs px-2.5 py-1 rounded-md bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              清空对话
            </button>
          </div>
        </div>

        {/* 消息区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/60">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-16 space-y-4">
              <p className="text-3xl">👋</p>
              <p className="text-base font-medium text-gray-600">告诉我你的需求，我来匹配公司</p>
              <div className="flex flex-col items-center gap-2 mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-sm text-gray-500 bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all max-w-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar role={msg.role} />
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-tr-sm"
                  : "bg-white border border-gray-100 shadow-sm rounded-tl-sm text-gray-800"
              }`}>
                {msg.role === "assistant" && msg.matches && msg.matches.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      语义匹配结果 · Top {msg.matches.length}
                    </p>
                    {msg.matches.map((match) => (
                      <MatchCard key={match.company.id} match={match} />
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content || (msg.isStreaming ? "" : "…")}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle rounded-sm" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 输入区 */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="描述你的需求,Enter 发送,Shift+Enter 换行..."
            className="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 resize-none"
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="px-5 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              停止
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isReady || !input.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              发送
            </button>
          )}
        </form>
      </div>
    </>
  );
}