 import http from "./http";
 interface ResponseData {
    code:number;
    message:string;
    data:any;
 }
export function get(url: string, params?: any):Promise<ResponseData> {
 return http.get(url,{params})
}

export function post(url: string, data?: any):Promise<ResponseData> {
 return http.post(url, data)
}

export function patch(url: string, data?: any):Promise<ResponseData> {
 return http.patch(url, data)
}