import RequireAuth from "../utils/RequireAuth";
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
const Login=lazy(()=>import("../page/Login/Login"))
const Home=lazy(()=>import("../page/Home"))
const NotFound=lazy(()=>import("../page/NotFound"))
const Assistant=lazy(()=>import("../page/assistant/Assistant"))
const Companies=lazy(()=>import("../page/Companies"))
const Profile=lazy(()=>import("../page/Profile"))
const Publish=lazy(()=>import("../page/Publish"))
const routes=createBrowserRouter([
    {
    path: "/",
    element: <RequireAuth allowed={true} redirectTo="/login">
      <Home/>
    </RequireAuth>
  },
  {
    path: "/login",
    element: <RequireAuth allowed={false} redirectTo="/"><Login/></RequireAuth>
  },
  {
    path: "*",
    element: <NotFound/>,
  },
  {
    path: "/assistant",
    element: <RequireAuth allowed={true} redirectTo="/login">
      <Assistant/>
      </RequireAuth>,
  },
  {
    path: "/profile",
    element:<RequireAuth allowed={true} redirectTo="/login"><Profile/></RequireAuth> ,
  },
  {
    path: "/publish",
    element:<RequireAuth allowed={true} redirectTo="/login"><Publish/></RequireAuth> ,
  },
  {
    path: "/companies",
    element: <RequireAuth allowed={true} redirectTo="/login"><Companies/></RequireAuth>,
  },
])
export default routes