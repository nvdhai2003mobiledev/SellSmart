import {hp} from "../../helpers/common";
import {theme} from "../../constants/theme";
import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        height: hp(6),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0.4,
        borderColor: theme.colors.text,
        borderRadius: theme.radius.xl,
        borderCurve: "continuous",
        paddingHorizontal: 18,
        gap: 12,
    },
});
