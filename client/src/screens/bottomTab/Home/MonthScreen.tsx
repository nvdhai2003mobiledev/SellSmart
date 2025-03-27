import React from 'react';
import {StyleSheet, View} from 'react-native';
import {DynamicText} from '../../../components';
import {color, moderateScale} from '../../../utils';
import {contents} from '../../../context';

const MonthScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <DynamicText style={styles.title}>{contents.home.result}</DynamicText>
        <DynamicText style={styles.value}>{contents.home.price}</DynamicText>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <DynamicText style={styles.statTitle}>
            {contents.home.average_value}
          </DynamicText>
          <DynamicText style={styles.statValue}>
            {contents.home.price}
          </DynamicText>
        </View>
        <View style={styles.statCard}>
          <DynamicText style={styles.statTitle}>
            {contents.home.quantity_sale}
          </DynamicText>
          <DynamicText style={styles.statValue}>
            {contents.home.quantity}
          </DynamicText>
        </View>
      </View>
    </View>
  );
};

export default MonthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
  },
  card: {
    backgroundColor: 'white',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  title: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(8),
  },
  value: {
    fontSize: moderateScale(24),
    color: color.accentColor.darkColor,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  statTitle: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(8),
  },
  statValue: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    fontWeight: 'bold',
  },
});
