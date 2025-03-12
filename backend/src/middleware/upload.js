exports.uploadAvatar = async (req, res) => {
    try {
      console.log("Uploaded file:", req.file); // Debug
  
      const employee = await Employee.findOne({ employeeId: req.params.id }).populate("userId");
      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy nhân viên" });
      }
  
      if (!req.file) {
        return res.status(400).json({ message: "Không có file nào được tải lên" });
      }
  
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
  
      // Cập nhật avatar trong User
      const user = await User.findById(employee.userId);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      user.avatar = avatarPath;
      await user.save();
  
      res.json({ message: "Cập nhật avatar thành công", avatar: avatarPath });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  };
  