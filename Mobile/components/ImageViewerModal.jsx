import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function ImageViewerModal({
  visible,
  imageUri,
  title,
  onClose,
}) {
  const scaleValue = useRef(new Animated.Value(0.6)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  const userScale = useRef(new Animated.Value(1)).current;
  const [zoomLevel, setZoomLevel] = useState(1);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: 150,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      panY.setValue(0);
      userScale.setValue(1);
      setZoomLevel(1);
      onClose();
    });
  };

  const handleZoomIn = () => {
    const next = Math.min(zoomLevel + 0.5, 3.0);
    setZoomLevel(next);
    Animated.spring(userScale, { toValue: next, useNativeDriver: true }).start();
  };

  const handleZoomOut = () => {
    const next = Math.max(zoomLevel - 0.5, 1.0);
    setZoomLevel(next);
    Animated.spring(userScale, { toValue: next, useNativeDriver: true }).start();
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    Animated.spring(userScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0 && zoomLevel === 1) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (zoomLevel === 1 && (gestureState.dy > 120 || gestureState.vy > 0.6)) {
          closeWithAnimation();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      scaleValue.setValue(0.5);
      opacityValue.setValue(0);
      userScale.setValue(1);
      setZoomLevel(1);

      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const backdropOpacity = panY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.4],
    extrapolate: "clamp",
  });

  const combinedScale = Animated.multiply(scaleValue, userScale);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: opacityValue }]}>
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />

        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

        <SafeAreaView style={styles.safeArea}>
          {/* HEADER BAR */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={closeWithAnimation}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title || "Image Preview"}
              </Text>
              <Text style={styles.headerSubtitle}>Tap image or use controls to zoom</Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleResetZoom}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* MAIN IMAGE CONTAINER WITH DRAG / ZOOM */}
          <View style={styles.imageWrapper} {...panResponder.panHandlers}>
            <Animated.View
              style={{
                transform: [
                  { scale: combinedScale },
                  { translateY: panY },
                ],
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.fullImage}
                  contentFit="contain"
                  transition={200}
                />
              ) : null}
            </Animated.View>
          </View>

          {/* ZOOM CONTROLS OVERLAY BAR */}
          <View style={styles.zoomBar}>
            <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
              <Ionicons name="remove" size={20} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.zoomPill}>
              <Text style={styles.zoomPillText}>{Math.round(zoomLevel * 100)}%</Text>
            </View>

            <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  resetText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 1,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullImage: {
    width: width * 0.92,
    height: height * 0.75,
    borderRadius: 12,
  },
  zoomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 20,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  zoomPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
});
