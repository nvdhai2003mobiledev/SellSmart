import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Text,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  BaseLayout,
  DynamicText,
  Header,
  Input,
  Button,
} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {Api} from '../../../services/api/api';
import {observer} from 'mobx-react-lite';
import {Provider} from '../../../models/provider/provider';
import {rootStore} from '../../../models/root-store';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Add,
  SearchNormal,
  Edit2,
  Grid2,
  Element3,
  Filter,
  ShoppingCart,
  CloseCircle,
  Profile2User,
  Call,
  ArrowRotateRight,
} from 'iconsax-react-native';
import {Fonts} from '../../../assets';
import {ApiEndpoint} from '../../../services/api/api-endpoint';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProviderScreen = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const {width: screenWidth} = Dimensions.get('window');
  const isTablet = screenWidth > 768;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [updateLoading, setUpdateLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Add view mode toggle
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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
      setRefreshing(false);
    }
  };

  // Sử dụng useFocusEffect để load lại danh sách khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchProviders();
    }, []),
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
      const response = await Api.get(
        `${ApiEndpoint.PROVIDERS}/search/phone?phone=${phone}`,
      );

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
    navigation.navigate(Screen.DETAIL_PROVIDER, {provider});
  };

  const confirmUpdateStatus = async () => {
    if (!selectedProvider) return;

    try {
      setUpdateLoading(true);
      const {_id, fullName, email, phoneNumber, address} = selectedProvider;
      const newStatus =
        selectedProvider.status === 'cung cấp' ? 'dừng cung cấp' : 'cung cấp';

      const response = await Api.put(`${ApiEndpoint.PROVIDERS}/${_id}`, {
        fullName,
        email,
        phoneNumber,
        address,
        status: newStatus,
      });

      const responseData = response.data as any;
      if (response.ok && responseData?.data) {
        setProviders(prevProviders =>
          prevProviders.map(p =>
            p._id === selectedProvider._id ? {...p, status: newStatus} : p,
          ),
        );

        setStatusModalVisible(false);
        Alert.alert('Thành công', 'Cập nhật trạng thái thành công');
      } else {
        Alert.alert(
          'Lỗi',
          responseData?.message || 'Không thể cập nhật trạng thái',
        );
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái');
    } finally {
      setUpdateLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProviders();
  }, []);

  const resetSearch = () => {
    setSearchPhone('');
  };

  const toggleFilterModal = () => {
    setIsFilterModalVisible(!isFilterModalVisible);
  };

  const renderProviderItem = ({
    item,
    index,
  }: {
    item: Provider;
    index: number;
  }) => {
    if (viewMode === 'grid') {
      // Grid view rendering
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => handleProviderPress(item)}>
          <View style={styles.gridHeader}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === 'cung cấp'
                      ? color.primaryColor
                      : color.accentColor.errorColor,
                },
              ]}>
              <DynamicText style={styles.statusText}>
                {item.status === 'cung cấp' ? 'Hoạt động' : 'Ngừng HĐ'}
              </DynamicText>
            </View>
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                handleUpdateStatus(item);
              }}
              style={styles.editButton}>
              <Edit2 size={16} color={color.primaryColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.gridContent}>
            <DynamicText style={styles.gridProviderName} numberOfLines={1}>
              {item.fullName}
            </DynamicText>

            <View style={styles.gridInfoRow}>
              <Call size={14} color={color.accentColor.grayColor} />
              <DynamicText style={styles.gridProviderPhone} numberOfLines={1}>
                {item.phoneNumber}
              </DynamicText>
            </View>

            <View style={styles.gridInfoRow}>
              <Profile2User size={14} color={color.accentColor.grayColor} />
              <DynamicText style={styles.gridProviderEmail} numberOfLines={1}>
                {item.email || 'Không có email'}
              </DynamicText>
            </View>

            <DynamicText style={styles.gridProviderAddress} numberOfLines={2}>
              {item.address || 'Không có địa chỉ'}
            </DynamicText>
          </View>
        </TouchableOpacity>
      );
    }

    // List view rendering
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleProviderPress(item)}>
        <View style={styles.listItemHeader}>
          <View>
            <DynamicText style={styles.listProviderName}>
              {item.fullName}
            </DynamicText>
            <DynamicText style={styles.listProviderEmail}>
              {item.email || 'Không có email'}
            </DynamicText>
          </View>

          <View style={styles.listItemActions}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === 'cung cấp'
                      ? color.primaryColor
                      : color.accentColor.errorColor,
                  marginRight: 8,
                },
              ]}>
              <DynamicText style={styles.statusText}>
                {item.status === 'cung cấp' ? 'Hoạt động' : 'Ngừng HĐ'}
              </DynamicText>
            </View>

            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                handleUpdateStatus(item);
              }}
              style={styles.editButtonList}>
              <Edit2 size={20} color={color.primaryColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listItemBody}>
          <View style={styles.listInfoRow}>
            <Call size={16} color={color.accentColor.grayColor} />
            <DynamicText style={styles.listProviderDetail}>
              {item.phoneNumber}
            </DynamicText>
          </View>

          <View style={styles.listInfoRow}>
            <Profile2User size={16} color={color.accentColor.grayColor} />
            <DynamicText style={styles.listProviderDetail} numberOfLines={2}>
              {item.address || 'Không có địa chỉ'}
            </DynamicText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <DynamicText style={styles.emptyText}>
        {searchPhone.length > 0
          ? `Không tìm thấy nhà cung cấp nào với số điện thoại "${searchPhone}"`
          : 'Không có nhà cung cấp nào'}
      </DynamicText>
      {searchPhone.length > 0 && (
        <TouchableOpacity
          style={styles.resetSearchButton}
          onPress={resetSearch}>
          <ArrowRotateRight size={16} color={color.accentColor.whiteColor} />
          <DynamicText style={styles.resetSearchText}>Xóa tìm kiếm</DynamicText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <BaseLayout>
      <Header title="Nhà cung cấp" />

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholderText="Tìm theo số điện thoại"
            value={searchPhone}
            onChangeText={setSearchPhone}
            EndIcon={<SearchNormal color={color.accentColor.grayColor} />}
            inputContainerStyle={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
          {viewMode === 'list' ? (
            <Grid2 size={20} color={color.primaryColor} variant="Bold" />
          ) : (
            <Element3 size={20} color={color.primaryColor} variant="Bold" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleFilterModal}>
          <Filter color={color.accentColor.whiteColor} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        key={viewMode} // Force re-render when view mode changes
        data={providers}
        renderItem={renderProviderItem}
        keyExtractor={item => item._id}
        numColumns={viewMode === 'grid' ? 3 : 1}
        contentContainerStyle={[
          styles.container,
          {paddingBottom: moderateScale(120)},
          viewMode === 'grid' && styles.gridList,
        ]}
        columnWrapperStyle={
          viewMode === 'grid' ? styles.columnWrapper : undefined
        }
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[color.primaryColor]}
          />
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddProvider}>
        <Add size={28} color={color.accentColor.whiteColor} variant="Bold" />
      </TouchableOpacity>

      {/* Status Change Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <DynamicText style={styles.modalTitle}>
                Thay đổi trạng thái
              </DynamicText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setStatusModalVisible(false)}>
                <CloseCircle size={24} color="#666" variant="Bold" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <DynamicText style={styles.modalDescription}>
                Bạn muốn thay đổi trạng thái nhà cung cấp này?
              </DynamicText>

              <DynamicText style={styles.providerDetailInModal}>
                <DynamicText style={styles.providerDetailLabel}>
                  Tên:{' '}
                </DynamicText>
                {selectedProvider?.fullName}
              </DynamicText>

              <DynamicText style={styles.providerDetailInModal}>
                <DynamicText style={styles.providerDetailLabel}>
                  SĐT:{' '}
                </DynamicText>
                {selectedProvider?.phoneNumber}
              </DynamicText>

              <DynamicText style={styles.providerDetailInModal}>
                <DynamicText style={styles.providerDetailLabel}>
                  Trạng thái hiện tại:{' '}
                </DynamicText>
                <DynamicText
                  style={[
                    styles.currentStatus,
                    {
                      color:
                        selectedProvider?.status === 'cung cấp'
                          ? color.primaryColor
                          : color.accentColor.errorColor,
                    },
                  ]}>
                  {selectedProvider?.status === 'cung cấp'
                    ? 'Đang hoạt động'
                    : 'Ngừng hoạt động'}
                </DynamicText>
              </DynamicText>

              <DynamicText style={styles.willChangeTo}>
                Sẽ chuyển thành:{' '}
                <DynamicText
                  style={{
                    fontFamily: Fonts.Inter_SemiBold,
                    color:
                      selectedProvider?.status !== 'cung cấp'
                        ? color.primaryColor
                        : color.accentColor.errorColor,
                  }}>
                  {selectedProvider?.status !== 'cung cấp'
                    ? 'Đang hoạt động'
                    : 'Ngừng hoạt động'}
                </DynamicText>
              </DynamicText>
            </View>

            <View style={styles.modalFooter}>
              <Button
                buttonContainerStyle={styles.cancelModalButton}
                onPress={() => setStatusModalVisible(false)}
                titleStyle={styles.cancelModalButtonText}
                title="Hủy"
              />

              <Button
                buttonContainerStyle={styles.confirmModalButton}
                titleStyle={styles.confirmModalButtonText}
                title={updateLoading ? 'Đang xử lý...' : 'Xác nhận'}
                onPress={confirmUpdateStatus}
                disabled={updateLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.filterModalContent}>
            {/* Modal Header */}
            <View style={styles.filterModalHeader}>
              <DynamicText style={styles.filterModalTitle}>
                Lọc nhà cung cấp
              </DynamicText>
              <TouchableOpacity
                style={styles.closeFilterButton}
                onPress={() => setIsFilterModalVisible(false)}>
                <CloseCircle
                  size={22}
                  color={color.accentColor.darkColor}
                  variant="Bold"
                />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.filterScrollView}>
              {/* Lọc theo trạng thái */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Profile2User
                    size={20}
                    color={color.primaryColor}
                    variant="Bold"
                  />
                  <DynamicText style={styles.filterSectionTitle}>
                    Trạng thái
                  </DynamicText>
                </View>

                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, styles.filterOptionSelected]}>
                    <DynamicText style={styles.filterOptionText}>
                      Tất cả
                    </DynamicText>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.filterOption}>
                    <DynamicText style={styles.filterOptionText}>
                      Đang hoạt động
                    </DynamicText>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.filterOption}>
                    <DynamicText style={styles.filterOptionText}>
                      Ngừng hoạt động
                    </DynamicText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Filter Action Buttons */}
            <View style={styles.filterModalFooter}>
              <Button
                buttonContainerStyle={styles.resetFiltersButton}
                onPress={resetSearch}
                titleStyle={styles.resetFiltersText}
                title="Đặt lại"
              />

              <Button
                buttonContainerStyle={styles.applyFiltersButton}
                titleStyle={styles.applyFiltersText}
                title="Áp dụng"
                onPress={() => setIsFilterModalVisible(false)}
              />
            </View>
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
    flexDirection: 'row',
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
    zIndex: 10,
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    height: scaleHeight(100),
    backgroundColor: color.inputColor,
    borderRadius: moderateScale(8),
  },
  viewModeButton: {
    width: scaleWidth(38),
    height: scaleWidth(38),
    borderRadius: moderateScale(8),
    backgroundColor: color.inputColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 0.5,
  },
  filterButton: {
    width: scaleWidth(38),
    height: scaleWidth(38),
    borderRadius: moderateScale(8),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(50),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: color.accentColor.grayColor,
    textAlign: 'center',
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
  },
  resetSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primaryColor,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    gap: moderateScale(8),
  },
  resetSearchText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
  },

  // Grid view styles
  gridList: {
    paddingHorizontal: moderateScale(8),
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: moderateScale(10),
  },
  gridItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(16),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    width: `${100 / 3 - 2}%`,
    padding: moderateScale(10),
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  gridContent: {
    flex: 1,
  },
  gridProviderName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  gridInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
    gap: moderateScale(4),
  },
  gridProviderPhone: {
    fontSize: moderateScale(12),
    color: color.accentColor.darkColor,
    flex: 1,
  },
  gridProviderEmail: {
    fontSize: moderateScale(12),
    color: color.accentColor.darkColor,
    flex: 1,
  },
  gridProviderAddress: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(4),
  },

  // List view styles
  listItem: {
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(16),
    padding: moderateScale(12),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
  },
  listItemBody: {
    marginTop: moderateScale(8),
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listProviderName: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  listProviderEmail: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(2),
  },
  listInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
    gap: moderateScale(8),
  },
  listProviderDetail: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    flex: 1,
  },

  // Common styles
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: moderateScale(10),
    color: color.accentColor.whiteColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  editButton: {
    padding: moderateScale(4),
  },
  editButtonList: {
    padding: moderateScale(4),
  },

  // Add button
  addButton: {
    position: 'absolute',
    right: moderateScale(16),
    bottom: moderateScale(20),
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: moderateScale(450),
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  closeButton: {
    padding: moderateScale(4),
  },
  modalBody: {
    padding: moderateScale(16),
  },
  modalDescription: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  providerDetailInModal: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  providerDetailLabel: {
    fontFamily: Fonts.Inter_SemiBold,
  },
  currentStatus: {
    fontFamily: Fonts.Inter_SemiBold,
  },
  willChangeTo: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: moderateScale(12),
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: color.accentColor.grayColor,
    height: scaleHeight(100),
  },
  cancelModalButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
  },
  confirmModalButton: {
    flex: 2,
    backgroundColor: color.primaryColor,
    height: scaleHeight(100),
  },
  confirmModalButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
  },

  // Filter modal styles
  filterModalContent: {
    width: '90%',
    maxWidth: moderateScale(500),
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: color.accentColor.whiteColor,
    position: 'relative',
  },
  filterModalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    textAlign: 'center',
  },
  closeFilterButton: {
    position: 'absolute',
    right: moderateScale(16),
    padding: moderateScale(4),
  },
  filterScrollView: {
    padding: moderateScale(20),
  },
  filterSection: {
    marginBottom: moderateScale(24),
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
    paddingBottom: moderateScale(6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
    gap: moderateScale(8),
  },
  filterSectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  filterOptions: {
    flexDirection: 'column',
    gap: moderateScale(8),
  },
  filterOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: color.accentColor.whiteColor,
  },
  filterOptionSelected: {
    borderColor: color.primaryColor,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  filterOptionText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: moderateScale(12),
  },
  resetFiltersButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    backgroundColor: color.accentColor.grayColor,
    height: scaleHeight(100),
  },
  resetFiltersText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.whiteColor,
  },
  applyFiltersButton: {
    flex: 2,
    backgroundColor: color.primaryColor,
    height: scaleHeight(100),
  },
  applyFiltersText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.whiteColor,
  },
});

export default ProviderScreen;
