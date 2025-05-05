const WarrantyRequest = require('../models/WarrantyRequest');
const Product = require('../models/Product');
const Warranty = require('../models/Warranty');
const Customer = require('../models/Customer');

// Hàm tiện ích để gửi thông báo bảo hành
async function sendWarrantyNotification(warrantyRequestId, customerName, productName, issue) {
    try {
        const notificationController = require('./NotificationController');
        
        // Tạo tiêu đề thông báo
        const notificationTitle = `Yêu cầu bảo hành mới: ${warrantyRequestId}`;
        
        // Tạo nội dung thông báo
        const truncatedIssue = issue.length > 50 ? issue.substring(0, 47) + '...' : issue;
        const notificationBody = `${customerName} - ${productName} - ${truncatedIssue}`;
        
        // Dữ liệu bổ sung cho thông báo
        const notificationData = {
            screen: 'WarrantyRequestDetail',
            warrantyRequestId: warrantyRequestId.toString(),
            type: 'NEW_WARRANTY_REQUEST',
            timestamp: Date.now().toString()
        };
        
        console.log('Gửi thông báo bảo hành:', {
            title: notificationTitle,
            body: notificationBody,
            data: notificationData
        });
        
        // Gửi thông báo đến tất cả thiết bị
        const notificationResult = await notificationController.sendNotificationToAll(
            notificationTitle,
            notificationBody,
            notificationData
        );
        
        console.log('Kết quả gửi thông báo:', notificationResult);
    } catch (notificationError) {
        console.error('Lỗi khi gửi thông báo bảo hành:', notificationError);
        // Tiếp tục xử lý ngay cả khi gửi thông báo thất bại
    }
}

exports.getWarrantySupportRequests = async (req, res) => {
  try {
    const warrantyRequests = await WarrantyRequest.find()
      .populate('productId', 'name')
      .sort({ createdAt: -1 });
    
    res.render('dashboard/warranty-support', {
      page: 'warranty-support',
      warrantyRequests,
      admin: req.user,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (error) {
    console.error('Error fetching warranty requests:', error);
    req.flash('error_msg', 'Không thể tải danh sách yêu cầu bảo hành');
    res.redirect('/dashboard');
  }
};

exports.getWarrantySupportRequestsAsJson = async (req, res) => {
  try {
    const warrantyRequests = await WarrantyRequest.find()
      .populate('productId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: warrantyRequests,
    });
  } catch (error) {
    console.error('Error fetching warranty requests:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tải danh sách bảo hành!',
    });
  }
};

// Handle new warranty support request (from customers)
exports.createWarrantyRequest = async (req, res) => {
  try {
    console.log('Received warranty request:', req.body);
    const { customerName, customerPhone, customerEmail, productId, supportDate, issue } = req.body;
    
    // Validate inputs
    if (!customerName || !customerPhone || !customerEmail || !productId || !supportDate || !issue) {
      console.log('Missing required fields:', { customerName, customerPhone, customerEmail, productId, supportDate, issue });
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc' 
      });
    }
    
    // Validate name (min 3 characters)
    if (customerName.length < 3) {
      console.log('Name too short:', customerName);
      return res.status(400).json({
        success: false,
        message: 'Họ và tên phải có ít nhất 3 ký tự'
      });
    }
    
    // Validate phone number (must start with 0, 10-11 digits)
    if (!/^0\d{9,10}$/.test(customerPhone)) {
      console.log('Invalid phone number:', customerPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'Số điện thoại không hợp lệ. Phải bắt đầu bằng số 0 và có 10-11 chữ số' 
      });
    }
    
    // Validate email
    if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      console.log('Invalid email:', customerEmail);
      return res.status(400).json({ 
        success: false, 
        message: 'Email không hợp lệ' 
      });
    }
    
    // Validate issue description (min 10 characters)
    if (issue.length < 10) {
      console.log('Issue description too short:', issue);
      return res.status(400).json({
        success: false,
        message: 'Mô tả vấn đề phải có ít nhất 10 ký tự'
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ 
        success: false, 
        message: 'Sản phẩm không tồn tại' 
      });
    }
    
    // Create new warranty request
    const warrantyRequest = new WarrantyRequest({
      customerName,
      customerPhone,
      customerEmail,
      productId,
      supportDate,
      issue,
      status: 'pending'
    });
    
    await warrantyRequest.save();
    console.log('Warranty request saved successfully:', warrantyRequest._id);
    
    // Gửi thông báo khi tạo yêu cầu bảo hành thành công
    await sendWarrantyNotification(warrantyRequest._id, customerName, product.name, issue);
    
    res.status(201).json({ 
      success: true, 
      message: 'Yêu cầu hỗ trợ bảo hành đã được gửi thành công', 
      data: warrantyRequest 
    });
  } catch (error) {
    console.error('Error creating warranty request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu' 
    });
  }
};

