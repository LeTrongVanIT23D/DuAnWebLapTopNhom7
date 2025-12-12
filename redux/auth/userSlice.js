import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import userApi from "../../api/userApi";
import { action_status } from "../../utils/constants/status";
import StorageKeys from "../../utils/constants/storage-keys";

// --- 1. HELPERS (Hàm phụ trợ) ---

// Xử lý lỗi chung từ API trả về
const handleError = (error, rejectWithValue) => {
  const message = error.response?.data?.message || error.message || "Lỗi không xác định";
  const data = error.response?.data || {};
  return rejectWithValue({ ...data, message });
};

// Lưu thông tin User & Token vào LocalStorage
const saveUserToStorage = (data) => {
  const { token, tokenStream, user } = data; // Giả sử API trả về cấu trúc này trong data hoặc root
  
  // Xử lý linh hoạt tùy cấu trúc response của bạn
  const userToSave = user || data.data?.user || data; 
  const tokenToSave = token || data.token;

  if (tokenToSave) localStorage.setItem(StorageKeys.TOKEN, tokenToSave);
  if (tokenStream) localStorage.setItem("tokenStream", tokenStream);
  if (userToSave) localStorage.setItem(StorageKeys.USER, JSON.stringify(userToSave));
  
  return userToSave;
};

// --- 2. ASYNC THUNKS (Các hành động bất đồng bộ) ---

export const register = createAsyncThunk(
  "user/register",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.register(payload);
      return saveUserToStorage(response); // Tái sử dụng hàm save
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const login = createAsyncThunk(
  "user/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.login(payload);
      return saveUserToStorage(response);
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  "user/loginWithGoogle",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.loginWithGoogle(payload);
      return saveUserToStorage(response);
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const verify = createAsyncThunk(
  "user/verify",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.verify(payload);
      // Verify thường trả về user mới nhất và có thể cả token mới
      return saveUserToStorage(response);
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const changeState = createAsyncThunk(
  "user/changeState",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.changeState(payload);
      // Chỉ cập nhật thông tin user, không đổi token
      localStorage.setItem(StorageKeys.USER, JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const updateInfoUser = createAsyncThunk(
  "user/updateInfoUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUser(payload);
      return saveUserToStorage(response);
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const getUser = createAsyncThunk(
  "user/getUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.getUser();
      const userData = response.data?.data || response.data;
      localStorage.setItem(StorageKeys.USER, JSON.stringify(userData));
      return userData;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

// Các action không cần lưu Storage
export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await userApi.resetPassword(payload, payload.token);
      return saveUserToStorage(response);
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      await userApi.forgotPassword(payload);
      return { success: true }; // Chỉ cần trả về thành công
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const verifyResetPassword = createAsyncThunk(
  "user/verifyResetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await userApi.verifyResetPassword(payload);
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

// --- 3. SLICE ---

const userSlice = createSlice({
  name: "user",
  initialState: {
    current: JSON.parse(localStorage.getItem(StorageKeys.USER)) || null,
    status: action_status.IDLE,
    error: null,
    update: false, // Cờ đánh dấu vừa update xong để reload component
  },
  reducers: {
    logout(state) {
      // Xóa sạch mọi thứ liên quan đến user
      localStorage.removeItem(StorageKeys.TOKEN);
      localStorage.removeItem(StorageKeys.USER);
      localStorage.removeItem("order");
      localStorage.removeItem("keyword");
      localStorage.removeItem("tokenStream");
      
      // Reset state về mặc định
      state.current = null;
      state.status = action_status.IDLE;
      state.error = null;
    },
    refresh: (state) => {
      state.update = false;
      state.error = null;
      state.status = action_status.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- XỬ LÝ THÀNH CÔNG (FULFILLED) ---
      // Nhóm các action có chung logic cập nhật User
      .addMatcher(
        isAnyOf(
          register.fulfilled,
          login.fulfilled,
          loginWithGoogle.fulfilled,
          verify.fulfilled,
          changeState.fulfilled,
          updateInfoUser.fulfilled,
          getUser.fulfilled,
          resetPassword.fulfilled
        ),
        (state, action) => {
          state.status = action_status.SUCCEEDED;
          state.current = action.payload; // Cập nhật user hiện tại
          state.error = null;
        }
      )
      // Riêng updateInfoUser bật cờ update
      .addMatcher(
        (action) => action.type === updateInfoUser.fulfilled.type,
        (state) => { state.update = true; }
      )
      
      // --- XỬ LÝ ĐANG CHẠY (PENDING) ---
      // Tự động bật Loading cho TẤT CẢ các async thunk trong slice này
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.status = action_status.LOADING;
          state.error = null;
        }
      )

      // --- XỬ LÝ THẤT BẠI (REJECTED) ---
      // Tự động tắt Loading và lưu lỗi cho TẤT CẢ các async thunk
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = action_status.FAILED;
          state.error = action.payload; // Lưu chi tiết lỗi
        }
      );
  },
});

const { actions, reducer } = userSlice;
export const { logout, refresh } = actions;
export default reducer;