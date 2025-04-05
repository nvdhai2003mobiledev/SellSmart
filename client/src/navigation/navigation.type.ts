import {Provider} from '../models/provider/provider';

export enum Screen {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  LOGIN = 'Login',
  REGISTER = 'Register',
  FORGOT_PASSWORD = 'ForgotPassword',
  OTP = 'OTP',
  VERIFY = 'VERIFY',
  CREATE_PASSWORD = 'CREATE_PASSWORD',
  BOTTOM_TAB = 'BOTTOM_TAB',
  HOME = 'Home',
  ORDER = 'Order',
  PRODUCT = 'Product',
  STATISTICAL = 'Statistical',
  MENU = 'Menu',
  ADD_EMPLOYEE = 'ADD_EMPLOYEE',
  DETAIL_EMPLOYEE = 'DETAIL_EMPLOYEE',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  EMPLOYEES = 'Employees',
  CUSTOMERS = 'Customers',
  ADD_CUSTOMER = 'ADD_CUSTOMER',
  UPDATE_CUSTOMER = 'UPDATECUSTOMER',
  DETAIL_CUSTOMER = 'DETAIL_CUSTOMER',
  CONFIG = 'Config',
  NOTIFI = 'NOTIFINOTIFI',
  CREATEORDER ='CREATEORDER',
  ORDERSCREEN = 'ORDERSCREEN',
  ORDERLIST = 'ORDERLIST',
  FILTERORDER = 'FILTERORDER',
  DAYSCREEN = 'DAYSCREEN',
  WEEKSCREEN = 'WEEKSCREEN',
  MONTHSCREEN = 'MONTHSCREEN',
  PROFILE = 'Profile',
  CHOOSE_ORDER_PRODUCT = 'CHOOSE_ORDER_PRODUCT',
  CUSTOMER_SELECTION = 'CUSTOMER_SELECTION',
  ORDER_DETAIL = 'ORDER_DETAIL',
  ORDER_CANCEL = 'ORDER_CANCEL',
  PAYMENT_METHODS = 'PAYMENT_METHODS',
  PROMOTION_LIST = 'PROMOTION_LIST',
  PROMOTION_DETAIL = 'PROMOTION_DETAIL',
  ADD_PROMOTION = 'ADD_PROMOTION',
  UPDATE_PROMOTION = 'UPDATE_PROMOTION'
}

export type RootStackParamList = {
  [Screen.SPLASH]: undefined;
  [Screen.ONBOARDING]: undefined;
  [Screen.LOGIN]: undefined;
  [Screen.REGISTER]: undefined;
  [Screen.FORGOT_PASSWORD]: undefined;
  [Screen.OTP]: undefined;
  [Screen.VERIFY]: undefined;
  [Screen.CREATE_PASSWORD]: undefined;
  [Screen.BOTTOM_TAB]: undefined;
  [Screen.ADD_EMPLOYEE]: undefined;
  [Screen.DETAIL_EMPLOYEE]: {id: string};
  [Screen.UPDATE_EMPLOYEE]: {employeeId: string};
  [Screen.EMPLOYEES]: undefined;
  [Screen.CUSTOMERS]: undefined;
  [Screen.ADD_CUSTOMER]: undefined;
  [Screen.UPDATE_CUSTOMER]: undefined;
  [Screen.DETAIL_CUSTOMER]: undefined;
  [Screen.CONFIG]: undefined;
  [Screen.NOTIFI]: undefined;
  [Screen.CREATEORDER]: {
    selectedProducts?: any[];
    customer?: any;
  };
  [Screen.ORDERSCREEN]: undefined;
  [Screen.ORDERLIST]: {
    status?: string;
    filter?: {
      orderStatus?: string;
      paymentStatus?: string;
      startDate?: string;
      endDate?: string;
    };
  };
  [Screen.FILTERORDER]: undefined;
  [Screen.PROFILE]: undefined;
  [Screen.CHOOSE_ORDER_PRODUCT]: {
    selectedProducts?: any[];
    onProductsSelected?: (products: any[]) => void;
  };
  [Screen.CUSTOMER_SELECTION]: {
    onSelect?: (customer: any) => void;
  };
  [Screen.ORDER_DETAIL]: {
    orderId: string;
  };
  [Screen.ORDER_CANCEL]: {
    orderId: string;
    orderAmount: number;
    paymentStatus: string;
    orderStatus: string;
  };
  [Screen.PAYMENT_METHODS]: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    remainingAmount?: number;
    isPartialPayment?: boolean;
    isNewOrder?: boolean;
    onPaymentComplete?: (method: string, amount: number) => void;
  };
  [Screen.PROMOTION_LIST]: undefined;
  [Screen.PROMOTION_DETAIL]: {
    id: string;
  };
  [Screen.ADD_PROMOTION]: undefined;
  [Screen.UPDATE_PROMOTION]: {
    id: string;
  };
};

export type BottomRootStackParamList = {
  [Screen.HOME]: undefined;
  [Screen.ORDER]: undefined;
  [Screen.PRODUCT]: undefined;
  [Screen.STATISTICAL]: undefined;
  [Screen.MENU]: undefined;
};

export type TabParamList = {
  [Screen.DAYSCREEN]: undefined;
  [Screen.WEEKSCREEN]: undefined;
  [Screen.MONTHSCREEN]: undefined;
};
