const WarrantyRequest = require('../models/WarrantyRequest');
const Product = require('../models/Product');

// Display warranty support requests management page
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
    try {
      const product = await Product.findById(productId);
      if (!product) {
        console.log('Product not found:', productId);
        return res.status(404).json({ 
          success: false, 
          message: 'Sản phẩm không tồn tại' 
        });
      }
    } catch (err) {
      console.log('Error finding product:', err);
      return res.status(400).json({ 
        success: false, 
        message: 'ID sản phẩm không hợp lệ' 
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
