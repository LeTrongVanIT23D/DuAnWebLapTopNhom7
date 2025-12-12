const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { connect } = require("getstream");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

// === JWT & COOKIE HELPER ===
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const setAuthCookie = (res, token, minutes) => {
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: minutes * 60 * 1000,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieMinutes = parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 90;
  setAuthCookie(res, token, cookieMinutes);

  user.password = undefined;
  res.locals.user = user;

  const serverClient = connect(api_key, api_secret, app_id);
  const tokenStream = serverClient.createUserToken(user._id.toString());

  res.status(statusCode).json({
    status: "success",
    token,
    tokenStream,
    data: { user },
  });
};

// === GỬI MÃ XÁC NHẬN ===
const sendVerifyToken = catchAsync(async (user, statusCode, res) => {
  const verifyToken = user.createVerifyToken(); // ← Trả về mã thô
  // user.userVerifyExpires = Date.now() + 10 * 60 * 1000; // 10 phút (Đã tự set trong model)
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  const cookieMinutes = parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 90;
  setAuthCookie(res, token, cookieMinutes);

  const verifyURL = `http://127.0.0.1:5173/verify`;
  const message = `
    Bạn là chủ tài khoản? Vui lòng xác nhận tại: ${verifyURL}
    Mã xác nhận: ${verifyToken}
    (Hiệu lực 10 phút. Nếu không phải bạn, bỏ qua email này.)
  `.trim();

  try {
    await sendEmail({
      email: user.email,
      subject: "Xác nhận tài khoản (10 phút)",
      message,
    });

    res.status(statusCode).json({
      status: "success",
      token,
      data: { user },
      message: "Mã xác nhận đã được gửi đến email!",
    });
  } catch (err) {
    user.userVerifyToken = undefined;
    user.userVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Lỗi gửi email:", err);
    // Lỗi này thường do .env (EMAIL_PASSWORD) bị sai
    return res.status(500).json({
      status: "error",
      message: "Gửi email thất bại. Vui lòng thử lại.",
    });
  }
});

// === ROUTE HANDLERS ===
exports.changeStateUser = catchAsync(async (req, res, next) => {
  // ... (code của bạn đã ổn)
  const token = req.cookies.jwt;
  if (!token) return next(new AppError("Không tìm thấy token", 401));

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError("Người dùng không tồn tại.", 401));

  currentUser.active = req.body.state;
  await currentUser.save({ validateBeforeSave: false });
  currentUser.password = undefined;

  res.status(200).json({
    status: "success",
    message: "Cập nhật trạng thái thành công!",
    data: { user: currentUser },
  });
});

exports.verifyUser = catchAsync(async (req, res, next) => {
  const code = req.body.code?.trim();
  if (!code) {
    return next(new AppError("Vui lòng nhập mã xác nhận!", 400));
  }
  const hashedToken = crypto.createHash("sha256").update(code).digest("hex");
  const user = await User.findOne({
    userVerifyToken: hashedToken,
    userVerifyExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Mã xác nhận không hợp lệ hoặc đã hết hạn!", 400));
  }
  user.active = "active";
  user.userVerifyToken = undefined;
  user.userVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });
  await createSendToken(user, 200, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  const userExist = await User.findOne({ email: req.body.email });
  if (userExist) {
    return next(new AppError("Email này đã được đăng ký.", 400));
  }

  //
  // !!! LỖI 500 XUẤT PHÁT TỪ ĐÂY !!!
  // Frontend BẮT BUỘC phải gửi 'passwordConfirm'.
  // Nếu không, 'User.create' sẽ báo lỗi Validation
  // và 'catchAsync' sẽ trả về lỗi 500.
  //
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm, // <<< PHẢI CÓ
    active: "verify",
  });

  // Lỗi 500 thứ hai có thể xảy ra ở đây nếu .env (EMAIL_PASSWORD) bị sai
  await sendVerifyToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Vui lòng cung cấp email và mật khẩu!", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  
  // Lỗi 401 là do signup (ở trên) thất bại -> user = null
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Email hoặc mật khẩu không chính xác", 401));
  }

  if (user.active === "verify") {
    return sendVerifyToken(user, 200, res);
  }

  await createSendToken(user, 200, res);
});

// ... (Tất cả các hàm khác của bạn)
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError("Bạn chưa đăng nhập!", 401));
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError("Token không hợp lệ.", 401));
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.", 401));
  }
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies?.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
        res.locals.user = currentUser;
        return next();
      }
    } catch (err) {
      // ignore
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Bạn không có quyền thực hiện hành động này", 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("Không tìm thấy tài khoản với email này.", 404));
  const resetToken = user.createPasswordResetToken();
  // user.passwordResetExpires = Date.now() + 10 * 60 * 1000; (Đã tự set trong model)
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get("host")}/forgot-password`;
  const message = `Mã đặt lại mật khẩu: ${resetToken}\nTruy cập: ${resetURL}\n(Hiệu lực 10 phút)`;
  try {
    await sendEmail({ email: user.email, subject: "Đặt lại mật khẩu (10 phút)", message });
    res.status(200).json({ status: "success", message: "Đã gửi mã đến email!" });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Gửi email thất bại. Thử lại sau!", 500));
  }
});

exports.verifyResetPass = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Token không hợp lệ hoặc đã hết hạn", 400));
  res.status(200).json({ status: "success", message: "Token hợp lệ" });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // ĐÃ SỬA: Token phải được hash trước khi tìm
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken, // Tìm bằng token đã hash
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token không hợp lệ hoặc đã hết hạn", 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // Model hook sẽ hash password

  await createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Mật khẩu hiện tại không đúng.", 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  await createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 1000,
  });
  res.status(200).json({ status: "success" });
};

exports.googleLogin = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Không được phép truy cập" });
  }
  await createSendToken(user, 200, res);
});

exports.userLoginWith = catchAsync(async (req, res, next) => {
  const { email, displayName } = req.body.user;
  let user = await User.findOne({ email });

  if (!user) {
    const password = email + process.env.JWT_SECRET;
    user = await User.create({
      email,
      name: displayName,
      password,
      passwordConfirm: password,
      active: "active",
    });
  } else {
    if (user.active === "ban") return next(new AppError("Tài khoản đã bị khóa.", 401));
    if (user.active === "verify") {
      user.active = "active";
      await user.save({ validateBeforeSave: false });
    }
  }

  await createSendToken(user, 200, res);
});