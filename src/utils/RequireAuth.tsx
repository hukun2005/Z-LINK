import {useSelector} from "react-redux"
import {useEffect} from "react"
import { useNavigate } from "react-router-dom";
import React from "react";
interface Iprops{
    allowed: boolean;
    redirectTo: string;
    children: React.ReactNode;
}

function RequireAuth({allowed, redirectTo, children}: Iprops){
    const navigate=useNavigate()
  const {token}=useSelector((state:any)=>state.authSlice)
const isLoading=token?true:false
useEffect(()=>{
    if(allowed!==isLoading){
        navigate(redirectTo)
    }
},[allowed,isLoading,redirectTo])

return allowed===isLoading?<>{children}</>:<></>
}
export default RequireAuth