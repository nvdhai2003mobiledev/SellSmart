const mongoose = require("mongoose");
const Warranty = require("../models/Warranty");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Order = require("../models/Order");

// 🟢 Hiển thị danh sách bảo hành (render EJS)
const getWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find()
      .populate('product', 'name price')
      .populate('customer', 'fullName phoneNumber email')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });
    
    res.render("dashboard/warranty", {
      warranties,
      title: 'Quản lý bảo hành',
      page: 'warranty',
      admin: {
        fullName: 'Admin',
        avatar: null
      },
      user: {
        fullName: 'Admin',
        avatar: null
      }
    });
  } catch (error) {
    console.error("Error fetching warranties:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tải danh sách bảo hành!" });
  }
};

// 🟢 Lấy danh sách bảo hành dưới dạng JSON
const getWarrantyAsJson = async (req, res) => {
  try {
    const warranties = await Warranty.find()
      .populate('product', 'name price')
      .populate('customer', 'fullName phoneNumber email')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });
    
    res.json(warranties);
  } catch (error) {
    console.error("Error fetching warranties JSON:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tải danh sách bảo hành!" });
  }
};

// 🟢 Lấy bảo hành theo ID
const getWarrantyById = async (req, res) => {
  try {
    const { warrantyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(warrantyId)) {
      return res.status(400).json({ success: false, message: "ID bảo hành không hợp lệ!" });
    }

    const warranty = await Warranty.findById(warrantyId)
      .populate('product', 'name price')
      .populate('customer', 'fullName phoneNumber email')
      .populate('order', 'orderNumber totalAmount');
    
    if (!warranty) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin bảo hành!" });
    }

    res.json(warranty);
  } catch (error) {
    console.error("Error fetching warranty:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tải thông tin bảo hành!" });
  }
};

// 🟢 API thêm bảo hành
const addWarranty = async (req, res) => {
  try {
    const { productId, customerId, orderId, status, startDate, endDate, warrantyPeriod } = req.body;

    // Validate required fields - only productId, startDate, endDate and warrantyPeriod are required
    if (!productId || !startDate || !endDate || !warrantyPeriod) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc!" });
    }

    // Validate ID for product (required)
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ!" });
    }

    // Validate IDs for customer and order (optional)
    if (customerId && !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "ID khách hàng không hợp lệ!" });
    }
    
    if (orderId && !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "ID đơn hàng không hợp lệ!" });
    }

    // Check if product exists (required)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy sản phẩm!" 
      });
    }

    // Check if customer exists (optional)
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy khách hàng!" 
        });
      }
    }

    // Check if order exists (optional)
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Không tìm thấy đơn hàng!" 
        });
      }
    }

    // Kiểm tra ngày
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Ngày không hợp lệ!" });
    }

    if (end <= start) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu!" });
    }

    // Kiểm tra thời gian bảo hành
    if (isNaN(warrantyPeriod) || warrantyPeriod <= 0) {
      return res.status(400).json({ message: "Thời gian bảo hành không hợp lệ!" });
    }

    // Create new warranty
    const newWarranty = new Warranty({
      product: productId,
      customer: customerId || null,
      order: orderId || null,
      status: status || "Đang xử lý",
      startDate: start,
      endDate: end,
      warrantyPeriod
    });

    await newWarranty.save();

    res.redirect("/warranty");
  } catch (error) {
    console.error("Error adding warranty:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi thêm thông tin bảo hành!" });
  }
};

// 🟢 API cập nhật bảo hành
const updateWarranty = async (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { productId, customerId, orderId, status, startDate, endDate, warrantyPeriod } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(warrantyId)) {
      return res.status(400).json({ success: false, message: "ID bảo hành không hợp lệ!" });
    }

    // Validate required fields - only productId, startDate, endDate and warrantyPeriod are required
    if (!productId || !startDate || !endDate || !warrantyPeriod) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc!" });
    }

    // Check if product exists (required)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy sản phẩm!" 
      });
    }

    // Check if warranty exists
    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin bảo hành!" });
    }

    // Update warranty
    warranty.product = productId;
    warranty.customer = customerId || null;
    warranty.order = orderId || null;
    warranty.status = status;
    warranty.startDate = startDate;
    warranty.endDate = endDate;
    warranty.warrantyPeriod = warrantyPeriod;

    await warranty.save();

    res.json({ success: true, message: "Cập nhật thông tin bảo hành thành công!", warranty });
  } catch (error) {
    console.error("Error updating warranty:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi cập nhật thông tin bảo hành!" });
  }
};

// 🟢 API xóa bảo hành
const deleteWarranty = async (req, res) => {
  try {
    const { warrantyId } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(warrantyId)) {
      return res.status(400).json({ success: false, message: "ID bảo hành không hợp lệ!" });
    }

    // Find and delete warranty
    const result = await Warranty.findByIdAndDelete(warrantyId);

    if (!result) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin bảo hành!" });
    }

    res.json({ success: true, message: "Xóa thông tin bảo hành thành công!" });
  } catch (error) {
    console.error("Error deleting warranty:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi xóa thông tin bảo hành!" });
  }
};

// 🟢 Tìm kiếm bảo hành theo khách hàng
const searchWarrantyByCustomer = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({ success: false, message: "Vui lòng nhập từ khóa tìm kiếm!" });
    }

    // Find customers matching the search term
    const customers = await Customer.find({
      fullName: { $regex: searchTerm, $options: "i" }
    });

    const customerIds = customers.map(customer => customer._id);

    // Find warranties by customer IDs
    const warranties = await Warranty.find({ customer: { $in: customerIds } })
      .populate('product', 'name price')
      .populate('customer', 'fullName phoneNumber email')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });

    res.json(warranties);
  } catch (error) {
    console.error("Error searching warranties:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tìm kiếm bảo hành!" });
  }
};

// ✅ Xuất tất cả hàm
module.exports = {
  getWarranties,
  getWarrantyAsJson,
  getWarrantyById,
  addWarranty,
  updateWarranty,
  deleteWarranty,
  searchWarrantyByCustomer
};
