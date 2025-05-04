import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { BaseLayout, DynamicText, Header } from '../../../components';
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../../../utils';
import { WarrantyApiService } from '../../../services/api/warrantyAPI';
import { Warranty } from '../../../models/warranty/warranty';
import { SearchNormal1 } from 'iconsax-react-native';
import {  useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/navigation.type';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WarrantyScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchWarranties = async () => {
    try {
      setIsLoading(true);
      const response = await WarrantyApiService.getWarranties();

      if (response.kind === 'ok') {
        setWarranties(response.warranties);
      } else {
        setError('Không thể tải danh sách bảo hành');
        Alert.alert('Lỗi', 'Không thể tải danh sách bảo hành');
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const searchWarranties = async (query: string) => {
    try {
      setIsSearching(true);
      const filteredWarranties = warranties.filter((item) =>
        item.customerName.toLowerCase().includes(query.toLowerCase())
      );
      setWarranties(filteredWarranties);
    } catch (error) {
      console.error('Error searching warranties:', error);
      setError('Đã xảy ra lỗi khi tìm kiếm');
      Alert.alert('Lỗi', 'Không thể tìm kiếm bảo hành');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  useEffect(() => {
    if (debouncedSearch.trim() === '') {
      fetchWarranties();
    } else {
      searchWarranties(debouncedSearch);
    }
  }, [debouncedSearch]);

  const renderWarrantyItem = ({ item }: { item: Warranty }) => {
    // Xác định màu sắc dựa trên trạng thái
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'pending': // Chờ xử lý
          return color.accentColor.yellowColor; // Màu vàng
        case 'processing': // Đang xử lý
          return color.accentColor.greenColor; // Màu xanh
        default: // Các trạng thái khác
          return color.accentColor.grayColor; // Màu xám
      }
    };
  
    return (
      <TouchableOpacity style={styles.warrantyCard}>
        <View style={styles.warrantyInfo}>
          <DynamicText style={styles.warrantyName}>{item.customerName}</DynamicText>
          <DynamicText style={styles.warrantyDetail}>Phone: {item.customerPhone}</DynamicText>
          <DynamicText style={styles.warrantyDetail}>Email: {item.customerEmail}</DynamicText>
          <DynamicText style={styles.warrantyDetail}>
            Product: {item.productId.name || 'N/A'}
          </DynamicText>
          <DynamicText style={styles.warrantyDetail}>
            Support Date: {new Date(item.supportDate).toLocaleDateString('vi-VN')}
          </DynamicText>
          {/* Hiển thị trạng thái với màu sắc */}
          <DynamicText
            style={[
              styles.warrantyDetail,
              { color: getStatusColor(item.status) }, // Áp dụng màu sắc
            ]}
          >
            Status: {item.status}
          </DynamicText>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <Header title="Hỗ trợ bảo hành" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <Header 
                title="Hỗ trợ bảo hành"
                showBackIcon={true}
                onPressBack={() => navigation.goBack()}
                showRightIcon={false}
              />
      <View style={styles.searchContainer}>
  <View style={styles.searchBox}>
    <SearchNormal1 size={24} color={color.accentColor.grayColor} style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder="Tìm kiếm theo tên khách hàng"
      value={searchText}
      onChangeText={setSearchText}
      returnKeyType="search"
      placeholderTextColor={color.accentColor.grayColor}
    />
    <TouchableOpacity
      style={styles.searchButton}
      onPress={() => searchWarranties(searchText)}
    >
      <DynamicText style={styles.searchButtonText}>Tìm</DynamicText>
    </TouchableOpacity>
  </View>
</View>

      <FlatList
        data={warranties}
        renderItem={renderWarrantyItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DynamicText style={styles.emptyText}>
              {searchText.length > 0
                ? `Không tìm thấy bảo hành nào với từ khóa "${searchText}"`
                : 'Không có bảo hành nào'}
            </DynamicText>
          </View>
        }
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
  },
  searchButton: {
    backgroundColor: color.primaryColor, // Màu nền của nút
    borderRadius: moderateScale(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleWidth(8),
    shadowColor: color.accentColor.darkColor, // Thêm bóng cho nút
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  searchButtonText: {
    color: color.accentColor.whiteColor, // Đảm bảo màu chữ là trắng
    fontSize: scaledSize(25),
    fontWeight: 'bold',
    textAlign: 'center',
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
    height: scaleHeight(65),
  },
  searchIcon: {
    marginRight: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaledSize(23),
    color: color.accentColor.darkColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warrantyCard: {
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
  warrantyInfo: {
    gap: scaleHeight(4),
  },
  warrantyName: {
    fontSize: scaledSize(25),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  warrantyDetail: {
    fontSize: scaledSize(23),
    color: color.accentColor.grayColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scaleHeight(40),
  },
  emptyText: {
    fontSize: scaledSize(23),
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  searchingIndicator: {
    marginLeft: scaleWidth(8),
  },
});

export default WarrantyScreen;