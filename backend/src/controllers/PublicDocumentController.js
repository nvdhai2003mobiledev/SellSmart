// backend/src/controllers/PublicDocumentController.js
const Document = require('../models/Document');
const Product = require('../models/Product');

exports.getPublicDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ product_id: { $exists: true, $ne: null } })
      .populate({
        path: 'product_id',
        select: 'name thumbnail',
        match: { _id: { $exists: true } }
      })
      .select('title description media product_id');

    const validDocuments = documents.filter(doc => doc.product_id !== null);
    res.render('publicDocuments', { documents: validDocuments });
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error);
    res.status(500).send('Lỗi server');
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    // Lấy thông tin sản phẩm
    const product = await Product.findById(productId).select('name thumbnail');
    if (!product) {
      return res.status(404).send('Sản phẩm không tồn tại');
    }

    // Lấy danh sách tài liệu liên quan đến sản phẩm
    const documents = await Document.find({ product_id: productId })
      .select('title description media');

    // Render view với dữ liệu
    res.render('productDetails', { product, documents });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).send('Lỗi server');
  }
};