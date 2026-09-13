import {post} from "../utils/https/request"


export function getSuppliers(data: any){
    return post("/suppliers", data)
}