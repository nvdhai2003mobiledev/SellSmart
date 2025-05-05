const Profile = require('../models/Profile'); // Import model Profile

const getProfiles = async () => {
  try {
    const profiles = await Profile.find(); // Lấy tất cả các profile từ database
    return profiles;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw new Error('Không thể lấy danh sách profile');
  }
};
const getProfileById = async (id) => {
  try {
    return await Profile.findById(id);
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    throw new Error('Không thể lấy thông tin profile');
  }
};

// Cập nhật thông tin profile
const updateProfile = async (id, updatedData) => {
  try {
    return await Profile.findByIdAndUpdate(id, updatedData, { new: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Không thể cập nhật profile');
  }
};

module.exports = {
  getProfiles, // Export hàm getProfiles
  getProfileById, // Hàm lấy profile theo ID
  updateProfile,
};