import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { bannerData } from "../../api/bannerData";

// --- SỬA DÒNG NÀY: Xóa chữ "/modules" đi ---
// Thay vì "swiper/modules", hãy để là "swiper"
import { Navigation, Pagination, Autoplay } from "swiper"; 
// ------------------------------------------

// Import CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const customSwiperStyles = `
  .swiper-button-next,
  .swiper-button-prev {
    color: white !important;
    opacity: 0.7;
    transition: all 0.3s ease;
  }
  .swiper-button-next:hover,
  .swiper-button-prev:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  .swiper-pagination-bullet {
    background-color: white !important;
    opacity: 0.5;
  }
  .swiper-pagination-bullet-active {
    opacity: 1 !important;
    width: 20px;
    border-radius: 5px;
    transition: all 0.3s ease;
  }
`;

const Banner = () => {
  if (!bannerData || bannerData.length === 0) return null;

  return (
    <div className="w-full relative group mt-4">
      <style>{customSwiperStyles}</style>

      <div className="w-full">
        <Swiper
          // Truyền các module đã import vào đây
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          navigation={true}
          pagination={{ clickable: true }}
          loop={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="w-full"
        >
          {bannerData.map((item) => (
            <SwiperSlide key={item.id}>
              {/* Chiều cao responsive: Mobile 200px, Tablet 400px, Desktop 500px */}
              <div className="relative w-full h-[200px] md:h-[400px] lg:h-[500px]">
                <img
                  src={item.img}
                  alt="Banner"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Banner;