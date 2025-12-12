import React from "react";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";

const ProductCard = ({ data }) => {
  const navigate = useNavigate();

  // Kiểm tra dữ liệu an toàn để tránh lỗi crash trang
  const product = data?.product;
  if (!product) return null;

  const handleClick = () => {
    // Tạo slug URL thân thiện (ví dụ: laptop-gaming-acer)
    const path = slugify(product.title, { lower: true, strict: true });
    // Dùng _id chuẩn của MongoDB
    navigate(`/${path}/${product._id}`);
  };

  // Hàm format tiền tệ VNĐ
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="flex items-start justify-start gap-x-4 p-2 border border-transparent hover:border-gray-200 rounded-lg transition-all">
      {/* 1. Hình ảnh sản phẩm */}
      <div 
        className="w-[80px] h-[80px] flex-shrink-0 cursor-pointer overflow-hidden rounded border border-gray-200"
        onClick={handleClick}
      >
        <img
          src={product.images?.[0] || "https://via.placeholder.com/150"} // Ảnh mặc định nếu lỗi
          alt={product.title}
          className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* 2. Thông tin chi tiết */}
      <div className="flex flex-col items-start gap-y-1 flex-1">
        {/* Tên sản phẩm */}
        <h3
          className="text-sm font-semibold text-gray-800 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
          title={product.title}
          onClick={handleClick}
        >
          {product.title}
        </h3>

        {/* Giá tiền (Mới thêm) */}
        <div className="text-blue-600 font-bold text-sm">
          {formatPrice(product.price)}
        </div>

        {/* Số lượng trong kho */}
        <div className="flex items-center gap-2 text-xs">
          {/* Sửa inventory -> quantity cho khớp Backend */}
          {product.quantity > 0 ? (
            <span className="text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded">
              Còn {product.quantity} sản phẩm
            </span>
          ) : (
            <span className="text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">
              Hết hàng
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;