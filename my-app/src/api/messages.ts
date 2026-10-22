import { get, post } from "../utils/https/request"

export interface Message {
  id: number
  contact: string
  role: "me" | "them"
  content: string
  is_read: boolean
  created_at: string
}

export interface Contact {
  contact: string
  last_content: string
  last_role: "me" | "them"
  last_time: string
  unread: number
}

/** 联系人列表（最后消息+未读数） */
export function getContacts() {
  return get("/messages/contacts")
}

/** 与某联系人的对话记录 */
export function getMessages(contact: string) {
  return get("/messages", { contact })
}

/** 发送消息（对方会自动回复） */
export function sendMessage(contact: string, content: string) {
  return post("/messages", { contact, content })
}

/** 标记某联系人的消息已读 */
export function readContact(contact: string) {
  return post("/messages/contact/read", { contact })
}
