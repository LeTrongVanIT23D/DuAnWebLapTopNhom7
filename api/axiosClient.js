import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:3000",
  headers: {
    "Content-Type": "application/JSON", // Sửa: JSON → json
  },
  withCredentials: true,
});

// === REQUEST INTERCEPTOR ===
axiosClient.interceptors.request.use(
  (config) => {
    // Có thể thêm token ở đây
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Chỉ trả về data
  },
  (error) => {
    // KIỂM TRA error.response TRƯỚC KHI DESTRUCTURE
    if (error.response) {
      const { config, status, data } = error.response;

      const URLs = [
        "/api/v1/users/signup",
        "/api/v1/users/login",
        "/api/v1/users/verify",
        "/api/v1/users/forgotPassword",
        "/api/v1/users/changeState",
        "/api/v1/users/logout",
        "/api/v1/users/verifyResetPass",
        "/api/v1/users/me",
        "/api/v1/users/resetPassword/:token",
        "/api/v1/users/updateMe",
        "/api/v1/users/createAddress",
        "/api/v1/users/me/address",
        "/api/v1/users/deleteAddress",
        "/api/v1/users/updateAddress",
        "/api/v1/users/updateMyPassword",
        "/api/v1/users/setDefaultAddress",
        "/api/v1/products",
        "/api/v1/reviews",
        "/api/v1/products/:id/reviews",
        "/api/v1/reviews/:id",
        "/api/v1/orders",
        "/api/v1/users/userLoginWith",
        "/api/v1/comments",
        "/api/v1/products/:id/comments",
        "/api/v1/comments/:id",
        "/api/v1/comments/setLike/:id",
      ];

      // Kiểm tra URL có trong danh sách không
      const isMatchedURL = URLs.some((url) => {
        // Xử lý URL có :id hoặc query
        const regex = new RegExp("^" + url.replace(/:\w+/g, "\\w+").replace(/\?.*/, "") + "$");
        return regex.test(config.url.replace(/\?.*/, "")); // Bỏ query string
      });

      // Chỉ xử lý lỗi cho các URL cụ thể + status code
      if (
        isMatchedURL &&
        (status === 400 || status === 401 || status === 403 || status === 404 || status === 500)
      ) {
        const message = data?.message || "Đã có lỗi xảy ra";
        throw new Error(message);
      }
    } else if (error.request) {
      // Không nhận được response (mạng, server sập)
      throw new Error("Không kết nối được tới server. Vui lòng kiểm tra kết nối mạng.");
    } else {
      // Lỗi cấu hình request
      throw new Error("Đã có lỗi xảy ra khi gửi yêu cầu.");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;