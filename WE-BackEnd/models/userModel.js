const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Vui lòng cung cấp tên!"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Vui lòng cung cấp email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Vui lòng cung cấp email hợp lệ"],
  },
  avatar: {
    type: String,
    default:
      "https://png.pngtree.com/png-clipart/20200701/original/pngtree-default-avatar-png-image_5407175.jpg",
  },
  role: {
    type: String,
    enum: ["user", "employee", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Tài khoản cần có mật khẩu"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Vui lòng nhập lại mật khẩu"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Mật khẩu nhập lại không khớp!",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  address: [
    {
      name: String,
      phone: String,
      province: String,
      district: String,
      ward: String,
      detail: String,
      setDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  userVerifyToken: String,
  userVerifyExpires: Date,
  active: {
    type: String,
    enum: ["active", "verify", "ban"],
    default: "verify",
  },
  dateOfBirth: String,
  gender: String,
  phone: String,
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// === INDEXES ===
// ĐÃ TỐI ƯU: Chỉ index các trường cần thiết
userSchema.index({ name: "text", email: "text", phone: "text" });

// === MIDDLEWARE ===
// TỐI ƯU: Tự động lọc user bị "ban"
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: "ban" } });
  next();
});

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Cập nhật passwordChangedAt
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// === INSTANCE METHODS ===
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createVerifyToken = function () {
  const verifyToken = Math.floor(100000 + Math.random() * 900000).toString();
  this.userVerifyToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");
  this.userVerifyExpires = Date.now() + 10 * 60 * 1000;
  return verifyToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;