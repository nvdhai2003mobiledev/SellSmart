import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ImageStyle,
  PixelRatio,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {observer} from 'mobx-react-lite';
import {onSnapshot} from 'mobx-state-tree';
import {BaseLayout} from '../../../components';
import {layStore} from '../../../models/product/product-store';
import {fetchProducts} from '../../../services/api/productAPI';

// Định nghĩa các giá trị màu và kích thước
const color = {
  primaryColor: '#007AFF',
  whiteColor: '#FFFFFF',
  accent: {
    whiteColor: '#FF3B30',
  },
};

// Điều chỉnh kích thước dựa trên tỷ lệ pixel của thiết bị
const scaledSize = (size: number) => {
  return Math.round(
    PixelRatio.roundToNearestPixel(size * (PixelRatio.get() / 2)),
  );
};

// Định nghĩa kiểu cho styles
interface Styles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  productCard: ViewStyle;
  image: ImageStyle;
  infoContainer: ViewStyle;
  name: TextStyle;
  category: TextStyle;
  status: TextStyle;
  priceLabel: TextStyle;
  price: TextStyle;
  trashContainer: ViewStyle;
  totalContainer: ViewStyle;
  text: TextStyle;
  total: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryText: TextStyle;
}

const ProductListScreen = observer(() => {
  const rootStore = layStore();
  const store = rootStore.productStore;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm trích xuất tên danh mục từ chuỗi hoặc đối tượng
  const getCategoryName = (category: any): string => {
    if (typeof category === 'string') {
      return category;
    } else if (category && typeof category === 'object' && category.name) {
      return category.name;
    }
    return 'Không có danh mục';
  };

  const loadProducts = async () => {
    try {
      setError(null);
      store.setLoading(true);
      console.log('Bắt đầu tải danh sách sản phẩm...');

      try {
        const products = await fetchProducts();
        console.log(`Tải thành công ${products.length} sản phẩm`);

        if (products.length === 0) {
          console.log('Không có sản phẩm nào được tải về');
        }

        // Sử dụng store function để xử lý dữ liệu đúng cách
        store.setProducts(products as any);
      } catch (fetchError) {
        console.error(
          'Lỗi khi tải sản phẩm lần đầu, thử lại sau 1 giây:',
          fetchError,
        );

        // Chờ 1 giây và thử lại một lần nữa
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const products = await fetchProducts();
          console.log(
            `Tải thành công ${products.length} sản phẩm sau khi thử lại`,
          );
          store.setProducts(products as any);
        } catch (retryError) {
          console.error('Lỗi khi tải sản phẩm sau khi thử lại:', retryError);
          throw retryError; // Ném lỗi để xử lý ở catch bên ngoài
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);

      // Xử lý dựa trên loại lỗi
      if (err instanceof Error) {
        if (err.message.includes('Phiên đăng nhập hết hạn')) {
          setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        } else if (
          err.message.includes('Network Error') ||
          err.message.includes('timeout')
        ) {
          setError(
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn',
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Không thể tải danh sách sản phẩm do lỗi không xác định');
      }
    } finally {
      store.setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('=== ProductListScreen mounted ===');
    loadProducts();

    const unsubscribe = onSnapshot(store, snapshot => {
      console.log('Store thay đổi:', {
        isLoading: snapshot.isLoading,
        totalPrice: snapshot.totalPrice || 0,
        productCount: snapshot.products.length,
        products: snapshot.products.map(p => ({id: p._id, name: p.name})),
      });
      if (typeof store.calculateTotalPrice === 'function') {
        store.calculateTotalPrice();
      }
    });

    return () => {
      console.log('=== ProductListScreen unmounted ===');
      unsubscribe();
    };
  }, [store]);

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    loadProducts();
  }, []);

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseLayout>
      <View style={styles.container}>
        {store.isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.primaryColor} />
          </View>
        ) : error ? (
          renderError()
        ) : store.products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
          </View>
        ) : (
          <FlatList
            data={store.products}
            keyExtractor={item => item._id.toString()}
            renderItem={({item}) => (
              <View style={styles.productCard}>
                <Image
                  source={
                    item.thumbnail
                      ? {uri: item.thumbnail}
                      : {uri: 'https://via.placeholder.com/50'}
                  }
                  style={styles.image}
                  onError={e =>
                    console.log('Lỗi tải ảnh:', e.nativeEvent.error)
                  }
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.name}>{typeof item.name === 'string' ? item.name : String(item.name)}</Text>
                  <Text style={styles.category}>Danh mục: {getCategoryName(item.category)}</Text>
                  <Text
                    style={[
                      styles.status,
                      {
                        color:
                          item.status === 'available' ? '#007AFF' : '#FF3B30',
                      },
                    ]}>
                    Trạng thái:{' '}
                    {item.status === 'available' ? 'Còn hàng' : 'Hết hàng'}
                  </Text>
                  {item.price !== null ? (
                    <Text style={styles.price}>
                      Giá: {item.price.toLocaleString()} VND
                    </Text>
                  ) : (
                    <View>
                      <Text style={styles.priceLabel}>Giá biến thể:</Text>
                      {item.variants.map((variant, index) => (
                        <Text key={index} style={styles.price}>
                          - {variant.price.toLocaleString()} VND
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() =>
                    store.deleteProduct && store.deleteProduct(item._id)
                  }
                  style={styles.trashContainer}>
                  <Icon
                    name="trash-outline"
                    size={scaledSize(18)}
                    color={color.accent.whiteColor}
                  />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{
              marginHorizontal: scaledSize(20),
              paddingBottom: scaledSize(20),
            }}
            ListFooterComponent={
              <View style={styles.totalContainer}>
                <Text style={styles.text}>Tổng tiền</Text>
                <Text style={styles.total}>
                  {(store.totalPrice || 0).toLocaleString()} VND
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[color.primaryColor]}
              />
            }
          />
        )}
      </View>
    </BaseLayout>
  );
});

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
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
  },
  emptyText: {
    fontSize: scaledSize(16),
    color: '#666',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: scaledSize(8),
    padding: scaledSize(12),
    marginBottom: scaledSize(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: scaledSize(50),
    height: scaledSize(50),
    borderRadius: scaledSize(8),
    marginRight: scaledSize(12),
    backgroundColor: '#ddd',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#000',
  },
  category: {
    fontSize: scaledSize(14),
    color: '#666',
    marginTop: scaledSize(4),
  },
  status: {
    fontSize: scaledSize(14),
    marginTop: scaledSize(4),
  },
  priceLabel: {
    fontSize: scaledSize(14),
    color: '#666',
    marginTop: scaledSize(4),
  },
  price: {
    fontSize: scaledSize(14),
    color: '#007AFF',
    marginTop: scaledSize(2),
  },
  trashContainer: {
    padding: scaledSize(8),
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaledSize(10),
    paddingHorizontal: scaledSize(20),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  text: {
    fontSize: scaledSize(16),
    color: '#666',
  },
  total: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#007AFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaledSize(20),
  },
  errorText: {
    fontSize: scaledSize(16),
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: scaledSize(20),
  },
  retryButton: {
    backgroundColor: color.primaryColor,
    paddingHorizontal: scaledSize(20),
    paddingVertical: scaledSize(10),
    borderRadius: scaledSize(8),
  },
  retryText: {
    color: '#fff',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
});

export default ProductListScreen;
