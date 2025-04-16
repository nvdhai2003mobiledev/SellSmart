const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);