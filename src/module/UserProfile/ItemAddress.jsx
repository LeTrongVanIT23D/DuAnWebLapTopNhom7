import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import DropdownSelect from "../../components/dropdown/DropdownSelect"; 
import Input from "../../components/input/Input";
import Label from "../../components/label/Label";
import ModalAdvanced from "../../components/Modal/ModalAdvanced";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "../../components/button/Button";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {
  deleteAddress,
  editAddress,
  setAddressDefault,
} from "../../redux/auth/addressSlice";

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
  district: yup.string().required("Vui lòng chọn Quận/ Huyện"),
  ward: yup.string().required("Vui lòng chọn Phường/Xã"),
});

const ItemAddress = ({ data, data_key }) => {
  const [showModal, setShowModal] = useState(false);
  const bodyStyle = document.body.style;

  const {
    control,
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    getValues,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      fullname: "",
      sdt: "",
      province: "",
      district: "",
      ward: "",
      address: "",
    },
    resolver: yupResolver(schema),
  });

  const dispatch = useDispatch();
  
  // Trạng thái cho dữ liệu API và ID (code)
  const [province, setProvince] = useState([]);
  const [provinceId, setProvinceId] = useState(null); // Sử dụng null
  const [district, setDistrict] = useState([]);
  const [districtId, setDistrictId] = useState(null); // Sử dụng null
  const [ward, setWard] = useState([]);

  // Hàm fetchProvince: Tải danh sách tỉnh/thành phố
  const fetchProvince = async () => {
    try {
      // ⚠️ ĐÃ SỬA: Thêm dấu gạch chéo cuối cùng (/)
      const { data } = await axios.get("https://provinces.open-api.vn/api/p/");
      setProvince(data);
    } catch (error) {
      console.error("LỖI API TỈNH/THÀNH PHỐ:", error);
      toast.error("Không thể tải danh sách Tỉnh/Thành phố.");
      setProvince([]);
    }
  };

  // Hàm fetchDistrict: Tải danh sách Quận/Huyện dựa trên ProvinceId
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
      console.error("Lỗi khi tải Quận/Huyện:", error);
      setDistrict([]);
    }
  };

  // Hàm fetchWard: Tải danh sách Phường/Xã dựa trên DistrictId
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
      console.error("Lỗi khi tải Phường/Xã:", error);
      setWard([]);
    }
  };

  // Effect 1: Tải dữ liệu Tỉnh/Thành phố khi component mount
  useEffect(() => {
    fetchProvince();
  }, []);

  // Effect 2: Tải dữ liệu Quận/Huyện khi provinceId thay đổi
  useEffect(() => {
    if (provinceId) {
      fetchDistrict(provinceId);
      // Reset DistrictId và Ward khi ProvinceId thay đổi
      setDistrictId(null); 
      setValue("district", "");
      setValue("ward", "");
    } else {
        setDistrict([]);
        setDistrictId(null);
    }
  }, [provinceId, setValue]);

  // Effect 3: Tải dữ liệu Phường/Xã khi districtId thay đổi
  useEffect(() => {
    if (districtId) {
      fetchWard(districtId);
      // Reset Ward khi DistrictId thay đổi
      setValue("ward", "");
    } else {
        setWard([]);
    }
  }, [districtId, setValue]);

  // Effect 4: Xử lý Modal Mở/Đóng và Set giá trị mặc định (Edit)
  useEffect(() => {
    if (showModal) {
      // 1. Tải toàn bộ dữ liệu địa chỉ ban đầu dựa trên tên
      const loadInitialIdsAndData = async () => {
        // Tìm ID của tỉnh/thành phố dựa trên tên cũ (data.province)
        const initialProvince = province.find(
          (p) => p.name === data.province
        );
        if (initialProvince) {
          const pCode = initialProvince.code;
          setProvinceId(pCode);
          
          // Tải toàn bộ dữ liệu cấp 3 cho tỉnh/thành phố này
          try {
            const { data: pData } = await axios.get(`https://provinces.open-api.vn/api/p/${pCode}?depth=3`);
            setDistrict(pData.districts);
            
            const initialDistrict = pData.districts.find(d => d.name === data.district);
            if (initialDistrict) {
              const dCode = initialDistrict.code;
              setDistrictId(dCode);
              
              // Tìm Ward (đã có trong pData.districts[...].wards, nhưng chúng ta cần set state ward)
              const districtWithWards = pData.districts.find(d => d.code === dCode);
              if (districtWithWards) {
                  setWard(districtWithWards.wards);
              }
            }
          } catch (e) {
              console.error("Lỗi tải địa chỉ ban đầu:", e);
              toast.error("Không thể tải chi tiết địa chỉ cũ.");
          }
        }
      };
      
      // Chạy logic khởi tạo ID
      loadInitialIdsAndData();
      
      // 2. Set giá trị cho form (dùng tên cũ)
      reset({
        fullname: data.name,
        sdt: data.phone,
        province: data.province, 
        district: data.district,
        ward: data.ward,
        address: data.detail,
      });

      disableBodyScroll(bodyStyle);
    } else {
      enableBodyScroll(bodyStyle);
      // Khi đóng Modal, reset IDs và data để chuẩn bị cho lần mở tiếp theo
      setProvinceId(null); 
      setDistrictId(null);
      setDistrict([]);
      setWard([]);
    }
  }, [showModal, data, province, reset, bodyStyle]); // Thêm dependencies cần thiết

  // --- HÀM XỬ LÝ SỰ KIỆN ---

  const handleDelete = () => {
    Swal.fire({
      title: "Xóa ",
      text: "Bạn có chắc chắn muốn xóa không ?",
      showCancelButton: true,
      icon: "question",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có",
      cancelButtonText: "Không",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const data = {
            id: data_key,
          };
          dispatch(deleteAddress(data));
          Swal.fire("Xóa thành công");
        } catch (error) {
          console.log(error.message);
        }
      }
    });
  };

  const handleEdit = (values) => {
    const dataEdit = {
      id: data_key,
      name: values.fullname,
      phone: values.sdt,
      province: getValues("province"),
      district: getValues("district"),
      ward: getValues("ward"),
      detail: values.address,
      setDefault: data.setDefault,
    };
    try {
      dispatch(editAddress(dataEdit));
      toast.dismiss();
      toast.success("Cập nhật địa chỉ thành công", { pauseOnHover: false });
      setShowModal(false);
    } catch (error) {
      console.log(error.message);
      toast.error("Cập nhật thất bại.");
    }
  };

  const handleDefault = (data_key) => {
    const dataKey = {
      id: data_key,
    };
    try {
      dispatch(setAddressDefault(dataKey));
    } catch (error) {
      console.log(error.message);
    }
  };

  // --- RENDERING ---
  return (
    <>
      <div className="w-full bg-white border-2 border-dotted text-black px-5 py-5 rounded-lg flex items-center justify-between my-7 focus:border-solid">
        <div className="flex flex-col justify-between ">
          <div className="flex items-center gap-x-5 mb-2">
            <h3 className="font-medium text-base ">{data.name}</h3>
            {data.setDefault && (
              <div className="px-1 py-1 bg-blue-100 rounded-md font-medium text-sm">
                Mặc định
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-normal">
              Địa chỉ: {data.detail} , {data.ward}, {data.district} ,
              {data.province}
            </span>
            <span className="text-sm font-normal">
              Điện thoại: {data.phone}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-start gap-x-4">
          {!data.setDefault && (
            <button
              className="border-2 border-solid px-2 py-2 text-green-400 font-medium border-green-400 rounded-lg"
              type="button"
              onClick={() => handleDefault(data_key)}
            >
              Đặt làm mặc định
            </button>
          )}

          <button
            className="border-2 border-solid px-2 py-2 text-blue-400 font-medium border-blue-400 rounded-lg"
            type="button"
            onClick={() => setShowModal(true)}
          >
            Chỉnh sửa
          </button>
          <button
            className="border-2 border-solid px-2 py-2 text-red-600 font-medium border-[red] rounded-lg"
            type="button"
            onClick={handleDelete}
          >
            Xóa
          </button>
        </div>
      </div>

      <ModalAdvanced
        visible={showModal}
        onClose={() => setShowModal(false)}
        bodyClassName="w-[750px] bg-white rounded-lg relative z-10 content overflow-y-auto"
      >
        <div className="h-[650px] overflow-x-hidden px-10 py-5 ">
          <h3 className="text-lg font-semibold text-black text-left mb-3">
            Thông tin người nhận hàng
          </h3>
          <form autoComplete="off" onSubmit={handleSubmit(handleEdit)}>
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

            {/* Dropdown Tỉnh/Thành phố */}
            <div className="flex items-center justify-between">
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
                  name="district"
                  dropdownLabel={getValues("district") || "Chọn"}
                  setValue={setValue}
                  data={district}
                  // disable nếu chưa chọn tỉnh
                  disable={!provinceId} 
                  onClick={(id) => setDistrictId(id)} 
                ></DropdownSelect>
                {errors.district && (
                  <p className="text-red-500 text-base font-medium">
                    {errors.district?.message}
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
                  // disable nếu chưa chọn huyện
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
                type="submit"
                height="50px"
                isLoding={isSubmitting}
                disable={isSubmitting}
              >
                <span className="text-base font-medium">Lưu địa chỉ</span>
              </Button>
            </div>
          </form>
        </div>
      </ModalAdvanced>
    </>
  );
};

export default ItemAddress;