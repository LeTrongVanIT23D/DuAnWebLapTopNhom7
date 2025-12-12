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
const helmet = require("helmet"); // Thêm Helmet cho bảo mật

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController"); // Import Global Error Handler (Đảm bảo file này tồn tại)

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
app.set("views", path.join(__dirname, "views"));

// --- 2. GLOBAL MIDDLEWARES (Bảo mật trước tiên) ---

// Bảo mật HTTP Headers
app.use(helmet());

// Cấu hình CORS
const allowedOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  // Thêm biến môi trường CORS_ORIGIN nếu cần
  process.env.CORS_ORIGIN,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request nếu không có origin (VD: Postman) hoặc nằm trong danh sách
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Chỉ chặn nếu origin không nằm trong danh sách
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Xử lý Pre-flight requests
app.options('*', cors()); 

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
app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization (Chống NoSQL injection & XSS)
app.use(mongoSanitize());
app.use(xss());

// Chống ô nhiễm tham số (Parameter Pollution)
app.use(
  hpp({
    whitelist: [
      "ratingsQuantity", "ratingsAverage", "price", "duration", "difficulty",
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// --- 3. SERVING STATIC FILES ---
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use("/text", express.static(path.join(__dirname, "node_modules/tinymce/")));
app.use(express.static(path.join(__dirname, "public")));

// --- 4. ROUTES ---

// API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter); // <-- Kiểm tra file orderRoutes.js
app.use("/api/v1/imports", importRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/payments", transactionRouter);
app.use("/api/v1/locations", locationRouter);

// View Routes (Render trang web)
app.use("/", viewRouter);

// --- 5. XỬ LÝ LỖI 404 (NOT FOUND) ---

app.all("/api/*", (req, res, next) => {
  next(new AppError(`Không thể tìm thấy ${req.originalUrl} trên server API!`, 404));
});

app.all("*", (req, res, next) => {
  res.status(404).render("404", { title: "Không tìm thấy trang" });
});

// --- 6. GLOBAL ERROR HANDLER ---
// Sử dụng Global Error Handler đã import
app.use(globalErrorHandler); 

module.exports = app;