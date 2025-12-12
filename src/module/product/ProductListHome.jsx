import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

// 1. Sửa lỗi chính tả tên Component
import ProductItem from "../product/ProductItem"; 

// 2. Import Swiper đúng chuẩn phiên bản mới
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules"; 

// Import CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import ModalAdvanced from "../../components/Modal/ModalAdvanced";
import { formatPrice } from "../../utils/formatPrice";

const ProductListHome = ({ data, bg = "", className = "" }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const bodyStyle = document.body.style;

  const [selectedItems, setSelectedItems] = useState([]);

  // --- Logic So Sánh ---
  const addToCompare = (item) => {
    if (selectedItems.length < 2) {
       // Tránh thêm trùng sản phẩm
       if (!selectedItems.some(i => i._id === item._id)) {
          setSelectedItems((prev) => [...prev, item]);
       }
    }
  };

  const removeFromCompare = (item) => {
    const filteredItems = selectedItems.filter(
      (product) => product._id !== item._id
    );
    setSelectedItems(filteredItems);
  };

  // Mở modal khi chọn đủ 2 sản phẩm
  useEffect(() => {
    if (selectedItems.length === 2) {
      setShowModal(true);
    }
  }, [selectedItems]);

  // Khóa cuộn trang khi mở modal
  useEffect(() => {
    if (showModal) {
      disableBodyScroll(bodyStyle);
    } else {
      enableBodyScroll(bodyStyle);
    }
  }, [showModal, bodyStyle]);

  const handleClick = (item) => {
    const path = slugify(item.title, { strict: true, lower: true });
    navigate(`/${path}/${item._id}`);
  };

  // Component icon check xanh (cho gọn code)
  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="green" className="w-6 h-6 inline-block ml-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`${className}`}>
      <div
        className={`container mx-auto p-4 ${
          bg === "bg1" ? 'bg-[url("../images/bg-laptop.png")]' : ""
        }
        ${bg === "bg2" ? 'bg-[url("../images/bg-laptop-1.png")]' : ""}
        bg-no-repeat w-full bg-cover rounded-xl shadow-sm`}
        style={{ minHeight: '460px' }} // Dùng minHeight để an toàn hơn
      >
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          navigation
          pagination={{ clickable: true }}
          className="w-full h-full py-5 px-2"
          // Responsive: Mobile hiện 2, Tablet hiện 3, PC hiện 5
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 10 },
            640: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
            1280: { slidesPerView: 5, spaceBetween: 20 },
          }}
        >
          {data?.length > 0 &&
            data.map((item) => (
              <SwiperSlide key={item._id || item.id}>
                <ProductItem
                  product={item} // Đảm bảo ProductItem nhận đúng prop này
                  onClickItem={() => handleClick(item)}
                  selected={selectedItems}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                />
              </SwiperSlide>
            ))}
        </Swiper>
      </div>

      {/* --- MODAL SO SÁNH --- */}
      {selectedItems.length === 2 && (
        <ModalAdvanced
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItems([]);
          }}
          bodyClassName="w-[90vw] max-w-[1050px] bg-white p-6 rounded-xl relative z-50 h-[80vh] overflow-y-auto shadow-2xl"
        >
          <div className="text-center mb-6">
             <h3 className="text-2xl font-bold text-blue-800">So Sánh Sản Phẩm</h3>
          </div>
          
          <table className="table-auto w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border border-gray-200 w-1/5">Tiêu chí</th>
                <th className="p-3 border border-gray-200 w-2/5 text-blue-700">{selectedItems[0]?.title}</th>
                <th className="p-3 border border-gray-200 w-2/5 text-blue-700">{selectedItems[1]?.title}</th>
              </tr>
            </thead>
            <tbody>
              {/* Ảnh */}
              <tr>
                <td className="p-3 border font-semibold">Hình ảnh</td>
                <td className="p-3 border text-center">
                  <img src={selectedItems[0]?.images?.[0]} alt="" className="w-32 h-32 object-contain mx-auto" />
                </td>
                <td className="p-3 border text-center">
                  <img src={selectedItems[1]?.images?.[0]} alt="" className="w-32 h-32 object-contain mx-auto" />
                </td>
              </tr>

              {/* Thương hiệu */}
              <tr>
                <td className="p-3 border font-semibold">Thương hiệu</td>
                <td className="p-3 border text-center">{selectedItems[0]?.brand?.name}</td>
                <td className="p-3 border text-center">{selectedItems[1]?.brand?.name}</td>
              </tr>

              {/* Giá Tiền (Logic: Thấp hơn là tốt) */}
              <tr>
                <td className="p-3 border font-semibold">Giá bán</td>
                <td className="p-3 border text-center font-bold text-red-600">
                   {formatPrice(selectedItems[0]?.promotion)}
                   {selectedItems[0]?.promotion <= selectedItems[1]?.promotion && <CheckIcon />}
                </td>
                <td className="p-3 border text-center font-bold text-red-600">
                   {formatPrice(selectedItems[1]?.promotion)}
                   {selectedItems[1]?.promotion <= selectedItems[0]?.promotion && <CheckIcon />}
                </td>
              </tr>

              {/* RAM (Logic: Cao hơn là tốt) */}
              <tr>
                <td className="p-3 border font-semibold">RAM</td>
                <td className="p-3 border text-center">
                   {selectedItems[0]?.ram} GB
                   {Number(selectedItems[0]?.ram) >= Number(selectedItems[1]?.ram) && <CheckIcon />}
                </td>
                <td className="p-3 border text-center">
                   {selectedItems[1]?.ram} GB
                   {Number(selectedItems[1]?.ram) >= Number(selectedItems[0]?.ram) && <CheckIcon />}
                </td>
              </tr>

              {/* Cân nặng (Logic: Thấp hơn là tốt) */}
              <tr>
                <td className="p-3 border font-semibold">Trọng lượng</td>
                <td className="p-3 border text-center">
                   {selectedItems[0]?.weight} kg
                   {selectedItems[0]?.weight <= selectedItems[1]?.weight && <CheckIcon />}
                </td>
                <td className="p-3 border text-center">
                   {selectedItems[1]?.weight} kg
                   {selectedItems[1]?.weight <= selectedItems[0]?.weight && <CheckIcon />}
                </td>
              </tr>

              {/* Các thông số khác (Text thuần) */}
              {[
                 { label: "CPU", key: "cpu" },
                 { label: "Màn hình", key: "screen" },
                 { label: "Card đồ họa", key: "graphicCard" },
                 { label: "Pin", key: "battery" },
                 { label: "Hệ điều hành", key: "os" },
              ].map((row) => (
                <tr key={row.key}>
                   <td className="p-3 border font-semibold">{row.label}</td>
                   <td className="p-3 border text-center">{selectedItems[0]?.[row.key]}</td>
                   <td className="p-3 border text-center">{selectedItems[1]?.[row.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModalAdvanced>
      )}
    </div>
  );
};

export default ProductListHome;