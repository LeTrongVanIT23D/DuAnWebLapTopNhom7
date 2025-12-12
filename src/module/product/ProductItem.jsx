import React from "react";
import { useDispatch } from "react-redux"; // 1. Import Redux
import { formatPrice } from "../../utils/formatPrice";
import { addToCart } from "../../redux/cart/cartSlice"; // 2. Import Action giỏ hàng (Kiểm tra đúng đường dẫn của bạn)
import { toast } from "react-toastify"; // 3. Import thông báo

const ProductItem = ({ product, onClickItem, className = "" }) => {
  const dispatch = useDispatch();

  // Hàm xử lý Thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    e.stopPropagation(); // Ngăn không cho click xuyên qua thẻ cha (để tránh chuyển trang)

    // Kiểm tra tồn kho
    if (product?.inventory <= 0) {
      toast.warning("Sản phẩm hiện tại đang hết hàng!");
      return;
    }

    // Gửi hành động lên Redux Store
    dispatch(
      addToCart({
        id: product._id, // Hoặc product.id tùy database của bạn
        product: product,
        quantity: 1,
      })
    );

    toast.success("Đã thêm sản phẩm vào giỏ hàng!");
  };

  return (
    <div
      className={`flex flex-col rounded-lg p-3 bg-white h-full mx-2 cursor-pointer shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-200 ${className}`}
      onClick={onClickItem}
    >
      {/* Hình ảnh sản phẩm */}
      <div className="relative overflow-hidden group rounded-lg mb-2">
        <img
          src={
            product?.images?.[0] ||
            "https://via.placeholder.com/180x180?text=No+Image" // Thay link google lỗi bằng placeholder
          }
          alt={product?.title}
          className="w-full h-[180px] object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Nhãn giảm giá nếu có */}
        {product?.percent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product?.percent}%
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1">
        {/* Tên sản phẩm */}
        <h3
          className="line-clamp-2 mb-2 text-sm font-semibold text-gray-800 h-[40px]"
          title={product?.title}
        >
          {product?.title}
        </h3>

        {/* Trạng thái kho hàng */}
        <div className="text-xs mb-2 h-[20px]">
          {product?.inventory <= 0 ? (
            <span className="text-red-500 font-medium bg-red-50 px-2 py-1 rounded-sm">
              Hết hàng
            </span>
          ) : product?.inventory < 5 ? (
            <span className="text-orange-500 font-medium">
              Chỉ còn {product?.inventory} sản phẩm
            </span>
          ) : (
            <span className="text-green-600 font-medium">Còn hàng</span>
          )}
        </div>

        {/* Giá cả */}
        <div className="flex flex-col mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg text-blue-700 font-bold">
              {formatPrice(product?.promotion)}
            </span>
            {product?.price > product?.promotion && (
              <span className="text-xs line-through text-slate-400">
                {formatPrice(product?.price)}
              </span>
            )}
          </div>
        </div>

        {/* Footer: Nút Mua Hàng */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {/* Icon quà tặng/promotion nhỏ */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-green-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21" />
            </svg>
            <span>Ưu đãi</span>
          </div>

          <button
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1
              ${
                product?.inventory > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
            onClick={handleAddToCart}
            disabled={product?.inventory <= 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {product?.inventory > 0 ? "Mua ngay" : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;