import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { bannerData } from "../../api/bannerData";

// --- SỬA DÒNG NÀY (QUAN TRỌNG NHẤT) ---
// Thêm chữ "/modules" vào cuối đường dẫn
import { Navigation, Pagination, Autoplay } from "swiper/modules"; 
// --------------------------------------

// Import CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const customSwiperStyles = `
  .swiper-button-next,
  .swiper-button-prev {
    color: white !important;
    opacity: 0.6;
    transition: all 0.3s ease;
    background-color: rgba(0,0,0,0.2);
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
  .swiper-button-next:after,
  .swiper-button-prev:after {
    font-size: 18px !important;
    font-weight: bold;
  }
  .swiper-button-next:hover,
  .swiper-button-prev:hover {
    opacity: 1;
    background-color: rgba(0,0,0,0.5);
    transform: scale(1.1);
  }
  .swiper-pagination-bullet {
    background-color: white !important;
    opacity: 0.5;
    width: 10px;
    height: 10px;
  }
  .swiper-pagination-bullet-active {
    opacity: 1 !important;
    width: 30px;
    border-radius: 5px;
    transition: all 0.3s ease;
  }
`;

const Banner = () => {
  if (!bannerData || !Array.isArray(bannerData) || bannerData.length === 0) {
    return null;
  }

  return (
    <div className="w-full relative group mt-4">
      <style>{customSwiperStyles}</style>

      <div className="w-full">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          navigation={true}
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="w-full rounded-lg overflow-hidden shadow-lg"
        >
          {bannerData.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="relative w-full h-[200px] md:h-[400px] lg:h-[500px]">
                <img
                  src={item.img}
                  alt="Banner quảng cáo"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                  loading="lazy" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Banner;