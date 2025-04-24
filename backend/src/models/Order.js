// Add this to the OrderSchema in Order.js model

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  products: [
    {
      productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      variantID: { type: mongoose.Schema.Types.ObjectId, ref: 'DetailsVariant' },
      name: { type: String, required: true },
      inventory: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
      quantity: { type: Number, required: true, default: 1, min: 1 },
      attributes: [
        {
          name: { type: String },
          value: [{ type: String, required: true }]
        }
      ]
    }
  ],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending','waiting', 'processing', 'canceled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'credit card', 'debit card', 'e-wallet', null], required: function() {
    return this.paymentStatus === 'paid' || this.paymentStatus === 'partpaid'; // Required if payment status is 'paid' or 'partpaid'
  } },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'refunded', 'partpaid'], default: 'unpaid' },
  // Add field to track how much has been paid for partial payments
  paidAmount: { type: Number, default: 0, min: 0 },
  // Add field to track payment details for multiple payment methods
  paymentDetails: [{
    method: { type: String, enum: ['cash', 'credit card', 'debit card', 'e-wallet'] },
    amount: { type: Number, min: 0 },
    date: { type: Date, default: Date.now }
  }],
  shippingAddress: { type: String, default:'Nhận hàng tại cửa hàng' },
  employeeID: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  notes: { type: String },
  // Thêm trường mới để lưu lý do hủy đơn hàng
  cancelReason: { type: String, default: null },
  // Add this new field to store promotion reference
  promotionID: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
  // Add fields to store promotion information when the order was created
  promotionDetails: {
    name: { type: String },
    discount: { type: Number },
    discountAmount: { type: Number }
  },
  // Store original amount before discount
  originalAmount: { type: Number }
}, { timestamps: true });

OrderSchema.pre('save', async function(next) {
  if (!this.orderID) {
      this.orderID = `ORD-${Date.now()}`; // 🔹 Tạo orderID duy nhất bằng timestamp
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);