import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

// --- SỬA DÒNG NÀY: Thêm "/modules" vào cuối ---
import { Navigation, Thumbs, Autoplay } from "swiper/modules";
// ---------------------------------------------

import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import SubInformationProduct from "./SubInformationProduct";

const InformationProduct = ({ data }) => {
  const [activeThumb, setActiveThumb] = useState(null);

  // Kiểm tra dữ liệu để tránh lỗi crash nếu data chưa tải xong
  if (!data) return null;

  return (
    <div className="Information-product bg-white rounded-xl py-8 px-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Cột Trái: Slider Ảnh */}
      <div className="product-image">
        {/* Slider Chính */}
        <Swiper
          loop={true}
          spaceBetween={10}
          navigation={true}
          modules={[Navigation, Thumbs, Autoplay]}
          grabCursor={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          thumbs={{ swiper: activeThumb && !activeThumb.destroyed ? activeThumb : null }}
          className="product-images-slider rounded-xl overflow-hidden mb-4 border border-gray-100"
        >
          {data?.images?.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="w-full pt-[100%] relative bg-white">
                <img 
                  src={item} 
                  alt={`Product ${index}`} 
                  className="absolute top-0 left-0 w-full h-full object-contain p-2"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Slider Thumbnails (Ảnh nhỏ) */}
        <Swiper
          onSwiper={setActiveThumb}
          loop={true}
          spaceBetween={10}
          slidesPerView={4} // Hiển thị 4 ảnh nhỏ
          modules={[Navigation, Thumbs]}
          watchSlidesProgress={true}
          className="product-images-slider-thumbs"
        >
          {data?.images?.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="product-images-slider-thumbs-wrapper cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors bg-white">
                <div className="w-full pt-[100%] relative">
                  <img 
                    src={item} 
                    alt={`Thumb ${index}`} 
                    className="absolute top-0 left-0 w-full h-full object-contain p-1"
                  />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Cột Phải: Thông tin chi tiết */}
      <div className="product-info">
         <SubInformationProduct key={data._id} data={data} />
      </div>
    </div>
  );
};

export default InformationProduct;