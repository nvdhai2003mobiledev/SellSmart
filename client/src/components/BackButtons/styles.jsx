import {theme} from "../../constants/theme";
import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    button: {
        alignSelf: "flex-start",
        padding: 5,
        borderRadius: theme.radius.sm,
        backgroundColor: "rgba(0,0,0,0.07)",
        marginTop: 20,
    },
});
