import React, {useState} from 'react';
import {StyleSheet, TouchableOpacity, View, Animated} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Screen, RootStackParamList} from './navigation.type';
import {DayScreen, WeekScreen, MonthScreen} from '../screens';
import {color, moderateScale, scaleHeight, scaleWidth} from '../utils';
import {contents} from '../context';
import {DynamicText, Header} from '../components';
import {
  Notification,
  DocumentText,
  ShoppingBag,
  Profile2User,
  Box,
  PercentageSquare,
  Chart1,
  UserAdd,
  UserEdit,
  More,
  ArrowRight2,
  Building,
  UserOctagon,
  Add,
} from 'iconsax-react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const Tab = createMaterialTopTabNavigator();

type MyTabsProps = {
  state: any;
  descriptors: {[key: string]: {options: any}};
  navigation: any;
};

const MyTabs = ({state, descriptors, navigation}: MyTabsProps) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: any) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabItem, isFocused ? styles.tabItemActive : null]}>
            <DynamicText style={styles.tabText}>{label}</DynamicText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Create a reusable QuickAccessCard component with animation
const QuickAccessCard = ({
  icon,
  title,
  color,
  gradientColors,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  gradientColors?: string[];
  onPress: () => void;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 400,
      useNativeDriver: true,
    }).start();
  };

  const colors = gradientColors || [color, shadeColor(color, -15)];

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}>
      <Animated.View style={[styles.card, {transform: [{scale: scaleAnim}]}]}>
        <LinearGradient
          colors={colors}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.cardGradient}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>{icon}</View>
            <DynamicText style={styles.cardTitle}>{title}</DynamicText>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Function to display the More menu
const MoreMenu = ({
  visible,
  onClose,
  navigation,
}: {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}) => {
  if (!visible) return null;

  const menuItems = [
    {
      icon: <UserAdd size={20} color="#FFFFFF" variant="Bold" />,
      title: 'Nhân viên',
      color: '#FF9500',
      onPress: () => {
        onClose();
        navigation.navigate(Screen.EMPLOYEES as any);
      },
    },
    {
      icon: <UserEdit size={20} color="#FFFFFF" variant="Bold" />,
      title: 'Hồ sơ',
      color: '#5856D6',
      onPress: () => {
        onClose();
        navigation.navigate(Screen.PROFILE as any);
      },
    },
    {
      icon: <Building size={20} color="#FFFFFF" variant="Bold" />,
      title: 'Cửa hàng',
      color: '#007AFF',
      onPress: () => {
        onClose();
        navigation.navigate(Screen.SETTINGS as any);
      },
    },
    {
      icon: <UserOctagon size={20} color="#FFFFFF" variant="Bold" />,
      title: 'Tài khoản',
      color: '#34C759',
      onPress: () => {
        onClose();
        navigation.navigate(Screen.PROFILE as any);
      },
    },
  ];

  return (
    <TouchableOpacity
      style={styles.moreMenuOverlay}
      activeOpacity={1}
      onPress={onClose}>
      <View style={styles.moreMenuContainer}>
        <View style={styles.moreMenuHeader}>
          <DynamicText style={styles.moreMenuTitle}>Truy cập nhanh</DynamicText>
          <TouchableOpacity onPress={onClose}>
            <Add
              size={24}
              color={color.accentColor.darkColor}
              style={{transform: [{rotate: '45deg'}]}}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.moreMenuContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.moreMenuItem}
              onPress={item.onPress}>
              <View
                style={[
                  styles.moreMenuIconContainer,
                  {backgroundColor: item.color},
                ]}>
                {item.icon}
              </View>
              <DynamicText style={styles.moreMenuItemText}>
                {item.title}
              </DynamicText>
              <ArrowRight2 size={16} color={color.accentColor.grayColor} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Helper function to darken or lighten a color
function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const RR =
    R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16);
  const GG =
    G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16);
  const BB =
    B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16);

  return '#' + RR + GG + BB;
}

