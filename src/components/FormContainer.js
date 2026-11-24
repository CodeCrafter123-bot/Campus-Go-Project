import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/colors";

// wrapper for screens with forms such as login and checkout .
export default function FormContainer({ children, contentStyle }) {
  return (

    //it passes filed or labels or buttons placed  between 
    <KeyboardAvoidingView
      style={styles.flex}
      //identify the os to know which os wokring to make the padding 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >

      
      <ScrollView
      //to make all the fields reachable 
        style={styles.flex}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48 },
});
