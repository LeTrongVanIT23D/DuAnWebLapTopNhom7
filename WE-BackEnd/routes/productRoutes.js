const express = require("express");
const productController = require("./../controllers/productController");
const authController = require("./../controllers/authController");
const reviewRouter = require("./../routes/reviewRoutes");
const commentRouter = require("./../routes/commentRoutes");

const router = express.Router();

// --- 1. NESTED ROUTES ---
router.use("/:productId/reviews", reviewRouter);
router.use("/:productId/comments", commentRouter);

// --- 2. SPECIAL ROUTES (Phải đặt TRƯỚC route /:id) ---

// Route tìm kiếm (MỚI THÊM)
router.route("/search").get(productController.searchProduct);

// Các route alias khác
router
  .route("/top-5-cheap")
  .get(productController.aliasTopProducts, productController.getAllProducts);

router.route("/getTableProduct").get(productController.getTableProduct);

// --- 3. STANDARD ROUTES ---

// Route gốc (/)
router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo("admin", "employee"),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.createProduct
  );

// Route có tham số (/:id) -> LUÔN ĐỂ CUỐI CÙNG
router
  .route("/:id")
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "employee"),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.deleteImageCloud,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "employee"),
    productController.deleteImageCloud,
    productController.deleteProduct
  );

module.exports = router;