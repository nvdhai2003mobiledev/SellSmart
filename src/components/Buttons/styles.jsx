import {theme} from "../../constants/theme";
import {hp} from "../../helpers/common";

export const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        height: hp(6),
        justifyContent: "center",
        alignItems: "center",
        borderCurve: "continuous",
        borderRadius: theme.radius.xl,
    },
    text: {
        fontSize: hp(2.2),
        color: theme.colors.white,
        fontWeight: theme.fontWeight.bold,
    },
});
