import { get, post } from "../utils/https/request"

export interface Requirement {
  id: number
  title: string
  category: string
  description: string
  quantity: number | null
  unit: string | null
  budget: number | null
  deadline: string | null
  qualifications: string[]
  contact: string
  phone: string
  publisher: string
  status: string
  created_at: string
}

export interface RequirementForm {
  title: string
  category: string
  description: string
  quantity?: number
  unit?: string
  budget?: number
  deadline?: string
  qualifications?: string[]
  contact: string
  phone: string
}

/** 发布采购需求 */
export function publishRequirement(data: RequirementForm) {
  return post("/requirements", data)
}

/** 获取已发布需求列表 */
export function getRequirements() {
  return get("/requirements")
}
