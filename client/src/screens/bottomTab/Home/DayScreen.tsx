import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {BaseLayout, DynamicText} from '../../../components';
import {color, moderateScale, scaleHeight, scaleWidth} from '../../../utils';
import {
  ArrowRight2,
  DocumentText,
  Clock,
  CloseCircle,
} from 'iconsax-react-native';
import {useNavigation} from '@react-navigation/native';

const DayScreen = () => {
  const navigation = useNavigation<any>();
  const scrollY = useRef(0);
  const [bottomTabVisible, setBottomTabVisible] = useState(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    // Ẩn hoặc hiện bottom tab dựa trên hướng cuộn
    if (
      currentScrollY > scrollY.current &&
      bottomTabVisible &&
      currentScrollY > 20
    ) {
      // Cuộn xuống và bottom tab đang hiển thị -> ẩn đi
      setBottomTabVisible(false);
      navigation.getParent()?.setOptions({
        tabBarStyle: {display: 'none'},
      });
    } else if (currentScrollY < scrollY.current && !bottomTabVisible) {
      // Cuộn lên và bottom tab đang ẩn -> hiện lại
      setBottomTabVisible(true);
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          height: scaleHeight(65),
          borderRadius: moderateScale(20),
          position: 'absolute',
          bottom: scaleHeight(30),
          marginHorizontal: scaleWidth(30),
          paddingHorizontal: scaleHeight(20),
          shadowColor: color.accentColor.darkColor,
          shadowOffset: {width: 0, height: 10},
          shadowOpacity: 0.2,
          shadowRadius: moderateScale(20),
          elevation: moderateScale(20),
          backgroundColor: color.accentColor.whiteColor,
        },
      });
    }

    // Lưu lại vị trí cuộn hiện tại
    scrollY.current = currentScrollY;
  };

  return (
    <BaseLayout style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Tối ưu hiệu suất, chỉ gọi 16 lần/giây
      >
        {/* Card doanh thu */}
        <TouchableOpacity style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <DynamicText style={styles.revenueTitle}>
              Doanh thu hôm nay
            </DynamicText>
            <ArrowRight2 size={20} color={color.accentColor.grayColor} />
          </View>
          <View style={styles.revenueRow}>
            <DynamicText style={styles.revenueDate}>19/11/2024</DynamicText>
            <DynamicText style={styles.revenueAmount}>0đ</DynamicText>
          </View>
        </TouchableOpacity>

        {/* Biểu đồ */}
        <View style={styles.chartContainer}>
          <View style={styles.chartBar}>
            <View style={[styles.bar, {height: moderateScale(60)}]} />
            <DynamicText style={styles.barLabel}>Jan</DynamicText>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.bar, {height: moderateScale(100)}]} />
            <DynamicText style={styles.barLabel}>Feb</DynamicText>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.bar, {height: moderateScale(80)}]} />
            <DynamicText style={styles.barLabel}>Mar</DynamicText>
          </View>
          <View style={styles.chartBar}>
            <View
              style={[
                styles.bar,
                {
                  height: moderateScale(120),
                  backgroundColor: color.primaryColor,
                },
              ]}
            />
            <DynamicText style={styles.barLabel}>Apr</DynamicText>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.bar, {height: moderateScale(40)}]} />
            <DynamicText style={styles.barLabel}>May</DynamicText>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.bar, {height: moderateScale(90)}]} />
            <DynamicText style={styles.barLabel}>Jun</DynamicText>
          </View>
        </View>

        {/* Card giá trị đơn */}
        <TouchableOpacity style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <DynamicText style={styles.revenueTitle}>
              Giá trị tb đơn
            </DynamicText>
            <ArrowRight2 size={20} color={color.accentColor.grayColor} />
          </View>
          <View style={styles.revenueRow}>
            <DynamicText style={styles.revenueDate}>SL đang bán</DynamicText>
            <DynamicText style={styles.revenueAmount}>0</DynamicText>
          </View>
        </TouchableOpacity>

        {/* Kết quả kinh doanh */}
        <View style={styles.resultContainer}>
          <DynamicText style={styles.resultTitle}>
            Kết quả kinh doanh
          </DynamicText>
          <TouchableOpacity style={styles.resultItem}>
            <View style={styles.resultItemContent}>
              <View style={styles.iconContainer}>
                <DocumentText
                  size={24}
                  color={color.primaryColor}
                  variant="Bold"
                />
              </View>
              <View style={styles.resultLeft}>
                <DynamicText style={styles.resultItemTitle}>
                  Tổng đơn
                </DynamicText>
                <DynamicText style={styles.resultItemValue}>0</DynamicText>
              </View>
            </View>
            <ArrowRight2 size={20} color={color.accentColor.grayColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultItem}>
            <View style={styles.resultItemContent}>
              <View style={styles.iconContainer}>
                <Clock size={24} color="#FFA500" variant="Bold" />
              </View>
              <View style={styles.resultLeft}>
                <DynamicText style={styles.resultItemTitle}>
                  Chờ thanh toán
                </DynamicText>
                <DynamicText style={styles.resultItemValue}>0</DynamicText>
              </View>
            </View>
            <ArrowRight2 size={20} color={color.accentColor.grayColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resultItem, styles.lastItem]}>
            <View style={styles.resultItemContent}>
              <View style={styles.iconContainer}>
                <CloseCircle
                  size={24}
                  color={color.accentColor.errorColor}
                  variant="Bold"
                />
              </View>
              <View style={styles.resultLeft}>
                <DynamicText style={styles.resultItemTitle}>Hủy</DynamicText>
                <DynamicText style={styles.resultItemValue}>0</DynamicText>
              </View>
            </View>
            <ArrowRight2 size={20} color={color.accentColor.grayColor} />
          </TouchableOpacity>
        </View>

        {/* Thêm padding bottom để không che phần cuối cùng khi cuộn */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </BaseLayout>
  );
};

export default DayScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
    backgroundColor: color.backgroundColor,
  },
  revenueCard: {
    backgroundColor: 'white',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueRow: {
    marginTop: moderateScale(4),
  },
  revenueTitle: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
  },
  revenueDate: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(4),
  },
  revenueAmount: {
    fontSize: moderateScale(20),
    color: color.accentColor.darkColor,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
    height: moderateScale(200),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: scaleWidth(40),
    borderRadius: moderateScale(15),
    backgroundColor: color.accentColor.grayColor + '40',
    marginBottom: moderateScale(8),
  },
  barLabel: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  resultTitle: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: color.accentColor.grayColor + '10',
  },
  resultItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: moderateScale(12),
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  resultLeft: {
    flex: 1,
  },
  resultItemTitle: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
  },
  resultItemValue: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  bottomPadding: {
    height: moderateScale(100), // Tăng padding để tránh bị che bởi bottom tab
  },
});
