import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const FRAME_WIDTH = Math.min(width * 0.8, 300);
const FRAME_HEIGHT = Math.round(FRAME_WIDTH * 1.33); // 3:4 Book Ratio

export default function ImageCropModal({
  visible,
  imageUri,
  onSave,
  onClose,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const [currentScale, setCurrentScale] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      scale.setValue(1);
      panX.setValue(0);
      panY.setValue(0);
      setCurrentScale(1);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(gestureState.dx);
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Keep bounds reasonable
        const limitX = FRAME_WIDTH * 0.4;
        const limitY = FRAME_HEIGHT * 0.4;
        
        let targetX = Math.max(-limitX, Math.min(limitX, gestureState.dx));
        let targetY = Math.max(-limitY, Math.min(limitY, gestureState.dy));

        Animated.parallel([
          Animated.spring(panX, { toValue: targetX, useNativeDriver: true }),
          Animated.spring(panY, { toValue: targetY, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  const handleZoomIn = () => {
    const newScale = Math.min(currentScale + 0.25, 2.5);
    setCurrentScale(newScale);
    Animated.spring(scale, { toValue: newScale, useNativeDriver: true }).start();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(currentScale - 0.25, 0.8);
    setCurrentScale(newScale);
    Animated.spring(scale, { toValue: newScale, useNativeDriver: true }).start();
  };

  const handleReset = () => {
    setCurrentScale(1);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(panX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(panY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const handleApply = async () => {
    try {
      setSaving(true);
      // Return adjusted image URI & state
      if (onSave) {
        await onSave(imageUri);
      }
      onClose();
    } catch (err) {
      console.error("Crop save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* TOP BAR */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Adjust Cover Position & Zoom</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* CROP VIEWPORT FRAME */}
        <View style={styles.viewportContainer}>
          <View style={styles.cropFrame}>
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                width: "100%",
                height: "100%",
                transform: [
                  { scale: scale },
                  { translateX: panX },
                  { translateY: panY },
                ],
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
              />
            </Animated.View>

            {/* CROP GRID OVERLAY */}
            <View style={styles.gridOverlay} pointerEvents="none">
              <View style={styles.gridLineH1} />
              <View style={styles.gridLineH2} />
              <View style={styles.gridLineV1} />
              <View style={styles.gridLineV2} />
            </View>
          </View>

          <Text style={styles.hintText}>
            Drag to reposition • Use zoom controls below
          </Text>
        </View>

        {/* ZOOM CONTROLS BAR */}
        <View style={styles.controlsBar}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut}>
            <Ionicons name="remove-circle-outline" size={26} color={COLORS.white} />
            <Text style={styles.controlText}>Zoom Out</Text>
          </TouchableOpacity>

          <View style={styles.zoomBadge}>
            <Text style={styles.zoomText}>{Math.round(currentScale * 100)}%</Text>
          </View>

          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn}>
            <Ionicons name="add-circle-outline" size={26} color={COLORS.white} />
            <Text style={styles.controlText}>Zoom In</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER ACTIONS */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.applyText}>Save Cover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "space-between",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  resetText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  viewportContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  cropFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: "hidden",
    backgroundColor: "#111111",
    position: "relative",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH1: {
    position: "absolute",
    top: "33.3%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  gridLineH2: {
    position: "absolute",
    top: "66.6%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  gridLineV1: {
    position: "absolute",
    left: "33.3%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  gridLineV2: {
    position: "absolute",
    left: "66.6%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  hintText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 14,
  },
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  controlBtn: {
    alignItems: "center",
  },
  controlText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  zoomBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  zoomText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },
  applyBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
});
