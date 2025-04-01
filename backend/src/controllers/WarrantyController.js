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
        fullName: req.user?.fullName || 'Admin',
        avatar: req.user?.avatar || null
      },
      user: {
        fullName: req.user?.fullName || 'Admin',
        avatar: req.user?.avatar || null
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
    const { productId, warrantyPeriod } = req.body;

    // Validate required fields - only productId is required
    if (!productId) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn sản phẩm!" });
    }

    // Validate ID for product (required)
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ!" });
    }

    // Check if product exists (required)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy sản phẩm!" 
      });
    }

    // Create new warranty with default values
    const newWarranty = new Warranty({
      product: productId,
      status: "Chờ kích hoạt",
      warrantyPeriod: warrantyPeriod || 12 // Default 12 months if not specified
    });

    await newWarranty.save();

    res.json({ 
      success: true, 
      message: "Thêm thông tin bảo hành thành công!", 
      warranty: newWarranty 
    });
  } catch (error) {
    console.error("Error adding warranty:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi thêm thông tin bảo hành!" });
  }
};

// 🟢 API kích hoạt bảo hành khi tạo đơn hàng
const activateWarranty = async (req, res) => {
  try {
    const { warrantyId, orderId, customerId } = req.body;

    // Validate required fields
    if (!warrantyId || !orderId || !customerId) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng cung cấp đầy đủ thông tin bảo hành, đơn hàng và khách hàng!" 
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(warrantyId) || 
        !mongoose.Types.ObjectId.isValid(orderId) || 
        !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ 
        success: false, 
        message: "ID không hợp lệ!" 
      });
    }

    // Check if warranty exists and is in pending status
    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông tin bảo hành!" 
      });
    }

    if (warranty.status !== "Chờ kích hoạt") {
      return res.status(400).json({ 
        success: false, 
        message: "Bảo hành đã được kích hoạt hoặc không thể kích hoạt!" 
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng!" 
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy khách hàng!" 
      });
    }

    // Calculate warranty dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + warranty.warrantyPeriod);

    // Update warranty
    warranty.order = orderId;
    warranty.customer = customerId;
    warranty.status = "Đang xử lý";
    warranty.startDate = startDate;
    warranty.endDate = endDate;

    await warranty.save();

    res.json({ 
      success: true, 
      message: "Kích hoạt bảo hành thành công!", 
      warranty 
    });
  } catch (error) {
    console.error("Error activating warranty:", error);
    res.status(500).json({ 
      success: false, 
      message: "Có lỗi xảy ra khi kích hoạt bảo hành!" 
    });
  }
};

// 🟢 API cập nhật bảo hành
const updateWarranty = async (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { status, notes } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(warrantyId)) {
      return res.status(400).json({ success: false, message: "ID bảo hành không hợp lệ!" });
    }

    // Check if warranty exists
    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin bảo hành!" });
    }

    // Only allow updating status and notes
    if (status) warranty.status = status;
    if (notes) warranty.notes = notes;

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
  searchWarrantyByCustomer,
  activateWarranty
};
