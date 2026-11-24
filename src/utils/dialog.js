import { Alert, Platform } from "react-native";

/**
 * Same API as Alert.alert(title, message, buttons).
 * On phones it uses the native Alert. On the web (where Alert.alert does nothing)
 * it falls back to the browser's alert / confirm boxes.
 */

// helper function that shows alert or asks for a confirmation 
export function showAlert(title, message, buttons) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join("\n\n");
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Two choices: OK = the main (non-cancel) button, Cancel = the cancel button.
  const cancel = buttons.find((b) => b.style === "cancel");
  const main = buttons.find((b) => b !== cancel);
  if (window.confirm(`${text}\n\nOK = ${main.text}`)) main.onPress?.();
  else cancel?.onPress?.();
  //ok => confirms and return true 
  //cancel => return false 
}
