import Header from "../shared/Header"
import { Link } from "react-router-dom"
const Home=()=>{
    return(<>
        <Header/>
        <main className="px-6 pt-32 pb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          已有 2,400+ 企业通过 AI 找到供应商
        </div>

        <h1 className="text-4xl md:text-5xl font-medium text-[var(--zlink-text-primary)] leading-tight tracking-tight mb-4">
          像聊天一样发布采购需求
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-sky-600 to-red-300">AI 帮你精准匹配厂家</span>
        </h1>

        <p className="text-lg text-[var(--zlink-text-tertiary)] max-w-xl mx-auto mb-10 leading-relaxed">
          不用填繁琐的表单，直接告诉 AI 你要什么。智链采自动理解你的需求，从千家工厂中筛选出最合适的供应商。
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/assistant" className="px-7 py-3 rounded-xl bg-[var(--zlink-text-primary)] text-[var(--zlink-bg-canvas)] text-[15px] font-medium hover:opacity-85 transition-opacity">
            立即体验 AI 对话
          </Link>
          <Link to="/companies" className="px-7 py-3 rounded-xl border border-[var(--zlink-border)] text-[var(--zlink-text-primary)] text-[15px] font-medium hover:bg-[var(--zlink-bg-surface-muted)] transition-colors">
            查看供应商库
          </Link>
        </div>

        <div  className="px-6 py-16 bg-[var(--zlink-bg-surface-muted)]">
             <h2 className="text-2xl md:text-3xl font-medium text-[var(--zlink-text-primary)] text-center mb-12">
          三步完成采购
        </h2>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-4 bg-[var(--zlink-bg-surface)] border border-[var(--zlink-border)]">
              💬
            </div>
            <h3 className="text-base font-medium text-[var(--zlink-text-primary)] mb-2">1. 告诉 AI 你的需求</h3>
            <p className="text-sm text-[var(--zlink-text-tertiary)] leading-relaxed">
              像聊天一样描述你要采购的产品，AI 自动理解规格、数量、用途等关键信息。
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-4 bg-[var(--zlink-bg-surface)] border border-[var(--zlink-border)]">
              ⚡
            </div>
            <h3 className="text-base font-medium text-[var(--zlink-text-primary)] mb-2">2. 秒级智能匹配</h3>
            <p className="text-sm text-[var(--zlink-text-tertiary)] leading-relaxed">
              系统从千家认证工厂中，基于产品、规格、交货期等多维度精准筛选供应商。
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-4 bg-[var(--zlink-bg-surface)] border border-[var(--zlink-border)]">
              📩
            </div>
            <h3 className="text-base font-medium text-[var(--zlink-text-primary)] mb-2">3. 接收报价与推送</h3>
            <p className="text-sm text-[var(--zlink-text-tertiary)] leading-relaxed">
              匹配结果实时推送，供应商主动报价，你只需选择最合适的合作方。
            </p>
          </div>
        </div>
        </div>
        </main>
        </>
    )
}
export default Home