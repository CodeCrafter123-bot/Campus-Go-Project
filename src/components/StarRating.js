import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

// renders five stars screen using it to display existing rating 
export default function StarRating({ value, onChange, size = 32 }) {
  return (
    //using th emap craetes one pressable for each number 
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={onChange ? () => onChange(star) : undefined}
          disabled={!onChange}
          hitSlop={4}
          accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Ionicons
            name={star <= value ? "star" : "star-outline"}
            size={size}
            color={star <= value ? colors.accent : colors.textMuted}
            style={styles.star}
          />
        </Pressable>
      ))}
    </View>
  );
  //display five icons and fill all the stars where number less than or equal to the current rating 
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  star: { marginRight: 4 },
});
