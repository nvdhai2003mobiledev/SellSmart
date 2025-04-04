export enum Screen {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  VERIFY = 'VERIFY',
  CREATE_PASSWORD = 'CREATE_PASSWORD',
  BOTTOM_TAB = 'BOTTOM_TAB',
  HOME = 'HOME',
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  STATISTICAL = 'STATISTICAL',
  MENU = 'MENU',
  ADD_EMPLOYEE = 'ADD_EMPLOYEE',
  DETAIL_EMPLOYEE = 'DETAIL_EMPLOYEE',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  EMPLOYEES = 'EMPLOYEES',
  CUSTOMERS = 'CUSTOMERS',
  ADD_CUSTOMER = 'ADD_CUSTOMER',
  UPDATE_CUSTOMER = 'UPDATECUSTOMER',
  DETAIL_CUSTOMER = 'DETAIL_CUSTOMER',
  CONFIG = 'CONFIG',
  NOTIFI = 'NOTIFINOTIFI',
  CREATEORDER ='CREATEORDER',
  ORDERSCREEN = 'ORDERSCREEN',
  ORDERLIST = 'ORDERLIST',
  FILTERORDER = 'FILTERORDER',
  DAYSCREEN = 'DAYSCREEN',
  WEEKSCREEN = 'WEEKSCREEN',
  MONTHSCREEN = 'MONTHSCREEN',
  PROFILE = 'PROFILE',
  CHOOSE_ORDER_PRODUCT = 'CHOOSE_ORDER_PRODUCT',
  CUSTOMER_SELECTION = 'CUSTOMER_SELECTION',
  ORDER_DETAIL = 'ORDER_DETAIL',
  ORDER_CANCEL = 'ORDER_CANCEL',
  PROMOTION_LIST = 'PROMOTION_LIST',
  PROMOTION_DETAIL = 'PROMOTION_DETAIL',
  ADD_PROMOTION = 'ADD_PROMOTION',
  UPDATE_PROMOTION = 'UPDATE_PROMOTION'
}

export type RootStackParamList = {
  [Screen.SPLASH]: undefined;
  [Screen.ONBOARDING]: undefined;
  [Screen.LOGIN]: undefined;
  [Screen.FORGOT_PASSWORD]: undefined;
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
