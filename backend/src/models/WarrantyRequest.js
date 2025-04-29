const mongoose = require('mongoose');

const warrantyRequestSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10,11}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  supportDate: {
    type: Date,
    required: true
  },
  issue: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const WarrantyRequest = mongoose.model('WarrantyRequest', warrantyRequestSchema);

module.exports = WarrantyRequest;
