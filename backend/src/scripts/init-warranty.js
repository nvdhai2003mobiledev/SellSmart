const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Warranty = require('../models/Warranty');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const initWarranty = async () => {
  try {
    // Check if warranty collection already has documents
    const warrantyCount = await Warranty.countDocuments();
    if (warrantyCount > 0) {
      console.log('Warranty collection already initialized');
      return;
    }

    // Get a sample product
    const product = await Product.findOne();
    if (!product) {
      console.error('No products found! Please initialize products first.');
      return;
    }

    // Get a sample customer
    const customer = await Customer.findOne();
    if (!customer) {
      console.error('No customers found! Please initialize customers first.');
      return;
    }

    // Get a sample order
    const order = await Order.findOne();
    if (!order) {
      console.error('No orders found! Please initialize orders first.');
      return;
    }

    // Create a sample warranty
    const sampleWarranty = new Warranty({
      product: product._id,
      customer: customer._id,
      order: order._id,
      status: 'Đang xử lý',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)), // 12 months warranty
      warrantyPeriod: 12,
      notes: 'Bảo hành tiêu chuẩn'
    });

    await sampleWarranty.save();
    console.log('Sample warranty created successfully');

  } catch (error) {
    console.error('Error initializing warranty collection:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the initialization
initWarranty(); 