// Update warranty request status
exports.updateWarrantyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const warrantyRequest = await WarrantyRequest.findById(id);
    
    if (!warrantyRequest) {
      req.flash('error_msg', 'Không tìm thấy yêu cầu bảo hành');
      return res.redirect('/warranty-support');
    }
    
    warrantyRequest.status = status;
    warrantyRequest.notes = notes;
    warrantyRequest.updatedAt = Date.now();
    
    await warrantyRequest.save();
    
    req.flash('success_msg', 'Cập nhật yêu cầu bảo hành thành công');
    res.redirect('/warranty-support');
  } catch (error) {
    console.error('Error updating warranty request:', error);
    req.flash('error_msg', 'Không thể cập nhật yêu cầu bảo hành');
    res.redirect('/warranty-support');
  }
};

// Delete warranty request
exports.deleteWarrantyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warrantyRequest = await WarrantyRequest.findById(id);
    
    if (!warrantyRequest) {
      req.flash('error_msg', 'Không tìm thấy yêu cầu bảo hành');
      return res.redirect('/warranty-support');
    }
    
    await WarrantyRequest.findByIdAndDelete(id);
    
    req.flash('success_msg', 'Xóa yêu cầu bảo hành thành công');
    res.redirect('/warranty-support');
  } catch (error) {
    console.error('Error deleting warranty request:', error);
    req.flash('error_msg', 'Không thể xóa yêu cầu bảo hành');
    res.redirect('/warranty-support');
  }
};

// Check if customer information matches with existing warranty records
exports.checkWarrantyMatch = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, productId } = req.body;
    console.log('Checking warranty match for:', { customerName, customerPhone, customerEmail, productId });
    
    // Validate inputs
    if (!customerName || !customerPhone || !customerEmail || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đầu vào cần thiết',
        matchCount: 0
      });
    }
    
    // Khởi tạo tập hợp các trường khớp
    let uniqueMatches = new Set();
    
    // Bước 1: Kiểm tra thông tin trong cơ sở dữ liệu khách hàng
    const customers = await Customer.find({
      $or: [
        { fullName: { $regex: new RegExp(customerName, 'i') } },
        { email: { $regex: new RegExp('^' + customerEmail + '$', 'i') } },
        { phoneNumber: customerPhone }
      ]
    });
    
    console.log(`Tìm thấy ${customers.length} khách hàng với email hoặc số điện thoại tương ứng`);
    
    // Kiểm tra các trường khớp trong bảng Customer
    for (const customer of customers) {
      // Kiểm tra tên khớp
      if (customer.fullName && customer.fullName.toLowerCase() === customerName.toLowerCase()) {
        uniqueMatches.add('name');
      }
      
      // Kiểm tra số điện thoại khớp
      if (customer.phoneNumber && customer.phoneNumber === customerPhone) {
        uniqueMatches.add('phone');
      }
      
      // Kiểm tra email khớp
      if (customer.email && customer.email.toLowerCase() === customerEmail.toLowerCase()) {
        uniqueMatches.add('email');
      }
    }
    
    // Bước 2: Kiểm tra thông tin trong bảng bảo hành
    const warranties = await Warranty.find({ 
      product: productId,
      status: { $in: ['Còn hạn', 'Chờ kích hoạt', 'Đang xử lý'] }
    }).populate('customer').exec();
    
    console.log(`Tìm thấy ${warranties.length} bảo hành còn hiệu lực cho sản phẩm ID ${productId}`);
    
    if (warranties.length > 0) {
      uniqueMatches.add('product'); // Sản phẩm khớp tính là một trường khớp nếu tìm thấy trong bảo hành
      
      // Kiểm tra thông tin khách hàng trong bảo hành
      for (const warranty of warranties) {
        if (!warranty.customer) continue;
        
        // Kiểm tra tên khớp
        if (warranty.customer.fullName && warranty.customer.fullName.toLowerCase() === customerName.toLowerCase()) {
          uniqueMatches.add('name');
        }
        
        // Kiểm tra số điện thoại khớp
        if (warranty.customer.phoneNumber && warranty.customer.phoneNumber === customerPhone) {
          uniqueMatches.add('phone');
        }
        
        // Kiểm tra email khớp
        if (warranty.customer.email && warranty.customer.email.toLowerCase() === customerEmail.toLowerCase()) {
          uniqueMatches.add('email');
        }
      }
    }
    
    const totalMatchCount = uniqueMatches.size;
    console.log(`Tổng số trường khớp duy nhất: ${totalMatchCount}, Các trường khớp: ${Array.from(uniqueMatches).join(', ')}`);
    
    return res.status(200).json({
      success: true,
      matchCount: totalMatchCount,
      matchDetails: Array.from(uniqueMatches),
      message: totalMatchCount >= 2 
        ? 'Thông tin khớp với hồ sơ bảo hành' 
        : 'Thông tin không khớp đủ với hồ sơ bảo hành'
    });
  } catch (error) {
    console.error('Error checking warranty match:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra thông tin bảo hành',
      matchCount: 0
    });
  }
};