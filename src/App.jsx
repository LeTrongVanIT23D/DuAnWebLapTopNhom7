import { Routes, Route } from "react-router-dom";
import React, { useEffect } from "react"; // Thêm useEffect
import { useDispatch } from "react-redux"; // Thêm useDispatch

// --- CSS & Toast ---
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Components ---
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Navbar from "./components/navbar/Navbar";
import ChatStream from "./components/chat/ChatStream";

// --- Pages ---
import HomePage from "./page/HomePage";
import NotFoundPage from "./page/NotFoundPage";
import SignInPage from "./page/SignInPage";
import SignUpPage from "./page/SignUpPage";
import VerifyPage from "./page/VerifyPage";
import ResetPasswordPage from "./page/ResetPasswordPage";
import ForgotPasswordPage from "./page/ForgotPasswordPage";
import ProductDetail from "./page/ProductDetail";
import ProductFilterPage from "./page/ProductFilterPage";

// --- Modules ---
import UserAccount from "./module/UserProfile/UserAccount";
import UserOrder from "./module/UserProfile/UserOrder";
import UserAddress from "./module/UserProfile/UserAddress";
import DashboardLayout from "./module/dashboard/DashboardLayout";
import UpdatePassword from "./module/UserProfile/UpdatePassword";
import CartPage from "./module/cart/CartPage";
import PaymentPage from "./module/payment/PaymentPage";
import PaymentCash from "./module/payment/PaymentCash";
import PaymentBank from "./module/payment/PaymentBank";
import InformationDetailOrder from "./module/UserProfile/InformationDetailOrder";

// --- Configs & Redux ---
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { key } from "./utils/constants/key";
import { getUser } from "./redux/auth/userSlice"; // Import Action getUser

function App() {
  const dispatch = useDispatch();

  // --- 1. LOGIC LOAD USER KHI VÀO APP ---
  useEffect(() => {
    // Kiểm tra xem có token trong localStorage không
    const token = localStorage.getItem("jwt") || localStorage.getItem("access_token");
    
    if (token) {
      // Nếu có token, gọi API lấy thông tin user để nạp vào Redux
      dispatch(getUser());
    }
  }, [dispatch]);

  return (
    <>
      {/* --- 2. CONTAINER ĐỂ HIỆN THÔNG BÁO TOAST --- */}
      <ToastContainer position="top-right" autoClose={2000} />

      <PayPalScriptProvider
        options={{
          "client-id": key.ClientId,
        }}
      >
        <Header />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/sign-in" element={<SignInPage />}></Route>
          <Route path="/sign-up" element={<SignUpPage />}></Route>
          <Route path="/verify" element={<VerifyPage />}></Route>
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          ></Route>
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          ></Route>
          
          {/* Dashboard Layout (User Profile) */}
          <Route element={<DashboardLayout />}>
            <Route path="/account" element={<UserAccount />}></Route>
            <Route path="/account/orders" element={<UserOrder />}></Route>
            <Route
              path="/account/orders/:id"
              element={<InformationDetailOrder />}
            ></Route>
            <Route path="/account/address" element={<UserAddress />}></Route>
            <Route path="/account/chat" element={<ChatStream />}></Route>
            <Route
              path="/account/reset-password"
              element={<UpdatePassword />}
            ></Route>
          </Route>

          <Route element={<ProductDetail />} path="/:slug/:id"></Route>
          <Route path="/cart" element={<CartPage />}></Route>
          <Route path="/checkout" element={<PaymentPage />}></Route>
          <Route path="/product" element={<ProductFilterPage />}></Route>
          <Route path="/payment-cash" element={<PaymentCash />}></Route>
          <Route path="/payment-bank" element={<PaymentBank />}></Route>
          <Route path="/*" element={<NotFoundPage />}></Route>
        </Routes>
        <Footer />
      </PayPalScriptProvider>
    </>
  );
}

export default App;