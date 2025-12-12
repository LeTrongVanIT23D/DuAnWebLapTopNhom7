const fs = require("fs"); // Import thêm để xóa file tạm
const Product = require("./../models/productModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("./../utils/appError");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const multer = require("multer");

// --- 1. CONFIG UPLOAD ---
const uploadFiles = upload.fields([{ name: "images", maxCount: 5 }]);

exports.uploadProductImages = (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new AppError("Vượt quá số lượng file quy định (Max: 5).", 400));
      }
    } else if (err) {
      return next(new AppError("Lỗi khi upload file.", 400));
    }
    next();
  });
};

// --- 2. RESIZE & UPLOAD TO CLOUDINARY (Đã tối ưu tốc độ) ---
exports.resizeProductImages = catchAsync(async (req, res, next) => {
  // 1. Kiểm tra nếu không có file thì bỏ qua
  if (!req.files || !req.files.images) return next();

  req.body.images = [];

  // 2. Upload song song (Parallel) - Nhanh hơn tuần tự
  const uploadPromises = req.files.images.map(async (file) => {
    try {
      // Upload lên Cloudinary (vào folder 'products' cho gọn)
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
        use_filename: true,
      });
      
      // Xóa file tạm trên server để tiết kiệm dung lượng
      try { fs.unlinkSync(file.path); } catch (e) { console.log("Lỗi xóa file tạm:", e); }

      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw new AppError("Lỗi khi upload ảnh lên Cloud.", 500);
    }
  });

  // Chờ tất cả ảnh upload xong mới chạy tiếp
  const imageUrls = await Promise.all(uploadPromises);
  req.body.images = imageUrls;

  // 3. Logic Business: Xử lý giá khuyến mãi (Nếu rỗng thì bằng giá gốc)
  if (!req.body.promotion || req.body.promotion == "") {
    req.body.promotion = req.body.price;
  }

  next();
});

// --- 3. DELETE OLD IMAGES (Sửa lỗi logic async) ---
exports.deleteImageCloud = catchAsync(async (req, res, next) => {
  // Chỉ xóa ảnh cũ khi action là 'Edit' và có ảnh mới được up lên
  if (req.body.action !== "Edit" || !req.files || !req.files.images) {
    return next();
  }

  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError("Không tìm thấy sản phẩm.", 404));

  // Lấy Public ID từ URL để xóa
  const deletePromises = product.images.map((imageURL) => {
    // Tách lấy public_id (VD: products/image_123)
    // Lưu ý: Logic này phụ thuộc vào cấu trúc URL của Cloudinary
    const parts = imageURL.split("/");
    const fileName = parts.pop().split(".")[0];
    const folderName = parts.pop(); // Lấy folder 'products'
    const publicId = `${folderName}/${fileName}`;

    return cloudinary.uploader.destroy(publicId);
  });

  // Chờ xóa hết ảnh cũ xong mới next()
  await Promise.all(deletePromises);

  next();
});

// --- 4. ALIAS ROUTE ---
exports.aliasTopProducts = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,priceDiscount,ratingsAverage,title,images";
  next();
};

// --- 5. SEARCH PRODUCT (Mới thêm cho Frontend) ---
exports.searchProduct = catchAsync(async (req, res, next) => {
  const { keyword } = req.query;

  if (!keyword) {
    return next(new AppError("Vui lòng nhập từ khóa tìm kiếm.", 400));
  }

  // Tìm kiếm tương đối (Regex), không phân biệt hoa thường ('i')
  const products = await Product.find({
    title: { $regex: keyword, $options: "i" },
  }).limit(10); // Limit 10 kết quả

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

// --- 6. STANDARD CRUD ---
exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product, { path: "reviews" });
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
exports.getTableProduct = factory.getTable(Product);