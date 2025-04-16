const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Định nghĩa Warranty Schema
const WarrantySchema = new Schema({
  // Tham chiếu đến model Product (Sản phẩm)
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product", // Giả sử model Product có tên là "Product"
    required: [true, 'Sản phẩm là bắt buộc']
  },
  // Tham chiếu đến model Order (Đơn hàng)
  order: {
    type: Schema.Types.ObjectId,
    ref: "Order", // Giả sử model Order có tên là "Order"
    required: false // Không bắt buộc
  },
  // Tham chiếu đến model Customer (Khách hàng)
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer", // Tham chiếu đến model Customer đã cung cấp
    required: false // Không bắt buộc
  },
  // Trạng thái bảo hành
  status: {
    type: String,
    enum: ['Chờ kích hoạt', 'Đang xử lý', 'Đã hoàn thành', 'Hết hạn'],
    default: 'Chờ kích hoạt'
  },
  // Ngày bắt đầu bảo hành
  startDate: {
    type: Date,
    required: false // Không bắt buộc
  },
  // Ngày kết thúc bảo hành
  endDate: {
    type: Date,
    required: false // Không bắt buộc
  },
  // Thời gian bảo hành (ví dụ: số tháng hoặc số ngày)
  warrantyPeriod: {
    type: Number,
    required: [true, 'Thời gian bảo hành là bắt buộc'],
    min: [1, 'Thời gian bảo hành phải lớn hơn 0'],
    default: 12 // Mặc định 12 tháng
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Middleware để kiểm tra ngày kết thúc phải sau ngày bắt đầu (chỉ khi cả hai đều có)
WarrantySchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    const error = new Error('Ngày kết thúc phải sau ngày bắt đầu');
    return next(error);
  }
  next();
});

// Kiểm tra thời gian bảo hành còn hiệu lực
WarrantySchema.methods.isActive = function() {
  if (!this.startDate || !this.endDate) return false;
  const currentDate = new Date();
  return currentDate <= this.endDate;
};

// Tính số ngày còn lại của bảo hành
WarrantySchema.methods.remainingDays = function() {
  if (!this.startDate || !this.endDate) return 0;
  
  const currentDate = new Date();
  if (currentDate > this.endDate) {
    return 0;
  }
  
  const timeDiff = this.endDate.getTime() - currentDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Định nghĩa ảo cho phần trăm hoàn thành của bảo hành
WarrantySchema.virtual('completionPercentage').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  
  const currentDate = new Date();
  if (currentDate <= this.startDate) {
    return 0;
  }
  
  if (currentDate >= this.endDate) {
    return 100;
  }
  
  const totalDuration = this.endDate.getTime() - this.startDate.getTime();
  const elapsedDuration = currentDate.getTime() - this.startDate.getTime();
  
  return Math.round((elapsedDuration / totalDuration) * 100);
});

// Tự động cập nhật trạng thái dựa trên ngày
WarrantySchema.pre('find', async function() {
  try {
    await mongoose.model('Warranty').updateMany(
      { status: { $ne: 'Đã hoàn thành' }, endDate: { $lt: new Date() } },
      { $set: { status: 'Hết hạn' } }
    );
  } catch (error) {
    console.error('Error updating warranty statuses:', error);
  }
});

WarrantySchema.pre('findOne', async function() {
  try {
    await mongoose.model('Warranty').updateMany(
      { status: { $ne: 'Đã hoàn thành' }, endDate: { $lt: new Date() } },
      { $set: { status: 'Hết hạn' } }
    );
  } catch (error) {
    console.error('Error updating warranty statuses:', error);
  }
});

// Xuất model
module.exports = mongoose.model("Warranty", WarrantySchema);