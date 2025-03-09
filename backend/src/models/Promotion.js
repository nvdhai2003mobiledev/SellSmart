const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  discount: {             //giá trị giảm giá
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ['percent', 'fixed'], 
    required: true,
  },
  minOrderValue: {           //giá trị tối thiểu đơn hàng sẽ đc nhận giảm giá
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscount: {            //giá trị giảm giá tối đa 
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["sapdienra", "active", "expired"],  // thay đổi giá trị enum cho đúng
    default: "sapdienra"
},
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
