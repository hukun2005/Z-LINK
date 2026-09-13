import { Container } from "../shared/Container"
import Logo from "../assets/Logo.png"
import { NavLink } from "react-router-dom"

const Header=()=>{
    return(
    <header className="absolute inset-x-0 top-0 z-50 py-6 bg-linear-to-r from-sky-500 to-violet-500">
        <Container>
           <div className="w-full flex justify-between gap-6 relative">
                <div className="min-w-max inline-flex relative">
                    <div className="relative flex items-center gap-3">
                         <img src={Logo} className="w-10 h-10" alt="logo" />
                         <div className="text-lg font-semibold text-heading-1">
                            智链采Z-Link
                         </div>
                    </div>
        <div className="flex flex-col lg:flex-row w-full lg:justify-between lg:items-center 
                 absolute top-full left-0 lg:static lg:top-0  
                 lg:bg-transparent border-x border-x-box-border lg:border-x-0 lg:h-auto h-0 overflow-hidden">
            <div className="border-t border-box-border lg:border-t-0 px-6 lg:px-0 
                                pt-6 lg:pt-0 flex flex-col lg:flex-row gap-y-4 gap-x-3 text-lg 
                                text-heading-2 w-full lg:justify-center lg:items-center">     
               <div className="duration-300 font-medium ease-linear hover:text-primary py-3">
                <NavLink to="/" end className={({ isActive }) => (isActive ? ' text-violet-500 mx-4' : 'mx-4')}>
                        首页
                </NavLink>   
                <NavLink to="/assistant"  className={({ isActive }) => (isActive ? ' text-violet-500 mx-4' : 'mx-4')}>AI助手</NavLink>
                <NavLink to="/publish"  className={({ isActive }) => (isActive ? ' text-violet-500 mx-4' : 'mx-4')}>发布需求</NavLink>
                <NavLink to="/companies"  className={({ isActive }) => (isActive ? ' text-violet-500 mx-4' : 'mx-4')}>供应商</NavLink>
                <NavLink to="/profile" className={({ isActive }) => (isActive ? ' text-violet-500 mx-4' : 'mx-4')}>推送通知中心</NavLink>
               </div>
            </div>
        </div>
                </div> 
            </div>
        </Container>   
     
    </header>)
}
export default Header