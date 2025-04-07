import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  ShoppingCart,
  CloseCircle,
  Add,
  SearchNormal,
  Filter,
  ArrowRotateRight,
  Category2,
  Profile2User,
  ArrowDown2,
  TickSquare,
} from 'iconsax-react-native';
import {observer} from 'mobx-react-lite';
import {khoiTaoStore} from '../../../models/product/product-store';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '../../../navigation/navigation.type';
import {color} from '../../../utils/color';
import AsyncImage from './AsyncImage';
import {
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils/dimensions';
import {
  BaseLayout,
  Button,
  DynamicText,
  Header,
  Input,
} from '../../../components';
import {Fonts} from '../../../assets';
import {create} from 'apisauce';
import {rootStore} from '../../../models/root-store';

// Define fonts object locally if the import is causing issues
const fonts = {
  Inter_Bold: 'Inter-Bold',
  Inter_Regular: 'Inter-Regular',
  Inter_SemiBold: 'Inter-SemiBold',
  Inter_Medium: 'Inter-Medium',
};

// SelectDropdown component for reusability
interface SelectOption {
  label: string;
  value: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

const SelectDropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Chọn...',
}: SelectDropdownProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const {width: screenWidth} = Dimensions.get('window');
  const isTablet = screenWidth > 768;

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity
        style={styles.selectField}
        onPress={() => setShowOptions(true)}>
        <Text style={styles.selectText}>{displayText}</Text>
        <ArrowDown2 size={16} color={color.accentColor.grayColor} />
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}>
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}>
          <View
            style={[
              styles.optionsContainer,
              isTablet && styles.tabletOptionModal,
            ]}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <CloseCircle size={24} color={color.accentColor.grayColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {options.length === 0 ? (
                <View style={styles.emptyOptionsContainer}>
                  <Text style={styles.emptyOptionsText}>
                    Đang tải dữ liệu...
                  </Text>
                </View>
              ) : (
                options.map((option, index) => (
                  <TouchableOpacity
                    key={`option-${index}`}
                    style={[
                      styles.optionItem,
                      selectedValue === option.value &&
                        styles.selectedOptionItem,
                    ]}
                    onPress={() => {
                      onSelect(option.value);
                      setShowOptions(false);
                    }}>
                    <Text
                      style={[
                        styles.optionText,
                        selectedValue === option.value &&
                          styles.selectedOptionText,
                      ]}>
                      {option.label}
                    </Text>

                    {selectedValue === option.value && (
                      <TickSquare
                        size={18}
                        color={color.primaryColor}
                        variant="Bold"
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const ProductScreen = observer(() => {
  const navigation = useNavigation<any>();
  const [store] = useState(() => {
    const rootStore = khoiTaoStore();
    return rootStore.productStore;
  });

  // Get screen dimensions
  const {width: screenWidth} = Dimensions.get('window');
  const isTablet = screenWidth > 768;

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [totalCartItems, setTotalCartItems] = useState(0);
  const [variantSelectionVisible, setVariantSelectionVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [additionalCategories, setAdditionalCategories] = useState<string[]>(
    [],
  );
  const [additionalProviders, setAdditionalProviders] = useState<string[]>([]);

  // Lọc danh sách sản phẩm dựa trên điều kiện tìm kiếm và bộ lọc
  const filterProducts = useCallback(
    (products: any[], search: string, category: string, provider: string) => {
      let filtered = [...products];

      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filtered = filtered.filter(item => {
          const name =
            typeof item.name === 'string' ? item.name.toLowerCase() : '';
          const id = item._id ? item._id.toLowerCase() : '';
          return name.includes(searchLower) || id.includes(searchLower);
        });
      }

      // Apply category filter
      if (category !== 'all') {
        filtered = filtered.filter(item => {
          const categoryName =
            typeof item.category === 'string'
              ? item.category
              : item.category?.name || '';
          return categoryName === category;
        });
      }

      // Apply provider filter
      if (provider !== 'all') {
        filtered = filtered.filter(item => {
          const providerName =
            typeof item.providerId === 'string'
              ? item.providerId
              : item.providerId?.fullName || '';
          return providerName === provider;
        });
      }

      return filtered;
    },
    [],
  );

  // Get unique categories and providers
  const getUniqueCategories = useCallback(() => {
    const uniqueCategories = new Set<string>();
    store.products.forEach(product => {
      const category =
        typeof product.category === 'string'
          ? product.category
          : product.category?.name || '';
      if (category) uniqueCategories.add(category);
    });
    return uniqueCategories;
  }, [store.products]);

  const getUniqueProviders = useCallback(() => {
    const uniqueProviders = new Set<string>();
    store.products.forEach(product => {
      const provider =
        typeof product.providerId === 'string'
          ? product.providerId
          : product.providerId?.fullName || '';
      if (provider) uniqueProviders.add(provider);
    });
    return uniqueProviders;
  }, [store.products]);

  // Combined categories from products and additional sources
  const categories = useMemo(() => {
    if (additionalCategories.length > 0) {
      return additionalCategories;
    }
    return ['all', ...Array.from(getUniqueCategories())];
  }, [additionalCategories, getUniqueCategories]);

  // Combined providers from products and additional sources
  const providers = useMemo(() => {
    if (additionalProviders.length > 0) {
      return additionalProviders;
    }
    return ['all', ...Array.from(getUniqueProviders())];
  }, [additionalProviders, getUniqueProviders]);

  // Danh sách products đã được lọc theo bộ lọc hiện tại
  const filteredProducts = useMemo(() => {
    return filterProducts(
      store.products,
      searchText,
      selectedFilter,
      selectedProvider,
    );
  }, [
    store.products,
    searchText,
    selectedFilter,
    selectedProvider,
    filterProducts,
  ]);

  // Fetch additional categories and providers data
  const fetchCategoriesAndProviders = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const cacheParams = `?_=${timestamp}`;

      console.log('Đang tải thông tin danh mục và nhà cung cấp...');

      // Thêm API tùy chỉnh với headers tránh cache
      const customApi = create({
        baseURL: 'http://10.0.2.2:8000',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Request-Time': timestamp.toString(),
        },
        timeout: 5000, // Timeout 5 giây
      });

      // Tải danh mục
      try {
        const categoriesResponse = await customApi.get<any>(
          `/typeproduct${cacheParams}`,
        );

        if (categoriesResponse.ok && categoriesResponse.data) {
          // Trích xuất danh mục từ sản phẩm
          const categories = categoriesResponse.data.data || [];
          const apiCategories = categories
            .map((category: any) => {
              return category.name || '';
            })
            .filter((name: string) => name !== '');

          console.log('Tải thêm danh mục thành công:', apiCategories.length);

          // Update categories with new data
          const uniqueCategories = new Set([
            'all',
            ...Array.from(getUniqueCategories()),
            ...apiCategories,
          ]);
          setAdditionalCategories(Array.from(uniqueCategories));
        } else {
          console.log(
            'Không tìm thấy danh mục hoặc dữ liệu không đúng định dạng',
            categoriesResponse.problem,
          );
        }
      } catch (catError) {
        console.error('Lỗi khi tải danh mục:', catError);
      }

      // Tải nhà cung cấp
      try {
        const providersResponse = await customApi.get<any>(
          `/products/json${cacheParams}`,
        );

        if (providersResponse.ok && providersResponse.data) {
          // Trích xuất nhà cung cấp từ sản phẩm
          const products = providersResponse.data.data || [];
          const apiProviders = products
            .map((product: any) => {
              if (
                product.providerId &&
                typeof product.providerId === 'object'
              ) {
                return product.providerId.fullName || product.providerId.name;
              }
              return product.providerId || '';
            })
            .filter((name: string) => name !== '');

          console.log('Tải thêm nhà cung cấp thành công:', apiProviders.length);

          // Update providers with new data
          const uniqueProviders = new Set([
            'all',
            ...Array.from(getUniqueProviders()),
            ...apiProviders,
          ]);
          setAdditionalProviders(Array.from(uniqueProviders));
        } else {
          console.log(
            'Không tìm thấy nhà cung cấp hoặc dữ liệu không đúng định dạng',
            providersResponse.problem,
          );
        }
      } catch (provError) {
        console.error('Lỗi khi tải nhà cung cấp:', provError);
      }
    } catch (err) {
      console.error('Lỗi khi tải thêm danh mục và nhà cung cấp:', err);
    }
  }, [getUniqueCategories, getUniqueProviders]);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      await store.fetchProducts();
      console.log(
        'Đã tải sản phẩm thành công, số lượng:',
        store.products.length,
      );
      // Fetch categories and providers
      await fetchCategoriesAndProviders();
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    }
  }, [store, fetchCategoriesAndProviders]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Refresh products
  const onRefresh = useCallback(async () => {
    try {
      console.log('Đang làm mới danh sách sản phẩm...');
      setRefreshing(true);

      // Kiểm tra và làm mới token nếu cần
      if (rootStore.auth.isAuthenticated && rootStore.auth.shouldRefreshToken) {
        console.log('Làm mới token trước khi tải dữ liệu...');
        await rootStore.auth.refreshAccessToken();
      }

      // Xóa cache và tải lại sản phẩm
      await store.fetchProducts();

      // Tải danh mục và nhà cung cấp
      await fetchCategoriesAndProviders();

      console.log('Làm mới dữ liệu thành công!');
    } catch (error) {
      console.error('Lỗi khi làm mới dữ liệu:', error);
    } finally {
      setRefreshing(false);
    }
  }, [store, fetchCategoriesAndProviders]);

  // Reset filters
  const resetFilters = () => {
    setSearchText('');
    setSelectedFilter('all');
    setSelectedProvider('all');
    setFilterVisible(false);
  };

  // Toggle filter modal
  const toggleFilterModal = () => {
    setFilterVisible(!filterVisible);
  };

  const addToCart = (productId: string, variant?: any) => {
    const cartKey = variant ? `${productId}_${variant._id}` : productId;
    const newCartItems = {...cartItems};
    newCartItems[cartKey] = (newCartItems[cartKey] || 0) + 1;
    setCartItems(newCartItems);

    // Calculate total items in cart
    const newTotal = Object.values(newCartItems).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
    setTotalCartItems(newTotal);
  };

  const handleAddToCartClick = (item: any, event?: any) => {
    // Prevent opening the product details modal when clicking the add button
    if (event) {
      event.stopPropagation();
    }

    // If product has variants, show variant selection modal
    if (
      item.hasVariants &&
      item.detailsVariants &&
      item.detailsVariants.length > 1
    ) {
      setSelectedProduct(item);
      setVariantSelectionVisible(true);
    } else if (
      item.hasVariants &&
      item.detailsVariants &&
      item.detailsVariants.length === 1
    ) {
      // If product has only one variant, add it directly
      addToCart(item._id, item.detailsVariants[0]);
    } else {
      // If product has no variants, add it directly
      addToCart(item._id);
    }
  };

  const showProductDetails = (item: any) => {
    setSelectedProduct(item);
    setModalVisible(true);
  };

  const getVariantName = (variant: any) => {
    if (!variant || !variant.variantDetails) {
      return '';
    }
    return variant.variantDetails.map((detail: any) => detail.value).join(', ');
  };

  const renderItem = ({item}: {item: any}) => {
    // Calculate display price based on product structure
    let price = 0;

    if (item.price !== null && item.price !== undefined) {
      price = item.price;
    } else if (
      item.hasVariants &&
      item.detailsVariants &&
      item.detailsVariants.length > 0
    ) {
      price = item.detailsVariants[0].price;
    } else if (item.variants && item.variants.length > 0) {
      price = item.variants[0].price;
    }

    const productName =
      typeof item.name === 'string'
        ? item.name
        : item.name && typeof item.name.toString === 'function'
        ? item.name.toString()
        : 'Sản phẩm không tên';

    // No need to manually fix the URL, AsyncImage now handles this
    const thumbnailUrl = item.thumbnail || '';

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => showProductDetails(item)}
        activeOpacity={0.7}>
        <AsyncImage
          source={{uri: thumbnailUrl}}
          style={styles.productImage}
          resizeMode="contain"
        />
        <View style={styles.productInfo}>
          <DynamicText style={styles.productName} numberOfLines={2}>
            {productName}
          </DynamicText>
          <DynamicText style={styles.productCategory}>
            {item.category ? item.category.name : 'Không phân loại'}
          </DynamicText>
          <DynamicText style={styles.productPrice}>
            {price.toLocaleString('vi-VN')} đ
          </DynamicText>
          <View style={styles.productInfoBottom}>
            <View style={styles.warrantyBadge}>
              <DynamicText style={styles.warrantyText}>
                <Text style={styles.warrantyIcon}>🛡️</Text>{' '}
                {item.warrantyPeriod || 12} tháng BH
              </DynamicText>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={e => handleAddToCartClick(item, e)}>
              <Add size={moderateScale(12)} color="#FFFFFF" variant="Linear" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
      <Text style={styles.emptySubText}>
        Hãy kiểm tra kết nối mạng và đảm bảo rằng server đang hoạt động
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
        disabled={refreshing}>
        {refreshing ? (
          <ActivityIndicator size="small" color={color.primaryColor} />
        ) : (
          <View style={styles.refreshButtonContent}>
            <ArrowRotateRight size={16} color={color.accentColor.whiteColor} />
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.connectionStatus}>
        <Text style={styles.emptyNoteText}>
          Nếu vấn đề vẫn tiếp diễn, hãy đăng xuất và đăng nhập lại.
        </Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => rootStore.logout()}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleCheckout = () => {
    if (totalCartItems > 0) {
      // Convert cart items to proper format for order creation
      const selectedProducts = Object.entries(cartItems)
        .map(([key, quantity]) => {
          const [productId, variantId] = key.split('_');
          const product = store.products.find(p => p._id === productId);

          if (!product) return null;

          if (variantId) {
            // Product with variant
            const variant = product.detailsVariants.find(
              v => v._id === variantId,
            );
            if (!variant) return null;

            return {
              productId: product._id,
              name: product.name,
              price: variant.price,
              quantity,
              thumbnail: product.thumbnail,
              variantId: variant._id,
              variant: getVariantName(variant),
            };
          } else {
            // Product without variant
            return {
              productId: product._id,
              name: product.name,
              price: product.price,
              quantity,
              thumbnail: product.thumbnail,
            };
          }
        })
        .filter(Boolean);

      // Navigate to CreateOrderScreen with selected products
      navigation.navigate(Screen.CREATEORDER, {
        selectedProducts,
      });
    }
  };

  return (
    <BaseLayout style={styles.container}>
      <Header title="Sản phẩm" />
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholderText="Tìm theo tên, mã sản phẩm"
            value={searchText}
            onChangeText={setSearchText}
            EndIcon={<SearchNormal color={color.accentColor.grayColor} />}
            inputContainerStyle={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleFilterModal}>
          <Filter color={color.accentColor.whiteColor} size={24} />
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(selectedFilter !== 'all' || selectedProvider !== 'all') && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersTitle}>Bộ lọc đang áp dụng:</Text>
          <View style={styles.filterTags}>
            {selectedFilter !== 'all' && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  Danh mục: {selectedFilter}
                </Text>
                <TouchableOpacity onPress={() => setSelectedFilter('all')}>
                  <CloseCircle size={16} color={color.accentColor.grayColor} />
                </TouchableOpacity>
              </View>
            )}
            {selectedProvider !== 'all' && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  Nhà cung cấp: {selectedProvider}
                </Text>
                <TouchableOpacity onPress={() => setSelectedProvider('all')}>
                  <CloseCircle size={16} color={color.accentColor.grayColor} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <ArrowRotateRight size={16} color={color.primaryColor} />
              <Text style={styles.resetText}>Đặt lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View>
        {store.isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.primaryColor} />
            <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
          </View>
        ) : store.error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Lỗi: {store.error}</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredProducts}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              numColumns={5}
              contentContainerStyle={[
                styles.productList,
                {paddingBottom: moderateScale(100)},
              ]}
              columnWrapperStyle={styles.columnWrapper}
              ListEmptyComponent={renderEmptyList}
              ListFooterComponent={() =>
                totalCartItems > 0 ? (
                  <View style={styles.floatingCheckoutContainer}>
                    <View style={styles.cartSummary}>
                      <DynamicText style={styles.cartItemCount}>
                        {totalCartItems} sản phẩm trong giỏ hàng
                      </DynamicText>
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={handleCheckout}>
                        <ShoppingCart
                          size={scaledSize(24)}
                          color="#fff"
                          variant="Bold"
                        />
                        <Text style={styles.checkoutButtonText}>
                          Thanh toán
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[color.primaryColor]}
                />
              }
            />
          </>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterVisible}
        onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              styles.filterModalContent,
              isTablet && styles.tabletFilterModal,
            ]}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Lọc sản phẩm</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFilterVisible(false)}>
                <CloseCircle size={24} color="#666" variant="Bold" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScrollView}>
              {/* Categories Filter with Select Dropdown */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Category2 size={20} color={color.accentColor.darkColor} />
                  <Text style={styles.filterSectionTitle}>Danh mục</Text>
                </View>
                <SelectDropdown
                  options={
                    categories.length > 1
                      ? categories.map(cat => ({
                          label: cat === 'all' ? 'Tất cả danh mục' : cat,
                          value: cat,
                        }))
                      : [{label: 'Đang tải danh mục...', value: 'all'}]
                  }
                  selectedValue={selectedFilter}
                  onSelect={setSelectedFilter}
                  placeholder="Chọn danh mục"
                />
              </View>

              {/* Providers Filter with Select Dropdown */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Profile2User size={20} color={color.accentColor.darkColor} />
                  <Text style={styles.filterSectionTitle}>Nhà cung cấp</Text>
                </View>
                <SelectDropdown
                  options={
                    providers.length > 1
                      ? providers.map(provider => ({
                          label:
                            provider === 'all'
                              ? 'Tất cả nhà cung cấp'
                              : provider,
                          value: provider,
                        }))
                      : [{label: 'Đang tải nhà cung cấp...', value: 'all'}]
                  }
                  selectedValue={selectedProvider}
                  onSelect={setSelectedProvider}
                  placeholder="Chọn nhà cung cấp"
                />
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <Button
                buttonContainerStyle={styles.resetFiltersButton}
                onPress={resetFilters}
                title="Đặt lại"
                titleStyle={styles.resetFiltersText}
              />
              <Button
                buttonContainerStyle={styles.applyFiltersButton}
                onPress={() => setFilterVisible(false)}
                title="Áp dụng"
                titleStyle={styles.applyFiltersText}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <CloseCircle size={24} color="#666" variant="Bold" />
            </TouchableOpacity>

            {selectedProduct && (
              <ScrollView style={styles.detailsScrollView}>
                <AsyncImage
                  source={{
                    uri: selectedProduct.thumbnail || '',
                  }}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailName}>{selectedProduct.name}</Text>
                  <Text style={styles.detailCategory}>
                    Danh mục:{' '}
                    {typeof selectedProduct.category === 'string'
                      ? selectedProduct.category
                      : selectedProduct.category?.name || 'Không phân loại'}
                  </Text>
                  <Text style={styles.detailProvider}>
                    Nhà cung cấp:{' '}
                    {typeof selectedProduct.providerId === 'string'
                      ? selectedProduct.providerId
                      : selectedProduct.providerId?.fullName || 'Không có'}
                  </Text>
                  <Text style={styles.detailPrice}>
                    {selectedProduct.hasVariants &&
                    selectedProduct.detailsVariants &&
                    selectedProduct.detailsVariants.length > 0
                      ? `${selectedProduct.detailsVariants[0].price.toLocaleString(
                          'vi-VN',
                        )} đ`
                      : selectedProduct.price
                      ? `${selectedProduct.price.toLocaleString('vi-VN')} đ`
                      : 'Liên hệ'}
                  </Text>

                  <View style={styles.variantsContainer}>
                    {selectedProduct.hasVariants &&
                      selectedProduct.detailsVariants &&
                      selectedProduct.detailsVariants.length > 0 && (
                        <>
                          <Text style={styles.variantsTitle}>
                            Biến thể sản phẩm
                          </Text>
                          {selectedProduct.detailsVariants.map(
                            (variant: any, index: number) => (
                              <View
                                key={variant._id || index}
                                style={styles.variantItem}>
                                <Text style={styles.variantName}>
                                  {getVariantName(variant)}
                                </Text>
                                <Text style={styles.variantPrice}>
                                  {variant.price.toLocaleString('vi-VN')} đ
                                </Text>
                                <TouchableOpacity
                                  style={styles.addVariantButton}
                                  onPress={() =>
                                    addToCart(selectedProduct._id, variant)
                                  }>
                                  <Text style={styles.addVariantButtonText}>
                                    Thêm
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ),
                          )}
                        </>
                      )}
                  </View>

                  {(!selectedProduct.hasVariants ||
                    !selectedProduct.detailsVariants ||
                    selectedProduct.detailsVariants.length === 0) && (
                    <Button
                      buttonContainerStyle={styles.addToCartButton}
                      onPress={() => addToCart(selectedProduct._id)}
                      title="Thêm vào giỏ hàng"
                      titleStyle={styles.addToCartButtonText}
                    />
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Variant Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={variantSelectionVisible}
        onRequestClose={() => setVariantSelectionVisible(false)}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              styles.variantModalContent,
              isTablet && styles.tabletVariantModal,
            ]}>
            <View style={styles.variantModalHeader}>
              <Text style={styles.variantModalTitle}>Chọn biến thể</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setVariantSelectionVisible(false)}>
                <CloseCircle size={24} color="#666" variant="Bold" />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <View style={styles.variantSelectionContainer}>
                {/* Thêm ảnh sản phẩm */}
                <View style={styles.variantProductHeader}>
                  <AsyncImage
                    source={{
                      uri: selectedProduct.thumbnail || '',
                    }}
                    style={styles.variantProductImage}
                    resizeMode="contain"
                  />
                  <View style={styles.variantProductInfo}>
                    <Text style={styles.productNameInVariantModal}>
                      {selectedProduct.name}
                    </Text>
                    {/* Hiển thị giá cơ bản */}
                    <Text style={styles.variantBasePrice}>
                      Giá thay đổi theo biến thể
                    </Text>
                  </View>
                </View>

                <Text style={styles.variantSelectPrompt}>
                  Vui lòng chọn biến thể:
                </Text>

                <ScrollView
                  style={[styles.variantList]}
                  showsVerticalScrollIndicator={false}>
                  {selectedProduct.detailsVariants &&
                    selectedProduct.detailsVariants.map(
                      (variant: any, index: number) => (
                        <TouchableOpacity
                          key={variant._id || index}
                          style={[
                            styles.variantSelectItem,
                            selectedVariant === variant &&
                              styles.selectedVariantItem,
                          ]}
                          onPress={() => setSelectedVariant(variant)}>
                          <View style={styles.variantSelectInfo}>
                            <Text style={styles.variantSelectName}>
                              {getVariantName(variant)}
                            </Text>
                            <Text style={styles.variantSelectPrice}>
                              {variant.price.toLocaleString('vi-VN')} đ
                            </Text>
                            {variant.inventory <= 5 &&
                              variant.inventory > 0 && (
                                <Text style={styles.variantLowStock}>
                                  Còn {variant.inventory} sản phẩm
                                </Text>
                              )}
                            {variant.inventory === 0 && (
                              <Text style={styles.variantOutOfStock}>
                                Hết hàng
                              </Text>
                            )}
                          </View>
                          {selectedVariant === variant && (
                            <View style={styles.selectedVariantCheckmark}>
                              <TickSquare
                                size={18}
                                color="#FFFFFF"
                                variant="Bold"
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      ),
                    )}
                </ScrollView>

                <View style={styles.variantButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cancelVariantButton}
                    onPress={() => {
                      setVariantSelectionVisible(false);
                      setSelectedVariant(null);
                    }}>
                    <Text style={styles.cancelButtonText}>Huỷ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.addVariantToCartButton,
                      !selectedVariant && styles.disabledButton,
                    ]}
                    disabled={
                      !selectedVariant ||
                      (selectedVariant && selectedVariant.inventory === 0)
                    }
                    onPress={() => {
                      if (selectedVariant && selectedProduct) {
                        addToCart(selectedProduct._id, selectedVariant);
                        setVariantSelectionVisible(false);
                        setSelectedVariant(null);
                      }
                    }}>
                    <Text style={styles.addToCartButtonText}>
                      Thêm vào giỏ hàng
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </BaseLayout>
  );
});

