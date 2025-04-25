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
import {useNavigation, useRoute, NavigationProp} from '@react-navigation/native';
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
import {Screen, RootStackParamList} from '../../../navigation/navigation.type';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {
  fetchInventoriesForProductSelection,
} from '../../../services/api/productAPI';
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
  product_code?: string;
}

interface RouteParams {
  selectedProducts?: ProductVariant[];
}

const ChooseOrderProduct = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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
    // If products are passed from order screen, process them to match our format
    if (routeParams?.selectedProducts && routeParams.selectedProducts.length > 0) {
      console.log('Received selected products from order screen:', routeParams.selectedProducts.length);
      
      // Convert products from order screen format to our format
      const processedProducts = routeParams.selectedProducts.map(product => {
        // Extract original ID and variantId from the combined ID if necessary
        let originalId = product._id;
        let variantId = product.variantId;
        
        // If _id contains a dash, it was previously combined (e.g., "originalId-variantId")
        if (typeof originalId === 'string' && originalId.includes('-')) {
          const parts = originalId.split('-');
          originalId = parts[0];
          variantId = parts[1];
        }
        
        // Create a product variant structure that matches our format
        return {
          _id: originalId,
          variantId: variantId,
          name: product.name,
          thumbnail: product.thumbnail,
          price: product.price,
          inventory: product.inventory || 0,
          attributes: product.attributes || [],
          quantity: 1,
          isVariant: !!variantId,
          product_code: product.product_code
        };
      });
      
      setSelectedProducts(processedProducts);
    }

    fetchInventoryData();
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

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // Fetch inventory data instead of products
      const inventories = await fetchInventoriesForProductSelection();

      if (inventories && Array.isArray(inventories)) {
        // Process inventory items to be used as products
        const processedProducts: ProductVariant[] = [];

        inventories.forEach((inventory: any) => {
          console.log('Processing inventory item:', inventory.product_name, {
            hasVariants: inventory.hasVariants,
            variantsCount: inventory.variantDetails?.length || 0,
            inventoryId: inventory._id
          });
          
          // Get thumbnail from inventory data if available
          const thumbnailUrl = inventory.productThumbnail || '';
          
          // Check if inventory has variants
          if (
            inventory.hasVariants &&
            Array.isArray(inventory.variantDetails) &&
            inventory.variantDetails.length > 0
          ) {
            // Process each variant as a separate product
            inventory.variantDetails.forEach((variant: any, index: number) => {
              // Skip if quantity is 0
              if (!variant || variant.quantity <= 0) {
                return;
              }

              console.log(`Processing variant ${index} for ${inventory.product_name}:`, {
                price: variant.price,
                quantity: variant.quantity,
                attributes: variant.attributes
              });

              // Extract attributes from the variant
              const attributes: Array<{name: string; value: string}> = [];
              
              // Handle different attribute formats in the inventory collection
              if (variant.attributes && typeof variant.attributes === 'object') {
                // Get attribute entries from the object
                Object.entries(variant.attributes).forEach(([key, value]) => {
                  // Map known variant IDs to their proper names based on the database data
                  if (key === '6800b2361185e9116e44520b') {
                    // This is the Color variant ID
                    attributes.push({
                      name: 'Màu sắc',
                      value: String(value)
                    });
                  } else if (key === '6803cd9047ead40c2b03a4a7') {
                    // This is the Capacity variant ID
                    attributes.push({
                      name: 'Dung lượng',
                      value: String(value)
                    });
                  } else {
                    // For other attribute keys, use the key as name
                    attributes.push({
                      name: key,
                      value: String(value)
                    });
                  }
                });
              }

              // If no attributes were processed but we know it's a variant,
              // add a generic attribute to differentiate it
              if (attributes.length === 0 && inventory.hasVariants) {
                attributes.push({
                  name: 'Biến thể',
                  value: `#${index + 1}`
                });
              }

              // Create the processed product variant
              processedProducts.push({
                _id: inventory._id,
                variantId: variant._id || `variant-${index}`,
                name: inventory.product_name,
                thumbnail: thumbnailUrl,
                price: variant.price || 0,
                inventory: variant.quantity || 0,
                product_code: inventory.product_code || '',
                attributes: attributes,
                quantity: 1, // Default quantity
                isVariant: true,
              });
            });
          } else {
            // Product without variants
            if (inventory.total_quantity <= 0) {
              return; // Skip if no inventory
            }

            processedProducts.push({
              _id: inventory._id,
              name: inventory.product_name,
              thumbnail: thumbnailUrl,
              price: inventory.total_price / inventory.total_quantity || 0, // Calculate unit price
              inventory: inventory.total_quantity || 0,
              product_code: inventory.product_code || '',
              attributes: [],
              quantity: 1, // Default quantity
              isVariant: false,
            });
          }
        });

        console.log(`Processed ${processedProducts.length} products from inventory`);
        
        // Sort products by name and then by price
        processedProducts.sort((a, b) => {
          // First sort by name
          const nameComparison = a.name.localeCompare(b.name);
          if (nameComparison !== 0) {
            return nameComparison;
          }
          
          // Then by variant status (non-variants first)
          if (a.isVariant !== b.isVariant) {
            return a.isVariant ? 1 : -1;
          }
          
          // Then by price
          return a.price - b.price;
        });
        
        setAllProducts(processedProducts);
        setFilteredProducts(processedProducts);
      } else {
        console.error('Failed to fetch inventory data: Invalid response format');
        Alert.alert('Error', 'Failed to load inventory data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading inventory data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product: ProductVariant) => {
    // Check if product is already selected
    const isSelected = selectedProducts.some(
      p =>
        p._id === product._id &&
        ((!p.variantId && !product.variantId) ||
          p.variantId === product.variantId),
    );

    if (isSelected) {
      // Remove product from selection
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
      // Add product to selection
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const isProductSelected = (product: ProductVariant) => {
    // Check if product is selected
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

    // Ensure each selected product has a unique ID for the order screen
    const productsForOrder = selectedProducts.map(product => {
      // For variant products, we need to clearly identify both the original productId and the variantId
      // The backend needs these to be separate values, but we combine them here for unique identification
      const uniqueId = product.variantId 
        ? `${product._id}-${product.variantId}` 
        : product._id;
        
      console.log(`Product for order: ${product.name}`);
      console.log(`Original ID: ${product._id}`);
      console.log(`Variant ID: ${product.variantId || 'N/A'}`);
      console.log(`Combined ID: ${uniqueId}`);
      
      // Make sure thumbnail is properly formatted for display on the next screen
      let thumbnailForDisplay = product.thumbnail;
      if (thumbnailForDisplay && !thumbnailForDisplay.startsWith('http')) {
        thumbnailForDisplay = `http://10.0.2.2:5000${thumbnailForDisplay}`;
      }
      
      return {
        ...product,
        _id: uniqueId, // Use the unique ID as the product ID for identification
        originalProductId: product._id, // Keep the original product ID
        variantId: product.variantId, // Keep the variant ID separate
        thumbnail: thumbnailForDisplay,
        quantity: 1 // Reset quantity to 1 for the order screen
      };
    });
    
    // Navigate with properly typed parameters
    navigation.navigate(Screen.CREATEORDER, {
      selectedProducts: productsForOrder,
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
  };

  const renderVariantDetails = (
    attributes: Array<{name: string; value: string}>,
  ) => {
    if (!attributes || attributes.length === 0) {
      return null;
    }

    return (
      <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
        {attributes.map((attr, index) => (
          <DynamicText
            key={index}
            style={styles.variantText}
            numberOfLines={1}>
            {attr.name}: {attr.value}
            {index < attributes.length - 1 ? ', ' : ''}
          </DynamicText>
        ))}
      </View>
    );
  };

  const renderProductItem = ({item}: {item: ProductVariant}) => {
    // Check if this item is selected
    const isSelected = isProductSelected(item);
    
    // Create image URL with fallback if needed
    let imageSource;
    if (item.thumbnail) {
      imageSource = item.thumbnail.startsWith('http') 
        ? {uri: item.thumbnail} 
        : {uri: `http://10.0.2.2:5000${item.thumbnail}`};
    } else {
      // Fallback to empty view instead of placeholder image
      imageSource = null;
    }

    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isSelected && styles.selectedProductItem,
          item.isVariant && styles.variantProductItem,
        ]}
        onPress={() => toggleProductSelection(item)}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkedCheckbox,
              ]}>
              {isSelected && (
                <TickCircle size={16} color="#fff" variant="Bold" />
              )}
            </View>
          </View>

          {imageSource ? (
            <AsyncImage
              source={imageSource}
              style={styles.productImage}
            />
          ) : (
            <View style={[styles.productImage, {backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center'}]}>
              <DynamicText style={{fontSize: 30, color: '#999'}}>{item.name[0]}</DynamicText>
            </View>
          )}

          <View style={styles.productDetails}>
            <DynamicText style={styles.productName} numberOfLines={1}>
              {item.name}
            </DynamicText>
            
            {renderVariantDetails(item.attributes)}
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
              <DynamicText style={styles.productPrice}>
                {formatCurrency(item.price)}
              </DynamicText>
              <DynamicText style={styles.inventory}>
                Còn {item.inventory} sp
              </DynamicText>
            </View>
            
            {item.product_code && (
              <DynamicText style={styles.productCode}>
                Mã: {item.product_code}
              </DynamicText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BaseLayout contentContainerStyle={styles.container}>
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
          contentContainerStyle={[
            styles.productsList, 
            { paddingBottom: scaleHeight(320) }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShoppingCart size={60} color="#ddd" variant="Bold" />
              <DynamicText style={styles.emptyText}>
                Không tìm thấy sản phẩm
              </DynamicText>
            </View>
          }
        />
      )}
      {/* Bottom Bar with Selected Count and Confirm Button */}
<View style={styles.bottomContainer}>
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
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: scaleWidth(16),
    alignItems: 'center',
    gap: scaleWidth(12),
    height: scaleHeight(100),
    marginBottom: scaleHeight(10),
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchInputContainer: {
    height: scaleHeight(100),
    backgroundColor: color.inputColor,
  },
  searchInputStyle: {
    fontSize: scaledSize(20),
  },
  scanButton: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: moderateScale(8),
    backgroundColor: color.inputColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    paddingLeft: scaleWidth(5),
    paddingRight: scaleWidth(16),
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(8),
    padding: scaleWidth(10),
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    marginVertical: scaleHeight(10),
  },
  selectedProductItem: {
    backgroundColor: '#E1F5FE',
    borderColor: color.primaryColor,
    borderWidth: 1,
  },
  variantProductItem: {
    marginLeft: scaleWidth(10),
    borderLeftWidth: 3,
    borderLeftColor: color.primaryColor,
  },
  productImage: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: moderateScale(6),
    marginRight: scaleWidth(12),
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: scaledSize(25),
    fontFamily: Fonts.Inter_Regular,
    marginBottom: scaleHeight(2),
  },
  variantText: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_Regular,
    color: '#666',
    marginBottom: scaleHeight(2),
  },
  productPrice: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  inventory: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_Regular,
    color: '#666',
  },
  productCode: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_Regular,
    color: '#999',
    marginTop: scaleHeight(2),
  },
  checkboxContainer: {
    marginRight: scaleWidth(8),
  },
  checkbox: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    padding: scaleWidth(16),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: scaleHeight(150),

  },
  selectedInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  confirmButton: {
    height: scaleHeight(100),
    width: scaleWidth(120),
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
  },
  confirmButtonText: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: 'white',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ChooseOrderProduct;