const TabNav = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <View style={styles.container}>
      <Header
        title={contents.appName}
        RightIcon={
          <Notification
            size={24}
            color={color.accentColor.darkColor}
            variant="Linear"
            style={{marginEnd: scaleWidth(20)}}
          />
        }
        showRightIcon={true}
      />

      {/* Card-based Quick Access Section with Header */}
      <View style={styles.quickAccessSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Chart1 size={18} color={color.accentColor.darkColor} />
            <DynamicText style={styles.sectionTitle}>
              Truy cập nhanh
            </DynamicText>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <QuickAccessCard
            icon={<DocumentText size={30} color="#FFFFFF" variant="Bold" />}
            title="Đơn hàng"
            color="#0077FF"
            gradientColors={['#0077FF', '#0066DD']}
            onPress={() => navigation.navigate(Screen.CREATEORDER as any)}
          />

          <QuickAccessCard
            icon={<Box size={30} color="#FFFFFF" variant="Bold" />}
            title="Sản phẩm"
            color="#EE0033"
            gradientColors={['#EE0033', '#DD0033']}
            onPress={() => navigation.navigate(Screen.PRODUCT as any)}
          />

          <QuickAccessCard
            icon={<Profile2User size={30} color="#FFFFFF" variant="Bold" />}
            title="Khách hàng"
            color="#00CC6A"
            gradientColors={['#00CC6A', '#00BB60']}
            onPress={() => navigation.navigate(Screen.CUSTOMERS as any)}
          />

          <QuickAccessCard
            icon={<PercentageSquare size={30} color="#FFFFFF" variant="Bold" />}
            title="Khuyến mãi"
            color="#37BCAC"
            gradientColors={['#37BCAC', '#2AA99C']}
            onPress={() => navigation.navigate(Screen.PROMOTION_LIST as any)}
          />

          <QuickAccessCard
            icon={<ShoppingBag size={30} color="#FFFFFF" variant="Bold" />}
            title="Nhà cung cấp"
            color="#4A6FFF"
            gradientColors={['#4A6FFF', '#3A5FEE']}
            onPress={() => navigation.navigate(Screen.PROVIDER as any)}
          />
          <QuickAccessCard
            icon={<Add size={30} color="#FFFFFF" variant="Linear" />}
            title="Thêm"
            color="#4A6FFF"
            gradientColors={['#4A6FFF', '#3A5FEE']}
            onPress={() => navigation.navigate(Screen.PROVIDER as any)}
          />
        </View>
      </View>

      <Tab.Navigator
        initialRouteName={Screen.DAYSCREEN}
        tabBar={props => <MyTabs {...props} />}>
        <Tab.Screen
          name={Screen.DAYSCREEN}
          component={DayScreen}
          options={{
            tabBarLabel: contents.home.today,
          }}
        />
        <Tab.Screen
          name={Screen.WEEKSCREEN}
          component={WeekScreen}
          options={{
            tabBarLabel: contents.home.week,
          }}
        />
        <Tab.Screen
          name={Screen.MONTHSCREEN}
          component={MonthScreen}
          options={{
            tabBarLabel: contents.home.month,
          }}
        />
      </Tab.Navigator>

      {/* More Menu Modal */}
      <MoreMenu
        visible={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        navigation={navigation}
      />
    </View>
  );
};

export default TabNav;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  // New Card-based Quick Access styles
  quickAccessSection: {
    marginVertical: scaleHeight(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    marginBottom: scaleHeight(8),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: color.accentColor.darkColor,
    marginLeft: moderateScale(6),
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: moderateScale(16),
    justifyContent: 'space-between',
    marginBottom: scaleHeight(30),
  },
  cardContainer: {
    width: '15.8%',
    height: scaleHeight(170),
    marginHorizontal: moderateScale(1),
  },
  card: {
    borderRadius: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    height: '100%',
  },
  cardGradient: {
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: moderateScale(5),
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: scaleHeight(10),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  cardTitle: {
    fontSize: moderateScale(11),
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // More Menu Styles
  moreMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  moreMenuContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  moreMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  moreMenuTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: color.accentColor.darkColor,
  },
  moreMenuContent: {
    paddingVertical: moderateScale(8),
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  moreMenuIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  moreMenuItemText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
  },
  // Original Tab Navigation styles
  tabBar: {
    borderRadius: moderateScale(12),
    height: scaleHeight(90),
    backgroundColor: '#EBEBEC',
    flexDirection: 'row',
    marginHorizontal: moderateScale(16),
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(3),
    marginBottom: scaleHeight(30),
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  tabItemActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#000',
    fontSize: moderateScale(14),
  },
});
