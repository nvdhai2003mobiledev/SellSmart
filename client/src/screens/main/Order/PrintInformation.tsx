import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Modal,
  Image,
} from 'react-native';
import {
  BaseLayout,
  Header,
  Button,
  DynamicText,
  Input,
} from '../../../components';
import {useNavigation, useRoute} from '@react-navigation/native';
import {observer} from 'mobx-react-lite';
import {color, moderateScale, scaleHeight, scaleWidth} from '../../../utils';
import {Fonts} from '../../../assets';
import {
  NoteText,
  Printer,
  Shop,
  Bluetooth,
} from 'iconsax-react-native';
import { format } from 'date-fns';
import { BleManager, Device, State } from 'react-native-ble-plx';
import QRCode from 'react-native-qrcode-svg';

// Document URL for QR code
const DOCUMENTS_URL = 'https://sellsmart-4.onrender.com/public/documents';

// Create a singleton BleManager instance at the file level to persist across component unmounts
let globalBleManager: BleManager | null = null;
let isGlobalBleManagerInitialized = false;
let lastConnectedDeviceId: string | null = null;

// Utility for safe error messages
const safeErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  } else if (typeof err === 'string') {
    return err;
  } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  } else {
    return 'Lỗi không xác định';
  }
};

// Khởi tạo BLE Manager sau khi component đã render để tránh lỗi
const PrintInformation = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const {order, printMethod, orderNumber} = route.params as {
    order: any;
    printMethod: 'wire' | 'wifi';
    orderNumber: string;
  };

  // Ref để lưu trữ bleManager
  const bleManagerRef = useRef<BleManager | null>(null);
  // Ref để theo dõi nếu BleManager đã khởi tạo
  const bleManagerInitializedRef = useRef<boolean>(false);
  // State để hiển thị UI dựa trên trạng thái khởi tạo
  const [bleManagerInitialized, setBleManagerInitialized] = useState(false);

  // State cho các tùy chọn in
  const [printLogo, setPrintLogo] = useState(true);
  const [printFooter, setPrintFooter] = useState(true);
  const [printItemSKU, setPrintItemSKU] = useState(false);
  const [printCompanyInfo, setPrintCompanyInfo] = useState(true);
  const [printQRCode, setPrintQRCode] = useState(true); // Thêm option in QR code
  const [footer, setFooter] = useState(
    'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!'
  );
  const [companyName, setCompanyName] = useState('Cửa hàng công nghệ SellSmart');
  const [companyAddress, setCompanyAddress] = useState(
    '123 Đường Công Nghệ, Quận 1, TP.HCM'
  );
  const [companyPhone, setCompanyPhone] = useState('0987654321');
  const [isConnecting, setIsConnecting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  // Bluetooth states
  const [isScanning, setIsScanning] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  
  // State cho preview hóa đơn
  const [showPreview, setShowPreview] = useState(false);
  
  // Refs để theo dõi trạng thái mà không gây re-render
  const isScanningRef = useRef<boolean>(false);
  const connectedDeviceRef = useRef<Device | null>(null);
  
  // Cập nhật refs khi state thay đổi
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);
  
  useEffect(() => {
    connectedDeviceRef.current = connectedDevice;
  }, [connectedDevice]);

  // Kiểm tra và khôi phục kết nối khi quay lại màn hình
  useEffect(() => {
    // Chỉ kiểm tra nếu BleManager đã khởi tạo
    if (bleManagerRef.current && bleManagerInitializedRef.current) {
      const checkConnectedDevices = async () => {
        try {
          console.log('Kiểm tra thiết bị đã kết nối khi trở lại màn hình...');
          
          // Nếu có ID thiết bị đã kết nối trước đó, thử khôi phục kết nối đó trước
          if (lastConnectedDeviceId) {
            console.log('Tìm thấy ID thiết bị đã kết nối trước đó:', lastConnectedDeviceId);
            
            try {
              // Thử kết nối lại với thiết bị đã kết nối trước đó
              if (bleManagerRef.current) {
                console.log('Đang thử kết nối lại với thiết bị:', lastConnectedDeviceId);
                
                // Kiểm tra xem thiết bị có sẵn không
                const peripherals = await bleManagerRef.current.connectedDevices([]);
                const existingDevice = peripherals.find(d => d.id === lastConnectedDeviceId);
                
                if (existingDevice) {
                  console.log('Đã tìm thấy thiết bị đã kết nối:', existingDevice.name || 'không tên');
                  setConnectedDevice(existingDevice);
                  setPrinterStatus('connected');
                  
                  // Thiết lập lại listener cho sự kiện ngắt kết nối
                  setupDisconnectionListener(existingDevice.id);
                  return;
                } else {
                  console.log('Thiết bị cũ không còn kết nối, thử kết nối lại');
                  
                  // Thiết bị không còn kết nối, thử kết nối lại
                  try {
                    const reconnectedDevice = await bleManagerRef.current.connectToDevice(lastConnectedDeviceId, {
                      timeout: 10000,
                      autoConnect: true,
                    });
                    
                    // Khám phá dịch vụ và đặc tính
                    await reconnectedDevice.discoverAllServicesAndCharacteristics();
                    
                    console.log('Đã kết nối lại với thiết bị:', reconnectedDevice.name || 'không tên');
                    setConnectedDevice(reconnectedDevice);
                    setPrinterStatus('connected');
                    
                    // Thiết lập lại listener cho sự kiện ngắt kết nối
                    setupDisconnectionListener(reconnectedDevice.id);
                    return;
                  } catch (reconnectError) {
                    console.log('Không thể kết nối lại với thiết bị cũ:', reconnectError);
                    // Tiếp tục tìm kiếm thiết bị khác đã kết nối
                  }
                }
              }
            } catch (previousDeviceError) {
              console.log('Lỗi khi thử kết nối với thiết bị cũ:', previousDeviceError);
            }
          }
          
          // Lấy thiết bị đã kết nối từ BleManager
          if (bleManagerRef.current) {
            const connectedDevices = await bleManagerRef.current.connectedDevices([]);
            console.log(`Tìm thấy ${connectedDevices.length} thiết bị đã kết nối`);
            
            // Nếu có thiết bị đã kết nối, cập nhật state
            if (connectedDevices.length > 0) {
              // Lấy thiết bị đầu tiên trong danh sách
              const device = connectedDevices[0];
              console.log('Khôi phục kết nối với thiết bị:', device.name || 'không tên', device.id);
              
              // Cập nhật state
              setConnectedDevice(device);
              setPrinterStatus('connected');
              
              // Thiết lập lại listener cho sự kiện ngắt kết nối
              setupDisconnectionListener(device.id);
            }
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra thiết bị đã kết nối:', error);
        }
      };
      
      // Hàm thiết lập listener cho sự kiện ngắt kết nối
      const setupDisconnectionListener = (deviceId: string) => {
        try {
          if (!bleManagerRef.current) return;
          
          const handleDisconnection = (error: any, disconnectedDevice: Device | null) => {
            console.log('Thiết bị đã ngắt kết nối:', disconnectedDevice?.id, error);
            
            // Chỉ xử lý nếu thiết bị ngắt kết nối trùng với thiết bị đã kết nối
            if (connectedDeviceRef.current?.id === disconnectedDevice?.id) {
              // Cập nhật trạng thái kết nối
              setPrinterStatus('disconnected');
              setConnectedDevice(null);
              
              // Thông báo ngắt kết nối nếu trước đó đã kết nối
              setTimeout(() => {
                Alert.alert(
                  'Thiết bị đã ngắt kết nối', 
                  'Kết nối với máy in đã bị mất. Vui lòng kết nối lại.',
                  [{ text: 'OK' }]
                );
              }, 500);
            }
          };
          
          // Đối với react-native-ble-plx, sử dụng phương thức này để theo dõi ngắt kết nối
          bleManagerRef.current.onDeviceDisconnected(deviceId, handleDisconnection);
        } catch (listenerError) {
          console.warn('Không thể thiết lập bộ lắng nghe sự kiện ngắt kết nối khi khôi phục:', listenerError);
        }
      };
      
      // Thực hiện kiểm tra
      checkConnectedDevices();
    }
  }, [bleManagerInitialized]); // Chỉ thực hiện khi BleManager đã khởi tạo

  // Khởi tạo BLE Manager trong useEffect - chỉ chạy 1 lần khi component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeBleManager = async () => {
      try {
        // Kiểm tra xem globalBleManager đã tồn tại chưa
        if (globalBleManager && isGlobalBleManagerInitialized) {
          console.log('Sử dụng BleManager toàn cục đã được khởi tạo trước đó');
          bleManagerRef.current = globalBleManager;
          bleManagerInitializedRef.current = true;
          if (isMounted) {
            setBleManagerInitialized(true);
          }
          return;
        }
        
        // Nếu không có instance toàn cục, tạo mới
        console.log('Khởi tạo BleManager toàn cục mới');
        globalBleManager = new BleManager({
          restoreStateIdentifier: 'sellsmart-bluetooth-printer',
          restoreStateFunction: (peripherals) => {
            // Xử lý khi khôi phục trạng thái
            console.log('Khôi phục trạng thái Bluetooth...', peripherals);
            
            // Kiểm tra nếu có dữ liệu được khôi phục
            if (peripherals && typeof peripherals === 'object') {
              console.log('Có dữ liệu Bluetooth được khôi phục');
              
              // Hiển thị thông tin về thiết bị đã kết nối (nếu có)
              try {
                // @ts-ignore - Trường hợp truy cập thuộc tính không xác định
                const deviceCount = peripherals.connectedUUIDs?.length || 0;
                if (deviceCount > 0) {
                  console.log(`Tìm thấy ${deviceCount} thiết bị đã kết nối trước đó`);
                  
                  // @ts-ignore
                  if (peripherals.connectedUUIDs && peripherals.connectedUUIDs.length > 0) {
                    // @ts-ignore
                    lastConnectedDeviceId = peripherals.connectedUUIDs[0];
                    console.log('Last connected device ID:', lastConnectedDeviceId);
                  }
                }
              } catch (e) {
                console.log('Không thể đọc thông tin thiết bị đã kết nối:', e);
              }
            }
          }
        });
        
        // Đánh dấu đã khởi tạo manager toàn cục
        isGlobalBleManagerInitialized = true;
        
        // Gán manager toàn cục cho ref cục bộ
        bleManagerRef.current = globalBleManager;
        bleManagerInitializedRef.current = true;
        
        // Cập nhật UI state nếu component vẫn mount
        if (isMounted) {
          setBleManagerInitialized(true);
          console.log('BleManager đã khởi tạo thành công');
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo BleManager:', error);
        
        // Nếu có lỗi, thử lại sau 1 giây
        if (isMounted) {
          setTimeout(initializeBleManager, 1000);
        }
      }
    };
    
    // Khởi tạo BleManager
    initializeBleManager();
    
    // Cleanup function
    return () => {
      // Đánh dấu component unmounted để tránh setState sau khi unmount
      isMounted = false;
      
      // Dọn dẹp khi component unmount
      const cleanupBluetooth = async () => {
        try {
          // Dừng quét nếu đang quét
          if (bleManagerRef.current && isScanningRef.current) {
            try {
              console.log('Dừng quét thiết bị khi unmount');
              bleManagerRef.current.stopDeviceScan();
            } catch (e) {
              console.log('Lỗi khi dừng quét trước khi unmount:', e);
            }
          }
          
          // Lưu ID của thiết bị đã kết nối để khôi phục sau
          if (connectedDevice) {
            lastConnectedDeviceId = connectedDevice.id;
            console.log('Lưu ID thiết bị đã kết nối trước khi rời khỏi màn hình:', lastConnectedDeviceId);
          }
          
          // KHÔNG hủy BleManager hoặc ngắt kết nối thiết bị để duy trì kết nối giữa các màn hình
          console.log('Duy trì kết nối Bluetooth khi rời khỏi màn hình');
        } catch (error) {
          console.error('Lỗi trong quá trình dọn dẹp Bluetooth:', error);
        }
      };
      
      cleanupBluetooth();
    };
  }, []); // Chỉ chạy một lần khi component mount

  // Theo dõi trạng thái Bluetooth
  useEffect(() => {
    if (!bleManagerRef.current || !bleManagerInitializedRef.current) return;
    
    console.log('Thiết lập theo dõi trạng thái Bluetooth');
    // Subscription để theo dõi trạng thái Bluetooth
    const subscription = bleManagerRef.current.onStateChange((state) => {
      console.log('Bluetooth state changed:', state);
      
      // Nếu Bluetooth đã bật, dừng theo dõi
      if (state === State.PoweredOn) {
        console.log('Bluetooth đã bật và sẵn sàng');
      } else if (state === State.PoweredOff) {
        setTimeout(() => {
          Alert.alert(
            'Bluetooth đã tắt',
            'Vui lòng bật Bluetooth để sử dụng tính năng này.',
            [{ text: 'OK' }]
          );
        }, 500);
      }
    }, true);

    // Chỉ hủy theo dõi trạng thái nếu cần thiết
    return () => {
      try {
        // Giữ lại subscription để duy trì trạng thái Bluetooth khi rời màn hình
        console.log('Giữ theo dõi trạng thái Bluetooth khi rời khỏi màn hình');
        // subscription.remove(); // Đã comment lại để không hủy subscription
      } catch (error) {
        console.error('Lỗi khi xử lý theo dõi Bluetooth:', error);
      }
    };
  }, [bleManagerInitialized]); // Chỉ chạy lại khi bleManagerInitialized thay đổi

  // Request Android permissions
  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('Yêu cầu quyền Bluetooth cho Android...');
        
        if (Platform.Version >= 31) { // Android 12+
          console.log('Android 12+ - Yêu cầu quyền mở rộng');
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          
          const results = {
            scan: granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN],
            connect: granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT], 
            location: granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]
          };
          
          console.log('Kết quả quyền:', results);
          
          return (
            results.scan === PermissionsAndroid.RESULTS.GRANTED &&
            results.connect === PermissionsAndroid.RESULTS.GRANTED &&
            results.location === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          console.log('Android < 12 - Yêu cầu quyền vị trí');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Quyền truy cập vị trí',
              message: 'Ứng dụng cần quyền truy cập vị trí của bạn để quét thiết bị Bluetooth.',
              buttonNeutral: 'Hỏi lại sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Đồng ý'
            }
          );
          
          console.log('Kết quả quyền vị trí:', granted);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.error('Lỗi khi yêu cầu quyền Bluetooth:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  // Tìm kiếm thiết bị Bluetooth
  const scanForDevices = async () => {
    try {
      // Kiểm tra xem đang quét hay không
      if (isScanningRef.current) {
        console.log('Đang trong quá trình quét, không khởi tạo quét mới');
        return;
      }

      // Kiểm tra xem BleManager đã được khởi tạo chưa
      if (!bleManagerRef.current || !bleManagerInitializedRef.current) {
        console.error('BleManager chưa được khởi tạo hoặc đã bị hủy');
        setTimeout(() => {
          Alert.alert(
            'Lỗi',
            'Bluetooth chưa sẵn sàng. Vui lòng thử lại sau.',
            [{ text: 'OK' }]
          );
        }, 500);
        return;
      }
      
      // Hiển thị loading indicator khi bắt đầu quét
      setIsConnecting(true);
      setIsScanning(true); // Cờ này sẽ tự động cập nhật isScanningRef.current
      
      // Kiểm tra quyền Bluetooth
      console.log('Kiểm tra quyền Bluetooth');
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        setTimeout(() => {
          Alert.alert(
            'Cần quyền', 
            'Ứng dụng cần quyền truy cập Bluetooth và vị trí để tìm kiếm máy in.',
            [{ text: 'OK' }]
          );
        }, 500);
        // Đặt lại trạng thái loading
        setIsConnecting(false);
        setIsScanning(false);
        return;
      }

      // Hiển thị danh sách thiết bị
      setShowDeviceList(true);
      setBluetoothDevices([]);
      
      console.log('Đang quét thiết bị Bluetooth...');
      
      // Kiểm tra trạng thái Bluetooth trước khi quét
      const state = await bleManagerRef.current.state();
      console.log('Trạng thái Bluetooth hiện tại:', state);
      
      if (state !== State.PoweredOn) {
        setTimeout(() => {
          Alert.alert(
            'Bluetooth chưa được bật',
            'Vui lòng bật Bluetooth và thử lại.',
            [{ text: 'OK' }]
          );
        }, 500);
        setIsScanning(false);
        setIsConnecting(false); // Đặt lại trạng thái loading
        return;
      }
      
      // Dừng quét trước nếu đang quét
      try {
        console.log('Dừng quét thiết bị trước đó nếu có');
        bleManagerRef.current.stopDeviceScan();
      } catch (e) {
        console.log('Lỗi khi dừng quét trước đó:', e);
        // Không cần xử lý lỗi này
      }
      
      // Đặt một timeout để tự động dừng quét
      const scanTimeout = setTimeout(() => {
        try {
          if (bleManagerRef.current && bleManagerInitializedRef.current) {
            console.log('Tự động dừng quét sau timeout');
            bleManagerRef.current.stopDeviceScan();
          }
          
          setIsScanning(false);
          setIsConnecting(false); // Đặt lại trạng thái loading khi dừng quét
          
          // Kiểm tra nếu không tìm thấy thiết bị nào
          setBluetoothDevices(currentDevices => {
            if (currentDevices.length === 0) {
              setTimeout(() => {
                Alert.alert(
                  'Thông báo', 
                  'Không tìm thấy thiết bị nào. Hãy đảm bảo máy in đã bật và trong phạm vi kết nối.',
                  [{ text: 'OK' }]
                );
              }, 500);
            }
            return currentDevices;
          });
        } catch (e) {
          console.log('Lỗi khi tự động dừng quét:', e);
        }
      }, 10000);
      
      // Bắt đầu quét thiết bị mới
      try {
        console.log('Bắt đầu quét thiết bị mới');
        
        bleManagerRef.current.startDeviceScan(
          null, // Không lọc UUID
          { allowDuplicates: false }, // Tùy chọn quét
          (error, device) => {
            if (error) {
              // Xóa timeout nếu có lỗi
              clearTimeout(scanTimeout);
              
              console.error('Lỗi quét thiết bị:', error);
              setIsScanning(false);
              setIsConnecting(false); // Đặt lại trạng thái loading khi có lỗi
              
              // Tránh hiển thị nhiều alert bằng cách sử dụng setTimeout
              setTimeout(() => {
                Alert.alert(
                  'Lỗi quét thiết bị',
                  `Không thể quét thiết bị: ${safeErrorMessage(error)}`,
                  [{ text: 'OK' }]
                );
              }, 500);
              return;
            }
            
            if (device) {
              console.log('Thiết bị được phát hiện:', device.id, device.name || 'không tên');
              
              // Chỉ thêm thiết bị có tên hoặc chưa có trong danh sách
              setBluetoothDevices(prev => {
                if (!prev.find(d => d.id === device.id)) {
                  return [...prev, device];
                }
                return prev;
              });
            }
          }
        );
        
        // Trả về một hàm dọn dẹp để đảm bảo dừng quét khi cần
        return () => {
          clearTimeout(scanTimeout);
          if (bleManagerRef.current && bleManagerInitializedRef.current) {
            try {
              bleManagerRef.current.stopDeviceScan();
              setIsScanning(false);
              setIsConnecting(false); // Đảm bảo đặt lại trạng thái loading khi dọn dẹp
            } catch (e) {
              console.log('Lỗi khi dừng quét trong cleanup:', e);
            }
          }
        };
      } catch (scanError: unknown) {
        console.error('Lỗi khi bắt đầu quét:', scanError);
        setIsScanning(false);
        setIsConnecting(false); // Đặt lại trạng thái loading khi có lỗi
        
        setTimeout(() => {
          Alert.alert(
            'Lỗi khi quét thiết bị', 
            `Không thể quét thiết bị Bluetooth: ${safeErrorMessage(scanError)}`,
            [{ text: 'OK' }]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Lỗi khi chuẩn bị quét thiết bị:', error);
      setIsScanning(false);
      setIsConnecting(false); // Đặt lại trạng thái loading khi có lỗi
      
      setTimeout(() => {
        Alert.alert(
          'Lỗi', 
          'Không thể khởi tạo quét Bluetooth. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }, 500);
    }
  };

  // Connect to selected Bluetooth device
  const connectToDevice = async (device: Device) => {
    try {
      if (!bleManagerRef.current) {
        throw new Error('BleManager chưa được khởi tạo hoặc đã bị hủy');
      }
      
      // Đảm bảo dừng quét trước khi kết nối
      try {
        bleManagerRef.current.stopDeviceScan();
      } catch (e) {
        console.log('Lỗi khi dừng quét trước khi kết nối:', e);
      }
      
      setIsConnecting(true);
      setPrinterStatus('connecting');
      
      console.log('Đang kết nối với thiết bị:', device.name, device.id);
      
      // Kiểm tra trạng thái Bluetooth
      const state = await bleManagerRef.current.state();
      if (state !== State.PoweredOn) {
        throw new Error('Bluetooth chưa được bật. Vui lòng bật Bluetooth và thử lại.');
      }
      
      // Hủy kết nối hiện tại nếu có
      if (connectedDevice) {
        console.log('Hủy kết nối thiết bị hiện tại:', connectedDevice.id);
        try {
          await bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
        } catch (disconnectError) {
          console.log('Lỗi khi hủy kết nối thiết bị hiện tại:', disconnectError);
          // Tiếp tục kết nối với thiết bị mới ngay cả khi không thể hủy kết nối thiết bị hiện tại
        }
      }
      
      // Kết nối với thiết bị với timeout dài hơn
      console.log('Bắt đầu kết nối với thiết bị:', device.id);
      const deviceConnection = await bleManagerRef.current.connectToDevice(device.id, {
        timeout: 15000, // Tăng timeout lên 15 giây
        autoConnect: true, // Bật tự động kết nối lại để duy trì khi rời màn hình
      });
      
      console.log('Kết nối ban đầu thành công, khám phá dịch vụ...');
      
      // Kiểm tra xem BleManager còn hoạt động không
      if (!bleManagerRef.current) {
        throw new Error('BleManager đã bị hủy trong quá trình kết nối');
      }
      
      // Khám phá dịch vụ và đặc tính với timeout riêng
      try {
        await deviceConnection.discoverAllServicesAndCharacteristics();
        console.log('Đã khám phá dịch vụ và đặc tính thành công');
      } catch (discoverError) {
        console.error('Lỗi khi khám phá dịch vụ:', discoverError);
        throw new Error('Không thể khám phá dịch vụ của thiết bị. Vui lòng thử lại.');
      }
      
      // Kiểm tra xem thiết bị còn kết nối không
      const isConnected = await deviceConnection.isConnected();
      if (!isConnected) {
        throw new Error('Thiết bị đã ngắt kết nối sau khi khám phá dịch vụ.');
      }
      
      console.log('Thiết bị đã kết nối thành công:', deviceConnection.name);
      
      // Thử kiểm tra khả năng in ngay sau khi kết nối
      try {
        // Tìm các dịch vụ và đặc tính
        const services = await deviceConnection.services();
        
        // Kiểm tra nhanh xem có đặc tính nào có thể ghi không
        let canPrint = false;
        
        for (const service of services) {
          console.log('Dịch vụ:', service.uuid);
          const characteristics = await service.characteristics();
          
          if (characteristics.length > 0) {
            canPrint = true;
            break;
          }
        }
        
        if (!canPrint) {
          console.warn('Thiết bị không có đặc tính nào có thể ghi.');
        } else {
          console.log('Thiết bị có các dịch vụ và đặc tính cần thiết.');
        }
      } catch (testError) {
        console.warn('Không thể kiểm tra khả năng in:', testError);
      }
      
      // Lưu thông tin thiết bị đã kết nối
      setConnectedDevice(deviceConnection);
      setPrinterStatus('connected');
      setShowDeviceList(false);
      
      // Lưu ID thiết bị cuối cùng đã kết nối
      // Thông báo thành công được đặt trong setTimeout để tránh lỗi React Native
      setTimeout(() => {
        Alert.alert(
          'Kết nối thành công', 
          `Đã kết nối với thiết bị ${device.name || 'không tên'}`,
          [{ text: 'OK' }]
        );
      }, 500);
      
      // Tạo hàm xử lý sự kiện ngắt kết nối toàn cục để duy trì theo dõi khi rời màn hình
      const handleDisconnection = (error: any, disconnectedDevice: Device | null) => {
        console.log('Thiết bị đã ngắt kết nối:', disconnectedDevice?.id, error);
        
        // Chỉ xử lý nếu thiết bị ngắt kết nối trùng với thiết bị đã kết nối
        if (connectedDeviceRef.current?.id === disconnectedDevice?.id) {
          // Cập nhật trạng thái kết nối
          setPrinterStatus('disconnected');
          setConnectedDevice(null);
          
          // Thông báo ngắt kết nối nếu trước đó đã kết nối
          setTimeout(() => {
            Alert.alert(
              'Thiết bị đã ngắt kết nối', 
              'Kết nối với máy in đã bị mất. Vui lòng kết nối lại.',
              [{ text: 'OK' }]
            );
          }, 500);
        }
      };
      
      // Đăng ký lắng nghe sự kiện ngắt kết nối - thiết lập sự kiện toàn cục
      // Không sử dụng onDisconnected của device vì nó sẽ mất khi component unmount
      try {
        // Đối với react-native-ble-plx, sử dụng phương thức này để theo dõi ngắt kết nối
        bleManagerRef.current.onDeviceDisconnected(device.id, handleDisconnection);
      } catch (listenerError) {
        console.warn('Không thể thiết lập bộ lắng nghe sự kiện ngắt kết nối:', listenerError);
      }
      
      return deviceConnection;
    } catch (error: any) {
      console.error('Lỗi kết nối chi tiết:', error);
      
      // Xử lý lỗi cụ thể
      let errorMessage = 'Không thể kết nối với thiết bị';
      
      if (error?.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Kết nối bị hết thời gian. Vui lòng đảm bảo máy in đang bật và ở gần.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Kết nối bị hủy. Vui lòng thử lại.';
        } else if (error.message.includes('bluetooth')) {
          errorMessage = 'Bluetooth không hoạt động đúng. Vui lòng tắt và bật lại Bluetooth.';
        } else if (error.message.includes('destroyed')) {
          errorMessage = 'Kết nối Bluetooth đã bị hủy. Vui lòng thử lại.';
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      // Đặt trong setTimeout để tránh lỗi Alert.alert
      setTimeout(() => {
        Alert.alert(
          'Lỗi kết nối', 
          errorMessage,
          [{ text: 'Thử lại' }]
        );
      }, 500);
      
      setPrinterStatus('disconnected');
      setConnectedDevice(null);
    } finally {
      setIsConnecting(false);
    }
  };

  // Hàm ngắt kết nối - chỉ gọi khi có yêu cầu từ người dùng
  const disconnectDevice = async () => {
    if (!connectedDevice || !bleManagerRef.current) return;
    
    try {
      console.log('Đang ngắt kết nối thiết bị theo yêu cầu người dùng:', connectedDevice.id);
      await bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setPrinterStatus('disconnected');
      
      setTimeout(() => {
        Alert.alert('Thông báo', 'Đã ngắt kết nối với thiết bị');
      }, 500);
    } catch (error) {
      console.error('Lỗi khi ngắt kết nối:', error);
      setTimeout(() => {
        Alert.alert('Lỗi', 'Không thể ngắt kết nối. Vui lòng thử lại.');
      }, 500);
    }
  };

  // Cập nhật hàm connectPrinter để thêm tùy chọn ngắt kết nối
  const connectPrinter = () => {
    if (isConnecting) return; // Ngăn chặn nhấn nhiều lần
    
    if (printerStatus === 'connected' && connectedDevice) {
      // Nếu đã kết nối, hiển thị tùy chọn ngắt kết nối
      Alert.alert(
        'Máy in đã kết nối',
        `Bạn đang kết nối với máy in ${connectedDevice.name || 'không tên'}. Bạn muốn làm gì?`,
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Ngắt kết nối',
            onPress: disconnectDevice,
            style: 'destructive'
          },
          {
            text: 'Tìm máy in khác',
            onPress: () => {
              disconnectDevice().then(() => {
                // Hiển thị modal trước, sau đó mới bắt đầu quét
                setShowDeviceList(true);
                
                // Delay quét thiết bị để modal có thời gian hiển thị trước
                setTimeout(() => {
                  scanForDevices();
                }, 300);
              });
            }
          }
        ]
      );
      return;
    }
    
    // Hiển thị modal trước, sau đó mới bắt đầu quét
    setShowDeviceList(true);
    
    // Delay quét thiết bị để modal có thời gian hiển thị trước
    setTimeout(() => {
      scanForDevices();
    }, 300);
  };

  // Thêm hàm chuyển đổi tiếng Việt có dấu thành không dấu
  const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    
    // Một số ký hiệu toán học
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền, sắc, hỏi, ngã, nặng
    
    return str;
  };

  // Thêm hàm tạo text cho logo đơn giản (ASCII art)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createSimpleLogo = () => {
    return [
      '================================',
      '          SELL SMART           ',
      '       TECHNOLOGY STORE        ',
      '================================',
    ].join('\n');
  };

  // Hàm căn lề cho text
  const padRight = (text: string, length: number): string => {
    if (!text) text = '';
    return text.length >= length ? text.substring(0, length) : text + ' '.repeat(length - text.length);
  };

  const padLeft = (text: string, length: number): string => {
    if (!text) text = '';
    return text.length >= length ? text.substring(0, length) : ' '.repeat(length - text.length) + text;
  };

  // Hàm tạo đường gạch ngang
  const createDashedLine = (length: number = 32): string => {
    return '-'.repeat(length);
  };

  // Hàm tạo QR code dưới dạng Base64 image
  const generateQRCodeBase64 = (): Promise<string> => {
    return new Promise((resolve) => {
      try {
        // Cung cấp một QR code base64 đã được tạo sẵn
        // Đây là một QR code đơn giản có chứa URL
        const fallbackQRData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAADONJREFUeJzt3XvMHUUdxvHvS1+gLaUtImCbcm0LaNUCahWUABFDUVCJoCiXKEgwiAQb/QOVoAaJGkCNoCIIGAigRokaRYxtQIzQloJyqQItFNpCuQktFHrx9Y+Zbfu+fXfPmTmzM7P7+yRN2n3fnXl29ny7e2bnnCMzEwDVNqQOAMgZCQIEkCBAAAkCBJAgQAAJAgSQIEAACQIEkCBAAAkCBJAgQAAJAgSQIEAACQIEkCBAAAkCBJAgQAAJAgSQIEAACQIEkCBAQCsJImmupAcl7ZY0L3U8QKqW1G2QtETSbEn7S9peddCWHZ9LWSBphaRfSvp8gH+lpJFd/x4taZ2k8ZJelHRNzDgH4vZX8jHdl/zv12pgIekapYklyQ2S3t3jWCMkfUT5JEiJx3Rf8r9fa2DBuoqT2h/XSDogcUx1ddov9ZjuS/73y2lggePMrLy2dEHqoHqo0366Md2X/O/XakC5JYjUvhPbhr4gp7b7kvf9Rl0DVl5DhzlJ0sW+RvOKnq2RflrSAb4d5HRNIvcx3Zus79fqQPdI+qfn58rl0w8jvjtCDsoGAgmCvlwtab+Gx2zKJ0GWNDxmU7mM6b5kfb8iflKslrTBzBYOE0CzQcYUSWdL+oakSZJG+n6peEmSNkq6T9Llkv7sMaa7kvdt3gO/+XwgtS+mEn+WtFX958IG11Y1iwWgByaJgDwxDyJJZjZXUl+LhPskzTOzRSnjQTtVDqHMbLakDb5fkrRZ0hwzWx07LrSXmU2WdJbvYMhcSQdIGu3rIM0xs42SlvscW7mVWlA+krTczDYVfYjjQlX/7FWTzGxuXwNKklZLWuVzbEXyMZulK/Tx1e88SVMlHev7OUmb5c1W/1TS+MBxYwY5MDbJm61+taQHzWxTzPNSIw0SRNJ6Sf/w/ZzPlO1DJPW14Gp6kJk97vsZny+a2WgzW9IjvlGSJkmaUfGWx0CgMuiK5GMk7etrI2ld1Xe6XvXVfvbBFTTvHcN8x+Zwy7lP5TjTXeEkCBBAgqBVGiSIr3WS9h3gOF9NSs3rQZLyfeqwUcV9PFQ9lfJtjcKPFf1E0iW+n/OZ1X2npGMP8j/jJc2StLKvg9amQcndKGmib2M+IzGfQ8z12d83QdIUSeMkrZa0oaFvwgCGVDlJ7Ps5n1msHAdPgQrMYgEBJAgQQIIAASQIEECCAAEkCBBAgvQgaXHqGJAv5kF6kDRb0hpJ48zskdTxIB9cgxTEXC5vPUt7Ii3uYs0xszkD/cPMZlf9vSKPxcG/x8p55X6LQomCr56EyYmU9i7W0ZKO8fm3grzVV7Eg80dJuyRt9Ti20jRJUyUt9Tg2a7kmiK89Gn6V96j+S+0gTT3gk+Q/5joQiLtYQAAJAgSQIEAACdJOByfeH9aMrNRwk/T0AO1skfRo4pgGSowYUi9Yn3u5QNLrWf3dKMQk6VFJm3wO7jHYvkXSj30CjHFRXlEukTTas3/0WeIy/0mXrCdOXIEXNWeMVzb+GD8jxpVw1Wd67zyEXs2KcT4qXpVt/P8OQsnJ3jxIzKKJUeXVzFaUEFOQ76p0X9ticVJVZeeTIN2VQ329JB+vd5fgWvGHuqbAOvuD9bN+khHWL+t3NU/Gn0RBgoAEQfscnHh/2J69qz28cUMbPSXp6cQxRRe75lLui57HkZ9Lfe3RcFdjr1f7bYlRGTT3GeEY5Uo91nYh9wQBAkgQIIAEAQJIkHY6OPH+kJnsd7Emb+6VtKdNO0vVcRdrrqTnaxrlYvSWX20GnRFuXfMlXVRjf+u6hBnXuOu+i/XmIPtzPdVP8+ZGxKiK/D1JT/p+qOIu1lnygn9BzE6qoq+G8jw76nPFhybuYnVtRO0b5GrfDzt3sYCAiGXfc957aWZzffsxs9lmtr7h9TGfx20OSXW/L5vZbDN71LeD0CRx6hPSh3kRYihq78OYT1wdnPg8tI5vgjTZdrSN5apRSRNDFwRD+7QpQUJjbYoEwTChBElVyAQI+T9gXNW9tTVBtlR87+CEsTRR9YGVGB5wTQnVKrHrYvnGWmQfbSk6eUTZ8yBLKr73wQE+kzIOIIrYFVKLVpkokqeHJ46lDmaxgAASBAggQYCA5AkiaS5FI7NiMfoPzDpnr8iKHrNYQy2CwLaeOKwSXawS6Y2iGWvNVcxiAQEkCBDQxgQZnXh/bcC1WhA5VCENndiVQRc1aLM0cQyxyg61sWBKErFnscaY2fqK75UQQiZIkJbzShCfcuGSbrTQ+gxmdrKko8xsZUXbVdXCQo2G2k7UzBbp1YKT06papryfzO+XtMmn8QDnGS1plpl9UdJLkp7pPqCtzziT5j2LtVVelc6i/3+NpAl9HFdFXwPtJfWOZ3wPNn3GNfRhvq97Xfu7Vv4PB90k6fxALC9I2iPpQEnLJJ0lb5Oh4Z7tmubZY6jlvr7faZ57n4XqJB0r6XRJ4yTdLulxM9vlE1R/f7e3+tpWM9vpexJJ+0jaIOlZM3vTt4M6zGyupGOrnpt01yvvPXMZFggULmKCfEnSdZLO7VROXCDpfElfaHD8t5QQR4gY56Pqc48O8ZmKPkcN05/Pc+OVn3VWPTvIzCxW5YeyN1G9V6vM7BlJSyUtlCQz+5+k/wUvhjTDLBYQkNUs1uvlrd8+MFEYQ71yYuqZ9NwlXQKgz2vV19lPUyeYF8vbJTvUz5KKvmMUssytFqukfau+95EGfddd/aH3uVDSTk/b3Z3wQpquxbpf0ioPmx0eNtIbZe95jqKL1fSeZw3aP2hmC2ucD9n3fEnDrVr9TdUTYtOGOLb7rndfi6aJQ9JzZrYs4rFj2ydGdZamx92joTegCbWvulZL+n2WA/l+PQxe/eEvPs2GKXgY8sA61V1DVbJflOf6jrwSrHsmevFQH+qnffcx30p47dKz8u5kveSboYdI2jfUa6Tus/VE15JmN0n6urzCjsErJmKDIpWLXu47QF+Swwk7rvMcyS5J15vZi85FElV3sQzeo6HnHfrrs9MMOkNcZ5e//fK85PmZHZ5xzJT0QU/bTlJeIOkcM/u3p3130YnBzsefzGxnwzhy8Li8Ox4hTUv9DlZe5Zc68Tm+22t7pzGzEyUtk3RYg+OeL2/VjlqzVnWY2XxJ8yXtVPEdcHZ7tI+9k/YiM7vdw7YSSXKrpF0etqs9bXuruzF7qNeR8j9HJ8obZ38ys8Wdv5tZk5Vx50i62cx+U1oLZh16rY8cKPdX4aM+Uy8mKLfrR0nH+xwkaaPPUa/i3z7HucWuuwwX1K3NJ+nu2PFk8FrhdTy3nPv0pVxnsSK/8/reHfB9d3FTVZtAu3LPfa8ESb3Kkq8cp0Ak/XugjK6Y5T59Kdec+z7SL1YlxeR7gUh6K3UAbZBrznO9i9XfJgkTfQ/yXcInw90icpc658E9Pcxsdt97efnI9Ro094WDUBF0Sj7eYmbrmx4wQoxeDv2OuuU8+zn82MxsiUcrqWOd/X1i+Z6kR30PlveSusbM1sU8KTVynhHOPudZJ0gdc+W9yPaZxvVZvqfKXUX/tuxKCTnPCGedc6/Kcpn6nqQ7fFoM00cfJkj6UuhzVb5nZve2ZX6jd86zyjnnng+vLlZXJ50vbTOzJ2rE1aHuS9z5vWPN7Cd12iQUK+fZXcPkdp3TqERgxASpWuykyd2L7u+Ps4ZdkNxynl2CdPcv6ZLuTxV9kLkjVg1v59iYjJnNTR3DiL1znvxIFmujz5GVypIgKCSf2dg25zvnBBkyQdq2ahIQQ+5jumqZz2xXsQYChTSaHn9xw+M11TrqJgjaCr0TJNaqR+hlacPjNdWq6/UiafNATXIdyLTvqIqVNRLEzJ7zOdBHp3hkiCLzIEDusgz6/wdvTmkxS93NAAAAAElFTkSuQmCC';
        
        console.log('Returning hardcoded QR code image');
        resolve(fallbackQRData);
      } catch (error) {
        console.error('QR generation error:', error);
        // Backup in case the above fails
        const emptyQRData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
        resolve(emptyQRData);
      }
    });
  };

  // Cập nhật hàm xử lý in thật
  const handleRealPrint = async () => {
    if (printerStatus !== 'connected') {
      Alert.alert(
        'Chưa kết nối máy in',
        'Vui lòng kết nối với máy in trước khi tiến hành in.',
        [
          {text: 'Hủy', style: 'cancel'},
          {text: 'Kết nối', onPress: connectPrinter},
        ]
      );
      return;
    }

    try {
      // Kiểm tra xem đã kết nối thiết bị chưa
      if (!connectedDevice) {
        throw new Error('Chưa kết nối với thiết bị in');
      }
      
      // Lưu tham chiếu local cho BleManager và thiết bị được kết nối để tránh mất tham chiếu
      const localBleManager = bleManagerRef.current;
      const localDevice = connectedDevice;
      
      // Kiểm tra xem BleManager còn hoạt động không
      if (!localBleManager || !bleManagerInitializedRef.current) {
        console.log('BleManager không còn hoạt động, khởi tạo lại...');
        
        // Thông báo cho người dùng
        Alert.alert(
          'Lỗi kết nối Bluetooth',
          'Kết nối Bluetooth đã bị mất. Vui lòng thử lại sau khi kết nối lại.',
          [{ 
            text: 'Kết nối lại',
            onPress: () => {
              // Thiết lập lại BleManager và kết nối lại
              setPrinterStatus('disconnected');
              setConnectedDevice(null);
              setTimeout(() => {
                connectPrinter();
              }, 1000);
            }
          }]
        );
        
        return;
      }
      
      // Hiển thị thông báo đang xử lý
      Alert.alert('Thông báo', 'Đang chuẩn bị dữ liệu để in...');
      
      // Đảm bảo thiết bị vẫn kết nối
      let isConnected = false;
      try {
        isConnected = await localDevice.isConnected();
        if (!isConnected) {
          throw new Error('Máy in đã ngắt kết nối. Vui lòng kết nối lại.');
        }
      } catch (connectionError) {
        console.error('Lỗi khi kiểm tra kết nối:', connectionError);
        
        // Kiểm tra xem có phải lỗi BleManager bị hủy không
        const errorMsg = safeErrorMessage(connectionError);
        if (errorMsg.includes('destroyed') || errorMsg.includes('not connected')) {
          throw new Error('Kết nối Bluetooth đã bị mất. Vui lòng kết nối lại máy in.');
        }
        
        throw new Error('Không thể xác định trạng thái kết nối. Vui lòng kết nối lại.');
      }
      
      // Dịch vụ và đặc tính cho dữ liệu lệnh in ESC/POS
      console.log('Tìm kiếm dịch vụ in và đặc tính...');
      
      // Tìm kiếm dịch vụ và đặc tính phù hợp
      let services = [];
      try {
        services = await localDevice.services();
        console.log(`Đã tìm thấy ${services.length} dịch vụ`);
      } catch (serviceError) {
        const errorMsg = safeErrorMessage(serviceError);
        console.error('Lỗi khi lấy danh sách dịch vụ:', errorMsg);
        
        // Nếu BleManager bị hủy, thử khởi tạo lại
        if (errorMsg.includes('destroyed') || errorMsg.includes('not connected')) {
          throw new Error('Kết nối Bluetooth đã bị hủy. Vui lòng kết nối lại máy in.');
        }
        
        throw new Error('Không thể lấy thông tin dịch vụ từ máy in. Vui lòng thử lại.');
      }
      
      if (services.length === 0) {
        throw new Error('Không tìm thấy dịch vụ nào từ máy in. Vui lòng kết nối lại.');
      }
      
      // Danh sách UUID của dịch vụ ESC/POS thường gặp
      const knownPrinterServices = [
        '18F0',                                  // ESC/POS service
        '49535343-FE7D-4AE5-8FA9-9FAFD205E455', // Printer Service
        '000018F0-0000-1000-8000-00805F9B34FB', // Custom printer service
        '1811',                                  // Alert Notification Service
        '1812',                                  // Human Interface Device
        '1801',                                  // Generic Attribute
        '1800',                                  // Generic Access
        'FFE0',                                  // Custom Service
        'FF00',                                  // Custom Service 
        '0000FFE0-0000-1000-8000-00805F9B34FB', // Custom Service
        '0000FF00-0000-1000-8000-00805F9B34FB'  // Custom Service
      ];
      
      // Danh sách UUID của đặc tính ESC/POS thường gặp
      const knownPrinterCharacteristics = [
        '2AF1',                                  // ESC/POS Characteristic
        '49535343-8841-43F4-A8D4-ECBE34729BB3', // Write Characteristic
        '000018F1-0000-1000-8000-00805F9B34FB', // Custom printer characteristic
        'FFE1',                                  // Custom Characteristic
        'FF01',                                  // Custom Characteristic
        '0000FFE1-0000-1000-8000-00805F9B34FB', // Custom Characteristic
        '0000FF01-0000-1000-8000-00805F9B34FB'  // Custom Characteristic
      ];
      
      let targetService = null;
      let targetCharacteristic = null;
      let availableCharacteristics = [];
      
      // Tìm tất cả các dịch vụ và đặc tính
      for (const service of services) {
        console.log('Dịch vụ:', service.uuid);
        
        try {
          const characteristics = await service.characteristics();
          console.log(`Dịch vụ ${service.uuid} có ${characteristics.length} đặc tính`);
          
          if (characteristics.length > 0) {
            // Chỉ thêm tất cả các đặc tính, không kiểm tra thuộc tính properties
            for (const char of characteristics) {
              console.log(`Đặc tính: ${char.uuid}`);
              
              // Luôn thêm vào danh sách
              availableCharacteristics.push({
                service: service,
                characteristic: char,
                priority: 0
              });
              
              // Tăng ưu tiên nếu uuid khớp với danh sách đã biết
              try {
                const shortUuid = char.uuid.substring(4, 8).toUpperCase();
                if (knownPrinterCharacteristics.includes(shortUuid) || 
                    knownPrinterCharacteristics.includes(char.uuid)) {
                  availableCharacteristics[availableCharacteristics.length-1].priority += 5;
                }
              } catch (error) {
                console.log('Lỗi khi xử lý UUID đặc tính:', error);
              }
              
              // Tăng ưu tiên nếu dịch vụ khớp với danh sách đã biết
              try {
                const serviceShortUuid = service.uuid.substring(4, 8).toUpperCase();
                if (knownPrinterServices.includes(serviceShortUuid) || 
                    knownPrinterServices.includes(service.uuid)) {
                  availableCharacteristics[availableCharacteristics.length-1].priority += 3;
                }
              } catch (error) {
                console.log('Lỗi khi xử lý UUID dịch vụ:', error);
              }
            }
          }
        } catch (error) {
          console.log('Lỗi khi quét đặc tính của dịch vụ:', error);
        }
      }
      
      // Sắp xếp các đặc tính theo độ ưu tiên
      availableCharacteristics.sort((a, b) => b.priority - a.priority);
      
      // Chọn đặc tính có độ ưu tiên cao nhất (nếu có)
      if (availableCharacteristics.length > 0) {
        targetService = availableCharacteristics[0].service;
        targetCharacteristic = availableCharacteristics[0].characteristic;
        console.log('Đã chọn đặc tính ưu tiên cao nhất:', 
                  targetService.uuid, 
                  targetCharacteristic.uuid, 
                  'Độ ưu tiên:', availableCharacteristics[0].priority);
      } else if (services.length > 0) {
        // Nếu không tìm thấy đặc tính nào, chọn đặc tính đầu tiên để thử
        try {
          const firstService = services[0];
          const firstCharacteristics = await firstService.characteristics();
          
          if (firstCharacteristics.length > 0) {
            targetService = firstService;
            targetCharacteristic = firstCharacteristics[0];
            console.log('Không tìm thấy đặc tính tối ưu, sử dụng đặc tính đầu tiên:', 
                       targetService.uuid, targetCharacteristic.uuid);
          }
        } catch (error) {
          console.log('Lỗi khi lấy đặc tính dự phòng:', error);
        }
      }
      
      console.log('Đã tìm thấy dịch vụ và đặc tính để in:', 
                  targetService ? targetService.uuid : 'unknown', 
                  targetCharacteristic ? targetCharacteristic.uuid : 'unknown');
      
      // Kiểm tra nếu không tìm thấy đặc tính phù hợp
      if (!targetCharacteristic) {
        throw new Error('Không tìm thấy đặc tính phù hợp để gửi dữ liệu in.');
      }
      
      // Chuẩn bị dữ liệu in ấn (ESC/POS commands)
      let receiptData = '';
      try {
        // Chuẩn bị dữ liệu in ấn
        console.log('Đang chuẩn bị dữ liệu in ấn...');
        
        // Định nghĩa chiều rộng của giấy in (số ký tự)
        const lineWidth = 32;
        // --- START CHANGE: Adjust column widths for new layout ---
        const columnWidths = {
          name: 32,    // Tên sản phẩm (full width initially)
          price: 15,   // Đơn giá (right aligned on next line)
          qty: 5,      // Số lượng (right aligned on next line)
          // total: 6  // Removed total column
        };
        // --- END CHANGE ---
        
        // Mảng chứa các dòng nội dung hóa đơn (will now include ESC/POS commands)
        let lines: (string | Uint8Array)[] = [];
        
        // Helper to add raw ESC/POS commands to lines
        const addCommand = (command: Uint8Array) => {
          lines.push(command);
        };
        
        // Define ESC/POS Commands
        const CMD_INIT = new Uint8Array([0x1B, 0x40]);       // Initialize
        const CMD_BOLD_ON = new Uint8Array([0x1B, 0x45, 1]);   // Bold ON
        const CMD_BOLD_OFF = new Uint8Array([0x1B, 0x45, 0]);  // Bold OFF
        const CMD_ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 1]); // Center Align
        const CMD_ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0]);   // Left Align

        // ---------- PHẦN ĐẦU HÓA ĐƠN ----------
        addCommand(CMD_INIT); // Initialize printer at the start
        
        // Thêm logo nếu được chọn - Chỉ hiển thị tên cửa hàng
        if (printLogo) {
          addCommand(CMD_ALIGN_CENTER);
          lines.push('SELL SMART');
          addCommand(CMD_ALIGN_LEFT);
        }
        
        // Thêm thông tin cửa hàng nếu được chọn
        if (printCompanyInfo) {
          addCommand(CMD_ALIGN_CENTER);
          addCommand(CMD_BOLD_ON);
          lines.push(removeVietnameseTones(companyName).toUpperCase());
          addCommand(CMD_BOLD_OFF);
          lines.push(removeVietnameseTones(companyAddress));
          lines.push('Tel: ' + companyPhone);
          addCommand(CMD_ALIGN_LEFT);
        }
        
        // --- START CHANGE: Center Title with ESC/POS ---
        // Tiêu đề hóa đơn
        addCommand(CMD_ALIGN_CENTER);
        addCommand(CMD_BOLD_ON);
        lines.push('HOA DON BAN HANG');
        addCommand(CMD_BOLD_OFF);
        addCommand(CMD_ALIGN_LEFT);
        // lines.push(padCenter(makeBoldText('HOA DON BAN HANG'), lineWidth)); // Old method
        // --- END CHANGE ---
        
        // Thông tin đơn hàng
        lines.push('Ma hoa don: #' + orderNumber);
        
        // Định dạng ngày giờ
        const orderDate = new Date(order.createdAt);
        const formattedDate = format(orderDate, 'dd/MM/yyyy HH:mm');
        lines.push('Ngay gio: ' + formattedDate);
        
        // Thông tin nhân viên (lấy từ order nếu có, hoặc để mặc định)
        const staffName = order.staffId?.fullName || order.staff?.fullName || 'Admin';
        lines.push('Nhan vien: ' + removeVietnameseTones(staffName));
        
        // Thông tin khách hàng
        if (order.customerID) {
          lines.push('THONG TIN KHACH HANG:');
          lines.push('Ten: ' + removeVietnameseTones(order.customerID.fullName || 'Khach le'));
          if (order.customerID.phone) {
            lines.push('SDT: ' + order.customerID.phone);
          }
        }
        
        // ---------- PHẦN SẢN PHẨM ----------
        
        // --- START CHANGE: Modify Product Header ---
        // Tiêu đề cột
        const headerRow = 
          padRight('San pham', columnWidths.name - columnWidths.price - columnWidths.qty - 2) + // Adjust padding
          padLeft('Don gia', columnWidths.price) + 
          padLeft('SL', columnWidths.qty);
          // Removed T.Tien
        
        lines.push(headerRow);
        lines.push(createDashedLine(lineWidth));
        // --- END CHANGE ---
        
        // Biến để theo dõi tổng số sản phẩm
        let totalQuantity = 0;
        
        // Thông tin các sản phẩm
        if (order.products && Array.isArray(order.products) && order.products.length > 0) {
          for (const product of order.products) {
            try {
              // Trích xuất thông tin sản phẩm
              const name = removeVietnameseTones(
                product.productId?.name || 
                product.product?.name || 
                product.name || 
                'San pham'
              );
              
              // Lấy thông tin biến thể nếu có
              const variant = product.variant || product.variantId || {};
              let variantText = '';
              
              if (variant && (variant.color || variant.size)) {
                variantText = removeVietnameseTones(
                  `(${variant.color || ''}${variant.color && variant.size ? ', ' : ''}${variant.size || ''})`
                );
              }
              
              const price = typeof product.price === 'number' ? product.price : 
                          (product.productId?.price || product.product?.price || 0);
                          
              const quantity = product.quantity || 1;
              totalQuantity += quantity;
              
              // --- START CHANGE: New Product Line Layout ---
              // Print product name (potentially wrapped)
              // Simple wrapping logic:
              let remainingName = name;
              while (remainingName.length > 0) {
                lines.push(remainingName.substring(0, columnWidths.name));
                remainingName = remainingName.substring(columnWidths.name);
              }

              // Print Price and Qty on the next line, right-aligned
              const priceQtyLine = 
                  padLeft(formatCurrency(price), lineWidth - columnWidths.qty) + // Price takes up remaining space left of qty
                  padLeft(quantity.toString(), columnWidths.qty);
              lines.push(priceQtyLine);
              // --- END CHANGE ---
              
              // Nếu có biến thể, thêm một dòng mới
              if (variantText) {
                lines.push('  ' + variantText); // Indent variant info
              }
              
              // Thêm dòng mã sản phẩm (SKU) nếu được chọn và có mã
              if (printItemSKU && (product.sku || product.productId?.sku || product.product?.sku)) {
                const sku = product.sku || product.productId?.sku || product.product?.sku;
                lines.push('  SKU: ' + sku); // Indent SKU
              }
              
              // Add a small separator between items if needed
              // lines.push(''); 

            } catch (error) {
              console.error('Lỗi khi thêm sản phẩm vào hóa đơn:', error);
            }
          }
        } else {
          lines.push('Khong co san pham');
        }
        
        // Đường phân cách
        lines.push(createDashedLine(lineWidth));
        
        // ---------- PHẦN TỔNG TIỀN ----------
        // Thông tin thanh toán
        lines.push('Tong so luong: ' + totalQuantity + ' san pham');
        
        // Tổng tiền hàng (trước giảm giá)
        const subTotal = order.subTotal || (order.totalAmount + (order.discount || 0));
        lines.push(padRight('Tong tien hang:', 20) + padLeft(formatCurrency(subTotal), 12));
        
        // Tổng khuyến mãi nếu có
        if (order.discount && order.discount > 0) {
          lines.push(padRight('Giam gia:', 20) + padLeft('-' + formatCurrency(order.discount), 12));
        }
        
        // --- START CHANGE: Use ESC/POS for Bold Total ---
        // Tổng cần thanh toán
        lines.push(createDashedLine(lineWidth));
        addCommand(CMD_BOLD_ON);
        lines.push(padRight('TONG THANH TOAN:', 20) + padLeft(formatCurrency(order.totalAmount), 12));
        addCommand(CMD_BOLD_OFF);
        // lines.push(padRight('TONG THANH TOAN:', 20) + padLeft(makeBoldText(formatCurrency(order.totalAmount)), 12)); // Old method
        // --- END CHANGE ---
        
        // Phương thức thanh toán nếu có
        if (order.paymentMethod) {
          lines.push('Phuong thuc: ' + removeVietnameseTones(order.paymentMethod));
        }
        
        // ---------- QR CODE SECTION ----------
        // QR Code will be handled separately after text printing
        
        // ---------- CHÂN TRANG ----------
        if (printFooter) {
          const footerText = removeVietnameseTones(footer);
          const footerWords = footerText.split(' ');
          let currentLine = '';
          
          addCommand(CMD_ALIGN_CENTER); // Center footer
          addCommand(CMD_BOLD_ON); // Bold footer
          
          for (const word of footerWords) {
            if ((currentLine + ' ' + word).length <= lineWidth) {
              currentLine += (currentLine ? ' ' : '') + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          
          if (currentLine) {
            lines.push(currentLine);
          }

          addCommand(CMD_BOLD_OFF);
          addCommand(CMD_ALIGN_LEFT); // Reset alignment
        }
        
        // Thêm dòng trống cuối cùng - trước khi QR
        lines.push('');
        lines.push('');
        
        // --- START CHANGE: Prepare combined text/command data ---
        // Combine lines and commands into a single buffer for text printing
        const textEncoder = new TextEncoder();
        let textCommandBuffers: Uint8Array[] = [];
        let totalTextBytes = 0;

        for (const line of lines) {
            if (typeof line === 'string') {
                const lineBytes = textEncoder.encode(line + '\n'); // Add newline after each text line
                textCommandBuffers.push(lineBytes);
                totalTextBytes += lineBytes.length;
            } else { // It's a Uint8Array (command)
                textCommandBuffers.push(line);
                totalTextBytes += line.length;
            }
        }

        const fullTextCommandBuffer = new Uint8Array(totalTextBytes);
        let currentTextOffset = 0;
        textCommandBuffers.forEach(buffer => {
            fullTextCommandBuffer.set(buffer, currentTextOffset);
            currentTextOffset += buffer.length;
        });

        receiptData = arrayBufferToBase64(fullTextCommandBuffer.buffer); // Base64 encode the combined buffer
        console.log(`Đã chuẩn bị dữ liệu in text/command (${receiptData.length} base64 bytes)`);
        // --- END CHANGE ---

      } catch (prepareError) {
        console.error('Lỗi khi chuẩn bị dữ liệu in:', prepareError);
        const errorMessage = safeErrorMessage(prepareError);
        throw new Error('Không thể chuẩn bị dữ liệu in: ' + errorMessage);
      }
      
      // Gửi dữ liệu theo từng phần để tránh lỗi buffer overflow
      // Mỗi lần gửi khoảng 20 bytes thay vì 80 để tránh lỗi buffer overflow
      const chunkSize = 20;
      let offset = 0;
      
      console.log(`Bắt đầu gửi dữ liệu in (tổng ${receiptData.length} bytes, mỗi lần ${chunkSize} bytes)`);
      
      // Sử dụng while thay vì for để tránh lỗi async/await trong vòng lặp
      while (offset < receiptData.length) {
        // Kiểm tra lại kết nối sau mỗi 5 phần dữ liệu được gửi
        if (offset % (chunkSize * 5) === 0 && offset > 0) {
          try {
            isConnected = await localDevice.isConnected();
            if (!isConnected) {
              throw new Error('Máy in đã ngắt kết nối trong quá trình in.');
            }
          } catch (connectionCheckError) {
            console.error('Lỗi khi kiểm tra kết nối trong quá trình in:', connectionCheckError);
            throw new Error('Mất kết nối với máy in trong quá trình gửi dữ liệu.');
          }
        }
        
        const chunk = receiptData.slice(offset, offset + chunkSize);
        console.log(`Gửi phần dữ liệu ${offset}-${offset + chunk.length}/${receiptData.length}`);
        
        let writeSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        // Thử gửi với các phương thức khác nhau và cho phép thử lại
        while (!writeSuccess && retryCount < maxRetries) {
          try {
            if (retryCount === 0) {
              // Thử đầu tiên: writeWithoutResponse
              await targetCharacteristic.writeWithoutResponse(chunk);
            } else {
              // Thử lại: writeWithResponse
              await targetCharacteristic.writeWithResponse(chunk);
            }
            
            // Đánh dấu thành công
            writeSuccess = true;
            
            // Đợi lâu hơn giữa các lần gửi
            await new Promise(resolve => setTimeout(resolve, 250));
            
            // Tăng offset để gửi phần tiếp theo
            offset += chunk.length;
          } catch (writeError) {
            retryCount++;
            console.log(`Lần thử ${retryCount}/${maxRetries} thất bại: `, writeError);
            
            const errorMsg = safeErrorMessage(writeError);
            if (errorMsg.includes('destroyed') || errorMsg.includes('cancelled')) {
              throw new Error('Kết nối Bluetooth đã bị hủy trong quá trình in. Vui lòng thử lại.');
            }
            
            // Đối với lỗi "Operation was rejected", đợi lâu hơn trước khi thử lại
            if (errorMsg.includes('rejected')) {
              console.log(`Đợi 1 giây trước khi thử lại lần ${retryCount + 1}...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (retryCount >= maxRetries) {
              // Nếu thử hết số lần cho phép, báo lỗi
              throw new Error(`Không thể gửi dữ liệu đến máy in: ${errorMsg}`);
            }
          }
        }
        
        if (!writeSuccess) {
          throw new Error('Không thể gửi dữ liệu đến máy in sau nhiều lần thử. Vui lòng kiểm tra máy in.');
        }
      }
      
      console.log('Đã gửi xong toàn bộ dữ liệu in!');
      
      // Thông báo in thành công
      setTimeout(() => {
        Alert.alert(
          'In thành công',
          'Đã gửi dữ liệu đến máy in thành công!',
          [{ text: 'OK' }]
        );
      }, 500);
      
      // Sau khi in nội dung văn bản xong, thử in QR code bằng thư viện thermal-receipt-printer
      if (printQRCode) {
        try {
          // --- START: Replace old QR logic with working ESC/POS command ---
          console.log('In QR code bằng lệnh ESC/POS...');
          
          // 1. Define QR Code Data
          const qrData = DOCUMENTS_URL;
          // Declare encoder locally if not available (it should be due to above change)
          const encoder = new TextEncoder(); 
          const qrDataBytes = encoder.encode(qrData);
          
          // 2. Assemble Command Sequence
          const commandList: Uint8Array[] = [];
          
          // Center Align QR Code
          commandList.push(new Uint8Array([0x1B, 0x61, 1])); 
          
          // Select QR Model 2
          commandList.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x41, 0x32]));
          
          // Set QR Size (e.g., 5) (GS ( k pL pH 0x31 0x43 n) -> 1D 28 6B 03 00 31 43 05
          commandList.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x05]));
          
          // Set Error Correction Level M (GS ( k pL pH 0x31 0x45 n) -> 1D 28 6B 03 00 31 45 31 (M=49 -> ASCII '1'))
          commandList.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]));
          
          // Store QR Data (GS ( k pL pH 0x31 0x50 30 d1...dk)
          const storeCmdLength = qrDataBytes.length + 3;
          const storepL = storeCmdLength % 256;
          const storepH = Math.floor(storeCmdLength / 256);
          commandList.push(new Uint8Array([0x1D, 0x28, 0x6B, storepL, storepH, 0x31, 0x50, 0x30]));
          commandList.push(qrDataBytes);
          
          // Print QR Code
          commandList.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));
          
          // Reset Alignment to Left
          commandList.push(new Uint8Array([0x1B, 0x61, 0])); 
          
          // Add Line Feeds
          commandList.push(new Uint8Array([0x0A, 0x0A, 0x0A, 0x0A]));
          
          // 3. Concatenate all commands into one buffer
          let totalBytesLength = 0;
          commandList.forEach(cmd => { totalBytesLength += cmd.length; });
          
          const fullCommandBuffer = new Uint8Array(totalBytesLength);
          let currentOffset = 0;
          commandList.forEach(cmd => {
            fullCommandBuffer.set(cmd, currentOffset);
            currentOffset += cmd.length;
          });
          
          // 4. Convert the final buffer to base64 for sending
          const base64CommandBuffer = arrayBufferToBase64(fullCommandBuffer.buffer);
          
          // 5. Send the entire command buffer
          console.log(`Gửi ESC/POS QR command buffer (${fullCommandBuffer.length} bytes)`);
          
          // Check connection before sending QR command
          const isStillConnected = await localDevice.isConnected();
          if (!isStillConnected) {
            throw new Error('Mất kết nối trước khi gửi lệnh in QR.');
          }

          // Send using writeWithResponse for reliability
          let writeSuccess = false;
          let retryCount = 0;
          const maxRetries = 3;
          while (!writeSuccess && retryCount < maxRetries) {
              try {
                  console.log(`Gửi QR command (thử ${retryCount + 1}/${maxRetries}) via writeWithResponse`);
                  await targetCharacteristic.writeWithResponse(base64CommandBuffer);
                  writeSuccess = true;
                  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay after sending
              } catch (writeError) {
                  retryCount++;
                  console.error(`Lỗi khi gửi QR command (thử ${retryCount}/${maxRetries}): ${safeErrorMessage(writeError)}`);
                  
                  const errorMsg = safeErrorMessage(writeError);
                   if (errorMsg.includes('destroyed') || errorMsg.includes('cancelled') || !(await localDevice.isConnected())) {
                      throw new Error('Kết nối Bluetooth đã bị hủy/mất trong quá trình gửi lệnh QR.');
                  }

                  if (retryCount >= maxRetries) {
                       throw new Error(`Không thể gửi lệnh QR đến máy in: ${errorMsg}`);
                  }
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
              }
          }
           if (!writeSuccess) {
               throw new Error('Không thể gửi lệnh QR đến máy in sau nhiều lần thử.');
           }

          console.log('Gửi lệnh ESC/POS QR thành công.');


        } catch (qrPrintError) {
          console.error('Lỗi khi in QR code bằng ESC/POS:', qrPrintError);
          // Không throw lỗi ở đây vì phần in text đã thành công, chỉ cảnh báo
           setTimeout(() => {
              Alert.alert(
                  'Lỗi In QR', 
                  `In hóa đơn thành công nhưng không thể in mã QR: ${safeErrorMessage(qrPrintError)}`,
                  [{ text: 'OK' }]
              );
           }, 600); // Delay slightly after main success message
        }
      } // End if (printQRCode)
    } catch (error) {
      console.error('Lỗi in ấn:', error);
      
      setTimeout(() => {
        Alert.alert(
          'Lỗi in ấn', 
          `Không thể in hóa đơn: ${safeErrorMessage(error)}`,
          [{ text: 'OK' }]
        );
      }, 500);
    }
  };

  // Hàm chuyển ArrayBuffer thành chuỗi base64 - replace implementation
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Add this helper function to convert hex string to bytes
  const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(Math.floor(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  };

  // Add this helper function to properly format printer commands
  const preparePrinterCommand = (command: Uint8Array): string => {
    // Convert Uint8Array to base64 string
    let binary = '';
    const len = command.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(command[i]);
    }
    return btoa(binary);
  };

  // Hàm hiển thị xem trước
  const handlePreview = () => {
    setShowPreview(true);
  };

  // Format tiền tệ
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'd';
  };

  // Hàm đóng modal thiết bị
  const closeDeviceModal = () => {
    // Dừng quét nếu đang quét
    if (isScanning && bleManagerRef.current) {
      try {
        bleManagerRef.current.stopDeviceScan();
      } catch (e) {
        console.log('Lỗi khi dừng quét:', e);
      }
    }
    setIsScanning(false);
    setIsConnecting(false); // Đặt lại trạng thái loading
    setShowDeviceList(false);
  };

  // Hiển thị danh sách sản phẩm
  const renderProductItems = () => {
    if (!order || !order.products || !Array.isArray(order.products) || order.products.length === 0) {
      return (
        <View style={styles.noProductsContainer}>
          <DynamicText style={styles.noProductsText}>Không có sản phẩm nào</DynamicText>
        </View>
      );
    }

    return order.products.map((product: any, index: number) => {
      // Kiểm tra các định dạng sản phẩm khác nhau và trích xuất thông tin phù hợp
      const productName = product.productId?.name || product.product?.name || product.name || 'Sản phẩm không tên';
      const productSKU = product.productId?.sku || product.product?.sku || product.sku || '';
      const productPrice = typeof product.price === 'number' ? product.price : 
                         (product.productId?.price || product.product?.price || 0);
      const productQuantity = product.quantity || 1;
      const totalPrice = productPrice * productQuantity;

      // Ghi log thông tin sản phẩm để debug
      console.log('Product info:', {
        index,
        originalProduct: product,
        extractedName: productName,
        extractedPrice: productPrice,
        extractedQuantity: productQuantity
      });

      return (
        <View key={index} style={styles.receiptItem}>
          <View style={styles.receiptItemHeader}>
            <DynamicText style={styles.receiptItemName} numberOfLines={2}>{productName}</DynamicText>
            <DynamicText style={styles.receiptItemPrice}>{formatCurrency(productPrice)}</DynamicText>
          </View>
          <View style={styles.receiptItemDetails}>
            <DynamicText style={styles.receiptItemQuantity}>SL: {productQuantity}</DynamicText>
            {printItemSKU && productSKU && (
              <DynamicText style={styles.receiptItemSKU}>SKU: {productSKU}</DynamicText>
            )}
            <DynamicText style={styles.receiptItemTotal}>Thành tiền: {formatCurrency(totalPrice)}</DynamicText>
          </View>
        </View>
      );
    });
  };

  // Chuẩn bị dữ liệu đơn hàng trước khi hiển thị
  useEffect(() => {
    if (order && order.products) {
      console.log('Order structure:', {
        orderNumber,
        totalAmount: order.totalAmount,
        productsCount: order.products.length,
        productSample: order.products.length > 0 ? order.products[0] : null
      });
    }
  }, [order, orderNumber]);

  // Fix the print function for simplicity, removing complex characteristic detection
  // Hàm in hóa đơn đơn giản hơn - thêm sau code hiện tại của handleRealPrint
  /**
   * Simplified print function for testing purposes
   * @ts-ignore - This function is kept for future reference
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _simplePrint = async () => {
    try {
      // Kiểm tra xem đã kết nối thiết bị chưa
      if (!connectedDevice) {
        throw new Error('Chưa kết nối với thiết bị in');
      }
      
      console.log('Đang chuẩn bị dữ liệu in...');
      
      // Tạo dữ liệu in thử nghiệm
      const testData = 'SellSmart Test Print\n\n' + 
                      'Hóa đơn test\n' +
                      'Ngày: ' + new Date().toLocaleDateString() + '\n' +
                      'Sản phẩm: Test\n' +
                      'Giá: 100,000đ\n\n';
                      
      // Mã hóa dữ liệu thành base64
      const encoder = new TextEncoder();
      const data = encoder.encode(testData);
      let base64Data = '';
      
      // Chuyển đổi thành base64 thủ công
      let binary = '';
      const bytes = new Uint8Array(data);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64Data = btoa(binary);
      
      console.log('Dữ liệu in: ', base64Data.substring(0, 20) + '...');
      
      // Tìm tất cả các dịch vụ
      const services = await connectedDevice.services();
      console.log(`Tìm thấy ${services.length} dịch vụ`);
      
      // Lặp qua từng dịch vụ để tìm đặc tính có thể ghi
      let targetCharacteristic = null;
      
      for (const service of services) {
        console.log(`Kiểm tra dịch vụ: ${service.uuid}`);
        
        try {
          const characteristics = await service.characteristics();
          console.log(`Dịch vụ có ${characteristics.length} đặc tính`);
          
          // Tìm đặc tính đầu tiên để thử
          if (characteristics.length > 0) {
            targetCharacteristic = characteristics[0];
            console.log(`Chọn đặc tính: ${targetCharacteristic.uuid} cho in thử nghiệm`);
            break;
          }
        } catch (e) {
          console.log('Lỗi khi lấy đặc tính:', e);
        }
      }
      
      if (!targetCharacteristic) {
        throw new Error('Không tìm thấy đặc tính phù hợp để in');
      }
      
      // Gửi dữ liệu theo từng phần nhỏ
      const chunkSize = 20;
      let success = false;
      
      // Cố gắng gửi với nhiều cách khác nhau
      try {
        console.log('Thử gửi dữ liệu với writeWithoutResponse');
        await targetCharacteristic.writeWithoutResponse(base64Data.slice(0, chunkSize));
        success = true;
      } catch (e1) {
        console.log('Lỗi writeWithoutResponse:', e1);
        
        try {
          console.log('Thử gửi dữ liệu với writeWithResponse');
          await targetCharacteristic.writeWithResponse(base64Data.slice(0, chunkSize));
          success = true;
        } catch (e2) {
          console.log('Lỗi writeWithResponse:', e2);
          
          // Một số thiết bị yêu cầu dữ liệu dạng hex string
          try {
            const hexData = Array.from(new TextEncoder().encode(base64Data.slice(0, chunkSize)))
                           .map(b => b.toString(16).padStart(2, '0'))
                           .join('');
            console.log('Thử gửi dữ liệu hex:', hexData);
            await targetCharacteristic.writeWithResponse(hexData);
            success = true;
          } catch (e3) {
            console.log('Lỗi gửi dạng hex:', e3);
            throw new Error('Không thể gửi dữ liệu đến máy in sau nhiều lần thử');
          }
        }
      }
      
      if (success) {
        console.log('Đã gửi dữ liệu in thử nghiệm thành công!');
        Alert.alert(
          'In thử nghiệm',
          'Đã gửi dữ liệu thử nghiệm đến máy in!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Lỗi in thử nghiệm:', error);
      Alert.alert(
        'Lỗi in thử nghiệm',
        safeErrorMessage(error),
        [{ text: 'OK' }]
      );
    }
  };

  // Add this dummy function to make the linter happy
  /**
   * Utility function to prepare receipt data
   * @ts-ignore - This function is kept for future reference
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _prepareReceiptData = async (): Promise<string> => {
    // This is a temporary placeholder 
    console.log('Dummy prepareReceiptData called');
    
    // Create a simple test string
    const testData = 'Test Print\n\nHello World\n';
    
    // Convert to ArrayBuffer and then to base64 using our utility function
    const encoder = new TextEncoder();
    const data = encoder.encode(testData);
    return arrayBufferToBase64(data.buffer);
  };

  // Fix TypeScript issues in the test print function
  /**
   * Test print function for debugging
   * @ts-ignore - This function is kept for future reference
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _testPrint = async () => {
    try {
      if (!connectedDevice) {
        throw new Error('Chưa kết nối với thiết bị in');
      }
      
      console.log('Đang thực hiện in thử nghiệm...');
      
      // Tạo dữ liệu in đơn giản
      const testData = 
        'SellSmart Test Print\n\n' +
        'Hóa đơn thử nghiệm\n' + 
        'Ngày: ' + new Date().toLocaleDateString() + '\n' +
        'Sản phẩm: Samsung S25 Ultra\n' +
        'Giá: 26,000,000đ\n' +
        'Số lượng: 2\n' +
        'Tổng: 52,000,000đ\n\n' +
        'Cảm ơn quý khách!\n\n\n\n';
      
      // Chuyển đổi dữ liệu thành mảng byte
      const encoder = new TextEncoder();
      const bytes = encoder.encode(testData);
      
      // Tìm kiếm dịch vụ và đặc tính
      console.log('Tìm kiếm dịch vụ in...');
      const services = await connectedDevice.services();
      console.log(`Tìm thấy ${services.length} dịch vụ`);
      
      // Kiểm tra từng dịch vụ
      let foundCharacteristic = null;
      
      for (const service of services) {
        console.log(`Kiểm tra dịch vụ: ${service?.uuid || 'unknown'}`);
        
        try {
          // Add explicit type casting to handle TypeScript errors
          const characteristics = await service.characteristics();
          console.log(`Dịch vụ ${service?.uuid || 'unknown'} có ${characteristics.length} đặc tính`);
          
          // Tìm đặc tính có thể ghi
          if (characteristics && characteristics.length > 0) {
            // We assume the first characteristic will work for our test
            foundCharacteristic = characteristics[0];
            console.log(`Chọn đặc tính đầu tiên: ${foundCharacteristic?.uuid || 'unknown'}`);
            break;
          }
        } catch (e) {
          console.log('Lỗi khi tìm đặc tính:', e);
        }
      }
      
      if (!foundCharacteristic) {
        throw new Error('Không tìm thấy đặc tính nào để in');
      }
      
      console.log('Gửi dữ liệu in thử nghiệm...');
      
      // Chuyển đổi dữ liệu thành base64
      const base64Data = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
      
      // Thử cả hai phương thức ghi
      let success = false;
      
      try {
        // Thử ghi không cần phản hồi trước
        console.log('Thử ghi dữ liệu với writeWithoutResponse...');
        // Add 'as any' type casting to avoid TypeScript errors
        await (foundCharacteristic as any).writeWithoutResponse(base64Data);
        success = true;
        console.log('Ghi dữ liệu thành công với writeWithoutResponse');
      } catch (error1) {
        console.log('Lỗi ghi với writeWithoutResponse:', error1);
        
        try {
          // Thử ghi có phản hồi
          console.log('Thử ghi dữ liệu với writeWithResponse...');
          // Add 'as any' type casting to avoid TypeScript errors
          await (foundCharacteristic as any).writeWithResponse(base64Data);
          success = true;
          console.log('Ghi dữ liệu thành công với writeWithResponse');
        } catch (error2) {
          console.log('Lỗi ghi với writeWithResponse:', error2);
          throw new Error(`Không thể gửi dữ liệu in: ${safeErrorMessage(error2)}`);
        }
      }
      
      if (success) {
        Alert.alert('In thử nghiệm', 'Đã gửi dữ liệu in thử nghiệm thành công!');
      }
    } catch (error) {
      console.error('Lỗi in thử nghiệm:', error);
      Alert.alert('Lỗi in thử nghiệm', safeErrorMessage(error));
    }
  };

  return (
    <BaseLayout>
      <Header
        title="In hóa đơn"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Thông tin kết nối máy in */}
        <View style={styles.section1}>
          <DynamicText style={styles.sectionTitle}>Kết nối máy in</DynamicText>
          <View style={styles.printerConnection}>
            <View style={styles.printerInfo}>
              <DynamicText style={styles.printerMethod}>
                {printMethod === 'wire' ? 'Máy in Bluetooth' : 'Máy in WiFi'}
              </DynamicText>
              <DynamicText style={[
                styles.printerStatus,
                printerStatus === 'connected' ? styles.connected : 
                printerStatus === 'connecting' ? styles.connecting : styles.disconnected
              ]}>
                {printerStatus === 'connected' 
                  ? `Đã kết nối: ${connectedDevice?.name || 'Thiết bị không tên'}` 
                  : printerStatus === 'connecting' 
                    ? 'Đang kết nối...' 
                    : 'Chưa kết nối'}
              </DynamicText>
            </View>
            <Button 
              title={printerStatus === 'connected' ? "Đã kết nối" : "Tìm máy in"}
              buttonContainerStyle={[
                styles.connectButton,
                printerStatus === 'connected' && styles.connectedButton
              ]}
              titleStyle={styles.connectButtonText}
              onPress={connectPrinter}
              disabled={printerStatus === 'connected' || printerStatus === 'connecting'}
              loading={isConnecting}
            >
              {printerStatus !== 'connected' && !isConnecting && (
                <View style={{marginRight: moderateScale(8)}}>
                  <Bluetooth size={20} color="#fff" />
                </View>
              )}
            </Button>
          </View>
        </View>

        {/* Thông tin hóa đơn */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Thông tin hóa đơn #{orderNumber}</DynamicText>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Thời gian:</DynamicText>
            <DynamicText style={styles.infoValue}>
              {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
            </DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Khách hàng:</DynamicText>
            <DynamicText style={styles.infoValue}>{order.customerID.fullName}</DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Tổng tiền:</DynamicText>
            <DynamicText style={styles.infoValue}>{formatCurrency(order.totalAmount)}</DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Số sản phẩm:</DynamicText>
            <DynamicText style={styles.infoValue}>{order.products.length}</DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Trạng thái:</DynamicText>
            <DynamicText style={styles.infoValue}>
              {order.status === 'pending' ? 'Chưa xử lý' :
               order.status === 'waiting' ? 'Chờ xử lý' :
               order.status === 'processing' ? 'Đã xử lý' :
               order.status === 'shipping' ? 'Đang giao' :
               order.status === 'delivered' ? 'Đã giao' :
               order.status === 'canceled' ? 'Đã hủy' : order.status}
            </DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Thanh toán:</DynamicText>
            <DynamicText style={styles.infoValue}>
              {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
               order.paymentStatus === 'partpaid' ? 'Thanh toán một phần' :
               order.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Đã hoàn tiền'}
            </DynamicText>
          </View>
        </View>

        {/* Tùy chọn in */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Tùy chọn in</DynamicText>
          
          <View style={styles.optionRow}>
            <DynamicText style={styles.optionLabel}>In logo cửa hàng</DynamicText>
            <Switch 
              value={printLogo}
              onValueChange={setPrintLogo}
              trackColor={{ false: "#d3d3d3", true: color.primaryColor }}
            />
          </View>
          
          <View style={styles.optionRow}>
            <DynamicText style={styles.optionLabel}>In thông tin cửa hàng</DynamicText>
            <Switch 
              value={printCompanyInfo}
              onValueChange={setPrintCompanyInfo}
              trackColor={{ false: "#d3d3d3", true: color.primaryColor }}
            />
          </View>
          
          <View style={styles.optionRow}>
            <DynamicText style={styles.optionLabel}>In mã sản phẩm (SKU)</DynamicText>
            <Switch 
              value={printItemSKU}
              onValueChange={setPrintItemSKU}
              trackColor={{ false: "#d3d3d3", true: color.primaryColor }}
            />
          </View>
          
          <View style={styles.optionRow}>
            <DynamicText style={styles.optionLabel}>In chân trang</DynamicText>
            <Switch 
              value={printFooter}
              onValueChange={setPrintFooter}
              trackColor={{ false: "#d3d3d3", true: color.primaryColor }}
            />
          </View>
          
          <View style={styles.optionRow}>
            <DynamicText style={styles.optionLabel}>In mã QR bảo hành</DynamicText>
            <Switch 
              value={printQRCode}
              onValueChange={setPrintQRCode}
              trackColor={{ false: "#d3d3d3", true: color.primaryColor }}
            />
          </View>
        </View>

        {/* Thông tin cửa hàng */}
        {printCompanyInfo && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <DynamicText style={styles.sectionTitle}>Thông tin cửa hàng</DynamicText>
              <Shop size={24} color={color.accentColor.darkColor} />
            </View>
            
            <Input
              inputType="default"
              placeholderText="Tên cửa hàng"
              value={companyName}
              onChangeText={setCompanyName}
              inputContainerStyle={styles.inputContainer}
            />
            
            <Input
              inputType="default"
              placeholderText="Địa chỉ"
              value={companyAddress}
              onChangeText={setCompanyAddress}
              inputContainerStyle={styles.inputContainer}
            />
            
            <Input
              inputType="default"
              placeholderText="Số điện thoại"
              value={companyPhone}
              onChangeText={setCompanyPhone}
              inputContainerStyle={styles.inputContainer}
            />
          </View>
        )}

        {/* Chân trang */}
        {printFooter && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <DynamicText style={styles.sectionTitle}>Chân trang hóa đơn</DynamicText>
              <NoteText size={24} color={color.accentColor.darkColor} />
            </View>
            
            <Input
              inputType="default"
              placeholderText="Nội dung chân trang"
              value={footer}
              onChangeText={setFooter}
              multiline={true}
              numberOfLines={3}
              inputContainerStyle={styles.textAreaContainer}
              inputStyle={styles.textArea}
            />
          </View>
        )}
        
        {/* Xem trước */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={handlePreview}
          >
            <DynamicText style={styles.previewButtonText}>Xem trước hóa đơn</DynamicText>
          </TouchableOpacity>
        </View>
        
        {/* In hóa đơn trực tiếp */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.directPrintButton}
            onPress={handleRealPrint}
          >
            <View style={styles.directPrintButtonContent}>
              <Printer size={24} color="#fff" variant="Bold" style={{marginRight: 8}} />
              <DynamicText style={styles.directPrintButtonText}>In hóa đơn</DynamicText>
            </View>
          </TouchableOpacity>
        </View>

    
      </ScrollView>
      
      {/* Modal hiển thị danh sách thiết bị Bluetooth */}
      <Modal
        visible={showDeviceList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => closeDeviceModal()}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.deviceListHeader}>
              <DynamicText style={styles.deviceListTitle}>Danh sách thiết bị Bluetooth</DynamicText>
              <TouchableOpacity 
                onPress={() => closeDeviceModal()}
                style={styles.closeButtonContainer}
              >
                <DynamicText style={styles.closeButton}>Đóng</DynamicText>
              </TouchableOpacity>
            </View>
            
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="large" color={color.primaryColor} />
                <DynamicText style={styles.scanningText}>Đang quét thiết bị...</DynamicText>
              </View>
            )}
            
            {bluetoothDevices.length > 0 ? (
              <FlatList
                data={bluetoothDevices}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.deviceItem}
                    onPress={() => connectToDevice(item)}
                    disabled={isConnecting}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deviceInfo}>
                      <DynamicText style={styles.deviceName}>{item.name || 'Thiết bị không tên'}</DynamicText>
                      <DynamicText style={styles.deviceId}>{item.id}</DynamicText>
                    </View>
                    <TouchableOpacity 
                      style={styles.connectDeviceButton}
                      onPress={() => connectToDevice(item)}
                      disabled={isConnecting}
                    >
                      <DynamicText style={styles.connectDeviceButtonText}>Kết nối</DynamicText>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                style={styles.deviceList}
                contentContainerStyle={styles.deviceListContent}
              />
            ) : (
              <View style={styles.noDevicesContainer}>
                {isScanning ? (
                  <DynamicText style={styles.noDevicesText}>Đang tìm kiếm thiết bị...</DynamicText>
                ) : (
                  <DynamicText style={styles.noDevicesText}>Không tìm thấy thiết bị nào</DynamicText>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Modal xem trước hóa đơn */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
        statusBarTranslucent={false} 
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.previewModalContent}>
              {/* Header với nút đóng */}
              <View style={styles.previewHeader}>
                <DynamicText style={styles.previewTitle}>Xem trước hóa đơn</DynamicText>
                <TouchableOpacity 
                  onPress={() => setShowPreview(false)}
                  style={styles.closeButtonContainer}
                >
                  <DynamicText style={styles.closeButton}>Đóng</DynamicText>
                </TouchableOpacity>
              </View>
              
              {/* Scroll view cho nội dung hóa đơn */}
              <ScrollView 
                style={styles.receiptContainer}
                showsVerticalScrollIndicator={true}
              >
                {/* Phần header của bill */}
                <View style={styles.receiptHeader}>
                  {printLogo && (
                    <View style={styles.logoContainer}>
                      <Image 
                        source={require('../../../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                      <DynamicText style={styles.logoText}>SELL SMART</DynamicText>
                    </View>
                  )}
                  
                  {printCompanyInfo && (
                    <View style={styles.companyInfo}>
                      <DynamicText style={styles.companyNameLarge}>{companyName.toUpperCase()}</DynamicText>
                      <DynamicText style={styles.companyDetail}>{companyAddress}</DynamicText>
                      <DynamicText style={styles.companyDetail}>SĐT: {companyPhone}</DynamicText>
                    </View>
                  )}
                  
                  <View style={styles.receiptTitle}>
                    <DynamicText style={styles.receiptTitleTextLarge}>HÓA ĐƠN BÁN HÀNG</DynamicText>
                  </View>
                  
                  <View style={styles.orderInfo}>
                    <View style={styles.orderInfoRow}>
                      <DynamicText style={styles.orderInfoLabel}>Mã hóa đơn:</DynamicText>
                      <DynamicText style={styles.orderInfoValue}>#{orderNumber}</DynamicText>
                    </View>
                    <View style={styles.orderInfoRow}>
                      <DynamicText style={styles.orderInfoLabel}>Ngày:</DynamicText>
                      <DynamicText style={styles.orderInfoValue}>
                        {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                      </DynamicText>
                    </View>
                    <View style={styles.orderInfoRow}>
                      <DynamicText style={styles.orderInfoLabel}>Khách hàng:</DynamicText>
                      <DynamicText style={styles.orderInfoValue}>{order.customerID.fullName}</DynamicText>
                    </View>
                    {order.customerID.phone && (
                      <View style={styles.orderInfoRow}>
                        <DynamicText style={styles.orderInfoLabel}>SĐT:</DynamicText>
                        <DynamicText style={styles.orderInfoValue}>{order.customerID.phone}</DynamicText>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Danh sách sản phẩm */}
                <View style={styles.receiptProducts}>
                  <View style={styles.receiptProductsHeader}>
                    <DynamicText style={styles.productHeaderText}>Sản phẩm</DynamicText>
                    <DynamicText style={styles.productHeaderText}>Đơn giá</DynamicText>
                  </View>
                  <View style={styles.receiptItemsContainer}>
                    {renderProductItems()}
                  </View>
                </View>
                
                {/* Tổng tiền */}
                <View style={styles.receiptSummary}>
                  <View style={styles.summaryRow}>
                    <DynamicText style={styles.summaryLabel}>Tổng tiền hàng:</DynamicText>
                    <DynamicText style={styles.summaryValue}>{formatCurrency(order.subTotal || order.totalAmount)}</DynamicText>
                  </View>
                  
                  {order.discount > 0 && (
                    <View style={styles.summaryRow}>
                      <DynamicText style={styles.summaryLabel}>Giảm giá:</DynamicText>
                      <DynamicText style={styles.summaryValue}>- {formatCurrency(order.discount)}</DynamicText>
                    </View>
                  )}
                  
                  <View style={styles.grandTotalRow}>
                    <DynamicText style={styles.grandTotalLabel}>TỔNG THANH TOÁN:</DynamicText>
                    <DynamicText style={styles.grandTotalValueLarge}>{formatCurrency(order.totalAmount)}</DynamicText>
                  </View>
                </View>
                
                {/* QR Code */}
                {printQRCode && (
                  <View style={styles.qrCodeContainer}>
                    <DynamicText style={styles.qrCodeTitle}>Quét mã để hỗ trợ bảo hành</DynamicText>
                    <QRCode
                      value={DOCUMENTS_URL}
                      size={160}
                      color={'#000'}
                      backgroundColor={'#fff'}
                    />
                    <DynamicText style={styles.qrCodeNote}>
                      {DOCUMENTS_URL}
                    </DynamicText>
                  </View>
                )}
                
                {/* Chân trang */}
                {printFooter && (
                  <View style={styles.receiptFooter}>
                    <DynamicText style={styles.footerTextBold}>{footer}</DynamicText>
                  </View>
                )}
              </ScrollView>
              
              {/* Nút in */}
              <TouchableOpacity 
                style={styles.printFromPreviewButton}
                onPress={handleRealPrint}
              >
                <Printer size={24} color="#fff" variant="Bold" style={{marginRight: 8}} />
                <DynamicText style={styles.printFromPreviewButtonText}>In hóa đơn</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonContainer}>
        <Button
          title="In hóa đơn"
          buttonContainerStyle={styles.printButton}
          titleStyle={styles.printButtonText}
          onPress={handleRealPrint}
          titleContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{marginRight: moderateScale(8)}}>
            <Printer size={24} color="#fff" variant="Bold" />
          </View>
        </Button>
      </View>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: scaleWidth(16),
  },
  section1: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),

    height: scaleHeight(280),
  },

  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: scaleHeight(12),
  },
  printerConnection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
  },
  printerInfo: {
    flex: 1,
  },
  printerMethod: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
    marginBottom: scaleHeight(4),
  },
  printerStatus: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
  },
  connected: {
    color: '#4CAF50',
  },
  connecting: {
    color: '#FFC107',
  },
  disconnected: {
    color: '#F44336',
  },
  connectButton: {
    backgroundColor: color.primaryColor,
    paddingHorizontal: scaleWidth(16),
    height: scaleHeight(100),
    borderRadius: moderateScale(8),
  },
  connectedButton: {
    backgroundColor: '#E8F5E9',
  },
  connectButtonText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(10),
  },
  infoLabel: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
  },
  infoValue: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  optionLabel: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  inputContainer: {
    marginBottom: scaleHeight(16),
    height: scaleHeight(70),
  },
  textAreaContainer: {
    marginBottom: scaleHeight(16),
    height: scaleHeight(120),
  },
  textArea: {
    textAlignVertical: 'top',
    height: scaleHeight(100),
  },
  previewButton: {
    backgroundColor: '#E3F2FD',
    padding: scaleWidth(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  buttonContainer: {
    padding: scaleWidth(16),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  printButton: {
    backgroundColor: color.primaryColor,
    padding: scaleWidth(12),
    borderRadius: moderateScale(8),
    height: scaleHeight(70),
  },
  printButtonText: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Bold,
    color: '#fff',
  },
  deviceListContainer: {
    marginTop: scaleHeight(16),
    flex: 1,
  },
  deviceListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(20),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: scaleHeight(15),
  },
  deviceListTitle: {
    fontSize: moderateScale(20),
    fontFamily: Fonts.Inter_Bold,
    color: color.accentColor.darkColor,
  },
  scanningIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleHeight(30),
    marginBottom: scaleHeight(15),
  },
  scanningText: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginTop: scaleHeight(16),
  },
  deviceList: {
    flexGrow: 0,
    maxHeight: scaleHeight(350),
  },
  deviceListContent: {
    paddingBottom: scaleHeight(20),
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(15),
    paddingHorizontal: scaleWidth(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: scaleHeight(10),
    backgroundColor: '#fafafa',
    borderRadius: moderateScale(10),
  },
  deviceInfo: {
    flex: 1,
    paddingRight: scaleWidth(15),
  },
  deviceName: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: scaleHeight(6),
  },
  deviceId: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
  },
  connectDeviceButton: {
    backgroundColor: color.primaryColor,
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(10),
    borderRadius: moderateScale(10),
    minWidth: scaleWidth(100),
    alignItems: 'center',
  },
  connectDeviceButtonText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#fff',
  },
  noDevicesContainer: {
    height: scaleHeight(200),
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(20),
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(10),
  },
  noDevicesText: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 40,
    left: 100,
    right: 0,
    bottom: 0,
    width: moderateScale(650),
    height: moderateScale(400),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: scaleWidth(24),
    width: scaleWidth(500),
    maxWidth: '80%',
    maxHeight: scaleHeight(600),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    height: moderateScale(350)
  },
  closeButtonContainer: {
    padding: scaleWidth(5),
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(8),
  },
  closeButton: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
  },
  // Styles for receipt preview
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: '80%',
    maxWidth: 600,
    height: '90%',
    maxHeight: 800,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewModalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 15,
  },
  previewTitle: {
    fontSize: moderateScale(20),
    fontFamily: Fonts.Inter_Bold,
    color: color.accentColor.darkColor,
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: scaleWidth(10),
    marginBottom: scaleHeight(15),
  },
  receiptContainerContent: {
    paddingBottom: scaleHeight(20),
  },
  receiptHeader: {
    marginBottom: scaleHeight(15),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  logo: {
    width: scaleWidth(100),
    height: scaleHeight(100),
  },
  companyInfo: {
    alignItems: 'center',
    marginBottom: scaleHeight(15),
  },
  companyName: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Bold,
    marginBottom: scaleHeight(5),
    textAlign: 'center',
  },
  companyDetail: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    marginBottom: scaleHeight(3),
    textAlign: 'center',
    color: '#555',
  },
  receiptTitle: {
    alignItems: 'center',
    marginBottom: scaleHeight(15),
    marginTop: scaleHeight(5),
  },
  receiptTitleText: {
    fontSize: moderateScale(20),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
  },
  receiptTitleTextLarge: {
    fontSize: moderateScale(24),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
  },
  orderInfo: {
    marginBottom: scaleHeight(15),
    padding: scaleWidth(10),
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(5),
  },
  orderInfoLabel: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#555',
  },
  orderInfoValue: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: '#333',
  },
  receiptProducts: {
    marginBottom: scaleHeight(15),
  },
  receiptProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: scaleHeight(10),
  },
  productHeaderText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Bold,
    color: '#333',
  },
  receiptItemsContainer: {
    marginBottom: scaleHeight(10),
  },
  receiptItem: {
    padding: scaleWidth(10),
    marginBottom: scaleHeight(10),
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(8),
  },
  receiptItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(5),
  },
  receiptItemName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#333',
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#333',
  },
  receiptItemDetails: {
    marginTop: scaleHeight(5),
  },
  receiptItemQuantity: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: '#555',
  },
  receiptItemSKU: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Inter_Regular,
    color: '#777',
  },
  receiptItemTotal: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#333',
    marginTop: scaleHeight(5),
  },
  receiptSummary: {
    marginTop: scaleHeight(15),
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: scaleHeight(15),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(8),
  },
  summaryLabel: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_Regular,
    color: '#555',
  },
  summaryValue: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(10),
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: scaleHeight(10),
    marginBottom: scaleHeight(10),
  },
  grandTotalLabel: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
  },
  grandTotalValue: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
  },
  grandTotalValueLarge: {
    fontSize: moderateScale(22),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f8ff',
    padding: scaleWidth(10),
    borderRadius: moderateScale(8),
  },
  paymentStatusLabel: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#333',
  },
  paymentStatusValue: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#4CAF50',
  },
  receiptFooter: {
    marginTop: scaleHeight(20),
    alignItems: 'center',
    paddingTop: scaleHeight(10),
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footerTextBold: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  printFromPreviewButton: {
    backgroundColor: color.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(15),
    borderRadius: moderateScale(10),
    marginTop: scaleHeight(10),
  },
  printFromPreviewButtonText: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Bold,
    color: '#fff',
  },
  noProductsContainer: {
    padding: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(8),
    marginVertical: scaleHeight(10),
  },
  noProductsText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
    color: '#777',
    textAlign: 'center',
  },
  directPrintButton: {
    backgroundColor: color.primaryColor,
    padding: scaleWidth(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  directPrintButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directPrintButtonText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#fff',
  },
  logoText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
    marginTop: scaleHeight(5),
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: scaleHeight(15),
  },
  qrCodeTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#333',
    marginBottom: scaleHeight(5),
  },
  qrCodeNote: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: '#555',
    textAlign: 'center',
    marginTop: scaleHeight(5),
  },
  companyNameLarge: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_Bold,
    marginBottom: scaleHeight(5),
    textAlign: 'center',
  },
});

export default PrintInformation; 