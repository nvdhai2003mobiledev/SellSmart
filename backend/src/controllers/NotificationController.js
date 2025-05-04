const NotificationToken = require("../models/NotificationToken");
const admin = require("../firebase-admin");

// Đăng ký token FCM
const registerToken = async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: "Error",
        message: "Token không được để trống",
      });
    }

    console.log("Đăng ký token FCM mới:", token);

    // Kiểm tra xem token đã tồn tại chưa
    let tokenDoc = await NotificationToken.findOne({ token });
    
    if (tokenDoc) {
      // Cập nhật thông tin token hiện có
      tokenDoc.lastActive = new Date();
      if (req.user) {
        tokenDoc.userId = req.user._id;
      }
      if (deviceInfo) {
        tokenDoc.deviceInfo = deviceInfo;
      }
      
      await tokenDoc.save();
      console.log("Cập nhật token FCM thành công:", token);
      
      return res.status(200).json({
        status: "Ok",
        message: "Cập nhật token FCM thành công",
        data: tokenDoc,
      });
    }
    
    // Tạo token mới
    const newToken = new NotificationToken({
      token,
      deviceInfo: deviceInfo || {},
      userId: req.user ? req.user._id : null,
    });
    
    await newToken.save();
    console.log("Đăng ký token FCM thành công:", token);
    
    res.status(201).json({
      status: "Ok",
      message: "Đăng ký token FCM thành công",
      data: newToken,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký token FCM:", error);
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi đăng ký token FCM: " + error.message,
    });
  }
};

// Gửi thông báo đến tất cả thiết bị
const removeInvalidToken = async (token) => {
  try {
    // Xóa token không hợp lệ từ cơ sở dữ liệu
    await NotificationToken.findOneAndDelete({ token });
    console.log(`Đã xóa token không hợp lệ: ${token}`);
  } catch (error) {
    console.error(`Lỗi khi xóa token không hợp lệ: ${error.message}`);
  }
};

const sendNotificationToAll = async (title, body, data = {}) => {
  try {
    console.log('Bắt đầu gửi thông báo:', {
      title,
      body,
      data
    });

    // Lấy tất cả token FCM
    const tokens = await NotificationToken.find().select("token");
    
    if (!tokens || tokens.length === 0) {
      console.log("Không có token FCM nào được đăng ký");
      return { success: false, message: "Không có token FCM nào được đăng ký" };
    }

    console.log('Có', tokens.length, 'token FCM được đăng ký');
    
    const tokenValues = tokens.map(t => t.token);
    console.log(`Gửi thông báo đến ${tokenValues.length} thiết bị`);
    
    // Gửi thông báo đến từng thiết bị sử dụng hàm sendNotificationToDevice
    const results = await Promise.all(
      tokens.map(async token => {
        try {
          // Tạo data object với title và body
          const notificationData = {
            ...data,
            title,
            body
          };
          
          const result = await sendNotificationToDevice(token.token, notificationData);
          if (!result.success && result.error.includes('not a valid FCM registration token')) {
            await removeInvalidToken(token.token);
          }
          return result;
        } catch (error) {
          console.error(`Lỗi khi gửi thông báo đến token ${token}:`, error.message);
          return { success: false, token, error: error.message };
        }
      })
    );
    
    // Thống kê kết quả
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`Kết quả gửi thông báo: Thành công: ${successCount}, Thất bại: ${failureCount}`);
    
    return {
      success: true,
      successCount,
      failureCount,
      responses: results,
    };
  } catch (error) {
    console.error("Lỗi khi gửi thông báo:", error);
    return { success: false, error: error.message };
  }
};

