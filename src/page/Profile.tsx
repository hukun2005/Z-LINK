import { useCallback, useEffect, useState } from "react"
import { Button, Tag, Spin, Empty, Card, message } from "antd"
import {
  BellOutlined,
  CheckCircleOutlined,
  NotificationOutlined,
  FileTextOutlined,
} from "@ant-design/icons"
import Header from "../shared/Header"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../api/notifications"
import type { Notification } from "../api/notifications"

const TYPE_META: Record<string, { color: string; icon: React.ReactNode }> = {
  system: { color: "blue", icon: <NotificationOutlined /> },
  requirement: { color: "orange", icon: <FileTextOutlined /> },
  match: { color: "green", icon: <CheckCircleOutlined /> },
}

const Profile = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await getNotifications()
      setNotifications(res.data)
      setUnread(res.unread)
    } catch {
      /* 拦截器已提示 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRead = async (id: number) => {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnread((u) => Math.max(0, u - 1))
    } catch {
      message.error("操作失败")
    }
  }

  const handleReadAll = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnread(0)
      message.success("已全部标记为已读")
    } catch {
      message.error("操作失败")
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-32 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <BellOutlined className="text-blue-500" />
              消息推送中心
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {unread > 0 ? `你有 ${unread} 条未读消息` : "所有消息已查看"}
            </p>
          </div>
          {unread > 0 && (
            <Button type="primary" size="small" onClick={handleReadAll}>
              全部已读
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin tip="加载中..." />
          </div>
        ) : notifications.length === 0 ? (
          <Card bordered={false} className="shadow-sm">
            <Empty description="暂无消息" />
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system
              return (
                <div
                  key={n.id}
                  className={`rounded-xl p-4 transition-all cursor-pointer border ${
                    n.is_read
                      ? "bg-white border-gray-100"
                      : "bg-blue-50/50 border-blue-200 hover:shadow-md"
                  }`}
                  onClick={() => !n.is_read && handleRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white bg-${meta.color}-500`}
                      style={{
                        background:
                          meta.color === "blue"
                            ? "#3b82f6"
                            : meta.color === "orange"
                            ? "#f97316"
                            : "#22c55e",
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm ${
                              n.is_read
                                ? "font-normal text-gray-600"
                                : "font-semibold text-gray-900"
                            }`}
                          >
                            {n.title}
                          </h3>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {n.created_at}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {n.content}
                      </p>
                      <Tag
                        color={meta.color}
                        className="text-[10px] mt-2 m-0"
                      >
                        {n.type === "system"
                          ? "系统通知"
                          : n.type === "requirement"
                          ? "需求动态"
                          : "匹配结果"}
                      </Tag>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

export default Profile
