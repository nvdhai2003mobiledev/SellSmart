export enum Screen {
  SPLASH = 'SPLASH',
  LOGIN = 'LOGIN',
  BOTTOM_TAB = 'BOTTOM_TAB',
  HOME = 'HOME',
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  STATISTICAL = 'STATISTICAL',
  MENU = 'MENU',
  STAFF='STAFF',
  ADDSTAFF='ADDSTAFF',
  STAFFDEATIL='STAFFDEATIL', //
  UPDATESTAFF='UPDATESTAFF',
  CUSTOMER='CUSTOMER',
  ADDCUSTOMER='ADDCUSTOMER',
  UPDATECUSTOMER='UPDATECUSTOMER',
  CUSTOMERDETAIL='CUSTOMERDETAIL',
  CONFIG='CONFIG',
  NOTIFI='NOTIFINOTIFI'
}

export type RootStackParamList = {
  [Screen.SPLASH]: undefined;
  [Screen.LOGIN]: undefined;
  [Screen.BOTTOM_TAB]: undefined;
  [Screen.STAFF]: undefined;
  [Screen.ADDSTAFF]:undefined;
  [Screen.STAFFDEATIL]:undefined;
  [Screen.UPDATESTAFF]:undefined;
  [Screen.CUSTOMER]:undefined;
  [Screen.ADDCUSTOMER]:undefined;
  [Screen.UPDATECUSTOMER]:undefined;
  [Screen.CUSTOMERDETAIL]:undefined;
  [Screen.CONFIG]:undefined;
  [Screen.NOTIFI]:undefined
};

export type BottomRootStackParamList = {
  [Screen.HOME]: undefined;
  [Screen.ORDER]: undefined;
  [Screen.PRODUCT]: undefined;
  [Screen.STATISTICAL]: undefined;
  [Screen.MENU]: undefined;

};

export type TopParamList = {

};
