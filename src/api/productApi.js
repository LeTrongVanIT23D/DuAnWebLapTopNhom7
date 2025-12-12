import axiosClient from "./axiosClient";

const productApi = {
  // Lấy tất cả sản phẩm (có filter/sort/pagination)
  getAllProduct(query) {
    const url = `/api/v1/products?${query}`;
    return axiosClient.get(url);
  },

  // Lấy chi tiết 1 sản phẩm theo ID
  getProductId(id) {
    const url = `/api/v1/products/${id}`;
    return axiosClient.get(url);
  },

  // Lấy danh sách thương hiệu
  getBrand() {
    const url = `/api/v1/brands`;
    return axiosClient.get(url);
  },

  // --- MỚI THÊM: HÀM TÌM KIẾM (SEARCH) ---
  getProductSearch(keyword) {
    // Gọi đúng đường dẫn Backend đã cấu hình: /api/v1/products/search
    const url = `/api/v1/products/search?keyword=${keyword}`;
    return axiosClient.get(url);
  },
};

export default productApi;