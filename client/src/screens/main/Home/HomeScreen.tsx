import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Screen, Text } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useNavigation } from '@react-navigation/native';
import { AppStackScreenProps } from '../../../navigators';
import { IconFontAwesome } from '../../../components/Icon/Icon';
import { Screen as ScreenEnum } from '../../../navigation/navigation.type';

export const HomeScreen = observer(function HomeScreen() {
  const navigation = useNavigation<AppStackScreenProps<any>['navigation']>();

  const navigateToProvider = () => {
    navigation.navigate(ScreenEnum.PROVIDER);
  };

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={['top']}
      contentContainerStyle={styles.container}
    >
      <Text preset="heading" text="Trang chủ" style={styles.title} />

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={navigateToProvider}>
          <IconFontAwesome name="users" size={30} color={colors.primary} />
          <Text style={styles.menuText}>Nhà cung cấp</Text>
        </TouchableOpacity>
        
        {/* Add more menu items here */}
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.medium,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: spacing.large,
  },
  menuItem: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: colors.palette.neutral100,
    borderRadius: 12,
    padding: spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.medium,
    shadowColor: colors.palette.neutral900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuText: {
    marginTop: spacing.small,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
}); 