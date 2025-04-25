import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { BaseLayout, DynamicText, Header } from '../../../components';
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../../../utils';
import { Api } from '../../../services/api/api';
import { observer } from 'mobx-react-lite';
import { Provider } from '../../../models/provider/provider';
import { rootStore } from '../../../models/root-store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Screen } from '../../../navigation/navigation.type';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Add, SearchNormal1, Edit2 } from 'iconsax-react-native';
import { Fonts } from '../../../assets';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import { ApiEndpoint } from '../../../services/api/api-endpoint';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProviderScreen = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await Api.get(ApiEndpoint.PROVIDERS);
      
      const responseData = response.data as any;
      if (response.ok && responseData?.data) {
        setProviders(responseData.data || []);
      } else {
        let errorMessage = 'Không thể tải danh sách nhà cung cấp';
        if (response.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập tính năng này';
        } else if (response.status === 401) {
          errorMessage = 'Vui lòng đăng nhập lại';
          rootStore.auth.clearAuth();
        }
        setError(errorMessage);
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Sử dụng useFocusEffect để load lại danh sách khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchProviders();
    }, [])
  );

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchPhone);
    }, 500); // Wait 500ms after typing stops

    return () => {
      clearTimeout(handler);
    };
  }, [searchPhone]);

  // Use debounced search term to search
  useEffect(() => {
    if (debouncedSearch.trim() === '') {
      // Reset search results when search is empty
      fetchProviders();
    } else {
      // Search using API when we have a search term
      searchProviders(debouncedSearch);
    }
  }, [debouncedSearch]);

  const searchProviders = async (phone: string) => {
    try {
      setIsSearching(true);
      const response = await Api.get(`${ApiEndpoint.PROVIDERS}/search/phone?phone=${phone}`);
      
      const responseData = response.data as any;
      if (response.ok && responseData?.data) {
        setProviders(responseData.data || []);
      } else if (response.status === 404) {
        setProviders([]);
        setError('Không tìm thấy nhà cung cấp nào với số điện thoại này');
      } else {
        setProviders([]);
        setError(responseData?.message || 'Không thể tìm kiếm nhà cung cấp');
      }
    } catch (error) {
      console.error('Error searching providers:', error);
      setError('Đã xảy ra lỗi khi tìm kiếm');
      Alert.alert('Lỗi', 'Không thể tìm kiếm nhà cung cấp');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProvider = () => {
    navigation.navigate(Screen.ADD_PROVIDER);
  };

  const handleUpdateStatus = (provider: Provider) => {
    console.log('Opening status modal for provider:', provider);
    setSelectedProvider(provider);
    setStatusModalVisible(true);
  };

  const handleProviderPress = (provider: Provider) => {
    navigation.navigate(Screen.DETAIL_PROVIDER, { provider });
  };

  const confirmUpdateStatus = async () => {
    if (!selectedProvider) return;
    
    try {
      setUpdateLoading(true);
      const { _id, fullName, email, phoneNumber, address } = selectedProvider;
      const newStatus = selectedProvider.status === 'cung cấp' ? 'dừng cung cấp' : 'cung cấp';
      
      const response = await Api.put(`${ApiEndpoint.PROVIDERS}/${_id}`, {
        fullName,
        email,
        phoneNumber,
        address,
        status: newStatus
      });
      
      const responseData = response.data as any;
      if (response.ok && responseData?.data) {
        setProviders(prevProviders => 
          prevProviders.map(p => 
            p._id === selectedProvider._id ? { ...p, status: newStatus } : p
          )
        );
        
        setStatusModalVisible(false);
        Alert.alert('Thành công', 'Cập nhật trạng thái thành công');
      } else {
        Alert.alert(
          'Lỗi',
          responseData?.message || 'Không thể cập nhật trạng thái'
        );
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái');
    } finally {
      setUpdateLoading(false);
    }
  };

  const renderProviderItem = ({ item }: { item: Provider }) => (
    <TouchableOpacity 
      style={styles.providerCard}
      onPress={() => handleProviderPress(item)}
    >
      <View style={styles.providerInfo}>
        <View style={styles.providerHeader}>
          <DynamicText style={[styles.providerName, { fontSize: scaledSize(18) }]}>{item.fullName}</DynamicText>
          <TouchableOpacity 
            onPress={() => handleUpdateStatus(item)}
            style={styles.editButton}
          >
            <Edit2 size={24} color={color.primaryColor} />
          </TouchableOpacity>
        </View>
        <DynamicText style={[styles.providerDetail, { fontSize: scaledSize(16) }]}>{item.email}</DynamicText>
        <DynamicText style={[styles.providerDetail, { fontSize: scaledSize(16) }]}>{item.phoneNumber}</DynamicText>
        <DynamicText style={[styles.providerDetail, { fontSize: scaledSize(16) }]}>{item.address}</DynamicText>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor:
              item.status === 'cung cấp'
                ? color.primaryColor
                : color.accentColor.errorColor,
          },
        ]}>
          <DynamicText style={[styles.statusText, { fontSize: scaledSize(14) }]}>
            {item.status === 'cung cấp' ? 'Đang cung cấp' : 'Dừng cung cấp'}
          </DynamicText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <BaseLayout>
        <Header 
          title="Nhà cung cấp"
          showBackIcon={true}
          onPressBack={() => navigation.goBack()}
          showRightIcon={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <Header 
        title="Nhà cung cấp"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={false}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <SearchNormal1 
            size={24} 
            color={color.accentColor.grayColor}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { fontSize: scaledSize(16) }]}
            placeholder="Tìm kiếm theo số điện thoại"
            value={searchPhone}
            onChangeText={setSearchPhone}
            keyboardType="numeric"
            returnKeyType="search"
            placeholderTextColor={color.accentColor.grayColor}
          />
          {searchPhone.length > 0 && !isSearching && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchPhone('')}
            >
              <DynamicText style={[styles.clearButtonText, { fontSize: scaledSize(16) }]}>×</DynamicText>
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator
              style={styles.searchingIndicator}
              size="small"
              color={color.primaryColor}
            />
          )}
        </View>
      </View>

      <FlatList
        data={providers}
        renderItem={renderProviderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DynamicText style={[styles.emptyText, { fontSize: scaledSize(30) }]}>
              {searchPhone.length > 0 
                ? `Không tìm thấy nhà cung cấp nào với số điện thoại "${searchPhone}"` 
                : "Không có nhà cung cấp nào"}
            </DynamicText>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddProvider}
      >
        <Add size={36} color={color.accentColor.whiteColor} variant="Bold" />
      </TouchableOpacity>

      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <DynamicText style={[styles.modalTitle, { fontSize: scaledSize(20) }]}>
              Thay đổi trạng thái
            </DynamicText>
            
            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedProvider?.status === 'cung cấp' && styles.statusOptionSelected,
              ]}
              onPress={() => confirmUpdateStatus()}
              disabled={updateLoading}
            >
              <DynamicText 
                style={[
                  styles.statusOptionText,
                  { fontSize: scaledSize(16) },
                  selectedProvider?.status === 'cung cấp' && styles.statusOptionTextSelected,
                ]}
              >
                Đang cung cấp
              </DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedProvider?.status === 'dừng cung cấp' && styles.statusOptionSelected,
              ]}
              onPress={() => confirmUpdateStatus()}
              disabled={updateLoading}
            >
              <DynamicText 
                style={[
                  styles.statusOptionText,
                  { fontSize: scaledSize(16) },
                  selectedProvider?.status === 'dừng cung cấp' && styles.statusOptionTextSelected,
                ]}
              >
                Dừng cung cấp
              </DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStatusModalVisible(false)}
              disabled={updateLoading}
            >
              <DynamicText style={[styles.cancelButtonText, { fontSize: scaledSize(16) }]}>
                {updateLoading ? 'Đang xử lý...' : 'Hủy'}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
  },
  searchContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    paddingHorizontal: scaleWidth(12),
    height: scaleHeight(45),
  },
  searchIcon: {
    marginRight: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaledSize(30),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_Regular,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerCard: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: scaleHeight(12),
    shadowColor: color.accentColor.darkColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  providerInfo: {
    gap: scaleHeight(4),
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: scaledSize(30),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: scaleHeight(4),
  },
  providerDetail: {
    fontSize: scaledSize(30),
    color: color.accentColor.grayColor,
    marginBottom: scaleHeight(2),
  },
  editButton: {
    padding: moderateScale(4),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    marginTop: scaleHeight(8),
  },
  statusText: {
    fontSize: scaledSize(30),
    color: color.accentColor.whiteColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(40),
  },
  emptyText: {
    fontSize: scaledSize(30),
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: scaledSize(30),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: scaleHeight(20),
    textAlign: 'center',
  },
  statusOption: {
    paddingVertical: scaleHeight(14),
    borderRadius: moderateScale(12),
    marginBottom: scaleHeight(10),
    alignItems: 'center',
    backgroundColor: color.accentColor.whiteColor,
    borderWidth: 1,
    borderColor: color.accentColor.grayColor + '40',
  },
  statusOptionSelected: {
    backgroundColor: color.primaryColor + '20',
    borderColor: color.primaryColor,
  },
  statusOptionText: {
    fontSize: scaledSize(30),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  statusOptionTextSelected: {
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  cancelButton: {
    paddingVertical: scaleHeight(14),
    borderRadius: moderateScale(12),
    marginTop: scaleHeight(10),
    alignItems: 'center',
    backgroundColor: color.accentColor.grayColor + '20',
  },
  cancelButtonText: {
    fontSize: scaledSize(30),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  addButton: {
    position: 'absolute',
    right: scaleWidth(16),
    bottom: scaleHeight(170),
    width: scaleWidth(50),
    height: scaleWidth(50),
    borderRadius: scaleWidth(25),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: color.accentColor.darkColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearButton: {
    position: 'absolute',
    right: scaleWidth(10),
    top: '50%',
    marginTop: -scaleHeight(10),
    padding: scaleWidth(5),
  },
  clearButtonText: {
    fontSize: moderateScale(30),
    color: color.accentColor.grayColor,
  },
  searchingIndicator: {
    position: 'absolute',
    right: scaleWidth(10),
    top: '50%',
    marginTop: -scaleHeight(10),
  },
});

export default ProviderScreen;
