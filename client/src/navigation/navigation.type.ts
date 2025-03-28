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
  DAYSCREEN = 'DAYSCREEN',
  WEEKSCREEN = 'WEEKSCREEN',
  MONTHSCREEN = 'MONTHSCREEN',
  PROFILE = 'PROFILE'
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
  [Screen.CREATEORDER]: undefined;
  [Screen.ORDERSCREEN]: undefined;
  [Screen.ORDERLIST]: undefined;
  [Screen.PROFILE]: undefined;
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
