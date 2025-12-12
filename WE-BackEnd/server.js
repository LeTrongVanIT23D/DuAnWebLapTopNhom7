const mongoose = require("mongoose");
const dotenv = require("dotenv");

// --- XỬ LÝ LỖI ĐỒNG BỘ (phải ở trên cùng) ---
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Đang tắt server...");
  console.log(err.name, err.message);
  process.exit(1);
});

// 1. Tải file .env TRƯỚC khi gọi "app"
// (Vì file "app" cần process.env.NODE_ENV)
dotenv.config({ path: "./config.env" });

const app = require("./app");

// 2. KẾT NỐI DATABASE
// ĐÃ SỬA: Không cần .replace()
// File .env của bạn nên chứa chuỗi kết nối HOÀN CHỈNH
const DB = process.env.DATABASE;

if (!DB) {
  console.error("LỖI: Không tìm thấy chuỗi kết nối DATABASE trong file .env");
  process.exit(1); // Thoát nếu không có DB
}

mongoose
  .connect(DB)
  .then(() => console.log("✅ Kết nối Database thành công!"))
  .catch((err) => {
    console.error("❌ Kết nối Database thất bại!");
    console.error(err);
    process.exit(1); // Thoát nếu không kết nối được DB
  });

// 3. KHỞI ĐỘNG SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Ứng dụng đang chạy trên cổng ${port}...`);
});

// --- XỬ LÝ LỖI BẤT ĐỒNG BỘ (Promises) ---
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Đang tắt server...");
  console.log(err.name, err.message);

  // Đóng server một cách duyên dáng
  server.close(() => {
    process.exit(1);
  });
});