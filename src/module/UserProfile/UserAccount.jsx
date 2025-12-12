import React, { useEffect, useState } from "react";
import DashboardHeading from "../dashboard/DashboardHeding";
import Button from "../../components/button/Button";
import Field from "../../components/field/Field";
import Label from "../../components/label/Label";
import Input from "../../components/input/Input";
import { useForm } from "react-hook-form";
import FieldCheckboxes from "../../components/field/FieldCheckboxes";
import Radio from "../../components/checkbox/Radio";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import ImageUpload from "../../components/images/ImageUpload";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getUser, refresh, updateInfoUser } from "../../redux/auth/userSlice";
import { action_status } from "../../utils/constants/status";
import Skeleton from "../../components/skeleton/Skeleton";
import { useNavigate } from "react-router-dom";

const today = moment();
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
  dateOfBirth: yup
    .string()
    .required("Vui lòng chọn ngày sinh")
    .nullable()
    // Lưu ý: Cần xử lý logic validate ngày sinh cẩn thận với moment object vs string
    .test("is-valid-date", "Ngày sinh không hợp lệ", (value) => {
      return moment().diff(moment(value), 'days') >= 0;
    }), 
  gender: yup.string().oneOf(["nam", "nữ", "khác"], "Vui lòng chọn giới tính"),
});

const Gender = {
  NAM: "nam",
  NU: "nữ",
  KHAC: "khác",
};

const UserAccount = () => {
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    getValues,
    reset,
    formState: { isSubmitting, isValid, errors },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, update, status, current } = useSelector((state) => state.user);

  const watchGender = watch("gender");
  const [image, setImage] = useState("");
  const [progress, setProgress] = useState(0);

  // 1. Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("jwt"); // Hoặc key bạn dùng lưu token
    if (!token && !current) {
      toast.dismiss();
      toast.warning("Vui lòng đăng nhập");
      navigate("/sign-in");
    }
  }, [current, navigate]);

  // 2. Logic sau khi update thành công -> Gọi lại data mới
  useEffect(() => {
    if (update) {
      dispatch(getUser()); // Lấy data mới nhất từ server
      dispatch(refresh()); // Reset biến update về false
    }
  }, [update, dispatch]);

  // 3. Gọi dữ liệu lần đầu
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // 4. QUAN TRỌNG: Fill dữ liệu vào form khi biến 'user' thay đổi
  useEffect(() => {
    if (user) {
      reset({
        fullname: user.name || "",
        image: user.avatar || "",
        email: user.email || "",
        sdt: user.phone || "",
        // Format ngày tháng chuẩn YYYY-MM-DD cho input type="date"
        dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth).format("YYYY-MM-DD") : "",
        gender: user.gender || "nam",
      });
      setImage(user.avatar || "");
    }
  }, [user, reset]);

  const handleSelectImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const urlImage = await handleUpLoadImage(file);
    setImage(urlImage);
  };

  const handleUpLoadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios({
        method: "post",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        url: "https://api.imgbb.com/1/upload?key=faf46b849aaf25c8587aec2835f05b26",
        onUploadProgress: (data) => {
          setProgress(Math.round((100 * data.loaded) / data.total));
        },
      });
      return response.data.data.url;
    } catch (error) {
      console.error("Upload image failed", error);
      toast.error("Lỗi upload ảnh");
      return "";
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const handleUpdate = async (values) => {
    if (!isValid) return;
    
    const cloneValues = { ...values };
    cloneValues.gender = getValues("gender"); // Lấy giá trị gender hiện tại
    cloneValues.dateOfBirth = getValues("dateOfBirth");
    cloneValues.avatar = image;
    cloneValues.name = values.fullname;
    cloneValues.phone = values.sdt;

    // Bỏ các trường không cần thiết gửi lên API nếu có (ví dụ email thường ko cho sửa ở đây)
    
    try {
      // Dispatch action update
      await dispatch(updateInfoUser(cloneValues)).unwrap();
      
      toast.dismiss();
      toast.success("Cập nhật thông tin thành công", { pauseOnHover: false });
      
      // Lưu ý: useEffect [update] sẽ chạy sau khi action này thành công để load lại data
    } catch (error) {
      toast.dismiss();
      // Xử lý lỗi từ rejectWithValue trong Redux Toolkit trả về
      toast.error(error?.message || "Cập nhật thất bại");
    }
  };

  const handleDeleteImage = () => {
    setImage("");
    setProgress(0);
  };

  if (status === action_status.LOADING && !user) {
     return (
        <div className="bg-white rounded-lg p-5">
             <div className="pb-16">
            <Field>
              <Skeleton className="w-[100px] h-4 rounded-lg" />
              <Skeleton className="w-36 h-36 rounded-full mx-auto" />
            </Field>
            {/* ... Skeleton Loading UI ... */}
            <Skeleton className="w-full h-10 rounded-md mt-5" />
          </div>
        </div>
     )
  }

  return (
    <>
      <div className="bg-white rounded-lg">
        <DashboardHeading
          title="Thông tin tài khoản"
          className="px-5 py-5"
        ></DashboardHeading>
        
        <form className="pb-16" onSubmit={handleSubmit(handleUpdate)}>
            <Field>
              <Label>Ảnh đại diện</Label>
              <ImageUpload
                onChange={handleSelectImage}
                className="mx-auto"
                progress={progress}
                image={image}
                handleDeleteImage={handleDeleteImage}
              ></ImageUpload>
            </Field>

            <Field>
              <Label htmlFor="fullname">Họ tên</Label>
              <Input name="fullname" control={control} type="text"></Input>
              {errors.fullname && (
                <p className="text-red-500 text-base font-medium">
                  {errors.fullname?.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="email">Email</Label>
              <Input name="email" control={control} disabled></Input>
            </Field>

            <Field>
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input name="sdt" type="number" control={control}></Input>
              {errors.sdt && (
                <p className="text-red-500 text-base font-medium">
                  {errors.sdt?.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="dateOfBirth">Ngày sinh</Label>
              <Input name="dateOfBirth" type="date" control={control}></Input>
              {errors.dateOfBirth && (
                <p className="text-red-500 text-base font-medium">
                  {errors.dateOfBirth?.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldCheckboxes>
                <Label htmlFor="gender">Giới tính</Label>
                <div className="flex gap-x-5">
                    <Radio
                    name="gender"
                    control={control}
                    checked={watchGender === Gender.NAM}
                    value={Gender.NAM}
                    onClick={() => setValue("gender", "nam")}
                    >
                    Nam
                    </Radio>
                    <Radio
                    name="gender"
                    control={control}
                    checked={watchGender === Gender.NU}
                    value={Gender.NU}
                    // Sửa lỗi: Set đúng giá trị 'nữ' khớp với Schema
                    onClick={() => setValue("gender", "nữ")}
                    >
                    Nữ
                    </Radio>
                    <Radio
                    name="gender"
                    control={control}
                    checked={watchGender === Gender.KHAC}
                    value={Gender.KHAC}
                    // Sửa lỗi: Set đúng giá trị 'khác' khớp với Schema
                    onClick={() => setValue("gender", "khác")}
                    >
                    Khác
                    </Radio>
                </div>
              </FieldCheckboxes>
              {errors.gender && (
                <p className="text-red-500 text-base font-medium">
                  {errors.gender?.message}
                </p>
              )}
            </Field>

            <Button
              kind="primary"
              className="mx-auto w-[200px] mt-10"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              height="50px"
            >
              Cập nhật thông tin
            </Button>
          </form>
      </div>
    </>
  );
};

export default UserAccount;