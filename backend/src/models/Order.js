const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },  // ✅ Đảm bảo kiểu dữ liệu đúng
  products: [
    {
      productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      inventory: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
      quantity: { type: Number, required: true, default: 1, min: 1 },
      attributes: [
        {
          name: { type: String, required: true },
          value: [{ type: String, required: true }]
        }
      ]
    }
  ],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'processing', 'shipping', 'delivered', 'canceled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'credit card', 'debit card', 'e-wallet'], required: true },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'refunded'], default: 'paid' },
  shippingAddress: { type: String, default:'Nhận hàng tại cửa hàng' },
  employeeID: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  notes: { type: String }
}, { timestamps: true });
OrderSchema.pre('save', async function(next) {
  if (!this.orderID) {
      this.orderID = `ORD-${Date.now()}`; // 🔹 Tạo orderID duy nhất bằng timestamp
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
