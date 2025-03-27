import React from 'react';
import {StyleSheet, View, Image, ImageSourcePropType} from 'react-native';
import {DynamicText} from '../DynamicText/DynamicText';
import {color, scaledSize, scaleHeight, scaleWidth} from '../../utils';
import {Fonts} from '../../assets';

interface EmptyStateProps {
  image: ImageSourcePropType;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  image,
  title,
  description,
}) => {
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} />
      <DynamicText style={styles.title}>{title}</DynamicText>
      <DynamicText style={styles.description}>{description}</DynamicText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaledSize(20),
  },
  image: {
    width: scaleWidth(200),
    height: scaleHeight(200),
    resizeMode: 'contain',
    marginBottom: scaleHeight(20),
  },
  title: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: scaleHeight(10),
    textAlign: 'center',
  },
  description: {
    fontSize: scaledSize(14),
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
});
