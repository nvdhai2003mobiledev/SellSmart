const userService = require('../src/services/UserServices');


const creatUser = async (req, res) => {
    try {
        console.log("req.body", req.body);
        const { fullName, phoneNumber, email, password,confirmPassword, birthDate, address, avatar } = req.body;

        // Kiểm tra input
        if (!fullName || !phoneNumber || !email || !password || !confirmPassword || !birthDate || !address || !avatar) {
            return res.status(400).json({
                status: "ERR",
                message: "The input is required",
            });
        }
    

        
        const reg = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; 
        if (!reg.test(email)) {
            return res.status(400).json({
                status: "ERR",
                message: "Invalid email format",
            });
        }
        else if(password !== confirmPassword){
            return res.status(400).json({
                status: "ERR",
                message: "The password is not similar confirmpassword",
            });
        }

        // Gọi hàm tạo user
        const result = await userService.creatUser(req.body);
        if (result.status === 'Error') {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({
            message: e.message || "An error occurred",
        });
    }
};  

const loginUser = async (req, res) => {
    try {
        console.log("req.body", req.body);
        const { fullName, phoneNumber, email, password,confirmPassword, birthDate, address, avatar } = req.body;

        // Kiểm tra input
        if (!fullName || !phoneNumber || !email || !password || !confirmPassword || !birthDate || !address || !avatar) {
            return res.status(400).json({
                status: "ERR",
                message: "The input is required",
            });
        }
    

        // Kiểm tra định dạng email
        const reg = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // Sửa regex
        if (!reg.test(email)) {
            return res.status(400).json({
                status: "ERR",
                message: "Invalid email format",
            });
        }
        else if(password !== confirmPassword){
            return res.status(400).json({
                status: "ERR",
                message: "The password is not similar confirmpassword",
            });
        }

        // Gọi hàm tạo user
        const result = await userService.loginUser(req.body);
        if (result.status === 'Error') {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({
            message: e.message || "An error occurred",
        });
    }
};  

const updateUser = async (req, res) => {
    try {
        const userID = req.params.id
        console.log("userID : ", userID);
        
        const data = req.body
        console.log("data : ", data);
        
        if(!userID){
            return res.status(400).json({
                status: "ERR",
                message: "The password is undifined",
            }); 
        }
        const result = await userService.updateUser(userID,data);
        if (result.status === 'Error') {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({
            message: e.message || "An error occurred",
        });
    }
}; 
module.exports = {
    creatUser,
    loginUser,
    updateUser,
};
