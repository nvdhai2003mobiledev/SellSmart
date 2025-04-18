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
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng!" 
      });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: "Đơn hàng chưa hoàn thành, không thể kích hoạt bảo hành!" 
      });
    }

    // Cập nhật ngày bắt đầu bảo hành
    order.warrantyStartDate = new Date();
    await order.save();

    res.json({ 
      success: true, 
      message: "Kích hoạt bảo hành thành công!" 
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
    const { status, notes, warrantyPeriod } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(warrantyId)) {
      return res.status(400).json({ success: false, message: "ID bảo hành không hợp lệ!" });
    }

    // Check if warranty exists
    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin bảo hành!" });
    }

    // Update fields if provided
    if (status) warranty.status = status;
    if (notes) warranty.notes = notes;
    if (warrantyPeriod) warranty.warrantyPeriod = warrantyPeriod;

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

// Lấy danh sách bảo hành đang hoạt động
const getActiveWarranties = async (req, res) => {
  try {
    // Lấy danh sách đơn hàng đã xử lý
    const processedOrders = await Order.find({
      status: 'processing'  // Chỉ lấy đơn hàng đã xử lý
    })
    .populate('customerID', 'fullName phoneNumber email')  // Lấy thông tin khách hàng
    .populate('products.productID', 'name')  // Lấy thông tin sản phẩm
    .sort({ updatedAt: -1 });

    console.log('Processed orders:', JSON.stringify(processedOrders, null, 2));

    // Tạo danh sách bảo hành từ đơn hàng đã xử lý
    const warranties = [];
    
    for (const order of processedOrders) {
      // Bỏ qua nếu không có thông tin khách hàng
      if (!order.customerID) continue;

      // Lấy ngày bắt đầu bảo hành (ngày đơn hàng được xử lý)
      const startDate = order.updatedAt || order.createdAt;

      // Xử lý từng sản phẩm trong đơn hàng
      for (const product of order.products) {
        // Bỏ qua nếu không có thông tin sản phẩm
        if (!product.productID) continue;

        // Mặc định thời gian bảo hành là 12 tháng nếu không có cấu hình
        const warrantyPeriod = product.warrantyPeriod || 12;

        // Tính ngày kết thúc bảo hành
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + warrantyPeriod);

        warranties.push({
          orderID: order._id,
          orderNumber: order.orderNumber || `#ORD-${order._id.toString().slice(-6)}`,
          customerName: order.customerID.fullName || 'N/A',
          customerPhone: order.customerID.phoneNumber || 'N/A',
          customerEmail: order.customerID.email || 'N/A',
          productName: product.productID.name || 'Unknown Product',
          warrantyPeriod: `${warrantyPeriod} tháng`,
          startDate: startDate,
          endDate: endDate,
          status: new Date() <= endDate ? 'Còn hạn' : 'Hết hạn'
        });
      }
    }

    console.log('Warranties:', warranties);

    // Render view với dữ liệu đã xử lý
    res.render("dashboard/warranty-list", {
      warranties,
      title: 'Danh sách bảo hành',
      page: 'warranty-list',
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
    console.error("Error fetching warranty list:", error);
    res.status(500).json({ 
      success: false, 
      message: "Có lỗi xảy ra khi tải danh sách bảo hành!" 
    });
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
  getActiveWarranties,
  activateWarranty
};
