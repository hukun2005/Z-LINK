import { get } from "../utils/https/request"

export function getSuppliers(params?: any) {
  return get("/suppliers", params)
}