export enum Screen {
  SPLASH = 'SPLASH',
  LOGIN = 'LOGIN',
  BOTTOM_TAB = 'BOTTOM_TAB',
  HOME = 'HOME',
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  STATISTICAL = 'STATISTICAL',
  MENU = 'MENU'
}

export type RootStackParamList = {
  [Screen.SPLASH]: undefined;
  [Screen.LOGIN]: undefined;
  [Screen.BOTTOM_TAB]: undefined;
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
