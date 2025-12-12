import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // 1. Import Redux Hooks
import { logout } from "../../redux/auth/userSlice";   // 2. Import action logout

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 3. Lấy thông tin user từ Redux Store
  const { current } = useSelector((state) => state.user);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // Chuyển về trang chủ
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white text-sm py-2 shadow-sm relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        
        {/* --- LEFT: PROMOTION (Ẩn trên mobile để đỡ chật) --- */}
        <div className="hidden lg:flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-default">
          <div className="bg-yellow-400 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-sm">
            HOT
          </div>
          <span className="font-medium tracking-wide">
            Giảm <span className="text-yellow-400 font-bold">35%</span> cho đơn đầu tiên
          </span>
        </div>

        {/* --- RIGHT: ACTIONS & USER INFO --- */}
        <div className="flex items-center gap-x-4 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Link: Tìm cửa hàng (Giữ nguyên) */}
          <Link to="/" className="hidden md:flex items-center gap-x-2 hover:text-yellow-400 transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Cửa hàng</span>
          </Link>

          {/* Vạch ngăn cách */}
          <div className="h-4 w-[1px] bg-blue-500/50 hidden md:block"></div>

          {/* --- PHẦN QUAN TRỌNG: CHECK ĐĂNG NHẬP --- */}
          {current ? (
            // TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP
            <div className="flex items-center gap-3 pl-2">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-90" onClick={() => navigate("/account")}>
                <img 
                  // Dùng ảnh user hoặc ảnh mặc định nếu chưa có
                  src={current.avatar || `https://ui-avatars.com/api/?name=${current.name}&background=random`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-yellow-400 object-cover"
                />
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-300">Xin chào,</span>
                  <span className="font-bold text-yellow-400 max-w-[100px] truncate">
                    {current.name || "Khách hàng"}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="ml-2 text-xs bg-red-600/80 hover:bg-red-600 px-3 py-1 rounded transition-colors"
              >
                Thoát
              </button>
            </div>
          ) : (
            // TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP
            <div className="flex items-center gap-3 font-medium">
              <Link to="/sign-in" className="hover:text-yellow-400 transition-colors">
                Đăng nhập
              </Link>
              <span className="opacity-50">/</span>
              <Link to="/sign-up" className="hover:text-yellow-400 transition-colors">
                Đăng ký
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;