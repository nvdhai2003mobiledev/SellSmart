import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  ShoppingCart,
  CloseCircle,
  SearchNormal,
  Filter,
  ArrowRotateRight,
  Category2,
  Profile2User,
  ArrowDown2,
  TickSquare,
  Grid2,
  Element3,
  Add,
} from 'iconsax-react-native';
import {observer} from 'mobx-react-lite';
import {layStore, taiLaiSanPham} from '../../../models/product/product-store';
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
import {Fonts, Images} from '../../../assets';
import {create} from 'apisauce';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import productAPI from '../../../services/api/productAPI';

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
    <View style={{marginBottom: moderateScale(16)}}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: scaleHeight(110),
          paddingHorizontal: moderateScale(16),
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: moderateScale(8),
          backgroundColor: color.accentColor.whiteColor,
        }}
        onPress={() => setShowOptions(true)}>
        <Text
          style={{
            fontSize: moderateScale(12),
            fontFamily: Fonts.Inter_Regular,
            color: color.accentColor.darkColor,
          }}>
          {displayText}
        </Text>
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
                    key={index}
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

interface Product {
  _id: string;
  name: string;
  thumbnail?: string;
  category: {
    _id: string;
    name: string;
  };
  providerId: {
    _id: string;
    fullName: string;
  };
  status: 'available' | 'unavailable';
  hasVariants: boolean;
  price?: number;
  inventory?: number;
  variantDetails?: Array<{
    attributes: Record<string, string>;
    price: number;
    quantity: number;
  }>;
  warrantyPeriod?: number;
  inventoryId: string;
  isPublished: boolean;
}

// Thêm interface cho Source type
interface ImageSource {
  uri: string;
}

// Interface cho item giỏ hàng
interface CartItem {
  productId: string;
  variantId?: string;
  product: Product;
  variant?: any;
  quantity: number;
  selected: boolean;
}

// Function to get the correct server URL based on device type
const getServerBaseUrl = () => {
  // Set this to true if testing on emulator, false for real device
  const isEmulator = false;

  if (Platform.OS === 'android') {
    return isEmulator
      ? 'http://10.0.2.2:5000' // Android Emulator special IP
      : 'http://192.168.1.170:5000'; // Real device - use actual server IP
  } else if (Platform.OS === 'ios') {
    return isEmulator
      ? 'http://localhost:5000' // iOS Simulator
      : 'http://192.168.1.170:5000'; // Real device - use actual server IP
  }

  return 'http://192.168.1.170:5000'; // Default fallback
};

