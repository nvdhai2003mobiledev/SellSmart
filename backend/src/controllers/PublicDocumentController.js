// backend/src/controllers/PublicDocumentController.js
const Document = require('../models/Document');
const Product = require('../models/Product');

exports.getPublicDocuments = async (req, res) => {
  try {
    // Lấy các tài liệu có liên kết với sản phẩm
    const documents = await Document.find({ product_id: { $exists: true, $ne: null } })
      .populate({
        path: 'product_id',
        select: 'name thumbnail',
        match: { _id: { $exists: true } }
      })
      .select('title description media product_id');

    const validDocuments = documents.filter(doc => doc.product_id !== null);
    
    // Lấy tất cả sản phẩm đã được phát hành (published products)
    const publishedProducts = await Product.find({ isPublished: true })
      .select('_id name thumbnail')
      .lean();
    
    res.render('publicDocuments', { 
      documents: validDocuments,
      publishedProducts: publishedProducts  // Truyền danh sách sản phẩm đã phát hành
    });
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

exports.getDocumentDetailPage = async (req, res) => {
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
    
    if (documents.length === 0) {
      return res.render('documentDetailPage', { 
        product, 
        documents: [], 
        activeDocument: null 
      });
    }
    
    // Nếu có tham số document_id, lấy tài liệu đó làm active, nếu không lấy tài liệu đầu tiên
    const documentId = req.query.document_id;
    let activeDocument = documents[0]; // Mặc định là tài liệu đầu tiên
    
    if (documentId) {
      const requestedDoc = documents.find(doc => doc._id.toString() === documentId);
      if (requestedDoc) {
        activeDocument = requestedDoc;
      }
    }
    
    // Render view với dữ liệu
    res.render('documentDetailPage', { 
      product, 
      documents, 
      activeDocument 
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết tài liệu:', error);
    res.status(500).send('Lỗi server');
  }
};