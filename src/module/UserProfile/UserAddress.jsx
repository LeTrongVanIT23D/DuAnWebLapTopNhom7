import React, { useEffect, useState } from "react";
import DashboardHeading from "../dashboard/DashboardHeding";
import ModalAdvanced from "../../components/Modal/ModalAdvanced";
import Label from "../../components/label/Label";
import Input from "../../components/input/Input";
import { useForm } from "react-hook-form";
import DropdownSelect from "../../components/dropdown/DropdownSelect"; // Giả định component này hoạt động đúng
import axios from "axios";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "../../components/button/Button";
import ListAddress from "./ListAddress";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { addAddress } from "../../redux/auth/addressSlice";
import { useNavigate } from "react-router-dom";

// --- VALIDATION SCHEMA ---
const schema = yup.object({
  fullname: yup
    .string()
    .required("Vui lòng nhập họ tên")
    .min(3, "Tối thiểu phải có 3 ký tự")
    .max(30, "Vượt quá 30 ký tự cho phép"),
  sdt: yup
    .string()
    .required("Vui lòng nhập số điện thoại")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
      message: "Định dạng số điện thoại không đúng",
    }),
  address: yup.string().required("Vui lòng nhập địa chỉ nhà"),
  province: yup.string().required("Vui lòng chọn Tỉnh/ Thành phố"),
  
  // 💥 ĐÃ SỬA LỖI CHÍNH TẢ: Đồng bộ hóa tên trường validation thành 'dictrict'
  dictrict: yup.string().required("Vui lòng chọn Quận/Huyện"), 
  
  ward: yup.string().required("Vui lòng chọn Phường/Xã"),
});

