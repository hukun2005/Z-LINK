import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { message } from "ant-design-vue";
import { pinia } from "../../store/index";
import { useAuthStore } from "../../store/login/index";
const http: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000
})

// 添加请求拦截器
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore(pinia)
    const { token } = authStore
    if (token) {
        //Authorization专门用来携带认证信息
        //Bearer是认证类型，后面跟着token是一个令牌
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

//添加响应拦截器
http.interceptors.response.use((response: AxiosResponse) => {
    const res = response.data
    if (res.code != 200) {
        message.error(res.code + ":" + res.message)
        return Promise.reject(new Error(res.message))
    }
    return response.data
})

export default http