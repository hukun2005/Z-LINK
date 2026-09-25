import { get } from "../utils/https/request"

export interface Supplier {
  id: number
  name: string
  describe: string
  product: string
  tags: string[]
}

/** 获取供应商列表 */
export function getSuppliers() {
  return get("/suppliers")
}
