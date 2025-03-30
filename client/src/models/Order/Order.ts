import { types, Instance, flow } from 'mobx-state-tree';
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
  paymentMethod: types.enumeration(['cash', 'credit card', 'debit card', 'e-wallet']),
  paymentStatus: types.enumeration(['paid', 'unpaid', 'refunded']),
  shippingAddress: types.optional(types.string, ''),
  employeeID: types.maybeNull(
    types.model({
      _id: types.string,
      fullName: types.string,
      position: types.string
    })
  ),
  notes: types.optional(types.string, ''),
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
    setOrders(orders) {
      self.orders = orders;
    },
    setLoading(status) {
      self.isLoading = status;
    },
    setError(message) {
      self.error = message;
    },
    reset() {
      self.orders = [];
      self.isLoading = false;
      self.error = '';
    },
    fetchOrders: flow(function* () {
      self.isLoading = true;
      self.error = '';
      
      try {
        // Use our custom fetch function that can handle various response types
        const ordersData = yield fetchOrders();
        
        console.log('Received orders data:', ordersData);
        
        if (Array.isArray(ordersData) && ordersData.length > 0) {
          // Make sure all required fields are present with defaults if needed
          const processedOrders = ordersData.map(order => {
            // If products array is missing or empty, provide default empty array
            if (!order.products || !Array.isArray(order.products)) {
              order.products = [];
            }
            
            return order;
          });
          
          self.orders = processedOrders;
          console.log('Orders loaded successfully, count:', processedOrders.length);
        } else if (ordersData && typeof ordersData === 'object') {
          // If we get an object with orders inside
          const orders = ordersData.data || ordersData.orders;
          if (Array.isArray(orders)) {
            self.orders = orders;
            console.log('Orders extracted from object, count:', orders.length);
          } else {
            console.error('Unexpected orders data format:', ordersData);
            self.error = 'Unexpected data format received from server';
          }
        } else {
          console.error('Invalid orders data:', ordersData);
          self.error = 'Invalid data received from server';
        }
      } catch (error) {
        console.error('Exception in fetchOrders:', error);
        self.error = error.message || 'An unexpected error occurred';
      } finally {
        self.isLoading = false;
      }
    }),
    deleteOrder: flow(function* (id) {
      self.isLoading = true;
      self.error = '';
      
      try {
        const response = yield deleteOrder(id);
        
        if (response.ok) {
          // Remove the deleted order from the list
          self.orders = self.orders.filter(order => order._id !== id);
          return true;
        } else {
          console.error('Delete Error:', response.problem, response.data);
          self.error = response.problem || 'Failed to delete order';
          return false;
        }
      } catch (error) {
        console.error('Exception in deleteOrder:', error);
        self.error = error.message || 'An unexpected error occurred';
        
        // For development: if the backend API is not working, simulate successful deletion
        if (__DEV__) {
          console.log('DEV MODE: Simulating successful delete');
          self.orders = self.orders.filter(order => order._id !== id);
          return true;
        }
        
        return false;
      } finally {
        self.isLoading = false;
      }
    }),
    createOrder: flow(function* (orderData) {
      self.isLoading = true;
      self.error = '';
      
      try {
        console.log('Creating new order with data:', orderData);
        
        const response = yield createOrder(orderData);
        
        if (response.ok) {
          console.log('Order created successfully:', response.data);
          
          // Refresh the orders list to include the new order
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
      } catch (error) {
        console.error('Exception in createOrder:', error);
        self.error = error.message || 'An unexpected error occurred';
        
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