import { get, post, patch } from "../utils/https/request"

export interface Notification {
  id: number
  type: string
  title: string
  content: string
  is_read: boolean
  created_at: string
}

/** 获取通知列表（含未读数） */
export function getNotifications() {
  return get("/notifications")
}

/** 标记单条已读 */
export function markAsRead(id: number) {
  return patch(`/notifications/${id}/read`)
}

/** 全部已读 */
export function markAllAsRead() {
  return post("/notifications/read-all")
}
