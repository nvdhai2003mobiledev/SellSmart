import React, {ReactNode, useEffect} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  DimensionValue,
  Animated,
  useWindowDimensions,
  Platform,
  ViewStyle,
} from 'react-native';
import {CloseCircle} from 'iconsax-react-native';
import {DynamicText} from '../DynamicText/DynamicText';
import {color, moderateScale, scaledSize, scaleWidth} from '../../utils';
import {Fonts} from '../../assets';
import LinearGradient from 'react-native-linear-gradient';

interface CustomModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  width?: DimensionValue;
  height?: DimensionValue;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  footerContent?: ReactNode;
  centerTitle?: boolean;
  headerGradient?: boolean;
  fullScreenOnMobile?: boolean;
}

export const CustomModal = ({
  visible,
  title,
  onClose,
  children,
  width = '80%',
  height = 'auto',
  showCloseButton = true,
  closeOnBackdropPress = true,
  animationType = 'fade',
  footerContent,
  centerTitle = false,
  headerGradient = false,
  fullScreenOnMobile = false,
}: CustomModalProps) => {
  // Get screen dimensions for responsive sizing
  const {width: screenWidth} = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // Animation value for fade effect
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Determine modal width based on device type
  const modalWidth = isTablet
    ? typeof width === 'string'
      ? width
      : `${Math.min(width as number, 600)}px`
    : fullScreenOnMobile
    ? '100%'
    : typeof width === 'string'
    ? width
    : `${Math.min(width as number, screenWidth - 40)}px`;

  // Handle animation on mount/unmount
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // Render header based on options
  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    const headerContent = (
      <View style={[styles.modalHeader, centerTitle && styles.centeredHeader]}>
        <DynamicText
          style={[
            styles.modalTitle,
            centerTitle && styles.centeredTitle,
            isTablet && styles.tabletTitle,
          ]}>
          {title}
        </DynamicText>

        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
            <CloseCircle
              size={isTablet ? 28 : 24}
              color={headerGradient ? 'white' : color.accentColor.darkColor}
              variant="Bold"
            />
          </TouchableOpacity>
        )}
      </View>
    );

    if (headerGradient) {
      return (
        <LinearGradient
          colors={[color.primaryColor, '#0055FF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradientHeader}>
          {headerContent}
        </LinearGradient>
      );
    }

    return headerContent;
  };

  return (
    <Modal
      animationType={animationType}
      transparent={true}
      visible={visible}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <Animated.View
        style={[styles.modalOverlay, {opacity: fadeAnim} as ViewStyle]}>
        <TouchableWithoutFeedback
          onPress={closeOnBackdropPress ? onClose : undefined}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  isTablet && styles.tabletModalContainer,
                  fullScreenOnMobile && !isTablet && styles.fullScreenContainer,
                  {
                    width: modalWidth,
                    height,
                    transform: [{scale: fadeAnim}],
                  } as ViewStyle,
                ]}>
                {renderHeader()}

                <View
                  style={[
                    styles.modalContent,
                    isTablet && styles.tabletModalContent,
                  ]}>
                  {children}
                </View>

                {footerContent && (
                  <View style={styles.modalFooter}>{footerContent}</View>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    maxHeight: '90%',
  },
  tabletModalContainer: {
    borderRadius: moderateScale(20),
    maxWidth: 700,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  fullScreenContainer: {
    borderRadius: 0,
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#F8F8F8',
  },
  centeredHeader: {
    justifyContent: 'center',
  },
  gradientHeader: {
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontFamily: Fonts.Inter_SemiBold,
    fontSize: scaledSize(22),
    color: color.accentColor.darkColor,
    flex: 1,
  },
  centeredTitle: {
    textAlign: 'center',
  },
  tabletTitle: {
    fontSize: scaledSize(24),
  },
  closeButton: {
    padding: scaleWidth(4),
    zIndex: 1,
  },
  modalContent: {
    padding: scaleWidth(20),
  },
  tabletModalContent: {
    padding: scaleWidth(26),
  },
  modalFooter: {
    padding: scaleWidth(16),
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
