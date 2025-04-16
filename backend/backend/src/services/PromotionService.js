const Promotion = require('../models/Promotion');

// 🟢 Thêm khuyến mãi mới
const addPromotion = async (newPromotion) => {
    try {
        const { name, discount,  minOrderValue, maxDiscount, status, startDate, endDate } = newPromotion;

        // Kiểm tra nếu ngày kết thúc nhỏ hơn ngày bắt đầu
        if (new Date(endDate) < new Date(startDate)) {
            return Promise.reject({
                status: 'Error',
                message: 'Ngày kết thúc phải sau ngày bắt đầu',
            });
        }

        // Tạo khuyến mãi mới
        const createdPromotion = await Promotion.create({
            name,
            discount,
            minOrderValue,
            maxDiscount,
            status,
            startDate,
            endDate
        });

        return {
            status: 'Ok',
            message: 'Thêm khuyến mãi thành công',
            data: createdPromotion,
        };
    } catch (error) {
        console.error('Lỗi CSDL:', error);
        return Promise.reject({
            status: 'Error',
            message: 'Lỗi khi thêm khuyến mãi',
            error: error.message,
        });
    }
};

// 🟡 Cập nhật khuyến mãi
const updatePromotion = async (promotionId, updatedData) => {
    try {
        if (Object.keys(updatedData).length === 0) {
            return Promise.reject({
                status: 'Error',
                message: 'Không có dữ liệu cập nhật',
            });
        }

        // Nếu có ngày bắt đầu & kết thúc, kiểm tra hợp lệ
        if (updatedData.startDate && updatedData.endDate && new Date(updatedData.endDate) < new Date(updatedData.startDate)) {
            return Promise.reject({
                status: 'Error',
                message: 'Ngày kết thúc phải sau ngày bắt đầu',
            });
        }

        const updatedPromotion = await Promotion.findByIdAndUpdate(promotionId, updatedData, { new: true });

        if (!updatedPromotion) {
            return Promise.reject({
                status: 'Error',
                message: 'Không tìm thấy khuyến mãi',
            });
        }

        return {
            status: 'Ok',
            message: 'Cập nhật khuyến mãi thành công',
            data: updatedPromotion,
        };
    } catch (error) {
        console.error('Lỗi CSDL:', error);
        return Promise.reject({
            status: 'Error',
            message: 'Lỗi khi cập nhật khuyến mãi',
            error: error.message,
        });
    }
};

// 🔴 Xóa khuyến mãi
const deletePromotion = async (promotionId) => {
    try {
        const deletedPromotion = await Promotion.findByIdAndDelete(promotionId);
        
        if (!deletedPromotion) {
            return Promise.reject({
                status: 'Error',
                message: 'Không tìm thấy khuyến mãi để xóa',
            });
        }

        return {
            status: 'Ok',
            message: 'Xóa khuyến mãi thành công',
        };
    } catch (error) {
        console.error('Lỗi CSDL:', error);
        return Promise.reject({
            status: 'Error',
            message: 'Lỗi khi xóa khuyến mãi',
            error: error.message,
        });
    }
};

  
  

module.exports = {
    addPromotion,
    updatePromotion,
    deletePromotion,
};
