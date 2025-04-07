import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextStyle,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  BaseLayout,
  Header,
  Button,
  DynamicText,
  Input,
} from '../../../components';
import {
  SearchNormal1,
  Scan,
  ShoppingCart,
  TickCircle,
} from 'iconsax-react-native';
import {create} from 'apisauce';
import {ApiEndpoint} from '../../../services/api/api-endpoint';
import {Screen} from '../../../navigation/navigation.type';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import AsyncImage from '../../bottomTab/Product/AsyncImage';
import {Fonts} from '../../../assets';

interface ProductVariant {
  _id: string;
  variantId?: string;
  name: string;
  thumbnail: string;
  price: number;
  inventory: number;
  attributes: Array<{name: string; value: string}>;
  quantity: number;
  isVariant: boolean;
}

interface RouteParams {
  selectedProducts?: ProductVariant[];
}

interface ApiResponse {
  data?: any;
}

const ChooseOrderProduct = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const routeParams = route.params as RouteParams;

  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<ProductVariant[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductVariant[]>(
    [],
  );
  const [selectedProducts, setSelectedProducts] = useState<ProductVariant[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Initialize selected products from route params if available
  useEffect(() => {
    if (routeParams?.selectedProducts) {
      setSelectedProducts(routeParams.selectedProducts);
    }

    fetchProducts();
  }, [routeParams]);

  // Filter products when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query),
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Create API instance
      const api = create({
        baseURL: 'http://10.0.2.2:5000/',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      // Fetch products with variants
      const response = await api.get<ApiResponse>(ApiEndpoint.PRODUCTS);

      if (response.ok && response.data) {
        const products = response.data?.data || [];

        // Process products to include variants as separate selectable items
        const processedProducts: ProductVariant[] = [];

        products.forEach((product: any) => {
          if (
            product.hasVariants &&
            product.detailsVariants &&
            product.detailsVariants.length > 0
          ) {
            // For products with variants, create a separate item for each variant
            product.detailsVariants.forEach((variant: any) => {
              // Kiểm tra và bỏ qua nếu số lượng tồn kho = 0
              if (variant.inventory <= 0) {
                return;
              }

              // Format variant attributes for display
              const attributes = variant.variantDetails.map((detail: any) => ({
                name: '', // Will be populated when we fetch variant info
                value: detail.value,
              }));

              // Add this variant as a selectable product
              processedProducts.push({
                _id: product._id, // Sử dụng ID sản phẩm chính
                variantId: variant._id, // Lưu ID biến thể riêng biệt
                name: product.name,
                thumbnail: product.thumbnail,
                price: variant.price,
                inventory: variant.inventory,
                attributes,
                quantity: 1, // Default quantity
                isVariant: true,
              });
            });
          } else {
            // For products without variants
            // Kiểm tra và bỏ qua nếu số lượng tồn kho = 0
            if (product.inventory <= 0) {
              return;
            }

            processedProducts.push({
              _id: product._id,
              name: product.name,
              thumbnail: product.thumbnail,
              price: product.price,
              inventory: product.inventory,
              attributes: [],
              quantity: 1, // Default quantity
              isVariant: false,
            });
          }
        });

        console.log(
          `Đã lọc ${
            products.length - processedProducts.length
          } sản phẩm hết hàng`,
        );
        setAllProducts(processedProducts);
        setFilteredProducts(processedProducts);
      } else {
        console.error('Failed to fetch products:', response.problem);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product: ProductVariant) => {
    // Kiểm tra sản phẩm có trong danh sách đã chọn không
    // So sánh cả ID sản phẩm và ID biến thể (nếu có)
    const isSelected = selectedProducts.some(
      p =>
        p._id === product._id &&
        ((!p.variantId && !product.variantId) ||
          p.variantId === product.variantId),
    );

    if (isSelected) {
      // Xóa sản phẩm khỏi danh sách đã chọn
      setSelectedProducts(
        selectedProducts.filter(
          p =>
            !(
              p._id === product._id &&
              ((!p.variantId && !product.variantId) ||
                p.variantId === product.variantId)
            ),
        ),
      );
    } else {
      // Thêm sản phẩm vào danh sách đã chọn
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const isProductSelected = (product: ProductVariant) => {
    // Kiểm tra sản phẩm đã được chọn hay chưa
    // So sánh cả ID sản phẩm và ID biến thể (nếu có)
    return selectedProducts.some(
      p =>
        p._id === product._id &&
        ((!p.variantId && !product.variantId) ||
          p.variantId === product.variantId),
    );
  };

  const handleComplete = () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    // Navigate back to CreateOrderScreen with selected products
    navigation.navigate(Screen.CREATEORDER, {selectedProducts});
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
  };

  const renderVariantDetails = (
    attributes: Array<{name: string; value: string}>,
  ) => {
    if (!attributes || attributes.length === 0) return null;

    // Hiển thị chi tiết biến thể rõ ràng hơn
    return (
      <DynamicText style={styles.variantText}>
        {attributes.map(attr => `${attr.value}`).join(' | ')}
      </DynamicText>
    );
  };

  const renderProductItem = ({item}: {item: ProductVariant}) => {
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isProductSelected(item) && styles.selectedProductItem,
        ]}
        onPress={() => toggleProductSelection(item)}>
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              isProductSelected(item) && styles.checkedCheckbox,
            ]}>
            {isProductSelected(item) && (
              <TickCircle size={16} color="#fff" variant="Bold" />
            )}
          </View>
        </View>

        <AsyncImage
          source={{uri: item.thumbnail || 'https://via.placeholder.com/80'}}
          style={styles.productImage}
        />

        <View style={styles.productDetails}>
          <DynamicText style={styles.productName}>{item.name}</DynamicText>
          {renderVariantDetails(item.attributes)}
          <DynamicText style={styles.productPrice}>
            {formatCurrency(item.price)}
          </DynamicText>
          <DynamicText style={styles.inventory}>
            Tồn kho: {item.inventory}
          </DynamicText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BaseLayout>
      <Header
        title="Chọn sản phẩm"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <Input
            inputType="default"
            placeholderText="Nhập từ khóa tìm kiếm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            showClearIcon={true}
            StartIcon={
              <SearchNormal1 size={20} color={color.accentColor.grayColor} />
            }
            inputContainerStyle={styles.searchInputContainer}
            inputStyle={styles.searchInputStyle as TextStyle}
          />
        </View>

        <TouchableOpacity style={styles.scanButton}>
          <Scan size={20} color={color.primaryColor} variant="Bold" />
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={color.primaryColor}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item =>
            item.variantId ? `${item._id}-${item.variantId}` : item._id
          }
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShoppingCart size={60} color="#ddd" variant="Bold" />
              <DynamicText style={styles.emptyText}>
                Không tìm thấy sản phẩm
              </DynamicText>
            </View>
          }
          ListFooterComponent={() => <View style={{height: scaleHeight(80)}} />}
        />
      )}

      {/* Bottom Bar with Selected Count and Confirm Button */}
      <View style={styles.bottomBar}>
        <View style={styles.selectedInfo}>
          <DynamicText style={styles.selectedCount}>
            Đã chọn: {selectedProducts.length} sản phẩm
          </DynamicText>
        </View>
        <Button
          title="Hoàn tất"
          buttonContainerStyle={styles.confirmButton}
          titleStyle={styles.confirmButtonText}
          onPress={handleComplete}
          disabled={selectedProducts.length === 0}
        />
      </View>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    padding: scaleWidth(16),
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchInputContainer: {
    height: scaleHeight(70),
    backgroundColor: '#f0f0f0',
  },
  searchInputStyle: {
    fontSize: scaledSize(16),
  },
  scanButton: {
    width: scaleWidth(30),
    height: scaleHeight(70),
    backgroundColor: '#f0f0f0',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: scaleWidth(16),
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(10),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(30),
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedProductItem: {
    backgroundColor: '#E1F5FE',
    borderColor: color.primaryColor,
    borderWidth: 1,
  },
  checkboxContainer: {
    marginRight: scaleWidth(12),
  },
  checkbox: {
    width: scaledSize(30),
    height: scaledSize(30),
    borderRadius: moderateScale(4),
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  productImage: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: moderateScale(6),
    marginRight: scaleWidth(12),
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: scaledSize(22),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
    marginBottom: scaleHeight(4),
  },
  variantText: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_Regular,
    color: '#666',
    marginBottom: scaleHeight(4),
  },
  productPrice: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginBottom: scaleHeight(2),
  },
  inventory: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(60),
  },
  emptyText: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    marginTop: scaleHeight(12),
  },
  bottomBar: {
    position: 'absolute',
    bottom: moderateScale(90),
    left: 0,
    right: 0,
    backgroundColor: color.accentColor.whiteColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  selectedInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: scaledSize(24),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  confirmButton: {
    height: scaleHeight(80),
    width: '20%',
  },
  confirmButtonText: {
    fontSize: scaledSize(22),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChooseOrderProduct;
