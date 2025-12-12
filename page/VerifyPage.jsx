// Vinh Làm 


import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// Redux & Components
import { changeState, verify } from "../redux/auth/userSlice";
import AuthenticationPage from "./AuthenticationPage";

// Schema Validation
const schema = yup.object({
  verify: yup
    .string()
    .required("Vui lòng nhập mã xác nhận")
    .min(6, "Mã xác nhận phải đủ 6 ký tự")
    .matches(/^[0-9]+$/, "Mã xác nhận chỉ chứa số")
    .trim(),
});

const VerifyPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setFocus,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dem = useRef(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // --- 1. KIỂM TRA QUYỀN TRUY CẬP ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFocus("verify");

    const token = localStorage.getItem("jwt");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      navigate("/sign-up");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user?.active === "active") {
        navigate("/");
      }
    } catch (e) {
      localStorage.clear();
      navigate("/sign-up");
    }
  }, [navigate, setFocus]);

  // --- 2. XỬ LÝ VERIFY ---
  const handleVerify = async (values) => {
    // 1. Strict Validation: Ensure code is not empty
    if (!values.verify || values.verify.trim() === "") {
        toast.error("Vui lòng nhập mã xác nhận");
        return;
    }

    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (!currentUser?.email) {
      toast.error("Lỗi phiên đăng nhập. Vui lòng thử lại.");
      navigate("/sign-in");
      return;
    }

    // 2. PAYLOAD FIX: Send multiple keys to ensure Backend finds one
    const data = {
      email: currentUser.email,
      encode: values.verify,  // Your original key
      otp: values.verify,     // Common backend key 1
      code: values.verify,    // Common backend key 2
      verifyCode: values.verify // Common backend key 3
    };

    console.log("SENDING DATA:", data); // Check Console F12 to confirm data is not empty

    try {
      const action = verify(data);
      const resultAction = await dispatch(action);
      unwrapResult(resultAction);

      toast.success("Kích hoạt thành công! 🎉");
      navigate("/");
      
    } catch (error) {
      dem.current += 1;
      const left = 3 - dem.current;
      setAttemptsLeft(left);

      console.error("Verify Error:", error);
      // Safely access error message
      const serverMsg = error?.message || error?.msg || "Mã xác nhận không đúng";

      if (dem.current >= 3) {
        toast.error("Tài khoản đã bị khóa do nhập sai quá 3 lần.");
        try {
          if (currentUser.active === "verify") {
            await dispatch(changeState({ email: currentUser.email, state: "ban" }));
            localStorage.clear();
            navigate("/sign-up");
          }
        } catch (e) {}
      } else {
        toast.error(`${serverMsg}. Bạn còn ${left} lần thử.`);
        reset({ verify: "" });
        setFocus("verify");
      }
    }
  };

  return (
    <AuthenticationPage>
      <div className="w-full max-w-xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Xác Thực Tài Khoản</h2>
          <p className="text-gray-500">
            Mã OTP 6 số đã được gửi đến email của bạn.<br/>Vui lòng kiểm tra hòm thư (kể cả mục Spam).
          </p>
        </div>

        <form onSubmit={handleSubmit(handleVerify)} autoComplete="off" className="space-y-6">
          
          <div className="flex flex-col items-center">
            <input
              {...register("verify")}
              type="text"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`
                w-full h-16 text-center text-3xl font-bold tracking-[10px] 
                border-2 rounded-xl outline-none transition-all duration-300
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                ${errors.verify ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"}
              `}
              placeholder="••••••"
            />
            
            {errors.verify ? (
              <p className="text-red-500 text-sm mt-3 font-medium animate-bounce">
                {errors.verify.message}
              </p>
            ) : (
              <p className={`text-sm mt-3 font-medium ${attemptsLeft < 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                {attemptsLeft < 3 ? `Cảnh báo: Còn ${attemptsLeft} lần thử` : "Nhập mã 6 chữ số"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all transform hover:-translate-y-1
              ${isSubmitting 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30"}
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang kiểm tra...
              </span>
            ) : (
              "XÁC NHẬN NGAY"
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Không nhận được mã?{" "}
              <button 
                type="button" 
                className="text-blue-600 font-semibold hover:underline"
                onClick={() => toast.info("Vui lòng đợi 60s để gửi lại mã")}
              >
                Gửi lại mã
              </button>
            </p>
          </div>

        </form>
      </div>
    </AuthenticationPage>
  );
};

export default VerifyPage;