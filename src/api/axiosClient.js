import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// === 1. REQUEST INTERCEPTOR (Gửi Token đi) ===
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ LocalStorage (Đảm bảo key khớp với lúc bạn lưu)
    const token = localStorage.getItem("jwt"); 
    
    if (token) {
      // Gắn token vào Header để Backend xác thực
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// === 2. RESPONSE INTERCEPTOR (Xử lý phản hồi) ===
axiosClient.interceptors.response.use(
  (response) => {
    // Nếu thành công, chỉ lấy phần data (bỏ qua status, headers...)
    return response.data;
  },
  (error) => {
    // --- XỬ LÝ LỖI CHUNG ---
    
    // 1. Lỗi từ Server trả về (có response)
    if (error.response) {
      // Tự động logout nếu token hết hạn (401)
      if (error.response.status === 401) {
        // localStorage.clear();
        // window.location.href = "/sign-in"; 
        console.warn("Phiên đăng nhập hết hạn.");
      }

      // Quan trọng: Trả về nguyên bản lỗi để Redux (rejectWithValue) bắt được message từ Backend
      return Promise.reject(error);
    } 
    
    // 2. Lỗi không nhận được phản hồi (Mạng rớt, Server sập)
    else if (error.request) {
      console.error("Không kết nối được Server:", error.request);
      return Promise.reject(new Error("Không thể kết nối đến Server. Vui lòng kiểm tra mạng."));
    } 
    
    // 3. Lỗi khi setup request
    else {
      console.error("Lỗi Config Axios:", error.message);
      return Promise.reject(error);
    }
  }
);

export default axiosClient;