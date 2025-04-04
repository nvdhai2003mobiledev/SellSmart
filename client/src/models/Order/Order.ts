import { types, Instance, flow, cast } from 'mobx-state-tree';
import { fetchOrders, deleteOrder, createOrder } from '../../services/api/ordersApi';

// Product item within an order
const ProductAttribute = types.model({
  name: types.string,
  value: types.union(types.array(types.string), types.string)
}).preProcessSnapshot(snapshot => {
  // Convert string value to array if needed
  if (typeof snapshot.value === 'string') {
    return { ...snapshot, value: [snapshot.value] };
  }
  return snapshot;
});

const OrderProduct = types.model({
  productID: types.string,
  name: types.string,
  inventory: types.optional(types.number, 0),
  price: types.number,
  quantity: types.optional(types.number, 1),
  attributes: types.optional(types.array(ProductAttribute), [])
});

// Order model
export const Order = types.model({
  _id: types.identifier,
  orderID: types.string,
  customerID: types.model({
    _id: types.string,
    fullName: types.string,
    phoneNumber: types.optional(types.string, ''),
    email: types.optional(types.string, ''),
    address: types.optional(types.string, '')
  }),
  products: types.array(OrderProduct),
  totalAmount: types.number,
  status: types.enumeration(['pending', 'processing', 'shipping', 'delivered', 'canceled']),
  paymentMethod: types.maybeNull(types.enumeration(['cash', 'credit card', 'debit card', 'e-wallet'])),
  paymentStatus: types.enumeration(['paid', 'unpaid', 'refunded', 'partpaid']),
  paidAmount: types.optional(types.number, 0),
  paymentDetails: types.optional(
    types.array(
      types.model({
        method: types.enumeration(['cash', 'credit card', 'debit card', 'e-wallet']),
        amount: types.number,
        date: types.string
      })
    ),
    []
  ),
  shippingAddress: types.optional(types.string, ''),
  employeeID: types.maybeNull(
    types.model({
      _id: types.string,
      fullName: types.string,
      position: types.string
    })
  ),
  notes: types.optional(types.string, ''),
  cancelReason: types.optional(types.maybeNull(types.string), null),
  promotionID: types.maybeNull(types.string),
  promotionDetails: types.maybeNull(
    types.model({
      name: types.string,
      discount: types.number,
      discountAmount: types.number
    })
  ),
  originalAmount: types.maybeNull(types.number),
  createdAt: types.string,
  updatedAt: types.string
});

