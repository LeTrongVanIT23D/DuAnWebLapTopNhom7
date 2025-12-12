import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import { action_status } from "../../utils/constants/status";
import { formatPrice } from "../../utils/formatPrice";
import { getProductSearch } from "../../redux/product/productSlice";
import Skeleton from "../skeleton/Skeleton";

const Search = ({ onClickItem, keyword }) => {
  const { productSearch, statusSearch } = useSelector((state) => state.product);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = (item) => {
    // Tạo slug thân thiện SEO
    const path = slugify(item.title, { lower: true, strict: true });
    navigate(`/${path}/${item._id}`);
    if (onClickItem) onClickItem();
  };

  // --- 1. KỸ THUẬT DEBOUNCE (QUAN TRỌNG) ---
  useEffect(() => {
    // Nếu không có từ khóa, không làm gì cả (hoặc clear state nếu cần)
    if (!keyword || keyword.trim() === "") return;

    // Tạo bộ đếm thời gian: Chỉ gọi API sau 500ms ngừng gõ
    const timer = setTimeout(() => {
      try {
        dispatch(getProductSearch(keyword));
      } catch (error) {
        console.log(error.message);
      }
    }, 500);

    // Xóa bộ đếm cũ nếu người dùng gõ tiếp
    return () => clearTimeout(timer);
  }, [keyword, dispatch]);

  // Nếu keyword rỗng thì không hiển thị bảng search
  if (!keyword) return null;

  return (
    <div className="absolute top-14 left-0 w-full rounded-xl max-h-[450px] z-50 bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-fade-in-down">
      
      {/* --- SCROLLBAR CUSTOM --- */}
      <div className="overflow-y-auto custom-scrollbar flex-1">
        
        {/* TRẠNG THÁI LOADING */}
        {statusSearch === action_status.LOADING && (
          <div className="flex flex-col gap-y-4 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start gap-x-4 animate-pulse">
                <Skeleton className="w-[80px] h-[80px] rounded-lg shrink-0" />
                <div className="flex flex-col gap-y-2 w-full">
                  <Skeleton className="w-3/4 h-4 rounded-md" />
                  <Skeleton className="w-1/2 h-3 rounded-md" />
                  <Skeleton className="w-1/4 h-3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRẠNG THÁI THÀNH CÔNG */}
        {statusSearch === action_status.SUCCEEDED && (
          <div className="flex flex-col">
            {productSearch.length > 0 ? (
              productSearch.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleClick(item)}
                  className="group flex items-center gap-x-4 p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer last:border-0"
                >
                  {/* Hình ảnh */}
                  <div className="w-[80px] h-[80px] shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-white p-1">
                    <img
                      src={item?.images?.[0]}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Thông tin */}
                  <div className="flex flex-col flex-1">
                    <h4
                      className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 group-hover:text-blue-700 transition-colors"
                      title={item?.title}
                    >
                      {item?.title}
                    </h4>
                    
                    <div className="flex items-baseline gap-x-2">
                      <span className="font-bold text-blue-600 text-sm">
                        {formatPrice(item?.promotion)}
                      </span>
                      {item.price > item.promotion && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(item?.price)}
                        </span>
                      )}
                      {item?.percent > 0 && (
                        <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-sm">
                          -{item?.percent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // KHÔNG TÌM THẤY KẾT QUẢ
              <div className="flex flex-col items-center justify-center py-10 gap-y-3">
                <div className="bg-gray-100 p-4 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  Không tìm thấy sản phẩm nào
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer nhỏ nếu cần (VD: Xem tất cả kết quả) */}
      {statusSearch === action_status.SUCCEEDED && productSearch.length > 5 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-xs font-semibold text-blue-600">Xem tất cả kết quả</span>
        </div>
      )}
    </div>
  );
};

export default Search;