export default ProductScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    fontFamily: Fonts.Inter_Regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  errorText: {
    fontSize: moderateScale(16),
    color: color.accentColor.errorColor,
    textAlign: 'center',
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: color.accentColor.grayColor,
    textAlign: 'center',
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
  },
  refreshButton: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
  },
  refreshButtonText: {
    fontSize: moderateScale(14),
    color: color.accentColor.whiteColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  cartButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(10),
    fontFamily: Fonts.Inter_Bold,
  },

  // Search and filter styles
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(10),
    alignItems: 'center',
    gap: moderateScale(8),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
    zIndex: 10,
  },
  filterButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(10),
    marginTop: moderateScale(10),
  },
  activeFiltersTitle: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(6),
    fontFamily: Fonts.Inter_Regular,
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    alignItems: 'center',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(16),
    gap: moderateScale(6),
  },
  filterTagText: {
    fontSize: moderateScale(12),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_Regular,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
  },
  resetText: {
    fontSize: moderateScale(12),
    color: color.primaryColor,
    fontFamily: '500',
  },
  filterModalContent: {
    height: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterModalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  filterScrollView: {
    flex: 1,
  },
  filterSection: {
    marginBottom: moderateScale(20),
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    gap: moderateScale(8),
  },
  filterSectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: color.accentColor.darkColor,
  },
  selectContainer: {
    marginBottom: moderateScale(16),
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: scaleHeight(90),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: moderateScale(8),
    backgroundColor: color.accentColor.whiteColor,
  },
  selectText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  resetFiltersButton: {
    flex: 1,
    alignItems: 'center',
    marginRight: moderateScale(8),
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    backgroundColor: color.accentColor.grayColor,
  },
  resetFiltersText: {
    fontSize: scaledSize(20),
    fontWeight: '500',
    color: color.accentColor.whiteColor,
  },
  applyFiltersButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
  },
  applyFiltersText: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.whiteColor,
  },

  // Existing modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '100%',
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
  closeButton: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    zIndex: 10,
  },
  detailsScrollView: {
    maxHeight: '100%',
    marginTop: moderateScale(20),
  },
  detailImage: {
    width: scaleWidth(400),
    height: scaleHeight(400),
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  detailInfo: {
    padding: moderateScale(8),
  },
  detailName: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
  },
  detailCategory: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: 5,
  },
  detailProvider: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: 5,
  },
  detailPrice: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginVertical: moderateScale(16),
  },
  variantsContainer: {
    marginTop: moderateScale(10),
  },
  variantsTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  variantName: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_Regular,
  },
  variantPrice: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  addVariantButton: {
    backgroundColor: color.primaryColor,
    paddingHorizontal: moderateScale(16),
    height: scaleHeight(80),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVariantButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_SemiBold,
  },
  addToCartButton: {
    backgroundColor: color.primaryColor,
    padding: moderateScale(16),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(20),
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
  productList: {
    marginTop: moderateScale(30),
    paddingBottom: moderateScale(120),
    flexGrow: 1,
    backgroundColor: '#F5F7FA',
  },
  productItem: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    maxWidth: '22%',
    minWidth: '22%',
    marginHorizontal: 0,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: moderateScale(120),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  productInfo: {
    padding: moderateScale(12),
  },
  productName: {
    fontSize: scaledSize(24),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    height: moderateScale(36),
    marginBottom: moderateScale(4),
  },
  productCategory: {
    fontSize: moderateScale(10),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(2),
  },
  productPrice: {
    fontSize: scaledSize(24),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginBottom: moderateScale(2),
  },
  warrantyBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
    marginTop: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 0, 0.2)',
  },
  warrantyText: {
    fontSize: scaledSize(18),
    color: '#FF8F00',
    fontWeight: '500',
  },
  warrantyIcon: {
    fontSize: moderateScale(10),
  },
  addButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(5),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  variantModalContent: {
    padding: moderateScale(20),
  },
  variantModalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(15),
    textAlign: 'center',
  },
  productNameInVariantModal: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  variantList: {
    maxHeight: scaleHeight(300),
  },
  variantSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
    marginVertical: moderateScale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedVariantItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderColor: color.primaryColor,
  },
  variantSelectInfo: {
    flex: 1,
  },
  variantSelectName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(5),
  },
  variantSelectPrice: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  selectedVariantCheckmark: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(10),
  },
  checkmarkText: {
    color: color.accentColor.whiteColor,
    fontFamily: Fonts.Inter_Bold,
  },
  addVariantToCartButton: {
    flex: 2,
    backgroundColor: color.primaryColor,
    height: scaleHeight(100),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.6)',
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  optionsContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: moderateScale(8),
  },
  optionsTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  optionsList: {
    maxHeight: moderateScale(300),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedOptionItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  optionText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  selectedOptionText: {
    fontWeight: '500',
    color: color.primaryColor,
  },
  tabletVariantModal: {
    width: '50%',
    maxWidth: moderateScale(450),
    alignSelf: 'center',
  },
  tabletOptionModal: {
    maxWidth: moderateScale(400),
    alignSelf: 'center',
  },
  variantModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  variantSelectionContainer: {
    paddingTop: moderateScale(16),
  },
  bottomPadding: {
    height: moderateScale(200),
  },
  contentContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(120),
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    // Add any necessary styles for the search input container
  },
  floatingCheckoutContainer: {
    width: '100%',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(30),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemCount: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: color.accentColor.darkColor,
  },
  checkoutButton: {
    height: scaleHeight(80),
    backgroundColor: color.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(8),
    gap: moderateScale(8),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  checkoutButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: scaledSize(24),
    fontFamily: Fonts.Inter_SemiBold,
  },
  tabletFilterModal: {
    width: '70%',
    maxWidth: moderateScale(600),
    alignSelf: 'center',
  },
  emptyOptionsContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOptionsText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(4),
    gap: moderateScale(10),
  },
  variantProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  variantProductImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(16),
  },
  variantProductInfo: {
    // flex: 1,
  },
  variantBasePrice: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  variantSelectPrompt: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
  },
  variantButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(20),
    gap: moderateScale(16),
  },
  cancelVariantButton: {
    flex: 1,
    backgroundColor: color.accentColor.grayColor,
    height: scaleHeight(100),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
  closeModalButton: {
    position: 'absolute',
    top: moderateScale(0),
    right: moderateScale(0),
    zIndex: 10,
  },
  variantLowStock: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_Regular,
    color: '#FF9800',
    marginTop: moderateScale(4),
  },
  variantOutOfStock: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_Regular,
    color: '#F44336',
    marginTop: moderateScale(4),
  },
  emptySubText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: moderateScale(8),
  },
  emptyNoteText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  logoutButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: color.primaryColor,
  },
  logoutButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
  },
  productInfoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
});
