const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');

// Thêm khách hàng mới
const addCustomer = async (newCustomer) => {
    try {
        const { fullName, phoneNumber, email, password, confirmPassword, birthDate , address,avatar } = newCustomer;

        // Kiểm tra email đã tồn tại chưa
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return Promise.reject({
                status: 'Error',
                message: 'Email đã tồn tại',
            });
        }

        // Kiểm tra password và confirmPassword
        if (password !== confirmPassword) {
            return Promise.reject({
                status: 'Error',
                message: 'Passwords do not match',
            });
        }

        // Mã hóa mật khẩu trước khi lưu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo khách hàng mới
        const createdCustomer = await Customer.create({
            fullName,
            phoneNumber,
            email,
            password: hashedPassword,
            confirmPassword,
            birthDate,
            address,
            avatar
        });

        return {
            status: 'Ok',
            message: 'Customer added successfully',
            data: createdCustomer,
        };
    } catch (error) {
        console.error('Database Error:', error);
        return Promise.reject({
            status: 'Error',
            message: 'Failed to add customer',
            error: error.message,
        });
    }
};

// Cập nhật khách hàng
const updateCustomer = async (customerId, updatedData) => {
    try {
        if (Object.keys(updatedData).length === 0) {
            return Promise.reject({
                status: 'Error',
                message: 'No update data provided',
            });
        }

        // Nếu cập nhật mật khẩu, cần mã hóa lại
        if (updatedData.password) {
            if (!updatedData.confirmPassword || updatedData.password !== updatedData.confirmPassword) {
                return Promise.reject({
                    status: 'Error',
                    message: 'Passwords do not match',
                });
            }
            updatedData.password = await bcrypt.hash(updatedData.password, 10);
            delete updatedData.confirmPassword;
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(customerId, updatedData, { new: true });

        if (!updatedCustomer) {
            return Promise.reject({
                status: 'Error',
                message: 'Customer not found',
            });
        }

        return {
            status: 'Ok',
            message: 'Customer updated successfully',
            data: updatedCustomer,
        };
    } catch (error) {
        console.error('Database Error:', error);
        return Promise.reject({
            status: 'Error',
            message: 'Failed to update customer',
            error: error.message,
        });
    }
};

// Xóa khách hàng
function deleteCustomer(id) {
    if (confirm("Bạn có chắc chắn muốn xóa khách hàng này không?")) {
        fetch(`/customers/delete/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Xóa thành công!");
                location.reload(); // Reload lại danh sách
            } else {
                alert("Lỗi: " + data.message);
            }
        })
        .catch(error => {
            console.error("Lỗi khi xóa:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        });
    }
}


module.exports = {
    addCustomer,
    updateCustomer,
    deleteCustomer,
};