// Order Store
export const OrderStore = types
  .model({
    orders: types.array(Order),
    isLoading: types.optional(types.boolean, false),
    error: types.optional(types.string, '')
  })
  .views(self => ({
    get pendingOrders() {
      return self.orders.filter(order => order.status === 'pending');
    },
    get processingOrders() {
      return self.orders.filter(order => order.status === 'processing');
    },
    get shippingOrders() {
      return self.orders.filter(order => order.status === 'shipping');
    },
    get deliveredOrders() {
      return self.orders.filter(order => order.status === 'delivered');
    },
    get canceledOrders() {
      return self.orders.filter(order => order.status === 'canceled');
    }
  }))
  .actions(self => ({
    setOrders(orders: Instance<typeof Order>[]) {
      self.orders = cast(orders);
    },
    setLoading(status: boolean) {
      self.isLoading = status;
    },
    setError(message: string) {
      self.error = message;
    },
    reset() {
      self.orders = cast([]);
      self.isLoading = false;
      self.error = '';
    },
    fetchOrders: flow(function* () {
      self.isLoading = true;
      self.error = '';
      
      try {
        const ordersData = yield fetchOrders();
        
        console.log('Received orders data:', ordersData);
        
        if (Array.isArray(ordersData)) {
          // Process orders to ensure they match our model
          const processedOrders = ordersData.map(order => {
            // Ensure all required fields are present with defaults if needed
            return {
              ...order,
              products: order.products || [],
              paymentMethod: order.paymentMethod || null,
              paymentStatus: order.paymentStatus || 'unpaid',
              paidAmount: order.paidAmount || 0,
              paymentDetails: Array.isArray(order.paymentDetails) ? order.paymentDetails.map((payment: any) => ({
                ...payment,
                date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString()
              })) : [],
              shippingAddress: order.shippingAddress || '',
              notes: order.notes || '',
              cancelReason: order.cancelReason || null,
              promotionID: order.promotionID || null,
              promotionDetails: order.promotionDetails ? {
                name: order.promotionDetails.name || '',
                discount: order.promotionDetails.discount || 0,
                discountAmount: order.promotionDetails.discountAmount || 0
              } : null,
              originalAmount: order.originalAmount || null
            };
          });
          
          self.orders = cast(processedOrders);
          console.log('Orders loaded successfully, count:', processedOrders.length);
        } else if (ordersData && typeof ordersData === 'object' && 'data' in ordersData) {
          const orders = (ordersData as { data: unknown }).data;
          if (Array.isArray(orders)) {
            const processedOrders = orders.map(order => ({
              ...order,
              products: order.products || [],
              paymentMethod: order.paymentMethod || null,
              paymentStatus: order.paymentStatus || 'unpaid',
              paidAmount: order.paidAmount || 0,
              paymentDetails: Array.isArray(order.paymentDetails) ? order.paymentDetails.map((payment: any) => ({
                ...payment,
                date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString()
              })) : [],
              shippingAddress: order.shippingAddress || '',
              notes: order.notes || '',
              cancelReason: order.cancelReason || null,
              promotionID: order.promotionID || null,
              promotionDetails: order.promotionDetails ? {
                name: order.promotionDetails.name || '',
                discount: order.promotionDetails.discount || 0,
                discountAmount: order.promotionDetails.discountAmount || 0
              } : null,
              originalAmount: order.originalAmount || null
            }));
            self.orders = cast(processedOrders);
            console.log('Orders extracted from object, count:', processedOrders.length);
          } else {
            console.error('Unexpected orders data format:', ordersData);
            self.error = 'Unexpected data format received from server';
          }
        } else {
          console.error('Invalid orders data:', ordersData);
          self.error = 'Invalid data received from server';
        }
      } catch (error: unknown) {
        console.error('Exception in fetchOrders:', error);
        self.error = error instanceof Error ? error.message : 'An unexpected error occurred';
      } finally {
        self.isLoading = false;
      }
    }),
    deleteOrder: flow(function* (id: string) {
      self.isLoading = true;
      self.error = '';
      
      try {
        const response = yield deleteOrder(id);
        
        if (response.ok) {
          self.orders = cast(self.orders.filter(order => order._id !== id));
          return true;
        } else {
          console.error('Delete Error:', response.problem, response.data);
          self.error = response.problem || 'Failed to delete order';
          return false;
        }
      } catch (error: unknown) {
        console.error('Exception in deleteOrder:', error);
        self.error = error instanceof Error ? error.message : 'An unexpected error occurred';
        
        if (__DEV__) {
          console.log('DEV MODE: Simulating successful delete');
          self.orders = cast(self.orders.filter(order => order._id !== id));
          return true;
        }
        
        return false;
      } finally {
        self.isLoading = false;
      }
    }),
    createOrder: flow(function* (orderData: any) {
      self.isLoading = true;
      self.error = '';
      
      try {
        console.log('Creating new order with data:', orderData);
        
        const response = yield createOrder(orderData);
        
        if (response.ok) {
          console.log('Order created successfully:', response.data);
          yield self.fetchOrders();
          
          return {
            success: true,
            data: response.data
          };
        } else {
          console.error('Create Order Error:', response.problem, response.data);
          self.error = response.data?.message || 'Failed to create order';
          
          return {
            success: false,
            error: self.error
          };
        }
      } catch (error: unknown) {
        console.error('Exception in createOrder:', error);
        self.error = error instanceof Error ? error.message : 'An unexpected error occurred';
        
        return {
          success: false,
          error: self.error
        };
      } finally {
        self.isLoading = false;
      }
    })
  }));

export type OrderInstance = Instance<typeof Order>;
export type OrderStoreInstance = Instance<typeof OrderStore>;