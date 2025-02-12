import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { BackButton } from "@src/components";
import { hp, theme, wp } from "@src/utils";
import { Icon } from "@src/assets";

export const Header = ({
  title,
  showStartIcon = false,
  showEndIcon = false,
  onPressStartIcon = () => {},
  onPressEndIcon = () => {},
  iconSize
}) => {
  return (
    <View style={styles.container}>
      {showStartIcon && (
        <Pressable onPress={onPressStartIcon} style={styles.backButton}>
          <Icon
            name="arrowLeft"
            strokeWidth={2.5}
            size={iconSize}
            color={theme.colors.darkColor}
          />
        </Pressable>
      )}
      <Text style={styles.title}>{title || ""}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: wp(3),
  },
  title: {
    flex: 1,
    fontSize: hp(2.7),
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.darkColor,
    textAlign: "center",
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
