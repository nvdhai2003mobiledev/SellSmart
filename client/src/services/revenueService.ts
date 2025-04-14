import { reaction } from 'mobx';
import { rootStore } from '../models/root-store';
import { OrderInstance } from '../models/Order/Order';

// Interface for revenue stats
export interface RevenueStats {
  totalRevenue: number;
  averageOrderValue: number;
  totalProductsSold: number;
  orderCount: number;
}

// Helper to get start of day
const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

// Helper to get start of week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const startOfWeek = new Date(date);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

// Helper to get start of month
const getStartOfMonth = (date: Date): Date => {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
};

// Filter orders by date range
const filterOrdersByDateRange = (orders: OrderInstance[], startDate: Date, endDate: Date): OrderInstance[] => {
  // Ensure startDate is at start of day
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // Ensure endDate is at end of day
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= start && orderDate <= end;
  });
};

// Calculate revenue stats for a given set of orders
const calculateRevenueStats = (orders: OrderInstance[]): RevenueStats => {
  // Only consider completed orders (paid and not canceled)
  const validOrders = orders.filter(order => 
    (order.paymentStatus === 'paid' || order.paymentStatus === 'partpaid') && 
    order.status !== 'canceled'
  );

  // Calculate total revenue
  const totalRevenue = validOrders.reduce((sum, order) => {
    // Use paidAmount for partial payments, otherwise use totalAmount
    return sum + (order.paymentStatus === 'partpaid' ? order.paidAmount : order.totalAmount);
  }, 0);

  // Calculate total products sold
  const totalProductsSold = validOrders.reduce((sum, order) => {
    return sum + order.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
  }, 0);

  // Calculate average order value
  const orderCount = validOrders.length;
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  return {
    totalRevenue,
    averageOrderValue,
    totalProductsSold,
    orderCount
  };
};

// Get today's revenue stats
export const getDailyRevenueStats = (): RevenueStats => {
  const now = new Date();
  const startOfDay = getStartOfDay(now);
  const filteredOrders = filterOrdersByDateRange(rootStore.orders.orders, startOfDay, now);
  return calculateRevenueStats(filteredOrders);
};

// Get this week's revenue stats
export const getWeeklyRevenueStats = (): RevenueStats => {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const filteredOrders = filterOrdersByDateRange(rootStore.orders.orders, startOfWeek, now);
  return calculateRevenueStats(filteredOrders);
};

// Get this month's revenue stats
export const getMonthlyRevenueStats = (): RevenueStats => {
  const now = new Date();
  const startOfMonth = getStartOfMonth(now);
  const filteredOrders = filterOrdersByDateRange(rootStore.orders.orders, startOfMonth, now);
  return calculateRevenueStats(filteredOrders);
};

// Get revenue stats for a specific date range
export const getRevenueStatsByDateRange = (startDate: Date, endDate: Date): RevenueStats => {
  const filteredOrders = filterOrdersByDateRange(rootStore.orders.orders, startDate, endDate);
  return calculateRevenueStats(filteredOrders);
};

// Set up reaction to update revenue stats when orders change
let revenueUpdateCallback: (() => void) | null = null;

export const setupRevenueTracking = (callback: () => void) => {
  // Remove previous reaction if exists
  if (revenueUpdateCallback) {
    revenueUpdateCallback();
  }

  // Set up new reaction
  revenueUpdateCallback = reaction(
    () => rootStore.orders.orders.length,
    () => {
      console.log('Orders changed, updating revenue stats...');
      callback();
    }
  );
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}; 