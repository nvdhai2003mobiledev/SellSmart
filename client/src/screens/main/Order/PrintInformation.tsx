import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
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
} from 'iconsax-react-native';
import { format } from 'date-fns';

const PrintInformation = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const {order, printMethod, orderNumber} = route.params as {
    order: any;
    printMethod: 'wire' | 'wifi';
    orderNumber: string;
  };

  // State cho các tùy chọn in
  const [printLogo, setPrintLogo] = useState(true);
  const [printFooter, setPrintFooter] = useState(true);
  const [printItemSKU, setPrintItemSKU] = useState(false);
  const [printCompanyInfo, setPrintCompanyInfo] = useState(true);
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

  // Hàm kết nối máy in
  const connectPrinter = () => {
    setIsConnecting(true);
    setPrinterStatus('connecting');
    
    // Giả lập kết nối máy in sau 2 giây
    setTimeout(() => {
      setIsConnecting(false);
      setPrinterStatus('connected');
      Alert.alert('Thông báo', 'Kết nối máy in thành công!');
    }, 2000);
  };

  // Hàm xử lý in
  const handlePrint = () => {
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

    // Giả lập đang in
    Alert.alert('Đang in...', 'Vui lòng đợi trong giây lát');
    
    // Giả lập in thành công sau 3 giây
    setTimeout(() => {
      Alert.alert(
        'In hóa đơn thành công',
        'Hóa đơn đã được in thành công',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 3000);
  };

  // Format tiền tệ
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
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
                {printMethod === 'wire' ? 'Máy in USB/Bluetooth' : 'Máy in WiFi'}
              </DynamicText>
              <DynamicText style={[
                styles.printerStatus,
                printerStatus === 'connected' ? styles.connected : 
                printerStatus === 'connecting' ? styles.connecting : styles.disconnected
              ]}>
                {printerStatus === 'connected' ? 'Đã kết nối' : 
                 printerStatus === 'connecting' ? 'Đang kết nối...' : 'Chưa kết nối'}
              </DynamicText>
            </View>
            <Button 
              title={printerStatus === 'connected' ? "Đã kết nối" : "Kết nối"}
              buttonContainerStyle={[
                styles.connectButton,
                printerStatus === 'connected' && styles.connectedButton
              ]}
              titleStyle={styles.connectButtonText}
              onPress={connectPrinter}
              disabled={printerStatus === 'connected' || printerStatus === 'connecting'}
              loading={isConnecting}
            />
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
            onPress={() => Alert.alert('Thông báo', 'Chức năng xem trước đang được phát triển')}
          >
            <DynamicText style={styles.previewButtonText}>Xem trước hóa đơn</DynamicText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button
          title="In hóa đơn"
          buttonContainerStyle={styles.printButton}
          titleStyle={styles.printButtonText}
          onPress={handlePrint}
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
    height: scaleHeight(300),
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
    height: scaleHeight(50),
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
});

export default PrintInformation; 