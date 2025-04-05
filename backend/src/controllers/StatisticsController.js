const Product = require("../models/Product");
const mongoose = require("mongoose");
const Order = require("../models/Order");

const getProductStatistics = async (req, res) => {
    try {
        console.log("Bắt đầu lấy thống kê sản phẩm");

        // Lấy tổng số sản phẩm
        const totalProducts = await Product.countDocuments();

        // Lấy tổng số đơn hàng và doanh thu từ các đơn hàng đã thanh toán
        const orderStats = await mongoose.model('Order').aggregate([
            {
                $match: {
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Lấy top 10 sản phẩm bán chạy nhất
        const topSellingProducts = await mongoose.model('Order').aggregate([
            {
                $match: {
                    paymentStatus: 'paid'
                }
            },
            {
                $unwind: '$products'
            },
            {
                $group: {
                    _id: '$products.productID',
                    totalSold: { $sum: '$products.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
                }
            },
            {
                $sort: { totalSold: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Lấy thông tin chi tiết của các sản phẩm bán chạy
        const productIds = topSellingProducts.map(p => p._id);
        const productsDetails = await Product.find(
            { _id: { $in: productIds } }
        ).populate('category').lean();

        // Kết hợp thông tin bán hàng với thông tin sản phẩm
        const enrichedTopSellingProducts = topSellingProducts.map(product => {
            const productDetail = productsDetails.find(p => p._id.toString() === product._id.toString());
            return {
                _id: product._id,
                name: productDetail?.name || 'Sản phẩm không tồn tại',
                thumbnail: productDetail?.thumbnail || '',
                category: productDetail?.category,
                totalSold: product.totalSold,
                totalRevenue: product.totalRevenue,
                inventory: productDetail?.inventory || 0
            };
        });

        console.log("Hoàn thành lấy thống kê sản phẩm");

        res.json({
            success: true,
            data: {
                totalProducts,
                totalOrders: orderStats[0]?.totalOrders || 0,
                totalRevenue: orderStats[0]?.totalRevenue || 0,
                topSellingProducts: enrichedTopSellingProducts
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê sản phẩm:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê sản phẩm",
            error: error.message
        });
    }
};

const getInventoryProducts = async (req, res) => {
    try {
        console.log("Bắt đầu lấy thông tin tồn kho sản phẩm");

        // Lấy tất cả sản phẩm có tồn kho
        const products = await Product.find()
            .populate('category')
            .populate('providerId')
            .sort({ inventory: -1 })
            .lean();

        // Tính tổng tồn kho
        const totalInventory = products.reduce((sum, product) => sum + (product.inventory || 0), 0);

        // Lấy top 5 sản phẩm có tồn kho cao nhất
        const topInventoryProducts = products.slice(0, 5);

        // Lấy các sản phẩm có tồn kho thấp (dưới 10)
        const lowInventoryProducts = products.filter(product => (product.inventory || 0) < 10);

        console.log("Hoàn thành lấy thông tin tồn kho sản phẩm");

        res.json({
            success: true,
            data: {
                totalInventory,
                topInventoryProducts,
                lowInventoryProducts,
                allProducts: products
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy thông tin tồn kho sản phẩm:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin tồn kho sản phẩm",
            error: error.message
        });
    }
};

// Lấy thống kê sản phẩm bán chạy
const getBestSellingProducts = async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        let startDate = new Date();

        // Tính ngày bắt đầu dựa trên period
        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        // Lấy tất cả đơn hàng trong khoảng thời gian
        const orders = await Order.find({
            createdAt: { $gte: startDate },
            status: { $in: ['processing', 'completed'] }
        }).populate('products.productID');

        // Tính toán số lượng bán và doanh thu cho từng sản phẩm
        const productStats = {};
        orders.forEach(order => {
            order.products.forEach(item => {
                const productId = item.productID._id.toString();
                if (!productStats[productId]) {
                    productStats[productId] = {
                        name: item.productID.name,
                        quantity: 0,
                        revenue: 0,
                        inventory: item.productID.inventory || 0
                    };
                }
                productStats[productId].quantity += item.quantity;
                productStats[productId].revenue += item.price * item.quantity;
            });
        });

        // Chuyển đổi thành mảng và sắp xếp theo doanh thu
        const bestSellingProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5); // Lấy top 5 sản phẩm

        res.json({
            success: true,
            data: bestSellingProducts
        });
    } catch (error) {
        console.error('Error getting best selling products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê sản phẩm bán chạy'
        });
    }
};

// Lấy thống kê doanh thu
const getRevenueStatistics = async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        let startDate = new Date();

        // Tính ngày bắt đầu dựa trên period
        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        // Lấy tổng doanh thu và số lượng đơn hàng
        const orders = await Order.find({
            createdAt: { $gte: startDate },
            paymentStatus: 'paid' // Chỉ lấy đơn hàng đã thanh toán
        }).populate('products.productID');

        // Tính tổng doanh thu và số lượng đơn hàng
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;

        // Tính doanh thu theo ngày cho biểu đồ
        const dailyRevenue = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = 0;
            }
            dailyRevenue[date] += order.totalAmount;
        });

        // Chuyển đổi thành mảng cho biểu đồ và sắp xếp theo ngày
        const chartData = Object.entries(dailyRevenue)
            .map(([date, revenue]) => ({
                date,
                revenue
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Tính doanh thu theo danh mục sản phẩm
        const categoryRevenue = {};
        orders.forEach(order => {
            order.products.forEach(product => {
                const category = product.productID.category;
                if (!categoryRevenue[category]) {
                    categoryRevenue[category] = 0;
                }
                categoryRevenue[category] += product.price * product.quantity;
            });
        });

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                chartData,
                categoryRevenue: Object.entries(categoryRevenue).map(([category, revenue]) => ({
                    category,
                    revenue
                }))
            }
        });
    } catch (error) {
        console.error('Error getting revenue statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê doanh thu'
        });
    }
};

// Lấy thống kê thanh toán
const getPaymentStatistics = async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        let startDate = new Date();

        // Tính ngày bắt đầu dựa trên period
        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        // Lấy thống kê phương thức thanh toán
        const paymentMethodStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    paymentMethod: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Lấy thống kê trạng thái thanh toán
        const paymentStatusStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Tính tổng số đơn hàng
        const totalOrders = paymentStatusStats.reduce((sum, stat) => sum + stat.count, 0);

        // Tính tỷ lệ thanh toán
        const paidOrders = paymentStatusStats.find(stat => stat._id === 'paid')?.count || 0;
        const unpaidOrders = paymentStatusStats.find(stat => stat._id === 'unpaid')?.count || 0;

        res.json({
            success: true,
            data: {
                paymentMethods: paymentMethodStats.map(stat => ({
                    method: stat._id,
                    count: stat.count
                })),
                paymentStatus: {
                    paid: paidOrders,
                    unpaid: unpaidOrders,
                    total: totalOrders
                }
            }
        });
    } catch (error) {
        console.error('Error getting payment statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê thanh toán'
        });
    }
};

module.exports = {
    getProductStatistics,
    getInventoryProducts,
    getBestSellingProducts,
    getRevenueStatistics,
    getPaymentStatistics
}; 