// Ai đã sửa: Chuẩn hóa việc kiểm tra tồn kho sản phẩm

import React from "react";
import { useDispatch } from "react-redux";
import { removeFromCart, setQuantity } from "../../redux/cart/cartSlice";
import Swal from "sweetalert2";
import { toast } from "react-toastify"; 

const QuantityCard = ({ data }) => {
  const dispatch = useDispatch();

  // --- SỬA LỖI Ở ĐÂY ---
  // 1. Ưu tiên lấy 'quantity' (mới), nếu không có thì tìm 'inventory' (cũ), nếu không có nữa thì là 0
  // 2. Ép kiểu Number để so sánh chính xác
  const maxStock = Number(data?.product?.quantity || data?.product?.inventory || 0);

  const handleDecreaseQuantity = () => {
    const newQty = data.quantity - 1;
    if (newQty < 1) return; 

    dispatch(setQuantity({
      id: data.id,
      quantity: newQty,
    }));
  };

  const handleIncreaseQuantity = () => {
    const newQty = data.quantity + 1;

    // Kiểm tra tồn kho
    if (newQty > maxStock) {
      toast.warning(`Chỉ còn ${maxStock} sản phẩm trong kho!`);
      return;
    }

    dispatch(setQuantity({
      id: data.id,
      quantity: newQty,
    }));
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Xóa sản phẩm?",
      text: "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
      showCancelButton: true,
      icon: "warning",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(removeFromCart(id));
        // toast.success("Đã xóa sản phẩm"); // Bật lên nếu muốn thông báo
      }
    });
  };

  return (
    <div className="flex flex-col justify-center gap-y-2 items-center">
      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
        {/* Nút Giảm */}
        <button
          className="p-2 bg-gray-50 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          onClick={handleDecreaseQuantity}
          disabled={data.quantity <= 1}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-3 h-3 text-gray-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
          </svg>
        </button>

        {/* Ô nhập số lượng */}
        <input
          type="number"
          value={data.quantity}
          readOnly
          className="p-1 w-[40px] text-center text-sm font-medium bg-white focus:outline-none"
        />

        {/* Nút Tăng */}
        <button
          className="p-2 bg-gray-50 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          onClick={handleIncreaseQuantity}
          // Chỉ disable khi đã xác định được tồn kho (>0) và số lượng đã đạt trần
          disabled={maxStock > 0 && data.quantity >= maxStock}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-3 h-3 text-gray-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </button>
      </div>

      {/* Nút Xóa */}
      <button
        className="text-xs font-medium text-gray-400 hover:text-red-600 hover:underline transition-all"
        onClick={() => handleDelete(data.id)}
      >
        Xóa
      </button>
    </div>
  );
};

export default QuantityCard;