const UserAddress = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid, errors },
    setValue,
    getValues,
    reset,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: {
      fullname: "",
      sdt: "",
      province: "",
      dictrict: "", // Giữ nguyên tên này trong form data
      ward: "",
      address: "",
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [province, setProvince] = useState([]);
  const [provinceId, setProvinceId] = useState(null);
  const [district, setDistrict] = useState([]);
  const [districtId, setDistrictId] = useState(null);
  const [ward, setWard] = useState([]);
  const dispatch = useDispatch();
  const { current } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const bodyStyle = document.body.style;

  // --- LOGIC FETCH API ---

  const fetchProvince = async () => {
    try {
      const { data } = await axios.get("https://provinces.open-api.vn/api/p/");
      setProvince(data);
    } catch (error) {
        console.error("LỖI API TỈNH/THÀNH PHỐ:", error);
        if (error.response) {
            console.error("Status:", error.response.status);
        }
        toast.error("Không thể tải danh sách Tỉnh/Thành phố. Vui lòng kiểm tra kết nối API.");
        setProvince([]);
    }
  };

  const fetchDistrict = async (pId) => {
    if (!pId) {
        setDistrict([]);
        return;
    }
    try {
        const { data } = await axios.get(
            `https://provinces.open-api.vn/api/p/${pId}?depth=2`
        );
        setDistrict(data.districts);
    } catch (error) {
        console.error("LỖI API QUẬN/HUYỆN:", error);
        setDistrict([]);
    }
  };

  const fetchWard = async (dId) => {
    if (!dId) {
        setWard([]);
        return;
    }
    try {
        const { data } = await axios.get(
            `https://provinces.open-api.vn/api/d/${dId}?depth=2`
        );
        setWard(data.wards);
    } catch (error) {
        console.error("LỖI API PHƯỜNG/XÃ:", error);
        setWard([]);
    }
  };

  useEffect(() => {
    fetchProvince();
  }, []);

  useEffect(() => {
    if (provinceId) {
        fetchDistrict(provinceId);
        setDistrictId(null);
        setValue("dictrict", ""); 
        setValue("ward", "");
    } else {
        setDistrict([]);
        setDistrictId(null);
    }
  }, [provinceId, setValue]);

  useEffect(() => {
    if (districtId) {
        fetchWard(districtId);
        setValue("ward", "");
    } else {
        setWard([]);
    }
  }, [districtId, setValue]);

  // --- LOGIC XỬ LÝ KHÁC ---

  useEffect(() => {
    if (current === null) {
      toast.dismiss();
      toast.warning("Vui lòng đăng nhập");
      navigate("/sign-in");
    }
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
  }, [current, navigate]);

  useEffect(() => {
    if (showModal === false) {
        reset({
            fullname: "",
            sdt: "",
            province: "",
            dictrict: "",
            ward: "",
            address: "",
        });
        setProvinceId(null);
        setDistrictId(null);
        enableBodyScroll(bodyStyle);
    } else {
        disableBodyScroll(bodyStyle);
    }
  }, [showModal, reset, bodyStyle]);

  // --- HANDLE SUBMIT ---
  const handleSend = (values) => {
    // 💥 ĐÃ SỬA: Thêm thông báo nếu form không hợp lệ
    if (!isValid) {
      toast.error("Vui lòng điền đầy đủ và chính xác tất cả các trường bắt buộc.");
      // Bỏ return null để cho phép form hiển thị lỗi validation dưới input
      return; 
    }
    
    const dataAddress = {
      name: values.fullname,
      phone: values.sdt,
      detail: values.address,
      province: getValues("province"),
      district: getValues("dictrict"), 
      ward: getValues("ward"),
    };

    try {
      dispatch(addAddress(dataAddress));
      toast.dismiss();
      toast.success("Thêm thành công địa chỉ");
      setShowModal(false);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  // --- RENDERING ---
  return (
    <div>
      <DashboardHeading
        title="Sổ địa chỉ"
        className="px-5 py-5"
      ></DashboardHeading>

      <button
        className="w-full bg-white h-[80px] rounded-md border-2 border-dotted focus:border-solid"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-center gap-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span className="text-base font-medium">Thêm địa chỉ mới </span>
        </div>
      </button>

      <ModalAdvanced
        visible={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        bodyClassName="w-[750px] bg-white rounded-lg relative z-10 content h-[650px] overflow-x-hidden"
      >
        <div className="overflow-y-auto h-[650px] px-10 py-5 ">
          <h3 className="text-lg font-semibold text-black text-left mb-3">
            Thông tin người nhận hàng
          </h3>
          <form onSubmit={handleSubmit(handleSend)} autoComplete="off">
            {/* Input Họ tên */}
            <div className="flex flex-col items-start gap-4 mb-5">
              <Label htmlFor="fullname">* Họ tên</Label>
              <Input
                type="text"
                name="fullname"
                placeholder="Mời bạn nhập tên của bạn"
                control={control}
              ></Input>
              {errors.fullname && (
                <p className="text-red-500 text-base font-medium">
                  {errors.fullname?.message}
                </p>
              )}
            </div>

            {/* Input Số điện thoại */}
            <div className="flex flex-col items-start gap-4 mb-5">
              <Label htmlFor="sdt">* Số điện thoại</Label>
              <Input
                type="number"
                name="sdt"
                placeholder="Mời bạn nhập số điện thoại"
                control={control}
              ></Input>
              {errors.sdt && (
                <p className="text-red-500 text-base font-medium">
                  {errors.sdt?.message}
                </p>
              )}
            </div>

            <h3 className="text-lg font-semibold text-black text-left mb-3">
              Địa chỉ nhận hàng
            </h3>

            <div className="flex items-center justify-between">
              {/* Dropdown Tỉnh/Thành phố */}
              <div className="flex flex-col items-start gap-4 mb-5">
                <Label htmlFor="province">* Tỉnh/Thành phố</Label>
                <DropdownSelect
                  control={control}
                  name="province"
                  dropdownLabel={getValues("province") || "Chọn"}
                  setValue={setValue}
                  data={province}
                  onClick={(id) => setProvinceId(id)}
                ></DropdownSelect>
                {errors.province && (
                  <p className="text-red-500 text-base font-medium">
                    {errors.province?.message}
                  </p>
                )}
              </div>

              {/* Dropdown Quận/Huyện */}
              <div className="flex flex-col items-start gap-4 mb-5">
                <Label htmlFor="district">* Quận/Huyện</Label>
                <DropdownSelect
                  control={control}
                  name="dictrict" 
                  dropdownLabel={getValues("dictrict") || "Chọn"}
                  setValue={setValue}
                  data={district}
                  disable={!provinceId} 
                  onClick={(id) => setDistrictId(id)}
                ></DropdownSelect>
                {errors.dictrict && (
                  <p className="text-red-500 text-base font-medium">
                    {errors.dictrict?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Dropdown Phường/Xã */}
              <div className="flex flex-col items-start gap-4 mb-5">
                <Label htmlFor="ward">* Phường/Xã</Label>
                <DropdownSelect
                  control={control}
                  name="ward"
                  dropdownLabel={getValues("ward") || "Chọn"}
                  setValue={setValue}
                  data={ward}
                  disable={!districtId} 
                ></DropdownSelect>
                {errors.ward && (
                  <p className="text-red-500 text-base font-medium">
                    {errors.ward?.message}
                  </p>
                )}
              </div>

              {/* Input Địa chỉ cụ thể */}
              <div className="flex flex-col items-start gap-4 mb-5">
                <Label htmlFor="address">* Địa chỉ cụ thể</Label>
                <Input
                  type="text"
                  name="address"
                  placeholder="Số nhà, ngõ, tên đường"
                  style={{ width: "300px" }}
                  control={control}
                ></Input>
                {errors.address && (
                  <p className="text-red-500 text-base font-medium">
                    {errors.address?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Button Hủy và Lưu */}
            <div className="flex items-center justify-end gap-x-4 mt-5">
              <button
                className="p-3 text-base font-medium bg-white text-[#316BFF] rounded-lg border border-solid border-[blue]"
                type="button"
                onClick={() => setShowModal(false)}
              >
                Hủy bỏ
              </button>
              <Button
                height="50px"
                type="submit"
                isLoding={isSubmitting}
                disable={isSubmitting}
              >
                Lưu địa chỉ
              </Button>
            </div>
          </form>
        </div>
      </ModalAdvanced>

      <ListAddress />
    </div>
  );
};

export default UserAddress;