const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const InventorySchema = new Schema(
  {
    product_name: {
      type: String,
      required: [true, "Tên sản phẩm là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên sản phẩm không được vượt quá 100 ký tự"],
    },
    product_code: {
      type: String,
      required: [true, "Mã sản phẩm là bắt buộc"],
      trim: true,
      match: [/^MD\d+$/, "Mã sản phẩm phải bắt đầu bằng 'MD' và theo sau là số"],
    },
    product_description: {
      type: String,
      trim: true,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
    },
    typeProduct_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeProduct",
      required: [true, "Danh mục sản phẩm là bắt buộc"],
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: [true, "Nhà cung cấp là bắt buộc"],
    },
    batch_number: {
      type: String,
      required: [true, "Số lô hàng là bắt buộc"],
      trim: true,
    },
    batch_date: {
      type: Date,
      required: [true, "Ngày nhập lô hàng là bắt buộc"],
      default: Date.now,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variantDetails: [
      {
        attributes: {
          type: Map,
          of: String,
          required: [true, "Thuộc tính biến thể là bắt buộc"],
          validate: {
            validator: (v) => v && Object.keys(v).length > 0,
            message: "Thuộc tính biến thể phải có ít nhất một cặp key-value",
          },
        },
        price: {
          type: Number,
          required: [true, "Giá biến thể là bắt buộc"],
          min: [0, "Giá biến thể không được nhỏ hơn 0"],
        },
        quantity: {
          type: Number,
          required: [true, "Số lượng biến thể là bắt buộc"],
          min: [0, "Số lượng biến thể không được nhỏ hơn 0"],
        },
      },
    ],
    total_quantity: {
      type: Number,
      required: [true, "Tổng số lượng là bắt buộc"],
      min: [0, "Tổng số lượng không được nhỏ hơn 0"],
    },
    total_price: {
      type: Number,
      required: [true, "Tổng giá là bắt buộc"],
      min: [0, "Tổng giá không được nhỏ hơn 0"],
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    status: {
      type: String,
      enum: {
        values: ["available", "unavailable"],
        message: "Trạng thái phải là 'available' hoặc 'unavailable'",
      },
      default: "available",
    },
    type: {
      type: String,
      enum: {
        values: ["import", "export"],
        message: "Loại phải là 'import' hoặc 'export'",
      },
      required: [true, "Loại giao dịch là bắt buộc"],
    },
    unit: {
      type: String,
      default: "cái",
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "Ghi chú không được vượt quá 200 ký tự"],
    },
    batch_info: [
      {
        batch_number: {
          type: String,
          required: [true, "Số lô hàng là bắt buộc"],
          trim: true,
        },
        batch_date: {
          type: Date,
          required: [true, "Ngày nhập lô hàng là bắt buộc"],
          default: Date.now,
        },
        quantity: {
          type: Number,
          min: [0, "Số lượng không được nhỏ hơn 0"],
          default: 0,
        },
        price: {
          type: Number,
          min: [0, "Giá không được nhỏ hơn 0"],
          default: 0,
        },
        note: {
          type: String,
          trim: true,
        },
        created_at: {
          type: Date,
          default: Date.now,
        }
      }
    ],
  },
  { timestamps: true }
);

// Validate variantDetails và total_quantity/total_price
InventorySchema.pre("validate", function (next) {
  // Đảm bảo variantDetails hợp lệ khi hasVariants
  if (this.hasVariants && (!this.variantDetails || !this.variantDetails.length)) {
    return next(new Error("Danh sách biến thể không được để trống khi có biến thể"));
  }
  if (!this.hasVariants && this.variantDetails?.length) {
    this.variantDetails = [];
  }

  // Kiểm tra total_quantity và total_price
  if (this.hasVariants && this.variantDetails?.length) {
    const calculatedQuantity = this.variantDetails.reduce((sum, v) => sum + Number(v.quantity), 0);
    const totalValue = this.variantDetails.reduce((sum, v) => sum + (Number(v.price) * Number(v.quantity)), 0);
    const calculatedPrice = totalValue / calculatedQuantity;

    // Cho phép sai số nhỏ trong phép tính số thực
    const epsilon = 0.01;
    if (Math.abs(this.total_quantity - calculatedQuantity) > epsilon) {
      return next(new Error(`Tổng số lượng (${this.total_quantity}) không khớp với số lượng biến thể (${calculatedQuantity})`));
    }
  
  } else if (!this.hasVariants) {
    // Nếu không có biến thể, total_quantity và total_price được tính từ controller
    if (this.total_quantity < 0 || this.total_price < 0) {
      return next(new Error("Tổng số lượng và tổng giá phải lớn hơn hoặc bằng 0 khi không có biến thể"));
    }
  }

  next();
});

// Đảm bảo index cho truy vấn nhanh
InventorySchema.index({ typeProduct_id: 1 });
InventorySchema.index({ provider_id: 1 });
InventorySchema.index({ batch_number: 1 });
InventorySchema.index({ product_code: 1 }, { collation: { locale: "en_US", numericOrdering: true } });

module.exports = mongoose.model("Inventory", InventorySchema);