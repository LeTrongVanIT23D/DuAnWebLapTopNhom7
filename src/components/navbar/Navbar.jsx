import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

// Redux & Api
import userApi from "../../api/userApi";
import { logout } from "../../redux/auth/userSlice";
import { getCart } from "../../redux/cart/cartSlice";

// Components & Hooks
import Profile from "../profile/Profile";
import Cart from "../cart/Cart";
import CartHollow from "../cart/CartHollow";
import Search from "../search/Search";
import useClickOutSide from "../../hooks/useClickOutSide";
import useDebounce from "../../hooks/useDebounce";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Redux State ---
  const loggedInUser = useSelector((state) => state.user.current);
  const { cart } = useSelector((state) => state.cart);
  const isLoggedIn = loggedInUser?.active === "active";

  // --- Local State ---
  const [keyword, setKeyWord] = useState("");
  const { show, setShow, nodeRef } = useClickOutSide();
  const searchDebounced = useDebounce(keyword, 500);
  
  // Body scroll lock logic (Refactored for cleaner look)
  const bodyStyle = document.body.style;
  const isLocked = useRef(false);

  const handleMouseOverCart = () => {
    if (!isLocked.current) {
      disableBodyScroll(bodyStyle);
      isLocked.current = true;
    }
  };

  const handleMouseOutCart = () => {
    if (isLocked.current) {
      enableBodyScroll(bodyStyle);
      isLocked.current = false;
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (!cart) dispatch(getCart());
  }, [cart, dispatch]);

  useEffect(() => {
    setKeyWord("");
    // Cleanup keyword in storage if needed based on logic
  }, [location.search]);

  useEffect(() => {
    show ? disableBodyScroll(bodyStyle) : enableBodyScroll(bodyStyle);
    return () => enableBodyScroll(bodyStyle); // Cleanup on unmount
  }, [show]);

  // --- Handlers ---
  const handleLogout = () => {
    Swal.fire({
      title: "Đăng xuất?",
      text: "Bạn có chắc chắn muốn đăng xuất không?",
      showCancelButton: true,
      icon: "question",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có",
      cancelButtonText: "Không",
    }).then(async (result) => {
      if (result.isConfirmed) {
        dispatch(logout());
        await userApi.logout();
        navigate("/");
        Swal.fire("Tạm biệt! Hẹn gặp lại quý khách");
      }
    });
  };

  const handleSearch = () => {
    if (!keyword.trim()) return;
    localStorage.setItem("keyword", keyword);
    navigate(`/product/?keyword=${keyword}`);
    setShow(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 h-[80px] sticky top-0 z-50 shadow-lg text-white">
      <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">
        
        {/* --- LEFT: LOGO --- */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link to="/product" title="Danh mục" className="hover:opacity-80 transition-opacity">
            <IconMenu />
          </Link>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 bg-white rounded-full p-1 shadow-md overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <img
                src="/images/logo.png"
                alt="Website bán laptop Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-2xl tracking-wide hidden md:block">Website bán Laptop</span>
          </Link>
        </div>

        {/* --- CENTER: SEARCH BAR --- */}
        <div className="flex-1 max-w-2xl relative z-50" ref={nodeRef}>
          <div className="flex items-center w-full bg-white rounded-full overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
            <input
              type="text"
              className="flex-1 py-2.5 px-5 text-gray-700 outline-none placeholder-gray-400"
              placeholder="Bạn muốn tìm gì hôm nay?..."
              value={keyword}
              onChange={(e) => setKeyWord(e.target.value)}
              onClick={() => setShow(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-6 py-3 transition-colors duration-200 flex items-center justify-center"
              onClick={handleSearch}
            >
              <IconSearch />
            </button>
          </div>
          
          {/* Search Result Dropdown */}
          {keyword && show && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl overflow-hidden">
               <Search onClickItem={() => setShow(false)} keyword={searchDebounced} />
            </div>
          )}
        </div>

        {/* --- RIGHT: ACTIONS --- */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* User Account */}
          {!isLoggedIn ? (
            <Link
              to="/sign-in"
              className="flex flex-col items-center justify-center hover:text-yellow-300 transition-colors group"
            >
              <IconUser className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Đăng nhập</span>
            </Link>
          ) : (
            <div className="cursor-pointer">
               <Profile data={loggedInUser} onLogout={handleLogout} /> 
            </div>
          )}

          {/* Cart Dropdown */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={handleMouseOverCart}
            onMouseLeave={handleMouseOutCart}
          >
            <Link to="/cart" className="flex items-center gap-2 hover:text-yellow-300 transition-colors">
              <div className="relative">
                <IconCart className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-2 bg-yellow-400 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {cart?.length || 0}
                </span>
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs opacity-90">Giỏ hàng</span>
                <span className="text-sm font-bold truncate max-w-[80px]">
                   {cart?.length ? "Có hàng" : "Trống"}
                </span>
              </div>
            </Link>

            {/* Cart Dropdown Content */}
            <div className="absolute top-full right-0 mt-4 w-[400px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50 pt-2">
                {/* Arrow pointing up */}
                <div className="absolute right-6 top-0 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-100"></div>
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden text-black">
                     {cart?.length > 0 ? <Cart /> : <CartHollow />}
                </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// --- Sub Components for Cleaner Code ---

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white hover:text-yellow-300 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const IconUser = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconCart = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);