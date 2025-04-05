import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseLayout, Header } from '../../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { create } from 'apisauce';
import { ApiEndpoint } from '../../../services/api/api-endpoint';
import { Screen } from '../../../navigation/navigation.type';
import { moderateScale } from '../../../utils';

const ChooseOrderProduct = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize selected products from route params if available
  useEffect(() => {
    if (route.params?.selectedProducts) {
      setSelectedProducts(route.params.selectedProducts);
    }
    
    fetchProducts();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Create API instance
      const api = create({
        baseURL: "http://10.0.2.2:5000/",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      // Fetch products with variants
      const response = await api.get(ApiEndpoint.PRODUCTS);
      
      if (response.ok) {
        const products = response.data?.data || [];
        
        // Process products to include variants as separate selectable items
        const processedProducts = [];
        
        products.forEach(product => {
          if (product.hasVariants && product.detailsVariants && product.detailsVariants.length > 0) {
            // For products with variants, create a separate item for each variant
            product.detailsVariants.forEach(variant => {
              // Format variant attributes for display
              const attributes = variant.variantDetails.map(detail => ({
                name: '', // Will be populated when we fetch variant info
                value: detail.value
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
                isVariant: true
              });
            });
          } else {
            // For products without variants
            processedProducts.push({
              _id: product._id,
              name: product.name,
              thumbnail: product.thumbnail,
              price: product.price,
              inventory: product.inventory,
              attributes: [],
              quantity: 1, // Default quantity
              isVariant: false
            });
          }
        });
        
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

  const toggleProductSelection = (product) => {
    // Kiểm tra sản phẩm có trong danh sách đã chọn không
    // So sánh cả ID sản phẩm và ID biến thể (nếu có)
    const isSelected = selectedProducts.some(p => 
      p._id === product._id && 
      ((!p.variantId && !product.variantId) || (p.variantId === product.variantId))
    );
    
    if (isSelected) {
      // Xóa sản phẩm khỏi danh sách đã chọn
      setSelectedProducts(selectedProducts.filter(p => 
        !(p._id === product._id && 
          ((!p.variantId && !product.variantId) || (p.variantId === product.variantId)))
      ));
    } else {
      // Thêm sản phẩm vào danh sách đã chọn
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const isProductSelected = (product) => {
    // Kiểm tra sản phẩm đã được chọn hay chưa
    // So sánh cả ID sản phẩm và ID biến thể (nếu có)
    return selectedProducts.some(p => 
      p._id === product._id && 
      ((!p.variantId && !product.variantId) || (p.variantId === product.variantId))
    );
  };

  const handleComplete = () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm');
      return;
    }
    
    // Navigate back to CreateOrderScreen with selected products
    navigation.navigate(Screen.CREATEORDER, { selectedProducts });
  };

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
  };

  const renderVariantDetails = (attributes) => {
    if (!attributes || attributes.length === 0) return null;
    
    // Hiển thị chi tiết biến thể rõ ràng hơn
    return (
      <Text style={styles.variantText}>
        {attributes.map(attr => `${attr.value}`).join(' | ')}
      </Text>
    );
  };

  const renderProductItem = ({ item }) => {
    // Tạo ID duy nhất cho mỗi biến thể
    const uniqueId = item.variantId ? `${item._id}-${item.variantId}` : item._id;
    
    return (
    <TouchableOpacity
      style={[
        styles.productItem,
        isProductSelected(item) && styles.selectedProductItem
      ]}
      onPress={() => toggleProductSelection(item)}
    >
      <View style={styles.checkboxContainer}>
        <View style={[
          styles.checkbox,
          isProductSelected(item) && styles.checkedCheckbox
        ]}>
          {isProductSelected(item) && (
            <Icon name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </View>
      
      <Image
        source={{ uri: item.thumbnail || 'https://via.placeholder.com/80' }}
        style={styles.productImage}
      />
      
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        {renderVariantDetails(item.attributes)}
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <Text style={styles.inventory}>Tồn kho: {item.inventory}</Text>
      </View>
    </TouchableOpacity>
  )};

  return (
    <BaseLayout>
      <Header
        title="Chọn sản phẩm"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập từ khóa tìm kiếm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.scanButton}>
          <Icon name="barcode-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.variantId ? `${item._id}-${item.variantId}` : item._id}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="basket-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
              </View>
            }
          />
          
          {/* Bottom Bar with Selected Count and Confirm Button */}
          <View style={styles.bottomBar}>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedCount}>
                Đã chọn: {selectedProducts.length} sản phẩm
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleComplete}
            >
              <Text style={styles.confirmButtonText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  scanButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: 16,
    paddingBottom: moderateScale(120), // Add padding for bottom bar
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedProductItem: {
    backgroundColor: '#E1F5FE',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  variantText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  inventory: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChooseOrderProduct; 