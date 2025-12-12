import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white text-sm py-2 shadow-sm relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        
        {/* --- LEFT: PROMOTION (Ẩn trên mobile) --- */}
        <div className="hidden md:flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-default">
          <div className="bg-yellow-400 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-sm">
            HOT
          </div>
          <span className="font-medium tracking-wide">
            Giảm giá lên đến <span className="text-yellow-400 font-bold">35%</span> cho đơn hàng đầu tiên
          </span>
        </div>

        {/* --- RIGHT: ACTIONS --- */}
        <div className="flex items-center gap-x-4 w-full md:w-auto justify-between md:justify-end">
          
          {/* Link 1: Tìm chi nhánh */}
          <Link
            to="/"
            className="flex items-center gap-x-2 hover:text-yellow-400 transition-colors duration-200 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <span>Tìm cửa hàng</span>
          </Link>

          {/* Separator (Dấu gạch đứng ngăn cách) */}
          <div className="h-4 w-[1px] bg-blue-500/50 hidden md:block"></div>

          {/* Link 2: Tải ứng dụng */}
          <Link
            to="/"
            className="flex items-center gap-x-2 hover:text-yellow-400 transition-colors duration-200 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
            <span>Tải ứng dụng</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;