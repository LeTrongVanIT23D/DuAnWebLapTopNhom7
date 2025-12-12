import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

// Components
import ProductItem from "../product/ProductItem"; // Đảm bảo đường dẫn đúng
import ModalAdvanced from "../../components/Modal/ModalAdvanced";

// Utils
import { formatPrice } from "../../utils/formatPrice";

// Swiper & Styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules"; // Import chuẩn bản mới
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Icon Check xanh (Tách ra cho gọn)
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="green" className="w-5 h-5 inline-block ml-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProductListHome = ({ data, bg = "", className = "" }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Ref để body-scroll-lock hoạt động
  const modalRef = React.useRef(null);

  // --- Logic So Sánh ---
  const addToCompare = (item) => {
    if (selectedItems.length < 2) {
       // Kiểm tra trùng lặp
       const exists = selectedItems.find(i => i._id === item._id);
       if (!exists) {
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

  // Tự động mở modal khi chọn đủ 2 món
  useEffect(() => {
    if (selectedItems.length === 2) {
      setShowModal(true);
    }
  }, [selectedItems]);

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    const targetElement = modalRef.current || document.body;
    if (showModal) {
      disableBodyScroll(targetElement);
    } else {
      enableBodyScroll(targetElement);
    }
    // Cleanup khi component unmount
    return () => enableBodyScroll(targetElement);
  }, [showModal]);

  const handleClick = (item) => {
    const path = slugify(item.title, { strict: true, lower: true });
    navigate(`/${path}/${item._id}`);
  };

  // Style background tùy chọn
  const bgStyle = bg === "bg1" 
    ? { backgroundImage: 'url("../images/bg-laptop.png")' }
    : bg === "bg2" 
      ? { backgroundImage: 'url("../images/bg-laptop-1.png")' }
      : {};

  return (
    <div className={`${className}`}>
      {/* Container Slider */}
      <div
        className={`container mx-auto p-4 bg-no-repeat w-full bg-cover rounded-xl shadow-sm`}
        style={{ ...bgStyle, minHeight: '460px' }}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          className="w-full h-full py-5 px-2"
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 10 }, // Mobile
            640: { slidesPerView: 3, spaceBetween: 15 }, // Tablet
            1024: { slidesPerView: 4, spaceBetween: 20 }, // Laptop
            1280: { slidesPerView: 5, spaceBetween: 20 }, // PC
          }}
        >
          {data?.length > 0 &&
            data.map((item) => (
              <SwiperSlide key={item._id || item.id}>
                <ProductItem
                  product={item}
                  onClickItem={() => handleClick(item)}
                  // Truyền props cho chức năng so sánh (nếu ProductItem hỗ trợ)
                  selected={selectedItems}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                />
              </SwiperSlide>
            ))}
        </Swiper>
      </div>

      {/* --- MODAL SO SÁNH --- */}
      {showModal && selectedItems.length === 2 && (
        <ModalAdvanced
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItems([]); // Reset khi đóng
          }}
          bodyClassName="w-[95vw] md:w-[900px] bg-white p-6 rounded-xl relative z-50 h-[80vh] overflow-y-auto shadow-2xl"
        >
          <div ref={modalRef}> {/* Vùng scrollable cho body-scroll-lock */}
            <div className="text-center mb-6 sticky top-0 bg-white z-10 py-2 border-b">
               <h3 className="text-2xl font-bold text-blue-800 uppercase">So Sánh Chi Tiết</h3>
            </div>
            
            <table className="table-auto w-full border-collapse border border-gray-200 text-sm md:text-base">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 border w-1/5 text-gray-500">Thông số</th>
                  <th className="p-3 border w-2/5 text-blue-700 font-bold">{selectedItems[0]?.title}</th>
                  <th className="p-3 border w-2/5 text-blue-700 font-bold">{selectedItems[1]?.title}</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Hình ảnh */}
                <tr>
                  <td className="p-3 border font-semibold">Hình ảnh</td>
                  <td className="p-3 border text-center">
                    <img src={selectedItems[0]?.images?.[0]} alt="" className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto" />
                  </td>
                  <td className="p-3 border text-center">
                    <img src={selectedItems[1]?.images?.[0]} alt="" className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto" />
                  </td>
                </tr>

                {/* 2. Giá bán (Logic: Rẻ hơn là tốt) */}
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

                {/* 3. RAM (Logic: Lớn hơn là tốt) */}
                <tr>
                  <td className="p-3 border font-semibold">RAM</td>
                  <td className="p-3 border text-center">
                     {selectedItems[0]?.ram}
                     {parseInt(selectedItems[0]?.ram) >= parseInt(selectedItems[1]?.ram) && <CheckIcon />}
                  </td>
                  <td className="p-3 border text-center">
                     {selectedItems[1]?.ram}
                     {parseInt(selectedItems[1]?.ram) >= parseInt(selectedItems[0]?.ram) && <CheckIcon />}
                  </td>
                </tr>

                {/* 4. Cân nặng (Logic: Nhẹ hơn là tốt) */}
                <tr>
                  <td className="p-3 border font-semibold">Trọng lượng</td>
                  <td className="p-3 border text-center">
                     {selectedItems[0]?.weight}
                     {parseFloat(selectedItems[0]?.weight) <= parseFloat(selectedItems[1]?.weight) && <CheckIcon />}
                  </td>
                  <td className="p-3 border text-center">
                     {selectedItems[1]?.weight}
                     {parseFloat(selectedItems[1]?.weight) <= parseFloat(selectedItems[0]?.weight) && <CheckIcon />}
                  </td>
                </tr>

                {/* 5. Các thông số khác (Loop cho gọn code) */}
                {[
                   { label: "Thương hiệu", key1: selectedItems[0]?.brand?.name, key2: selectedItems[1]?.brand?.name },
                   { label: "CPU", key: "cpu" },
                   { label: "Màn hình", key: "screen" },
                   { label: "Card đồ họa", key: "graphicCard" },
                   { label: "Pin", key: "battery" },
                   { label: "Hệ điều hành", key: "os" },
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                     <td className="p-3 border font-semibold">{row.label}</td>
                     {/* Xử lý trường hợp object lồng nhau (Brand) hoặc key thường */}
                     <td className="p-3 border text-center">{row.key1 || selectedItems[0]?.[row.key]}</td>
                     <td className="p-3 border text-center">{row.key2 || selectedItems[1]?.[row.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalAdvanced>
      )}
    </div>
  );
};

export default ProductListHome;