// Gửi thông báo đến một thiết bị cụ thể
const sendNotificationToDevice = async (token, data) => {
  try {
    // Lấy title và body từ data object
    const title = data.title;
    const body = data.body;
    
    console.log('Đang tạo thông báo cho token:', token);
    console.log('Nội dung thông báo:', {
      title,
      body,
      data
    });

    // Tạo thông báo
    const message = {
      token: token,
      notification: {
        title: data.title,
        body: data.body
      },
      data: {
        ...data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        screen: data.screen || 'OrderDetail',
        time: Date.now().toString(),
        imageUrl: data.imageUrl || '',
        display_mode: 'dialog',
        importance: 'high',
        priority: 'high'
      },
      android: {
        notification: {
          title: data.title,
          body: data.body,
          icon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'sellsmart_notification',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: data.title,
              body: data.body
            },
            sound: 'default',
            badge: 1,
            contentAvailable: true,
            mutableContent: true
          }
        },
        fcmOptions: {
          image: data.imageUrl || null
        }
      },
      webpush: {
        notification: {
          title: data.title,
          body: data.body,
          icon: data.imageUrl || null,
          requireInteraction: true
        },
        fcmOptions: {
          link: `sellsmart://order/${data.orderId}`
        }
      },
      fcmOptions: {
        analyticsLabel: data.type === 'PAYMENT_COMPLETED' ? 'payment_completed_notification' : 'new_order_notification'
      }
    };
    
    // Gửi thông báo
    const response = await admin.messaging().send(message);
    
    console.log("Đã gửi thông báo thành công:", response);
    
    return { success: true, response };
  } catch (error) {
    console.error("Lỗi khi gửi thông báo:", error);
    return { success: false, error: error.message };
  }
};

// API để test gửi thông báo
const sendTestNotification = async (req, res) => {
  try {
    const { title, body, data, token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: "Error",
        message: "Token FCM không được để trống",
      });
    }
    
    // Kiểm tra token có tồn tại trong database không
    const tokenExists = await NotificationToken.findOne({ token });
    
    if (!tokenExists) {
      // Nếu token không tồn tại, tạo mới
      console.log("Token không tồn tại, đang tạo mới...");
      
      const newToken = new NotificationToken({
        token,
        deviceInfo: { platform: "android", model: "sample_device" },
      });
      
      await newToken.save();
    }
    
    // Gửi thông báo sử dụng hàm sendNotificationToDevice
    const result = await sendNotificationToDevice(token, title, body, data);
    
    if (result.success) {
      return res.status(200).json({
        status: "Ok",
        message: "Thông báo test đã được gửi thành công",
        data: result,
      });
    } else {
      return res.status(500).json({
        status: "Error",
        message: "Không thể gửi thông báo test",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Lỗi khi gửi thông báo test:", error);
    return res.status(500).json({
      status: "Error",
      message: "Lỗi khi gửi thông báo test",
      error: error.message,
    });
  }
};

// Tạo token FCM mẫu để test
const createSampleToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: "Error",
        message: "Token không được để trống",
      });
    }
    
    console.log("Tạo token FCM mẫu:", token);
    
    // Kiểm tra xem token đã tồn tại chưa
    let tokenDoc = await NotificationToken.findOne({ token });
    
    if (tokenDoc) {
      console.log("Token đã tồn tại, cập nhật lastActive");
      tokenDoc.lastActive = new Date();
      await tokenDoc.save();
      
      return res.status(200).json({
        status: "Ok",
        message: "Token đã tồn tại và được cập nhật",
        data: tokenDoc,
      });
    }
    
    // Tạo token mới
    tokenDoc = new NotificationToken({
      token,
      deviceInfo: {
        platform: "android",
        model: "sample_device",
      },
    });
    
    await tokenDoc.save();
    console.log("Tạo token FCM mẫu thành công:", tokenDoc);
    
    res.status(201).json({
      status: "Ok",
      message: "Tạo token FCM mẫu thành công",
      data: tokenDoc,
    });
  } catch (error) {
    console.error("Lỗi khi tạo token FCM mẫu:", error);
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi tạo token FCM mẫu: " + error.message,
    });
  }
};

module.exports = {
  registerToken,
  sendTestNotification,
  sendNotificationToDevice,
  sendNotificationToAll,
  createSampleToken,
};