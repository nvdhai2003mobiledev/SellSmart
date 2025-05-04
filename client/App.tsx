import React, { useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigation } from './src/navigation/AppNavigation';
import { Provider } from 'mobx-react';
import { rootStore } from './src/models/root-store';
import FlashMessage, { showMessage, hideMessage, MessageType } from 'react-native-flash-message';

const App = () => {
  const flashMessageRef = useRef<FlashMessage>(null);

  useEffect(() => {
    requestUserPermission();
    requestAndroidPermission();

    const registerToken = async () => {
      try {
        console.log('===========================================');
        console.log('Bắt đầu lấy FCM Token...');
        const token = await messaging().getToken();
        console.log('FCM Token đã sẵn sàng trong thông báo:');
        console.log(token);
        console.log('===========================================');
        
        try {
          console.log('Thử gửi thông báo test...');
          const testMessage = {
            notification: {
              title: 'Test thông báo',
              body: 'Đây là thông báo test từ ứng dụng SellSmart',
            },
            data: {
              screen: 'Home',
              timestamp: Date.now().toString(),
            },
          };
          
          console.log('Kiểm tra xử lý thông báo foreground:');
          const mockRemoteMessage = {
            notification: testMessage.notification,
            data: testMessage.data
          };
          
          showNotificationDialog(
            mockRemoteMessage.notification?.title || 'Thông báo mới',
            mockRemoteMessage.notification?.body || '',
            mockRemoteMessage.data
          );
        } catch (testError) {
          console.error('Lỗi khi test thông báo:', testError);
        }
        
        const { registerFCMToken } = require('./src/services/api/notificationAPI');
        
        const result = await registerFCMToken(token, {
          platform: Platform.OS,
          model: 'unknown',
        });
        
        if (result.kind === 'ok') {
          console.log('Đăng ký FCM token thành công');
        } else {
          console.error('Lỗi đăng ký FCM token:', result.kind);
        }
      } catch (error) {
        console.error('Lỗi khi đăng ký FCM token:', error);
      }
    };
    
    registerToken();
    
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token được làm mới:', token);
      try {
        const { registerFCMToken } = require('./src/services/api/notificationAPI');
        await registerFCMToken(token);
      } catch (error) {
        console.error('Lỗi khi đăng ký lại FCM token:', error);
      }
    });

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Nhận thông báo khi app đang chạy:', remoteMessage);
      
      showNotificationDialog(
        remoteMessage.notification?.title || 'Thông báo mới',
        remoteMessage.notification?.body || '',
        remoteMessage.data || {}
      );
    });

    const unsubscribeBackground = messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Nhận thông báo khi app ở background:', remoteMessage);
      return Promise.resolve();
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Thông báo được nhấn để mở app:', remoteMessage);
      if (remoteMessage.data?.screen) {
        console.log('Điều hướng đến:', remoteMessage.data.screen);
      }
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('App được mở từ thông báo khi đã đóng:', remoteMessage);
        if (remoteMessage.data?.screen) {
          console.log('Điều hướng đến:', remoteMessage.data.screen);
        }
      }
    });

    return () => {
      if (typeof unsubscribeForeground === 'function') unsubscribeForeground();
      if (typeof unsubscribeTokenRefresh === 'function') unsubscribeTokenRefresh();
    };
  }, []);

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Quyền thông báo được cấp');
    } else {
      console.log('Quyền thông báo bị từ chối');
    }
  };

  const requestAndroidPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Quyền thông báo Android được cấp');
        } else {
          console.log('Quyền thông báo Android bị từ chối');
        }
      } catch (err) {
        console.warn('Lỗi khi xin quyền thông báo:', err);
      }
    }
  };

  const showNotificationDialog = (title: string, body: string, data: any) => {
    showMessage({
      message: title,
      description: body,
      type: 'success' as MessageType,
      duration: 15000, 
      position: 'top',
      icon: 'success',
      hideStatusBar: false,
      floating: true,
      backgroundColor: '#FFFFFF',
      color: '#000000',
      titleStyle: styles.notificationTitle,
      textStyle: styles.notificationText,
      renderCustomContent: () => (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              hideMessage();
            }}
          >
            <Text style={styles.buttonTextCancel}>ĐÓNG</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              hideMessage();
              if (data?.screen) {
                console.log('Điều hướng đến:', data.screen, 'với productId:', data.productId);
              }
            }}
          >
            <Text style={styles.buttonTextAction}>XEM</Text>
          </TouchableOpacity>
        </View>
      )
    });
  };

  return (
    <Provider rootStore={rootStore}>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
      <FlashMessage position="top" ref={flashMessageRef} />
    </Provider>
  );
};

const styles = StyleSheet.create({
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  notificationText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonTextCancel: {
    color: '#888',
    fontWeight: 'bold',
  },
  buttonTextAction: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default App;
