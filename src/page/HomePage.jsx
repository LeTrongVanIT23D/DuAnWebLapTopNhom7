import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Components
import Banner from "../components/banner/Banner";
import ProductListHome from "../module/product/ProductListHome";
import BackToTopButton from "../components/backtotop/BackToTopButton";
import ProductList from "../module/product/ProductList";
import SkeletonItem from "../components/skeleton/SkeletonItem";
import Skeleton from "../components/skeleton/Skeleton";

// Redux & Utils
import { getProduct } from "../redux/product/productSlice";
import { action_status } from "../utils/constants/status";

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Lấy state từ Redux
  const { status, totalPage, product } = useSelector((state) => state.product);
  
  const [page, setPage] = useState(1);
  const productListRef = useRef(null);

  // --- 1. DATA SLICING (An toàn hóa dữ liệu đầu vào) ---
  const hotProducts = useMemo(() => {
    return Array.isArray(product) ? product.slice(0, 5) : [];
  }, [product]);

  const newProducts = useMemo(() => {
    return Array.isArray(product) ? product.slice(5, 10) : [];
  }, [product]);

  // --- 2. IMAGE ERROR HANDLER ---
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
    e.target.onerror = null;
  };

  // --- 3. AUTH CHECK ---
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    const userStr = localStorage.getItem("user");
    // Kiểm tra kỹ hơn để tránh lỗi JSON.parse nếu userStr null
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.active === "verify") {
          toast.warning("Vui lòng xác thực tài khoản", { pauseOnHover: false });
          navigate("/verify");
        }
      } catch (e) {
        // Nếu localStorage lỗi thì bỏ qua
      }
    }
  }, [navigate]);

  // --- 4. INIT & FETCH ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Gọi API lấy sản phẩm (Trang hiện tại, Limit 10)
    dispatch(getProduct({ page: page, limit: 10 }));
  }, [page, dispatch]);

  const handlePageClick = (values) => {
    setPage(values);
    // Cuộn mượt xuống danh sách sản phẩm
    productListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- 5. LOADING UI ---
  if (status === action_status.LOADING) {
    return (
      <div className="bg-gray-50 min-h-screen pb-20 pt-6">
        <div className="container mx-auto px-4 space-y-8">
          <Skeleton className="w-full rounded-2xl h-[300px] md:h-[500px]" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
          <div className="space-y-4">
             <Skeleton className="w-48 h-8 rounded" />
             <SkeletonItem className="grid-cols-2 md:grid-cols-5 gap-4" totalItem={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen flex flex-col gap-y-10 pb-20">
      
      {/* === HERO SECTION === */}
      <div className="bg-white pb-6 shadow-sm">
        <Banner />
        
        <div className="container mx-auto px-4 -mt-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <PolicyItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Giao hàng siêu tốc" desc="Nội thành trong 2h" 
              />
              <PolicyItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Cam kết chính hãng" desc="Đền bù 200% nếu giả" 
              />
              <PolicyItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Hỗ trợ kỹ thuật" desc="Online 24/7 miễn phí" 
              />
              <PolicyItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                title="Đổi trả dễ dàng" desc="Lỗi là đổi mới 30 ngày" 
              />
          </div>
        </div>
      </div>

      {/* === SECTION 1: HOT PRODUCTS === */}
      {hotProducts.length > 0 && (
        <section className="container mx-auto px-4">
          <SectionHeader title="Săn Deal Giá Sốc 🔥" linkText="Xem tất cả deal" />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <ProductListHome data={hotProducts} bg="bg-white" />
          </div>
        </section>
      )}

      {/* === MIDDLE BANNER === */}
      <section className="container mx-auto px-4">
         <div className="w-full h-[120px] md:h-[180px] rounded-2xl overflow-hidden shadow-md relative group cursor-pointer">
            <img 
               src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
               alt="Tech Promo" 
               onError={handleImageError}
               className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-10">
               <div>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">Nâng cấp PC Gaming</h3>
                  <p className="text-gray-200">Giảm thêm 5% khi thanh toán qua thẻ</p>
               </div>
            </div>
         </div>
      </section>

      {/* === SECTION 2: NEW ARRIVALS === */}
      {newProducts.length > 0 && (
        <section className="bg-gradient-to-b from-blue-50 to-transparent py-10">
          <div className="container mx-auto px-4">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-blue-900 uppercase">Hàng Mới Cập Bến 🚀</h2>
                <p className="text-gray-500 mt-2">Những mẫu laptop công nghệ mới nhất 2025</p>
             </div>
             <ProductListHome data={newProducts} bg="bg-transparent" />
          </div>
        </section>
      )}

      {/* === SECTION 3: ALL PRODUCTS (MAIN LIST) === */}
      <section className="container mx-auto px-4" ref={productListRef}>
         <SectionHeader title="Gợi Ý Cho Bạn" />
         <div className="min-h-[600px]">
            {/* --- FIX LỖI Ở ĐÂY: Thêm "|| 0" cho totalPage --- */}
            <ProductList
              data={product || []} // An toàn cho data
              handlePageClick={handlePageClick}
              page={page}
              totalPage={totalPage || 0} // Fix lỗi "value is null"
            />
         </div>
      </section>

      <BackToTopButton />
    </div>
  );
};

// --- SUB COMPONENTS ---
const PolicyItem = ({ icon, title, desc }) => (
  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-default group">
    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
       {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-blue-700 transition-colors">{title}</h4>
      <p className="text-xs md:text-sm text-gray-500">{desc}</p>
    </div>
  </div>
);

const SectionHeader = ({ title, linkText }) => (
  <div className="flex items-center justify-between mb-5">
     <h2 className="text-xl md:text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-3 leading-none">
       {title}
     </h2>
     {linkText && (
       <button className="text-sm text-blue-600 font-medium hover:text-blue-800 hover:underline flex items-center gap-1">
         {linkText}
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
         </svg>
       </button>
     )}
  </div>
);

export default HomePage;