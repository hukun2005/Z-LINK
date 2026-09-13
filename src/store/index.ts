import { configureStore } from "@reduxjs/toolkit";
import  authSlice  from "./login/index";

export  const store = configureStore({
    reducer: {
            authSlice
           
    }
})
