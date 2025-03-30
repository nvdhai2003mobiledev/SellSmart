import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Modal, Dimensions, ScrollView } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { ProductStore } from '../../../models/product/product';
import { khoiTaoStore } from '../../../models/product/product-store';

const ProductScreen = observer(() => {
  const [store] = useState(() => {
    const rootStore = khoiTaoStore();
    return rootStore.productStore;
  });
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [totalCartItems, setTotalCartItems] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [variantSelectionVisible, setVariantSelectionVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const windowWidth = Dimensions.get('window').width;

  const loadProducts = useCallback(async () => {
    try {
      await store.fetchProducts();
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    }
  }, [store]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } catch (error) {
      console.error('Lỗi khi làm mới sản phẩm:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadProducts]);

  const addToCart = (productId: string, variant?: any) => {
    const cartKey = variant ? `${productId}_${variant._id}` : productId;
    const newCartItems = { ...cartItems };
    newCartItems[cartKey] = (newCartItems[cartKey] || 0) + 1;
    setCartItems(newCartItems);
    
    // Calculate total items in cart
    const newTotal = Object.values(newCartItems).reduce((sum, quantity) => sum + quantity, 0);
    setTotalCartItems(newTotal);
  };

  const handleAddToCartClick = (item: any, event?: any) => {
    // Prevent opening the product details modal when clicking the add button
    if (event) {
      event.stopPropagation();
    }
    
    // If product has variants, show variant selection modal
    if (item.hasVariants && item.detailsVariants && item.detailsVariants.length > 1) {
      setSelectedProduct(item);
      setVariantSelectionVisible(true);
    } else if (item.hasVariants && item.detailsVariants && item.detailsVariants.length === 1) {
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

  const getProductInfo = (item: any) => {
    // Safely extract category name
    let categoryName = 'Không có danh mục';
    if (typeof item.category === 'string') {
      categoryName = item.category;
    } else if (item.category && typeof item.category === 'object') {
      categoryName = item.category.name || 'Không có danh mục';
    }

    // Safely extract provider name
    let providerName = 'Không có nhà cung cấp';
    if (typeof item.providerId === 'string') {
      providerName = item.providerId;
    } else if (item.providerId && typeof item.providerId === 'object') {
      providerName = item.providerId.fullName || 'Không có nhà cung cấp';
    }

    return { categoryName, providerName };
  };

  const getVariantName = (variant: any) => {
    if (!variant || !variant.variantDetails) return '';
    
    return variant.variantDetails
      .map((detail: any) => detail.value)
      .join(', ');
  };

  const renderItem = ({ item }: { item: any }) => {
    // Get product info
    const { categoryName } = getProductInfo(item);
    
    // Calculate display price based on product structure
    let price = 0;
    
    if (item.price !== null && item.price !== undefined) {
      // Product has a direct price
      price = item.price;
    } else if (item.hasVariants && item.detailsVariants && item.detailsVariants.length > 0) {
      // Product has variants, use the first variant's price
      price = item.detailsVariants[0].price;
    } else if (item.variants && item.variants.length > 0) {
      // Fallback to variants array if detailsVariants isn't available
      price = item.variants[0].price;
    }
    
    // Make sure we have a string for the name
    const productName = typeof item.name === 'string' ? item.name : 
                        (item.name && typeof item.name.toString === 'function' ? 
                         item.name.toString() : 'Sản phẩm không tên');
    
    // Format thumbnail URL
    const thumbnailUrl = item.thumbnail 
      ? (item.thumbnail.startsWith('http') ? item.thumbnail : `http://10.0.2.2:3000${item.thumbnail}`)
      : 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity 
        style={styles.productItem} 
        onPress={() => showProductDetails(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: thumbnailUrl }} 
          style={styles.productImage} 
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
          <Text style={styles.productCategory}>{categoryName}</Text>
          <Text style={styles.productPrice}>{price.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={(e) => handleAddToCartClick(item, e)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Làm mới</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {store.isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Đang tải sản phẩm...</Text>
        </View>
      ) : store.error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lỗi: {store.error}</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Text style={styles.refreshButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {totalCartItems > 0 && (
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Thanh toán ({totalCartItems})</Text>
            </TouchableOpacity>
          )}
          
          <FlatList
            data={store.availableProducts}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            numColumns={4}
            contentContainerStyle={styles.productList}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0000ff']}
              />
            }
          />
          
          {/* Product Detail Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                
                {selectedProduct && (
                  <ScrollView style={styles.detailsScrollView}>
                    <Image 
                      source={{ 
                        uri: selectedProduct.thumbnail 
                          ? (selectedProduct.thumbnail.startsWith('http') 
                              ? selectedProduct.thumbnail 
                              : `http://10.0.2.2:3000${selectedProduct.thumbnail}`)
                          : 'https://via.placeholder.com/300'
                      }} 
                      style={styles.detailImage} 
                      resizeMode="cover"
                    />
                    
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailName}>
                        {typeof selectedProduct.name === 'string' 
                          ? selectedProduct.name 
                          : String(selectedProduct.name)}
                      </Text>
                      
                      <Text style={styles.detailCategory}>
                        Danh mục: {getProductInfo(selectedProduct).categoryName}
                      </Text>
                      
                      <Text style={styles.detailProvider}>
                        Nhà cung cấp: {getProductInfo(selectedProduct).providerName}
                      </Text>
                      
                      <Text style={styles.detailStatus}>
                        Trạng thái: {selectedProduct.status === 'available' ? 'Còn hàng' : 'Hết hàng'}
                      </Text>
                      
                      {selectedProduct.price !== null && selectedProduct.price !== undefined ? (
                        <Text style={styles.detailPrice}>
                          Giá: {selectedProduct.price.toLocaleString('vi-VN')} đ
                        </Text>
                      ) : selectedProduct.hasVariants && selectedProduct.detailsVariants && selectedProduct.detailsVariants.length > 0 ? (
                        <View>
                          <Text style={styles.variantTitle}>Các biến thể:</Text>
                          {selectedProduct.detailsVariants.map((variant: any, index: number) => (
                            <TouchableOpacity 
                              key={index} 
                              style={styles.variantItemSelectable}
                              onPress={() => {
                                addToCart(selectedProduct._id, variant);
                                setModalVisible(false);
                              }}
                            >
                              <Text style={styles.variantDetails}>
                                {variant.variantDetails.map((detail: any) => `${detail.value}`).join(', ')}
                              </Text>
                              <Text style={styles.variantPrice}>
                                {variant.price.toLocaleString('vi-VN')} đ
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                      
                      {!selectedProduct.hasVariants && (
                        <TouchableOpacity 
                          style={styles.addToCartButton}
                          onPress={() => {
                            addToCart(selectedProduct._id);
                            setModalVisible(false);
                          }}
                        >
                          <Text style={styles.addToCartButtonText}>Thêm vào giỏ hàng</Text>
                        </TouchableOpacity>
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
            onRequestClose={() => setVariantSelectionVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setVariantSelectionVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                
                {selectedProduct && (
                  <View style={styles.variantSelectionContainer}>
                    <Text style={styles.variantSelectionTitle}>Chọn phiên bản</Text>
                    
                    <Text style={styles.productNameInVariantModal}>
                      {typeof selectedProduct.name === 'string' 
                        ? selectedProduct.name 
                        : String(selectedProduct.name)}
                    </Text>
                    
                    <ScrollView style={styles.variantList}>
                      {selectedProduct.detailsVariants && selectedProduct.detailsVariants.map((variant: any, index: number) => (
                        <TouchableOpacity 
                          key={index} 
                          style={[
                            styles.variantSelectItem,
                            selectedVariant === variant && styles.selectedVariantItem
                          ]}
                          onPress={() => setSelectedVariant(variant)}
                        >
                          <View style={styles.variantSelectInfo}>
                            <Text style={styles.variantSelectName}>
                              {getVariantName(variant)}
                            </Text>
                            <Text style={styles.variantSelectPrice}>
                              {variant.price.toLocaleString('vi-VN')} đ
                            </Text>
                          </View>
                          {selectedVariant === variant && (
                            <View style={styles.selectedVariantCheckmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    <TouchableOpacity 
                      style={[
                        styles.addVariantToCartButton,
                        !selectedVariant && styles.disabledButton
                      ]}
                      disabled={!selectedVariant}
                      onPress={() => {
                        if (selectedVariant) {
                          addToCart(selectedProduct._id, selectedVariant);
                          setVariantSelectionVisible(false);
                          setSelectedVariant(null);
                        }
                      }}
                    >
                      <Text style={styles.addToCartButtonText}>
                        Thêm vào giỏ hàng
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
});

export default ProductScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productList: {
    padding: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  productItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    maxWidth: '24%',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    height: 32,
  },
  productCategory: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#4caf50',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 100,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsScrollView: {
    maxHeight: '100%',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  detailsContainer: {
    padding: 10,
  },
  detailName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailStatus: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 5,
  },
  detailPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginVertical: 10,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  variantItemSelectable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  variantDetails: {
    fontSize: 14,
    color: '#333',
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  addToCartButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  variantSelectionContainer: {
    paddingVertical: 15,
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  variantSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  productNameInVariantModal: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  variantList: {
    maxHeight: 300,
  },
  variantSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedVariantItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  variantSelectInfo: {
    flex: 1,
  },
  variantSelectName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  variantSelectPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  selectedVariantCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkmarkText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addVariantToCartButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
});
