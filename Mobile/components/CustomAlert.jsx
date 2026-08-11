import { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

export default function CustomAlert({
  visible,
  title,
  message,
  type = "info", // "success" | "error" | "confirm" | "info"
  buttons = [],
  onClose,
}) {
  const scaleValue = useRef(new Animated.Value(0.7)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const renderIcon = () => {
    switch (type) {
      case "success":
        return (
          <View style={[styles.iconBadge, { backgroundColor: "#e8f5e9" }]}>
            <Ionicons name="checkmark-circle" size={42} color={COLORS.primary} />
          </View>
        );
      case "error":
        return (
          <View style={[styles.iconBadge, { backgroundColor: "#ffebee" }]}>
            <Ionicons name="alert-circle" size={42} color="#e53935" />
          </View>
        );
      case "confirm":
        return (
          <View style={[styles.iconBadge, { backgroundColor: "#e3f2fd" }]}>
            <Ionicons name="help-circle" size={42} color="#1e88e5" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconBadge, { backgroundColor: COLORS.inputBackground }]}>
            <Ionicons name="information-circle" size={42} color={COLORS.primary} />
          </View>
        );
    }
  };

  const defaultButtons = [{ text: "OK", onPress: onClose }];
  const actionButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityValue }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* ICON BADGE */}
          {renderIcon()}

          {/* TITLE & MESSAGE */}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* BUTTONS ROW */}
          <View
            style={[
              styles.buttonsRow,
              actionButtons.length > 2 && { flexDirection: "column" },
            ]}
          >
            {actionButtons.map((btn, index) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";

              let btnStyle = styles.primaryButton;
              let textStyle = styles.primaryButtonText;

              if (isCancel) {
                btnStyle = styles.cancelButton;
                textStyle = styles.cancelButtonText;
              } else if (isDestructive) {
                btnStyle = styles.destructiveButton;
                textStyle = styles.destructiveButtonText;
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.button, btnStyle]}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    onClose();
                  }}
                >
                  <Text style={[styles.buttonText, textStyle]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  destructiveButton: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  destructiveButtonText: {
    color: "#e53935",
    fontWeight: "700",
  },
  buttonText: {
    fontSize: 14,
  },
});
