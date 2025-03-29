import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import { BaseLayout, DynamicText, Header } from '../../../components';
import { rootStore } from '../../../models/root-store';
import { color, moderateScale, scaleWidth, scaleHeight } from '../../../utils';

// Hàm định dạng ngày tháng
const formatDate = (isoDate: string | null) => {
  if (!isoDate) return 'Không có';
  const date = new Date(isoDate);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
};

const CustomerListScreen = observer(({ navigation }: any) => {
  const customerStore = rootStore.customers;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    customerStore.fetchCustomers();
  }, []); // Chỉ chạy một lần khi mount
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // Wait 500ms after typing stops

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Use debounced search term to search
  useEffect(() => {
    if (debouncedSearch.trim() === '') {
      // Reset search results when search is empty
      customerStore.clearSearchResults();
    } else {
      // Search using API when we have a search term
      customerStore.searchCustomers(debouncedSearch);
    }
  }, [debouncedSearch, customerStore]);

  console.log('📌 customerStore trong CustomerListScreen:', customerStore.customers.slice());

  if (customerStore.isLoading) {
    return <ActivityIndicator size="large" color={color.primaryColor} style={styles.loading} />;
  }

  if (customerStore.error) {
    return (
      <View style={styles.errorContainer}>
        <DynamicText style={styles.errorText}>{customerStore.error}</DynamicText>
        <TouchableOpacity onPress={() => customerStore.fetchCustomers()}>
          <DynamicText style={styles.retryText}>Thử lại</DynamicText>
        </TouchableOpacity>
        <DynamicText style={styles.errorHint}>
          Lỗi kết nối có thể do:
          {'\n'}- Server backend chưa được khởi động
          {'\n'}- Kết nối mạng không ổn định
          {'\n'}- Các thiết lập URL API không đúng
        </DynamicText>
      </View>
    );
  }

  // Determine which data to display
  const displayData = searchQuery.trim() !== '' 
    ? customerStore.searchResults
    : customerStore.customerList;

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={
            item.avatar && typeof item.avatar === 'string' && item.avatar.trim() !== ''
              ? { uri: item.avatar }
              : require('../../../assets/images/device-mobile.png')
          }
          style={styles.avatar}
        />
        <View>
          <DynamicText style={styles.name}>{item.fullName || 'Không có tên'}</DynamicText>
          <DynamicText style={styles.info}>📞 {item.phoneNumber || 'Chưa cập nhật'}</DynamicText>
          <DynamicText style={styles.info}>📧 {item.email || 'Chưa cập nhật'}</DynamicText>
          {item.birthDate ? (
            <DynamicText style={styles.info}>🎂 {formatDate(item.birthDate)}</DynamicText>
          ) : null}
          <DynamicText style={styles.info}>📍 {item.address || 'Chưa cập nhật'}</DynamicText>
        </View>
      </View>
    </View>
  );

  return (
    <BaseLayout>
      <Header
        title="Danh sách khách hàng"
        showBackIcon
        onPressBack={() => navigation.goBack()}
        showRightIcon={false}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khách hàng theo SĐT"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && !customerStore.isSearching && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <DynamicText style={styles.clearButtonText}>×</DynamicText>
            </TouchableOpacity>
          )}
          {customerStore.isSearching && (
            <ActivityIndicator
              style={styles.searchingIndicator}
              size="small"
              color={color.primaryColor}
            />
          )}
        </View>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <DynamicText style={styles.emptyText}>
            {searchQuery.length > 0 
              ? `Không tìm thấy khách hàng với số điện thoại "${searchQuery}"` 
              : "Không có khách hàng nào"}
          </DynamicText>
        }
      />
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: moderateScale(16),
    color: 'red',
  },
  retryText: {
    fontSize: moderateScale(16),
    color: color.primaryColor,
    marginTop: scaleHeight(10),
  },
  errorHint: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginTop: scaleHeight(10),
  },
  emptyText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: scaleHeight(20),
    color: color.accentColor.grayColor,
  },
  listContainer: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(80),
  },
  card: {
    backgroundColor: color.accentColor.whiteColor,
    padding: scaleWidth(16),
    borderRadius: moderateScale(12),
    marginBottom: scaleHeight(12),
    shadowColor: color.accentColor.darkColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scaleWidth(50),
    height: scaleHeight(50),
    borderRadius: moderateScale(25),
    marginRight: scaleWidth(12),
  },
  name: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  info: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(10),
    marginTop: scaleHeight(10),
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(8),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    fontSize: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  clearButton: {
    position: 'absolute',
    right: scaleWidth(10),
    top: '50%',
    marginTop: -scaleHeight(10),
    padding: scaleWidth(5),
  },
  clearButtonText: {
    fontSize: moderateScale(16),
    color: color.accentColor.grayColor,
  },
  searchingIndicator: {
    position: 'absolute',
    right: scaleWidth(10),
    top: '50%',
    marginTop: -scaleHeight(10),
  }
});

export default CustomerListScreen;