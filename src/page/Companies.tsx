import { useCallback, useEffect, useMemo, useState } from "react"
import { Input, Tag, Spin, Empty, Card } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import Header from "../shared/Header"
import { getSuppliers } from "../api/suppliers"
import type { Supplier } from "../api/suppliers"

const Companies = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await getSuppliers()
      setSuppliers(res.data)
    } catch {
      /* 拦截器已提示 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  // 收集所有标签（去重 + 按出现频率排序）
  const allTags = useMemo(() => {
    const freq: Record<string, number> = {}
    suppliers.forEach((s) => {
      s.tags.forEach((t) => {
        freq[t] = (freq[t] || 0) + 1
      })
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map((e) => e[0])
  }, [suppliers])

  // 过滤后的供应商
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return suppliers.filter((s) => {
      const matchKw =
        !kw ||
        s.name.toLowerCase().includes(kw) ||
        s.product.toLowerCase().includes(kw) ||
        s.describe.toLowerCase().includes(kw) ||
        s.tags.some((t) => t.toLowerCase().includes(kw))
      const matchTag =
        activeTags.length === 0 || activeTags.every((t) => s.tags.includes(t))
      return matchKw && matchTag
    })
  }, [suppliers, keyword, activeTags])

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">供应商列表</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {suppliers.length} 家认证供应商，支持按名称、产品、标签搜索
          </p>
        </div>

        {/* 搜索栏 */}
        <div className="mb-4">
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="搜索供应商名称、产品、描述或标签..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.slice(0, 20).map((tag) => (
              <Tag
                key={tag}
                color={activeTags.includes(tag) ? "blue" : "default"}
                className="cursor-pointer text-sm px-2 py-0.5"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Tag>
            ))}
            {activeTags.length > 0 && (
              <Tag
                className="cursor-pointer text-sm px-2 py-0.5"
                onClick={() => setActiveTags([])}
              >
                清除筛选
              </Tag>
            )}
          </div>
        )}

        {/* 结果计数 */}
        <div className="text-xs text-gray-400 mb-3">
          {filtered.length === suppliers.length
            ? `显示全部 ${filtered.length} 家`
            : `筛选结果：${filtered.length} / ${suppliers.length} 家`}
        </div>

        {/* 供应商卡片 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin tip="加载中..." />
          </div>
        ) : filtered.length === 0 ? (
          <Card bordered={false} className="shadow-sm">
            <Empty description="没有匹配的供应商" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="border border-gray-100 rounded-xl p-5 bg-white hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <span className="text-xs text-gray-300 shrink-0">
                    #{String(s.id).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">
                  {s.describe}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="text-xs text-gray-400 mb-1">主营产品</div>
                  <p className="text-sm text-gray-700">{s.product}</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {s.tags.map((t) => (
                    <Tag
                      key={t}
                      className="text-[10px] m-0 cursor-pointer"
                      color={activeTags.includes(t) ? "blue" : "default"}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default Companies
