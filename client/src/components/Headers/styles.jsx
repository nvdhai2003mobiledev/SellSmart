import {hp} from "../../helpers/common";
import {theme} from "../../constants/theme";
import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 5,
        gap: 10,
    },
    title: {
        fontSize: hp(2.7),
        fontWeight: theme.fontWeight.semiBold,
        color: theme.colors.textDark,
        marginTop: 7,
    },
    backButton: {
        position: "absolute",
        left: 0,
    },
});
