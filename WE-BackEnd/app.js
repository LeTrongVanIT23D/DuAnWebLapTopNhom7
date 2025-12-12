const express = require("express");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const engine = require("ejs-mate");

const AppError = require("./utils/appError");

// Import Routes
const productRouter = require("./routes/productRoutes");
const userRouter = require("./routes/userRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const brandRouter = require("./routes/brandRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const orderRouter = require("./routes/orderRoutes");
const importRouter = require("./routes/importRoutes");
const commentRouter = require("./routes/commentRoutes");
const viewRouter = require("./routes/viewRoutes");
const transactionRouter = require("./routes/transactionRoutes");
const locationRouter = require("./routes/locationRoutes");

const app = express();

// --- 1. CẤU HÌNH VIEW ENGINE ---
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Đảm bảo Express tìm đúng thư mục views

// --- 2. CẤU HÌNH CORS (QUAN TRỌNG) ---
// Cho phép cả localhost và 127.0.0.1 để tránh lỗi kết nối từ Frontend
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      // Thêm domain đã deploy của bạn vào đây (nếu có)
      // "https://ten-du-an-cua-ban.onrender.com"
    ],
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    credentials: true, // Cho phép gửi cookie
  })
);

// --- 3. SERVING STATIC FILES ---
// Sử dụng path.join để an toàn trên mọi hệ điều hành
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use("/text", express.static(path.join(__dirname, "node_modules/tinymce/")));
app.use(express.static(path.join(__dirname, "public")));

// --- 4. GLOBAL MIDDLEWARES ---
app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Giới hạn request (Rate Limiting)
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 giờ
  message: "Quá nhiều request từ IP này, vui lòng thử lại sau 1 giờ!",
});
app.use("/api", limiter);

// Body parser (Đọc dữ liệu từ body request)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Data sanitization (Chống NoSQL injection & XSS)
app.use(mongoSanitize());
app.use(xss());

// Chống ô nhiễm tham số (Parameter Pollution)
app.use(
  hpp({
    whitelist: [
      "ratingsQuantity",
      "ratingsAverage",
      "price",
      "duration",
      "difficulty",
    ],
  })
);

// Test middleware (Gán thời gian vào request)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// --- 5. ROUTES ---

// API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/imports", importRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/payments", transactionRouter);
app.use("/api/v1/locations", locationRouter);

// View Routes (Render trang web)
app.use("/", viewRouter);

// --- 6. XỬ LÝ LỖI 404 (NOT FOUND) ---

// 6.1. Xử lý 404 cho API (Trả về JSON)
app.all("/api/*", (req, res, next) => {
  next(new AppError(`Không thể tìm thấy ${req.originalUrl} trên server API!`, 404));
});

// 6.2. Xử lý 404 cho View (Render trang lỗi)
app.all("*", (req, res, next) => {
  // Đảm bảo bạn có file views/404.ejs
  res.status(404).render("404", { title: "Không tìm thấy trang" });
});

// --- 7. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // LOG LỖI RA CONSOLE ĐỂ DEBUG
  console.error("🔥 ERROR 💥", err);

  // A) NẾU LÀ API: Trả về JSON
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) NẾU LÀ VIEW: Render trang lỗi
  // Đảm bảo bạn có file views/error.ejs
  return res.status(err.statusCode).render("error", {
    title: "Đã có lỗi xảy ra!",
    message: "Xin lỗi, đã xảy ra sự cố. Vui lòng thử lại sau.",
  });
});

module.exports = app;