const Product = require('../src/models/Product');
exports.getProduct = async (req, res) => {
  try {
    const products = await Product.find(); // Lấy tất cả sản phẩm
    res.render('product', { products });
    // res.json(products); // Gửi danh sách sản phẩm
  } catch (error) {
    console.error(error); // Ghi log lỗi
    // Kiểm tra xem đã gửi phản hồi chưa
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm' });
  }
};
