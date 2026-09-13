import {post} from "../utils/https/request"

interface LoginResponse {
    username: string;
    password: string;
}


export function login(data: LoginResponse){
    return post("/login", data)
} 