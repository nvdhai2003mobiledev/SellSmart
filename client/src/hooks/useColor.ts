import { useColorScheme } from 'react-native';
import { color } from '../utils';

export const useThemeColor = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark'
    ? color.accentColor.darkColor
    : color.backgroundColor;
};

export const useTextColor = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark'
    ? color.backgroundColor
    : color.accentColor.darkColor;
};