const ProductScreen = observer(() => {
  const navigation = useNavigation<any>();
  const [store] = useState(() => {
    const rootStore = layStore();
    return rootStore.productStore;
  });

  // Get screen dimensions
  const {width: screenWidth} = Dimensions.get('window');
  const isTablet = screenWidth > 768;

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemsDetail, setCartItemsDetail] = useState<CartItem[]>([]);
  const [totalCartItems, setTotalCartItems] = useState(0);
  const [variantSelectionVisible, setVariantSelectionVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, boolean>
  >({});
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [isSelectingForCheckout, setIsSelectingForCheckout] = useState(false);
  const [checkoutSelectedItems, setCheckoutSelectedItems] = useState<
    Record<string, boolean>
  >({});

  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [additionalCategories, setAdditionalCategories] = useState<string[]>(
    [],
  );
  const [additionalProviders, setAdditionalProviders] = useState<string[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [hiddenProducts, setHiddenProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCart, setShowCart] = useState(false);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [providers, setProviders] = useState<SelectOption[]>([]);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Add view mode toggle
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Lọc danh sách sản phẩm dựa trên điều kiện tìm kiếm và bộ lọc
  const filterProducts = useCallback(
    (products: any[], search: string, category: string, provider: string) => {
      // Đảm bảo products là mảng
      if (!Array.isArray(products)) {
        console.warn('products không phải là mảng:', products);
        return [];
      }

      // Tạo bản sao của mảng để tránh thay đổi mảng gốc
      let filtered = [...products];
      console.log(`Bắt đầu lọc ${filtered.length} sản phẩm`);

      // Apply search filter - tìm kiếm theo tên, mã sản phẩm hoặc mã code
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        console.log(`Đang tìm kiếm với từ khóa: "${searchLower}"`);

        filtered = filtered.filter(item => {
          if (!item) return false;

          // Tìm theo tên sản phẩm
          const name =
            typeof item.name === 'string' ? item.name.toLowerCase() : '';

          // Tìm theo ID sản phẩm
          const id = item._id ? item._id.toLowerCase() : '';

          // Tìm theo mã sản phẩm (product_code)
          const productCode = item.product_code
            ? item.product_code.toLowerCase()
            : '';

          // Kiểm tra các trường cơ bản
          if (
            name.includes(searchLower) ||
            id.includes(searchLower) ||
            productCode.includes(searchLower)
          ) {
            return true;
          }

          // Tìm trong các thuộc tính biến thể nếu có
          if (
            item.hasVariants &&
            item.detailsVariants &&
            Array.isArray(item.detailsVariants)
          ) {
            for (const variant of item.detailsVariants) {
              if (!variant) continue;

              // Kiểm tra attributes
              if (variant.attributes) {
                // Nếu attributes là MobX Map
                if (
                  variant.attributes.entries &&
                  typeof variant.attributes.entries === 'function'
                ) {
                  try {
                    // Sử dụng for...of thay vì forEach để tránh lỗi
                    for (const key of variant.attributes.keys()) {
                      const value = variant.attributes.get(key);
                      if (
                        typeof value === 'string' &&
                        value.toLowerCase().includes(searchLower)
                      ) {
                        return true;
                      }
                    }
                  } catch (error) {
                    console.error('Lỗi khi tìm kiếm trong attributes:', error);
                  }
                }
                // Nếu attributes là object thông thường
                else if (
                  typeof variant.attributes === 'object' &&
                  variant.attributes !== null
                ) {
                  const values = Object.values(variant.attributes);
                  for (const value of values) {
                    if (
                      typeof value === 'string' &&
                      value.toLowerCase().includes(searchLower)
                    ) {
                      return true;
                    }
                  }
                }
              }
            }
          }

          return false;
        });

        console.log(`Sau khi tìm kiếm: ${filtered.length} sản phẩm`);
      }

      // Apply category filter
      if (category && category !== 'all') {
        console.log(`Đang lọc theo danh mục: ${category}`);

        filtered = filtered.filter(item => {
          if (!item || !item.category) return false;

          const categoryName =
            typeof item.category === 'string'
              ? item.category
              : item.category?.name || '';
          return categoryName === category;
        });

        console.log(`Sau khi lọc danh mục: ${filtered.length} sản phẩm`);
      }

      // Apply provider filter
      if (provider && provider !== 'all') {
        console.log(`Đang lọc theo nhà cung cấp: ${provider}`);

        filtered = filtered.filter(item => {
          if (!item || !item.providerId) return false;

          const providerName =
            typeof item.providerId === 'string'
              ? item.providerId
              : item.providerId?.fullName || '';
          return providerName === provider;
        });

        console.log(`Sau khi lọc nhà cung cấp: ${filtered.length} sản phẩm`);
      }

      // Sắp xếp sản phẩm: ưu tiên sản phẩm có tồn kho > 0
      filtered.sort((a, b) => {
        if (!a || !b) return 0;

        const aInventory = a.inventory || 0;
        const bInventory = b.inventory || 0;

        // Ưu tiên sản phẩm có tồn kho
        if (aInventory > 0 && bInventory === 0) return -1;
        if (aInventory === 0 && bInventory > 0) return 1;

        // Nếu cùng trạng thái tồn kho, sắp xếp theo tên
        return (a.name || '').localeCompare(b.name || '');
      });

      console.log(`Kết quả cuối cùng: ${filtered.length} sản phẩm`);
      return filtered;
    },
    [],
  );

  // Get unique categories from products
  const getUniqueCategories = useCallback(() => {
    const uniqueCategories = new Set<string>();
    store.products.forEach((product: any) => {
      const category =
        typeof product.category === 'string'
          ? product.category
          : product.category?.name;
      if (category) uniqueCategories.add(category);
    });
    return Array.from(uniqueCategories);
  }, [store.products]);

  // Get unique providers from products
  const getUniqueProviders = useCallback(() => {
    const uniqueProviders = new Set<string>();
    store.products.forEach((product: any) => {
      const provider =
        typeof product.providerId === 'string'
          ? product.providerId
          : product.providerId?.fullName;
      if (provider) uniqueProviders.add(provider);
    });
    return Array.from(uniqueProviders);
  }, [store.products]);

  // Combined categories from products and additional sources
  const productCategories = useMemo(() => {
    const uniqueCategories = getUniqueCategories();
    return uniqueCategories.length > 0
      ? uniqueCategories.map(cat => ({
          label: cat,
          value: cat,
        }))
      : [{label: 'Đang tải danh mục...', value: 'all'}];
  }, [getUniqueCategories]);

  // Combined providers from products and additional sources
  const productProviders = useMemo(() => {
    const uniqueProviders = getUniqueProviders();
    return uniqueProviders.length > 0
      ? uniqueProviders.map(provider => ({
          label: provider,
          value: provider,
        }))
      : [{label: 'Đang tải nhà cung cấp...', value: 'all'}];
  }, [getUniqueProviders]);

  // Danh sách products đã được lọc theo bộ lọc hiện tại
  const filteredProducts = useMemo(() => {
    // Nếu không có sản phẩm, trả về mảng rỗng
    if (!store.products || store.products.length === 0) {
      return [];
    }

    // Chuyển đổi MST array sang mảng JavaScript thông thường
    // Sử dụng JSON.parse(JSON.stringify()) để tạo bản sao sâu của dữ liệu
    // Điều này giúp đảm bảo dữ liệu được làm mới hoàn toàn và không bị ảnh hưởng bởi các tham chiếu
    const productsArray = JSON.parse(JSON.stringify(store.products));

    // Lọc sản phẩm theo các điều kiện
    const filtered = filterProducts(
      productsArray,
      searchText,
      selectedFilter,
      selectedProvider,
    );

    console.log('Lọc sản phẩm:', {
      tổng: store.products.length,
      sau_khi_lọc: filtered.length,
      từ_khóa: searchText,
      danh_mục: selectedFilter,
      nhà_cung_cấp: selectedProvider,
    });

    return filtered;
  }, [
    // Sử dụng JSON.stringify(store.products) thay vì store.products trực tiếp
    // Điều này đảm bảo useMemo sẽ tính toán lại khi nội dung của sản phẩm thay đổi
    // chứ không chỉ khi tham chiếu thay đổi
    JSON.stringify(store.products),
    searchText,
    selectedFilter,
    selectedProvider,
    filterProducts,
  ]);

  // Log dữ liệu để kiểm tra
  console.log('store.products:', store.products);
  console.log('filteredProducts:', filteredProducts);

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

  // Tải sản phẩm khi component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Tự động làm mới danh sách sản phẩm khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      console.log('Màn hình ProductScreen được focus - tải lại dữ liệu');
      // Tải lại dữ liệu mỗi khi màn hình được focus
      loadData();
      return () => {
        // Cleanup khi màn hình mất focus
      };
    }, []),
  );

  // Refresh products khi kéo xuống
  const onRefresh = useCallback(async () => {
    console.log('Đang làm mới danh sách sản phẩm...');
    setRefreshing(true);
    try {
      // Sử dụng taiLaiSanPham từ store để đảm bảo dữ liệu được làm mới hoàn toàn
      await taiLaiSanPham();
      // Sau đó tải lại dữ liệu bổ sung (danh mục, nhà cung cấp)
      await fetchCategoriesAndProviders();
      console.log('Đã làm mới danh sách sản phẩm thành công');
    } catch (error) {
      console.error('Lỗi khi làm mới dữ liệu:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategoriesAndProviders]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('loadData: Đang tải lại dữ liệu sản phẩm...');

      // Sử dụng taiLaiSanPham từ store để đảm bảo dữ liệu được làm mới hoàn toàn
      // Với cấu hình cache-busting để tránh cache
      await taiLaiSanPham();

      console.log(
        'loadData: Đã tải lại sản phẩm thành công, đang tải danh mục và nhà cung cấp...',
      );

      // Load categories and providers in parallel
      // Thêm timestamp để tránh cache
      const timestamp = Date.now();
      const cacheParams = `?_t=${timestamp}`;

      const [categoriesData, providersData] = await Promise.all([
        productAPI.fetchCategories(cacheParams),
        productAPI.fetchProviders(cacheParams),
      ]);

      // Format categories
      const formattedCategories = categoriesData.map(
        (cat: {name: string; _id: string}) => ({
          label: cat.name,
          value: cat._id,
        }),
      );
      setCategories(formattedCategories);

      // Format providers
      const formattedProviders = providersData.map(
        (provider: {fullName: string; _id: string}) => ({
          label: provider.fullName,
          value: provider._id,
        }),
      );
      setProviders(formattedProviders);

      console.log('loadData: Đã tải xong tất cả dữ liệu');
      setIsLoading(false);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedFilter('all');
    setSelectedProvider('all');
    setSearchText('');
    // Thêm các bộ lọc khác nếu có
  };

  // Toggle filter modal
  const toggleFilterModal = () => {
    setIsFilterModalVisible(!isFilterModalVisible);
  };

  const addToCart = (productId: string, variant?: any) => {
    const cartKey = variant ? `${productId}_${variant._id}` : productId;
    const newCartItems = {...cartItems};
    newCartItems[cartKey] = (newCartItems[cartKey] || 0) + 1;
    setCartItems(newCartItems);

    // Add detailed information to cart items
    const product = store.products.find(p => p._id === productId);
    if (product) {
      const existingItemIndex = cartItemsDetail.findIndex(
        item =>
          item.productId === productId &&
          (variant ? item.variantId === variant._id : !item.variantId),
      );

      if (existingItemIndex >= 0) {
        // Update existing cart item
        const updatedCartItems = [...cartItemsDetail];
        updatedCartItems[existingItemIndex].quantity += 1;
        setCartItemsDetail(updatedCartItems);
      } else {
        // Create a compatible CartItem object with safe type conversions
        const newCartItem: CartItem = {
          productId,
          variantId: variant ? variant._id : undefined,
          product: {
            _id: product._id,
            name: product.name,
            thumbnail: product.thumbnail || undefined,
            category:
              typeof product.category === 'string'
                ? {_id: product.category, name: product.category}
                : product.category || {_id: '', name: 'Không phân loại'},
            providerId:
              typeof product.providerId === 'string'
                ? {_id: product.providerId, fullName: product.providerId}
                : product.providerId || {_id: '', fullName: 'Không có'},
            status: product.status || 'available',
            hasVariants: !!product.hasVariants,
            price: product.price || 0,
            inventory: product.inventory || 0,
            warrantyPeriod: product.warrantyPeriod || 0,
            inventoryId: product.inventoryId || '',
            isPublished: true, // Default value to satisfy type
          },
          variant,
          quantity: 1,
          selected: true,
        };

        setCartItemsDetail([...cartItemsDetail, newCartItem]);
      }
    }

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
      setSelectedVariants({}); // Reset selected variants
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

  // Toggle variant selection
  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: !prev[variantId],
    }));
  };

  // Add multiple selected variants to cart
  const addSelectedVariantsToCart = () => {
    if (!selectedProduct) return;

    const selectedVariantIds = Object.keys(selectedVariants).filter(
      id => selectedVariants[id],
    );

    if (selectedVariantIds.length === 0) {
      // If no variants selected, show alert
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một biến thể');
      return;
    }

    // Add each selected variant to cart
    selectedVariantIds.forEach(variantId => {
      const variant = selectedProduct.detailsVariants.find(
        (v: any) => v._id === variantId,
      );
      if (variant) {
        addToCart(selectedProduct._id, variant);
      }
    });

    // Close the variant selection modal
    setVariantSelectionVisible(false);
  };

  // Update item quantity in the cart
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedCartItems = [...cartItemsDetail];
    const item = updatedCartItems[index];

    // Check inventory limit
    const inventoryLimit = item.variant
      ? item.variant.inventory || Infinity
      : item.product.inventory || Infinity;

    if (newQuantity > inventoryLimit) {
      Alert.alert('Thông báo', 'Số lượng không thể vượt quá tồn kho');
      return;
    }

    // Update in detailed cart
    updatedCartItems[index].quantity = newQuantity;
    setCartItemsDetail(updatedCartItems);

    // Update in simple cart
    const cartKey = item.variantId
      ? `${item.productId}_${item.variantId}`
      : item.productId;

    const newCartItems = {...cartItems};
    newCartItems[cartKey] = newQuantity;
    setCartItems(newCartItems);

    // Recalculate total
    const newTotal = Object.values(newCartItems).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
    setTotalCartItems(newTotal);
  };

  // Remove item from cart
  const removeFromCart = (index: number) => {
    const updatedCartItems = [...cartItemsDetail];
    const itemToRemove = updatedCartItems[index];

    // Remove from detailed cart
    updatedCartItems.splice(index, 1);
    setCartItemsDetail(updatedCartItems);

    // Remove from simple cart
    const cartKey = itemToRemove.variantId
      ? `${itemToRemove.productId}_${itemToRemove.variantId}`
      : itemToRemove.productId;

    const newCartItems = {...cartItems};
    delete newCartItems[cartKey];
    setCartItems(newCartItems);

    // Recalculate total
    const newTotal = Object.values(newCartItems).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
    setTotalCartItems(newTotal);

    // If cart is empty, close cart modal
    if (updatedCartItems.length === 0) {
      setCartModalVisible(false);
    }
  };

  // Toggle item selection for checkout
  const toggleItemSelection = (index: number) => {
    const updatedCartItems = [...cartItemsDetail];
    updatedCartItems[index].selected = !updatedCartItems[index].selected;
    setCartItemsDetail(updatedCartItems);
  };

  // Handle checkout with selected items
  const handleCheckout = () => {
    if (totalCartItems === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng đang trống');
      return;
    }

    // Open cart modal for selection
    setIsSelectingForCheckout(true);
    setCartModalVisible(true);

    // Initialize selection state based on current cart items
    const initialSelection = {};
    cartItemsDetail.forEach(item => {
      // Use a unique key combining product ID and variant ID if exists
      const itemKey = item.variantId
        ? `${item.productId}_${item.variantId}`
        : item.productId;

      // Default to selected
      initialSelection[itemKey] = true;
    });

    setCheckoutSelectedItems(initialSelection);
  };

  // Toggle selection of an item in the cart modal
  const toggleItemSelectionForCheckout = (item: CartItem) => {
    const itemKey = item.variantId
      ? `${item.productId}_${item.variantId}`
      : item.productId;

    setCheckoutSelectedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  // Check if an item is selected in the checkout modal
  const isItemSelectedForCheckout = (item: CartItem): boolean => {
    const itemKey = item.variantId
      ? `${item.productId}_${item.variantId}`
      : item.productId;

    return !!checkoutSelectedItems[itemKey];
  };

  // Process checkout after selecting items
  const processCheckout = () => {
    // Get selected items based on checkout selection state
    const selectedItems = cartItemsDetail.filter(item => {
      const itemKey = item.variantId
        ? `${item.productId}_${item.variantId}`
        : item.productId;

      return checkoutSelectedItems[itemKey];
    });

    if (selectedItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    // Convert to format expected by CreateOrderScreen
    const productsForOrder = selectedItems.map(item => {
      // Determine price based on variant or base product
      const price = item.variant ? item.variant.price : item.product.price;

      // Create attributes array from variant if exists
      let attributes: Array<{name: string; value: string | string[]}> = [];
      if (item.variant && item.variant.attributes) {
        // Handle attributes from MobX Map or regular object
        if (
          item.variant.attributes.entries &&
          typeof item.variant.attributes.entries === 'function'
        ) {
          // MobX Map
          for (const [key, value] of item.variant.attributes.entries()) {
            if (key !== '_id') {
              attributes.push({
                name: key,
                value: value,
              });
            }
          }
        } else if (typeof item.variant.attributes === 'object') {
          // Regular object
          Object.entries(item.variant.attributes).forEach(([key, value]) => {
            if (key !== '_id') {
              attributes.push({
                name: key,
                value: value as string,
              });
            }
          });
        }
      }

      return {
        _id: item.variantId
          ? `${item.productId}-${item.variantId}`
          : item.productId,
        originalProductId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        price: price,
        inventory: item.variant
          ? item.variant.inventory || 0
          : item.product.inventory || 0,
        quantity: item.quantity,
        thumbnail: item.product.thumbnail,
        attributes: attributes,
      };
    });

    // Navigate to CreateOrderScreen with selected products
    navigation.navigate(Screen.CREATEORDER, {
      selectedProducts: productsForOrder,
    });

    // Close cart modal
    setCartModalVisible(false);
    setIsSelectingForCheckout(false);
  };

  // Select all items in cart
  const selectAllItems = () => {
    const allSelected = {};
    cartItemsDetail.forEach(item => {
      const itemKey = item.variantId
        ? `${item.productId}_${item.variantId}`
        : item.productId;

      allSelected[itemKey] = true;
    });

    setCheckoutSelectedItems(allSelected);
  };

  // Deselect all items in cart
  const deselectAllItems = () => {
    const allDeselected = {};
    cartItemsDetail.forEach(item => {
      const itemKey = item.variantId
        ? `${item.productId}_${item.variantId}`
        : item.productId;

      allDeselected[itemKey] = false;
    });

    setCheckoutSelectedItems(allDeselected);
  };

  // Get number of selected items for checkout
  const getSelectedItemsCount = (): number => {
    return Object.values(checkoutSelectedItems).filter(Boolean).length;
  };

  const showProductDetails = (item: any) => {
    // Log dữ liệu gốc để debug
    console.log('=== DỮ LIỆU GỐC SẢN PHẨM ===');
    console.log(JSON.stringify(item, null, 2));

    // Tạo đối tượng để lưu thông tin chi tiết về biến thể
    const variantInfo =
      item.hasVariants && item.detailsVariants
        ? item.detailsVariants.map((variant: any, index: number) => {
            // Log từng biến thể để debug với định dạng đẹp hơn
            console.log(`=== CHI TIẾT BIẾN THỂ ${index} ===`);
            console.log(JSON.stringify(variant, null, 2));

            // Xử lý trường hợp attributes có thể là undefined, null, hoặc object
            const attributesObj: Record<string, string> = {};
            let variantNameStr = '';

            // Kiểm tra cấu trúc của biến thể
            console.log(
              `Các key trong biến thể ${index}:`,
              Object.keys(variant),
            );

            // Vấn đề chính: Có sự khác biệt giữa mô hình trong product.ts và dữ liệu thực tế từ API
            // Mô hình mong đợi variantDetails, nhưng dữ liệu thực tế có attributes

            // Trường hợp 1: Biến thể có trường attributes
            if (variant.attributes) {
              console.log(
                `Tìm thấy trường attributes trong biến thể ${index}:`,
                variant.attributes,
              );

              // Kiểm tra nếu attributes là MobX Map (có phương thức entries, keys, get)
              if (
                variant.attributes.entries &&
                typeof variant.attributes.entries === 'function'
              ) {
                try {
                  // Đây là MobX Map
                  // Sử dụng toán tử as để đảm bảo TypeScript hiểu đây là MobX Map
                  const mobxMap = variant.attributes as {
                    keys: () => IterableIterator<string>;
                    get: (key: string) => string;
                  };

                  // Lấy danh sách các key
                  const keys: string[] = [];
                  for (const key of mobxMap.keys()) {
                    keys.push(key);
                  }
                  console.log(`Các key trong MobX Map attributes:`, keys);

                  // Tạo object từ MobX Map
                  for (const key of keys) {
                    const value = mobxMap.get(key);
                    if (typeof value === 'string') {
                      attributesObj[key] = value;
                    }
                  }

                  // Tạo tên biến thể từ attributes
                  const nameFragments: string[] = [];
                  for (const key of keys) {
                    if (key !== '_id') {
                      const value = mobxMap.get(key);
                      nameFragments.push(`${key}: ${value}`);
                    }
                  }
                  variantNameStr = nameFragments.join(', ');
                } catch (error) {
                  console.error('Lỗi khi xử lý MobX Map:', error);
                }
              }
              // Nếu attributes là object thông thường
              else if (
                typeof variant.attributes === 'object' &&
                variant.attributes !== null
              ) {
                try {
                  // Sao chép các thuộc tính từ object
                  Object.entries(variant.attributes).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                      attributesObj[key] = value;
                    }
                  });

                  // Tạo tên biến thể từ attributes
                  variantNameStr = Object.entries(attributesObj)
                    .filter(([key, value]) => key !== '_id' && value) // Loại bỏ _id và các giá trị null/undefined
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                } catch (error) {
                  console.error('Lỗi khi xử lý attributes object:', error);
                }
              }
            }

            // Trường hợp 2: Biến thể có trường variantDetails (theo mô hình product.ts)
            if (
              !variantNameStr &&
              variant.variantDetails &&
              Array.isArray(variant.variantDetails)
            ) {
              console.log(
                `Tìm thấy trường variantDetails trong biến thể ${index}:`,
                variant.variantDetails,
              );

              try {
                // Tạo tên biến thể từ variantDetails
                const details = variant.variantDetails.filter(
                  (detail: any) => detail && detail.value,
                );
                if (details.length > 0) {
                  variantNameStr = details
                    .map((detail: any) => detail.value)
                    .join(', ');
                }
              } catch (error) {
                console.error('Lỗi khi xử lý variantDetails:', error);
              }
            }

            // Trường hợp 3: Thuộc tính được lưu trực tiếp trong biến thể
            if (!variantNameStr) {
              // Danh sách các key cần loại trừ (không phải thuộc tính)
              const excludedKeys = [
                'price',
                'original_price',
                'inventory',
                '_id',
                'attributes',
                'variantDetails',
                '__v',
              ];

              try {
                // Kiểm tra cụ thể các trường hợp đặc biệt
                const variantAny = variant as any;

                if (variantAny['Loại Máy'] || variantAny['Chất Liệu']) {
                  console.log(
                    `Tìm thấy thuộc tính trực tiếp trong biến thể ${index}`,
                  );

                  if (variantAny['Loại Máy']) {
                    attributesObj['Loại Máy'] = variantAny['Loại Máy'];
                    variantNameStr +=
                      (variantNameStr ? ', ' : '') +
                      `Loại Máy: ${variantAny['Loại Máy']}`;
                  }

                  if (variantAny['Chất Liệu']) {
                    attributesObj['Chất Liệu'] = variantAny['Chất Liệu'];
                    variantNameStr +=
                      (variantNameStr ? ', ' : '') +
                      `Chất Liệu: ${variantAny['Chất Liệu']}`;
                  }
                } else {
                  // Thu thập tất cả các key không phải là thuộc tính hệ thống
                  Object.keys(variant).forEach(key => {
                    if (
                      !excludedKeys.includes(key) &&
                      typeof variantAny[key] === 'string'
                    ) {
                      const attrValue = variantAny[key];
                      attributesObj[key] = attrValue;
                      variantNameStr +=
                        (variantNameStr ? ', ' : '') + `${key}: ${attrValue}`;
                    }
                  });
                }
              } catch (error) {
                console.error('Lỗi khi xử lý thuộc tính trực tiếp:', error);
              }
            }

            // Trường hợp 4: Sử dụng các thuộc tính đặc biệt nếu có

            // Trường hợp 4: Sử dụng các thuộc tính đặc biệt nếu có
            if (!variantNameStr && variant._id) {
              variantNameStr = `ID: ${variant._id}`;
            }

            // Nếu vẫn không có tên biến thể
            if (!variantNameStr) {
              variantNameStr = 'Biến thể không tên';
            }

            // Log kết quả xử lý biến thể
            console.log(`Kết quả xử lý biến thể ${index}:`, {
              attributes: attributesObj,
              variantName: variantNameStr,
            });

            return {
              attributes: attributesObj,
              price: variant.price || 0,
              original_price: variant.original_price || 0,
              quantity: variant.inventory || 0,
              _id: variant._id || '',
              variantName: variantNameStr || 'Biến thể không tên',
            };
          })
        : [];

    // Tính tổng số lượng hàng tồn kho
    const totalInventory =
      item.hasVariants && item.detailsVariants
        ? item.detailsVariants.reduce(
            (sum: number, variant: any) => sum + (variant.inventory || 0),
            0,
          )
        : item.inventory || 0;

    // Tạo đối tượng provider chi tiết
    const providerDetail =
      typeof item.providerId === 'string'
        ? {id: item.providerId, name: item.providerId}
        : {id: item.providerId?._id, name: item.providerId?.fullName};

    // Tạo đối tượng category chi tiết
    const categoryDetail =
      typeof item.category === 'string'
        ? {id: item.category, name: item.category}
        : {id: item.category?._id, name: item.category?.name};

    // Tạo object chi tiết sản phẩm để log
    const productDetails = {
      id: item._id,
      inventoryId: item.inventoryId,
      product_code: item.product_code,
      name: item.name,
      category: categoryDetail,
      provider: providerDetail,
      hasVariants: item.hasVariants,
      basePrice: item.price,
      original_price: item.original_price,
      totalInventory: totalInventory,
      status: item.status,
      isPublished: item.isPublished,
      warrantyPeriod: item.warrantyPeriod,
      thumbnail: item.thumbnail,
      variants: variantInfo,
      batchInfo: item.batch_info || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      viewedAt: new Date().toISOString(),
      viewedBy: 'user', // Có thể thay thế bằng thông tin người dùng thực tế nếu có
      deviceInfo: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        isTablet: Dimensions.get('window').width > 768,
      },
    };

    // Log chi tiết sản phẩm với định dạng đẹp hơn
    console.log('=== CHI TIẾT SẢN PHẨM ===');
    console.log(JSON.stringify(productDetails, null, 2));

    setSelectedProduct(item);
    setModalVisible(true);
  };

  const getVariantName = (variant: any) => {
    if (!variant || !variant.attributes) {
      return '';
    }
    // Xử lý trường hợp attributes là object
    if (typeof variant.attributes === 'object' && variant.attributes !== null) {
      // Chuyển đổi object attributes thành chuỗi dạng "key: value, key2: value2"
      return Object.entries(variant.attributes)
        .filter(([key, value]) => key !== '_id' && value) // Loại bỏ _id và các giá trị null/undefined
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    return '';
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://10.0.2.2:5000/api/products/json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('API /products/json data:', data);

      if (data.status === 'Ok' && data.data) {
        if (Array.isArray(data.data)) {
          setProducts(data.data);
          console.log('setProducts with array:', data.data);
        } else if (data.data.productsWithPriceAndInventory) {
          setProducts(data.data.productsWithPriceAndInventory);
          console.log(
            'setProducts with productsWithPriceAndInventory:',
            data.data.productsWithPriceAndInventory,
          );
        } else {
          setProducts([]);
          console.log('setProducts with empty array');
        }
      } else {
        throw new Error(data.message || 'Không thể lấy danh sách sản phẩm');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Hàm lấy giá bán hiển thị
  const getDisplayPrice = (item: any) => {
    if (
      item.hasVariants &&
      Array.isArray(item.detailsVariants) &&
      item.detailsVariants.length > 0
    ) {
      return Math.min(...item.detailsVariants.map((v: any) => v.price));
    }
    return item.price;
  };

  // Format currency display
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
  };

  const renderItem = ({item, index}: {item: Product; index: number}) => {
    // Kiểm tra item có hợp lệ không
    if (!item) {
      console.warn('renderItem nhận item không hợp lệ:', item);
      return null;
    }

    // Chỉ hiển thị sản phẩm đã có giá bán (price > 0)
    if (!item.price || item.price <= 0) {
      return null;
    }

    const hasVariants =
      item.hasVariants && item.variantDetails && item.variantDetails.length > 0;
    const totalInventory = hasVariants
      ? item.variantDetails?.reduce((sum, v) => sum + v.quantity, 0)
      : item.inventory;

    const getImageSource = (): any => {
      if (!item.thumbnail) return Images.PLACEHOLDER;

      // Nếu là URL đầy đủ
      if (item.thumbnail.startsWith('http')) {
        return {uri: item.thumbnail};
      }

      // Nếu là đường dẫn tương đối từ backend
      if (item.thumbnail.startsWith('/')) {
        return {uri: `${getServerBaseUrl()}${item.thumbnail}`};
      }

      return Images.PLACEHOLDER;
    };

    const imageSource = getImageSource();
    const categoryName =
      typeof item.category === 'string'
        ? item.category
        : item.category?.name || 'Không phân loại';

    // Grid view rendering
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={[
            styles.gridItem,
            // {
            //   marginRight: (index + 1) % 3 !== 0 ? scaleWidth(8) : 0,
            // },
          ]}
          onPress={() => showProductDetails(item)}>
          <View style={styles.gridImageContainer}>
            {imageSource ? (
              <AsyncImage
                source={imageSource}
                style={styles.gridImage}
                loadingColor={color.primaryColor}
                retryable={true}
              />
            ) : (
              <View style={[styles.gridImage, styles.noImageContainer]}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
              </View>
            )}

            {/* Display inventory badge on top of image */}
            <View style={styles.inventoryBadge}>
              <DynamicText style={styles.inventoryBadgeText}>
                {(totalInventory || 0) > 0
                  ? `Còn: ${totalInventory || 0}`
                  : 'Hết hàng'}
              </DynamicText>
            </View>
          </View>

          <View style={styles.gridDetails}>
            <View style={styles.gridCategoryRow}>
              <DynamicText style={styles.categoryText} numberOfLines={1}>
                {categoryName}
              </DynamicText>
            </View>

            <DynamicText style={styles.gridProductName} numberOfLines={2}>
              {item.name}
            </DynamicText>

            <View style={styles.gridPriceRow}>
              {hasVariants &&
              Array.isArray((item as any).detailsVariants) &&
              (item as any).detailsVariants.length > 0 ? (
                <Text style={styles.priceText}>
                  {formatCurrency(
                    Math.min(
                      ...((item as any).detailsVariants as any[]).map(
                        (v: any) => v.price,
                      ),
                    ),
                  )}
                  <Text style={styles.variantText}>
                    {' '}
                    ({(item as any).detailsVariants.length} biến thể)
                  </Text>
                </Text>
              ) : (
                <DynamicText style={styles.priceText}>
                  {formatCurrency(getDisplayPrice(item))}
                </DynamicText>
              )}

              <TouchableOpacity
                style={styles.addToCartGridButton}
                onPress={e => handleAddToCartClick(item, e)}>
                <Add
                  size={20}
                  color={color.accentColor.whiteColor}
                  variant="Linear"
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // List view rendering
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => showProductDetails(item)}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={styles.productImageContainer}>
            {imageSource ? (
              <FastImage
                source={imageSource}
                style={styles.productImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.productImage, styles.noImageContainer]}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
              </View>
            )}
          </View>

          <View style={styles.productDetails}>
            <View style={styles.productHeader}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            <Text style={styles.categoryText}>{categoryName}</Text>

            <View style={styles.productFooter}>
              {hasVariants &&
              Array.isArray((item as any).detailsVariants) &&
              (item as any).detailsVariants.length > 0 ? (
                <View>
                  <Text style={styles.variantText}>
                    {(item as any).detailsVariants.length} biến thể
                  </Text>
                  <Text style={styles.priceText}>
                    Từ:{' '}
                    {formatCurrency(
                      Math.min(
                        ...((item as any).detailsVariants as any[]).map(
                          (v: any) => v.price,
                        ),
                      ),
                    )}
                  </Text>
                </View>
              ) : (
                <Text style={styles.priceText}>
                  {formatCurrency(getDisplayPrice(item))}
                </Text>
              )}

              <View style={styles.inventoryAndButtonContainer}>
                <DynamicText style={styles.inventoryText}>
                  Còn: {totalInventory}
                </DynamicText>
                <TouchableOpacity
                  style={styles.addToCartListButton}
                  onPress={e => handleAddToCartClick(item, e)}>
                  <Ionicons name="add-circle" size={28} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp</Text>
    </View>
  );

  // Check if a variant is already in the cart
  const isVariantInCart = (productId: string, variantId?: string): boolean => {
    const cartKey = variantId ? `${productId}_${variantId}` : productId;
    return cartItems[cartKey] > 0;
  };

  return (
    <BaseLayout style={styles.container}>
      {/* Header Title */}
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

        {totalCartItems > 0 && (
          <TouchableOpacity
            style={styles.headerCartButton}
            onPress={() => setCartModalVisible(true)}>
            <ShoppingCart
              size={20}
              color={color.accentColor.whiteColor}
              variant="Bold"
            />
            <View style={styles.headerCartBadge}>
              <DynamicText style={styles.headerCartBadgeText}>
                {totalCartItems}
              </DynamicText>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* REMOVE Checkout Button Below Search/Filter */}
      {/* Old floating checkout button code removed */}

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
              key={viewMode} // Force re-render when view mode changes
              data={filteredProducts as any}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              numColumns={viewMode === 'grid' ? 3 : 1}
              contentContainerStyle={[
                styles.productList,
                {paddingBottom: moderateScale(120)},
                viewMode === 'grid' && styles.gridList,
              ]}
              columnWrapperStyle={
                viewMode === 'grid' ? styles.columnWrapper : undefined
              }
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
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.filterModalContent,
              isTablet ? styles.tabletFilterModalContent : null,
            ]}>
            {/* Modal Header */}
            <View style={styles.filterModalHeader}>
              <DynamicText style={styles.filterModalTitle}>
                Lọc sản phẩm
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
            <ScrollView
              style={styles.filterScrollView}
              showsVerticalScrollIndicator={false}>
              {/* Bộ lọc danh mục */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Category2
                    size={20}
                    color={color.primaryColor}
                    variant="Bold"
                  />
                  <DynamicText style={styles.filterSectionTitle}>
                    Danh mục
                  </DynamicText>
                </View>
                <SelectDropdown
                  options={[
                    {label: 'Tất cả danh mục', value: 'all'},
                    ...productCategories,
                  ]}
                  selectedValue={selectedFilter}
                  onSelect={value => setSelectedFilter(value)}
                  placeholder="Chọn danh mục"
                />
              </View>

              {/* Bộ lọc nhà cung cấp */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Profile2User
                    size={20}
                    color={color.primaryColor}
                    variant="Bold"
                  />
                  <DynamicText style={styles.filterSectionTitle}>
                    Nhà cung cấp
                  </DynamicText>
                </View>
                <SelectDropdown
                  options={[
                    {label: 'Tất cả nhà cung cấp', value: 'all'},
                    ...productProviders,
                  ]}
                  selectedValue={selectedProvider}
                  onSelect={value => setSelectedProvider(value)}
                  placeholder="Chọn nhà cung cấp"
                />
              </View>

              {/* Tùy chọn hiển thị */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={color.primaryColor}
                  />
                  <DynamicText style={styles.filterSectionTitle}>
                    Tùy chọn hiển thị
                  </DynamicText>
                </View>
                <TouchableOpacity
                  style={styles.filterOptionRow}
                  onPress={() => {}}>
                  <View style={styles.checkboxContainer}>
                    <TickSquare
                      size={20}
                      color={color.primaryColor}
                      variant="Bold"
                    />
                  </View>
                  <DynamicText style={styles.optionText}>
                    Chỉ hiển thị sản phẩm có tồn kho
                  </DynamicText>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Filter Action Buttons */}
            <View style={styles.filterModalFooter}>
              <Button
                buttonContainerStyle={styles.resetFiltersButton}
                onPress={resetFilters}
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

      {/* Product Detail Modal */}
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
                  Chọn biến thể muốn thêm vào giỏ hàng:
                </Text>

                <ScrollView
                  style={[styles.variantList]}
                  showsVerticalScrollIndicator={false}>
                  {selectedProduct.detailsVariants &&
                    selectedProduct.detailsVariants.map(
                      (variant: any, index: number) => {
                        const isSelected =
                          selectedVariants[variant._id] === true;
                        const isAlreadyInCart = isVariantInCart(
                          selectedProduct._id,
                          variant._id,
                        );
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.variantSelectItem,
                              isSelected && styles.selectedVariantItem,
                              isAlreadyInCart && styles.variantAlreadyInCart,
                            ]}
                            onPress={() => toggleVariantSelection(variant._id)}>
                            <View style={styles.variantSelectInfo}>
                              <Text style={styles.variantSelectName}>
                                {getVariantName(variant)}
                              </Text>
                              <Text style={styles.variantSelectPrice}>
                                {variant.price.toLocaleString('vi-VN')} đ
                              </Text>
                              {isAlreadyInCart && (
                                <View style={styles.alreadyInCartIndicator}>
                                  <TickSquare
                                    size={14}
                                    color="#4CD964"
                                    variant="Bold"
                                  />
                                  <Text style={styles.alreadyInCartText}>
                                    Đã có trong giỏ hàng
                                  </Text>
                                </View>
                              )}
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
                            {isSelected && (
                              <View style={styles.selectedVariantCheckmark}>
                                <TickSquare
                                  size={18}
                                  color="#FFFFFF"
                                  variant="Bold"
                                />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      },
                    )}
                </ScrollView>

                <View style={styles.variantButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cancelVariantButton}
                    onPress={() => {
                      setVariantSelectionVisible(false);
                      setSelectedVariants({});
                    }}>
                    <Text style={styles.cancelButtonText}>Huỷ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addVariantToCartButton}
                    onPress={addSelectedVariantsToCart}>
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

      {/* Cart Modal for Checkout */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cartModalVisible}
        onRequestClose={() => setCartModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              styles.cartModalContent,
              isTablet && styles.tabletCartModal,
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isSelectingForCheckout
                  ? 'Chọn sản phẩm để thanh toán'
                  : 'Giỏ hàng'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setCartModalVisible(false);
                  setIsSelectingForCheckout(false);
                }}>
                <CloseCircle size={24} color="#666" variant="Bold" />
              </TouchableOpacity>
            </View>

            {cartItemsDetail.length === 0 ? (
              <View style={styles.emptyCartContainer}>
                <Ionicons name="cart-outline" size={64} color="#ccc" />
                <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
              </View>
            ) : (
              <>
                {isSelectingForCheckout && (
                  <View style={styles.selectionControls}>
                    <Text style={styles.selectedCountText}>
                      Đã chọn: {getSelectedItemsCount()}/
                      {cartItemsDetail.length} sản phẩm
                    </Text>
                    <View style={styles.selectionButtons}>
                      <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={selectAllItems}>
                        <Text style={styles.selectButtonText}>Chọn tất cả</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deselectAllButton}
                        onPress={deselectAllItems}>
                        <Text style={styles.selectButtonText}>
                          Bỏ chọn tất cả
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <FlatList
                  data={cartItemsDetail}
                  keyExtractor={(item, index) => `cart_item_${index}`}
                  renderItem={({item, index}) => (
                    <View style={styles.cartItemContainer}>
                      {isSelectingForCheckout && (
                        <TouchableOpacity
                          style={styles.checkboxContainer}
                          onPress={() => toggleItemSelectionForCheckout(item)}>
                          <View
                            style={[
                              styles.checkbox,
                              isItemSelectedForCheckout(item) &&
                                styles.checkboxSelected,
                            ]}>
                            {isItemSelectedForCheckout(item) && (
                              <TickSquare
                                size={16}
                                color="#FFFFFF"
                                variant="Bold"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      )}

                      {item.product.thumbnail ? (
                        <Image
                          source={{uri: item.product.thumbnail}}
                          style={styles.cartItemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.cartItemImage,
                            styles.noImageContainer,
                          ]}>
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color="#ccc"
                          />
                        </View>
                      )}

                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {item.product.name}
                        </Text>

                        {item.variant && (
                          <Text
                            style={styles.cartItemVariant}
                            numberOfLines={1}>
                            {getVariantName(item.variant)}
                          </Text>
                        )}

                        <Text style={styles.cartItemPrice}>
                          {(item.variant
                            ? item.variant.price
                            : item.product.price
                          ).toLocaleString('vi-VN')}
                          đ
                        </Text>

                        <View style={styles.cartItemActions}>
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() =>
                                updateCartItemQuantity(index, item.quantity - 1)
                              }>
                              <Ionicons
                                name="remove"
                                size={16}
                                color="#007AFF"
                              />
                            </TouchableOpacity>

                            <Text style={styles.cartItemQuantity}>
                              {item.quantity}
                            </Text>

                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() =>
                                updateCartItemQuantity(index, item.quantity + 1)
                              }>
                              <Ionicons name="add" size={16} color="#007AFF" />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.removeItemButton}
                            onPress={() => removeFromCart(index)}>
                            <CloseCircle
                              size={20}
                              color="#FF3B30"
                              variant="Bold"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.cartItemsList}
                />

                <View style={styles.cartSummaryContainer}>
                  <View style={styles.cartTotalRow}>
                    <Text style={styles.cartTotalLabel}>Tổng số lượng:</Text>
                    <Text style={styles.cartTotalValue}>
                      {totalCartItems} sản phẩm
                    </Text>
                  </View>

                  <View style={styles.cartTotalRow}>
                    <Text style={styles.cartTotalLabel}>Tạm tính:</Text>
                    <Text style={styles.cartTotalValue}>
                      {cartItemsDetail
                        .reduce(
                          (sum, item) =>
                            sum +
                            (item.variant
                              ? item.variant.price
                              : item.product.price) *
                              item.quantity,
                          0,
                        )
                        .toLocaleString('vi-VN')}
                      đ
                    </Text>
                  </View>
                </View>

                {isSelectingForCheckout ? (
                  <TouchableOpacity
                    style={[
                      styles.checkoutButton,
                      getSelectedItemsCount() === 0 && styles.disabledButton,
                    ]}
                    onPress={processCheckout}
                    disabled={getSelectedItemsCount() === 0}>
                    <ShoppingCart size={24} color="#FFFFFF" variant="Bold" />
                    <Text style={styles.checkoutButtonText}>
                      Xác nhận thanh toán ({getSelectedItemsCount()})
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}>
                    <ShoppingCart size={24} color="#FFFFFF" variant="Bold" />
                    <Text style={styles.checkoutButtonText}>
                      Tiến hành thanh toán
                    </Text>
                  </TouchableOpacity>
                )}
              </>
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
    fontFamily: Fonts.Inter_SemiBold,
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

  // Search and filter styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
    zIndex: 10,
    alignItems: 'center',
    marginBottom: moderateScale(28),
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
    fontFamily: Fonts.Inter_SemiBold,
  },

  // Product list styles
  productList: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(120),
    flexGrow: 1,
    backgroundColor: '#F5F7FA',
  },
  gridList: {},
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: moderateScale(10),
  },

  // Grid view styles
  gridItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(28),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    width: `${100 / 3 - 2}%`,
  },
  gridImageContainer: {
    width: '100%',
    height: scaleWidth(120),
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  gridDetails: {
    padding: scaleWidth(8),
  },
  gridProductName: {
    fontSize: scaledSize(22),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginVertical: moderateScale(4),
  },
  addToCartGridButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: color.primaryColor,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  inventoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inventoryBadgeText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(8),
    fontFamily: Fonts.Inter_Regular,
  },
  gridCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },

  // List view styles
  listItem: {
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(16),
    padding: scaleWidth(10),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  productImageContainer: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: moderateScale(6),
    marginRight: scaleWidth(12),
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(6),
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: scaledSize(22),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    flex: 1,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(4),
  },
  inventoryAndButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartListButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Common styles
  categoryText: {
    fontSize: moderateScale(10),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(4),
  },
  priceText: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  inventoryText: {
    fontSize: scaledSize(16),
    color: '#666',
    fontFamily: Fonts.Inter_Regular,
  },
  variantText: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  noImageContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Checkout button styles
  checkoutButtonWrapperFixed: {
    width: '100%',
    alignItems: 'center',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(10),
    zIndex: 1,
  },
  checkoutButtonFullFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    position: 'relative',
  },
  checkoutButtonTextFullFixed: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_SemiBold,
    marginLeft: moderateScale(8),
    marginRight: moderateScale(8),
  },
  cartBadgeFullFixed: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: '#FF3B30',
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeTextFullFixed: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(10),
    fontFamily: Fonts.Inter_Bold,
  },
  floatingCheckoutContainer: {
    width: '100%',
    marginTop: moderateScale(28),
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

  // Existing modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '50%',
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
  selectedOptionItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  optionText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  selectedOptionText: {
    fontWeight: '500',
    color: color.primaryColor,
  },
  optionsTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedOptionItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  optionText: {
    fontSize: moderateScale(12),
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

  addToCartBtn: {
    backgroundColor: color.primaryColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  addToCartBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: moderateScale(12),
    color: '#666',
    marginLeft: 4,
  },

  headerTitleWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  headerTitleText: {
    fontSize: moderateScale(24),
    fontFamily: Fonts.Inter_Bold,
    color: color.accentColor.darkColor,
    textAlign: 'center',
  },
  cartModalContent: {
    width: '95%',
    maxHeight: '90%',
    padding: moderateScale(16),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  cartItemsList: {
    flexGrow: 1,
  },
  cartItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  checkboxContainer: {
    marginRight: moderateScale(10),
  },
  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: color.primaryColor,
  },
  cartItemImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(10),
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  cartItemVariant: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(2),
  },
  cartItemPrice: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginTop: moderateScale(4),
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(8),
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQuantity: {
    fontSize: moderateScale(14),
    fontFamily: fonts.Inter_Medium,
    paddingHorizontal: moderateScale(10),
  },
  removeItemButton: {
    padding: moderateScale(5),
  },
  cartSummaryContainer: {
    marginTop: moderateScale(16),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  cartTotalLabel: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_Regular,
  },
  cartTotalValue: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  tabletCartModal: {
    width: '70%',
    maxWidth: moderateScale(600),
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyCartText: {
    fontSize: moderateScale(16),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
  },
  variantItemInCart: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderColor: color.primaryColor,
  },
  addedVariantIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  addedVariantText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_Regular,
    color: '#4CD964',
    marginRight: moderateScale(4),
  },
  variantAlreadyInCart: {
    borderColor: '#4CD964',
    borderWidth: 1,
  },
  alreadyInCartIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  alreadyInCartText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_Regular,
    color: '#4CD964',
    marginLeft: moderateScale(4),
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  // Add these new styles for cart multi-selection
  selectionControls: {
    marginBottom: moderateScale(10),
    padding: moderateScale(10),
    backgroundColor: 'rgba(0,122,255,0.05)',
    borderRadius: moderateScale(8),
  },
  selectedCountText: {
    fontSize: moderateScale(14),
    fontFamily: fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectAllButton: {
    backgroundColor: color.primaryColor,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(4),
  },
  deselectAllButton: {
    backgroundColor: color.accentColor.grayColor,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(4),
  },
  selectButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(12),
    fontFamily: fonts.Inter_SemiBold,
  },

  filterModalContent: {
    width: '90%',
    maxWidth: moderateScale(800),
    maxHeight: '75%',
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
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  checkboxContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(10),
    gap: moderateScale(12),
  },
  optionText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: moderateScale(16),
    paddingBottom: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: color.accentColor.whiteColor,
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
    color: color.accentColor.darkColor,
  },
  applyFiltersButton: {
    flex: 2,
    backgroundColor: color.primaryColor,
    height: scaleHeight(100),
  },
  applyFiltersText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.whiteColor,
  },

  // New cart button in header
  headerCartButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: moderateScale(8),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    minWidth: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  headerCartBadgeText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(10),
    textAlign: 'center',
    fontFamily: Fonts.Inter_SemiBold,
  },
  tabletFilterModalContent: {
    width: '60%',
    maxWidth: moderateScale(450),
  },
});
