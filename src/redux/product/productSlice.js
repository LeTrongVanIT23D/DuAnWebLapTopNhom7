import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import productApi from "../../api/productApi";
import { action_status } from "../../utils/constants/status";
import queryString from "query-string";

// Khởi tạo state an toàn hơn (Mảng thì để [], Object thì để null hoặc {})
const initialState = {
  status: action_status.IDLE,
  statusId: action_status.IDLE,
  statusFilter: action_status.IDLE,
  statusBrand: action_status.IDLE,
  statusSearch: action_status.IDLE,
  statusProductBrand: action_status.IDLE,
  totalPage: 0,
  totalPageFilter: 0,
  product: [],        // Sửa thành mảng
  productId: null,    // Chi tiết 1 sản phẩm
  productFilter: [],  // Sửa thành mảng
  productSearch: [],  // Sửa thành mảng
  productBrand: [],   // Sửa thành mảng
  brand: [],          // Sửa thành mảng
  error: null,
};

// --- ASYNC THUNKS ---

export const getProduct = createAsyncThunk(
  "product/getProduct", // Đổi tên namespace cho chuẩn
  async (payload, { rejectWithValue }) => {
    try {
      // payload: { page: 1, limit: 10 }
      const query = queryString.stringify(payload);
      const response = await productApi.getAllProduct(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// --- QUAN TRỌNG: SỬA HÀM NÀY ĐỂ GỌI API SEARCH MỚI ---
export const getProductSearch = createAsyncThunk(
  "product/getProductSearch",
  async (keyword, { rejectWithValue }) => {
    try {
      // Gọi đúng hàm search đã định nghĩa trong productApi
      const response = await productApi.getProductSearch(keyword);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);
// -----------------------------------------------------

export const getProductBrand = createAsyncThunk(
  "product/getProductBrand",
  async (brandName, { rejectWithValue }) => {
    try {
      const query = `limit=15&brand=${brandName}`;
      const response = await productApi.getAllProduct(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getBrand = createAsyncThunk(
  "product/getBrand", 
  async (_, { rejectWithValue }) => {
    try {
      const response = await productApi.getBrand();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getProductFilter = createAsyncThunk(
  "product/getProductFilter",
  async (payload, { rejectWithValue }) => {
    try {
      const query = queryString.stringify(payload);
      const response = await productApi.getAllProduct(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getProductId = createAsyncThunk(
  "product/getProductId",
  async (id, { rejectWithValue }) => {
    try {
      const response = await productApi.getProductId(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// --- SLICE (Dùng Builder Callback Syntax) ---

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    // Có thể thêm reducer clear search nếu cần
    clearSearch: (state) => {
      state.productSearch = [];
      state.statusSearch = action_status.IDLE;
    }
  },
  extraReducers: (builder) => {
    builder
      // 1. Get All Product
      .addCase(getProduct.pending, (state) => {
        state.status = action_status.LOADING;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.status = action_status.SUCCEEDED;
        state.product = action.payload.data;
        state.totalPage = action.payload.totalPage; // Đảm bảo API trả về field này
      })
      .addCase(getProduct.rejected, (state) => {
        state.status = action_status.FAILED;
      })

      // 2. Get Product By ID
      .addCase(getProductId.pending, (state) => {
        state.statusId = action_status.LOADING;
      })
      .addCase(getProductId.fulfilled, (state, action) => {
        state.statusId = action_status.SUCCEEDED;
        state.productId = action.payload.data;
      })
      .addCase(getProductId.rejected, (state) => {
        state.statusId = action_status.FAILED;
      })

      // 3. Filter
      .addCase(getProductFilter.pending, (state) => {
        state.statusFilter = action_status.LOADING;
      })
      .addCase(getProductFilter.fulfilled, (state, action) => {
        state.statusFilter = action_status.SUCCEEDED;
        state.productFilter = action.payload.data;
        state.totalPageFilter = action.payload.totalPage;
      })
      .addCase(getProductFilter.rejected, (state) => {
        state.statusFilter = action_status.FAILED;
      })

      // 4. Get Brand
      .addCase(getBrand.pending, (state) => {
        state.statusBrand = action_status.LOADING;
      })
      .addCase(getBrand.fulfilled, (state, action) => {
        state.statusBrand = action_status.SUCCEEDED;
        state.brand = action.payload.data;
      })
      .addCase(getBrand.rejected, (state) => {
        state.statusBrand = action_status.FAILED;
      })

      // 5. Search (QUAN TRỌNG)
      .addCase(getProductSearch.pending, (state) => {
        state.statusSearch = action_status.LOADING;
      })
      .addCase(getProductSearch.fulfilled, (state, action) => {
        state.statusSearch = action_status.SUCCEEDED;
        // API trả về: { status: "success", results: 10, data: [...] }
        // Hoặc: { data: { data: [...] } } tùy cấu trúc response của bạn
        // Code cũ của bạn là: action.payload.data
        state.productSearch = action.payload.data || action.payload; 
      })
      .addCase(getProductSearch.rejected, (state) => {
        state.statusSearch = action_status.FAILED;
        state.productSearch = []; // Reset về rỗng nếu lỗi
      })

      // 6. Product Brand
      .addCase(getProductBrand.pending, (state) => {
        state.statusProductBrand = action_status.LOADING;
      })
      .addCase(getProductBrand.fulfilled, (state, action) => {
        state.statusProductBrand = action_status.SUCCEEDED;
        state.productBrand = action.payload.data;
      })
      .addCase(getProductBrand.rejected, (state) => {
        state.statusProductBrand = action_status.FAILED;
      });
  },
});

const { actions, reducer } = productSlice;
export const { clearSearch } = actions;
export default reducer;