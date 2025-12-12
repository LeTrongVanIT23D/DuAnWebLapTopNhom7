import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify"; // 1. Import Toast để không bị lỗi

import Table from "../../components/table/Table";
import PriceCard from "./PriceCard";
import ProductCard from "./ProductCard";
import QuantityCard from "./QuantityCard";
import CartHidden from "./CartHidden";
import PDF from "../../components/PDF/PDF";
import { formatPrice } from "../../utils/formatPrice";

const CartPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const { cart } = useSelector((state) => state.cart);
  const componentRef = useRef();

  // 2. Tính tổng tiền một lần duy nhất bằng useMemo (Tối ưu hiệu năng)
  const totalPrice = useMemo(() => {
    return cart?.reduce((total, item) => {
      // Logic: Nếu có giá khuyến mãi thì dùng, không thì dùng giá gốc
      const price = item.product.promotion > 0 ? item.product.promotion : item.product.price;
      return total + item.quantity * price;
    }, 0);
  }, [cart]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Báo giá sản phẩm - LapTopGaming.VN",
    onAfterPrint: () => {
      toast.dismiss();
      toast.success("In báo giá thành công!", { pauseOnHover: false });
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Kiểm tra đăng nhập an toàn hơn
    const token = localStorage.getItem("jwt");
    const user = JSON.parse(localStorage.getItem("user"));

    if (token && user?.active === "verify") {
      return navigate("/verify");
    }
    
    if (!token || !user) {
      setIsLoggedIn(false);
    }
  }, [navigate]);

  const handleCheckout = () => navigate("/checkout");
  const handleLogin = () => navigate("/sign-in");

  return (
    <div className="mt-8 mb-20">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-blue-600 flex items-center">
            Trang chủ
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mx-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
          <span className="font-medium text-gray-700">Giỏ hàng</span>
        </div>

        {cart?.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Giỏ hàng của bạn</h1>
              <button
                className="text-sm font-medium border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition-colors flex items-center gap-2"
                onClick={handlePrint}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 001.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Tải báo giá
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cột trái: Danh sách sản phẩm */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-4 pl-4 text-left font-semibold text-gray-600">Sản phẩm</th>
                      <th className="py-4 text-center font-semibold text-gray-600">Đơn giá</th>
                      <th className="py-4 text-center font-semibold text-gray-600">Số lượng</th>
                      <th className="py-4 pr-4 text-right font-semibold text-gray-600">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item) => {
                      // Tính giá cho từng item (Ưu tiên giá Promotion)
                      const itemPrice = item.product.promotion > 0 ? item.product.promotion : item.product.price;
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <ProductCard data={item} />
                          </td>
                          <td className="p-4 text-center">
                            <PriceCard data={item} />
                          </td>
                          <td className="p-4 text-center">
                            {/* QUAN TRỌNG: QuantityCard cần nhận vào maxStock để chặn tăng quá số lượng kho */}
                            <QuantityCard data={item} /> 
                          </td>
                          <td className="p-4 text-right font-bold text-blue-600">
                            {formatPrice(itemPrice * item.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Cột phải: Thanh toán */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-4 mb-4">Thông tin thanh toán</h3>
                
                <div className="flex items-center justify-between py-2 text-gray-600">
                  <span>Tổng tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-t border-gray-100 mt-2">
                  <span className="text-gray-800 font-semibold">Thành tiền</span>
                  <span className="text-blue-600 font-bold text-xl">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {!isLoggedIn ? (
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-3 mt-4 transition-colors shadow-lg shadow-blue-500/30"
                    onClick={handleLogin}
                  >
                    ĐĂNG NHẬP ĐỂ THANH TOÁN
                  </button>
                ) : (
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-3 mt-4 transition-colors shadow-lg shadow-blue-500/30"
                    onClick={handleCheckout}
                  >
                    TIẾN HÀNH THANH TOÁN
                  </button>
                )}
                
                <div className="text-xs text-gray-400 text-center mt-3">
                  An toàn và bảo mật 100%
                </div>
              </div>
            </div>
          </>
        ) : (
          <CartHidden />
        )}
      </div>
      
      {/* Component ẩn dùng để in PDF */}
      <div style={{ display: "none" }}>
         <PDF componentRef={componentRef} cart={cart} totalPrice={totalPrice} />
      </div>
    </div>
  );
};

export default CartPage;