import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import { action_status } from "../../utils/constants/status";
import { formatPrice } from "../../utils/formatPrice";
import { getProductSearch } from "../../redux/product/productSlice";
import Skeleton from "../skeleton/Skeleton";

const Search = ({ onClickItem, keyword, setKeyword }) => {
  const { productSearch, statusSearch } = useSelector((state) => state.product);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wrapperRef = useRef(null);

  // --- 1. HÀM HIGHLIGHT TỪ KHÓA (Tô đậm từ tìm kiếm) ---
  const HighlightText = ({ text, highlight }) => {
    if (!highlight || !text) return <span>{text}</span>;
    
    // Tách chuỗi dựa trên từ khóa (không phân biệt hoa thường)
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-blue-600 font-bold bg-yellow-100 rounded px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // --- 2. XỬ LÝ CLICK SẢN PHẨM ---
  const handleClick = (item) => {
    const path = slugify(item.title, { lower: true, strict: true });
    navigate(`/${path}/${item._id}`);
    if (setKeyword) setKeyword(""); // Đóng bảng tìm kiếm
    if (onClickItem) onClickItem();
  };

  // --- 3. CLICK RA NGOÀI ĐỂ ĐÓNG ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (setKeyword) setKeyword("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setKeyword]);

  // --- 4. DEBOUNCE GỌI API ---
  useEffect(() => {
    if (!keyword || keyword.trim() === "") return;

    const timer = setTimeout(() => {
      dispatch(getProductSearch(keyword.trim()));
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, dispatch]);

  if (!keyword) return null;

  return (
    <div
      ref={wrapperRef}
      // Thêm z-[9999] để đảm bảo nổi lên trên cùng
      className="absolute top-full mt-2 left-0 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] animate-fade-in-up"
      style={{ maxHeight: "450px", display: "flex", flexDirection: "column" }}
    >
      <div className="overflow-y-auto custom-scrollbar">
        
        {/* TRẠNG THÁI LOADING */}
        {statusSearch === action_status.LOADING && (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRẠNG THÁI THÀNH CÔNG */}
        {statusSearch === action_status.SUCCEEDED && (
          <div>
            {Array.isArray(productSearch) && productSearch.length > 0 ? (
              productSearch.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleClick(item)}
                  className="flex items-center gap-4 p-3 border-b border-gray-50 hover:bg-blue-50 transition-colors cursor-pointer group last:border-0"
                >
                  {/* Ảnh sản phẩm */}
                  <div className="w-16 h-16 shrink-0 border border-gray-100 rounded-lg overflow-hidden bg-white p-1">
                    <img
                      src={item.images?.[0]}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600">
                      {/* Áp dụng Highlight */}
                      <HighlightText text={item.title} highlight={keyword} />
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-red-600">
                        {formatPrice(item.promotion)}
                      </span>
                      {item.price > item.promotion && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // KHÔNG CÓ KẾT QUẢ
              <div className="p-8 text-center text-gray-500">
                <p>Không tìm thấy sản phẩm nào cho "<b>{keyword}</b>"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;