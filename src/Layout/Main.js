import React, { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../Images/Gvi-logo.png";
import BottomBar from "../Component/BottomBar";

const Main = () => {
  const { pathname } = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div>
      <div className="flex top-0 justify-between items-center p-4 bg-[#ffffff]">
        <Link to="/">
          {" "}
          <img className="w-[60px]" src={logo} alt="" />
        </Link>
        <Link to="/profile" className="flex items-center gap-2">
          <p className="font-bold">{user?.name}</p>
          <svg
            className="w-[32px] border border-black p-1 rounded-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
          </svg>
        </Link>
      </div>
      <Outlet></Outlet>
      {pathname.includes("/admin") || <BottomBar />}
    </div>
  );
};

export default Main;
