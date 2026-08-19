import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  TextInput,
  TouchableWithoutFeedback,
  PanResponder,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

const { width, height } = Dimensions.get("window");

export default function StoryViewerModal({
  visible,
  onClose,
  storyGroup,
  currentUser,
  onStoryDeleted,
}) {
  const { token } = useAuthStore();
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");

  const progressAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const stories = storyGroup?.stories || [];
  const currentStory = stories[storyIndex];
  const author = storyGroup?.user || currentStory?.user;
  const isAuthor = author?._id === currentUser?._id || storyGroup?.isCurrentUser;

  // Swipe Down to Close gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 15,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          onClose();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setStoryIndex(0);
      panY.setValue(0);
    }
  }, [visible, storyGroup]);

  // Auto-progress segment timer (5 seconds)
  useEffect(() => {
    if (!visible || !currentStory || isPaused) return;

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNextStory();
      }
    });

    return () => animation.stop();
  }, [visible, storyIndex, isPaused]);

  const handleNextStory = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory?._id) return;
    try {
      const response = await fetch(`${API_URL}/stories/${currentStory._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        if (onStoryDeleted) onStoryDeleted();
        onClose();
      }
    } catch (err) {
      console.error("Delete story error:", err);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    Alert.alert("Reply Sent 💬", `Your message was sent to ${author?.username || "user"}!`);
    setReplyText("");
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: panY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <StatusBar backgroundColor="#0090a8" barStyle="light-content" />

        {/* FULL SCREEN MEDIA DISPLAY */}
        <View style={styles.mediaContainer}>
          {currentStory.mediaUrl ? (
            <Image source={{ uri: currentStory.mediaUrl }} style={styles.fullMedia} resizeMode="cover" />
          ) : (
            <View style={styles.textCanvas}>
              <Text style={styles.canvasText}>{currentStory.caption || "BookWorm Story"}</Text>
            </View>
          )}

          {/* CAPTION OVERLAY AT BOTTOM OF MEDIA */}
          {currentStory.caption && currentStory.mediaUrl ? (
            <View style={styles.captionBox}>
              <Text style={styles.captionText}>{currentStory.caption}</Text>
            </View>
          ) : null}
        </View>

        {/* TOP SEGMENTED PROGRESS BARS */}
        <View style={styles.topProgressContainer}>
          {stories.map((s, idx) => {
            let flexWidth = 0;
            if (idx < storyIndex) flexWidth = 1;
            else if (idx === storyIndex) {
              flexWidth = progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });
            }
            return (
              <View key={s._id || idx} style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: flexWidth ? Animated.multiply(flexWidth, width / stories.length) : 0 }]} />
              </View>
            );
          })}
        </View>

        {/* TOP AUTHOR ROW: AVATAR + USERNAME + TIME + CLOSE */}
        <View style={styles.topHeader}>
          <View style={styles.authorInfo}>
            <Image
              source={{ uri: author?.profileImage || "https://avatar.iran.liara.run/public" }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{author?.username || "YouName"}</Text>
            <Text style={styles.timeAgo}>2h</Text>
          </View>

          <View style={styles.headerRight}>
            {isAuthor && (
              <TouchableOpacity onPress={handleDeleteStory} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TOUCHABLE TAP NAVIGATION (LEFT / RIGHT & HOLD TO PAUSE) */}
        <View style={styles.touchOverlay}>
          <TouchableWithoutFeedback
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            onPress={handlePrevStory}
          >
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            onPress={handleNextStory}
          >
            <View style={{ flex: 2 }} />
          </TouchableWithoutFeedback>
        </View>

        {/* BOTTOM INTERACTION BAR (MATCHING SCREEN 3 WIREFRAME) */}
        <View style={styles.bottomBar}>
          {/* CAMERA ICON */}
          <TouchableOpacity style={styles.bottomIconBtn}>
            <Ionicons name="camera-outline" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* "Send Message" ROUNDED INPUT PILL */}
          <View style={styles.sendPillContainer}>
            <TextInput
              style={styles.sendPillInput}
              placeholder="Send Message"
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={replyText}
              onChangeText={setReplyText}
              onSubmitEditing={handleSendReply}
            />
            <TouchableOpacity onPress={handleSendReply} style={styles.sendInnerBtn}>
              <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 3-DOTS OPTIONS ICON */}
          <TouchableOpacity style={styles.bottomIconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* SHARE PAPER PLANE */}
          <TouchableOpacity style={styles.bottomIconBtn} onPress={handleSendReply}>
            <Ionicons name="paper-plane-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0090a8", // Matching Cyan Teal Theme from Wireframe Screen 3
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  fullMedia: {
    width: "100%",
    height: "100%",
  },
  textCanvas: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  canvasText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 34,
  },
  captionBox: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 12,
    borderRadius: 14,
  },
  captionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  topProgressContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
  },
  topHeader: {
    position: "absolute",
    top: 24,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    marginRight: 10,
  },
  username: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  timeAgo: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  bottomIconBtn: {
    padding: 6,
  },
  sendPillContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 42,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  sendPillInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    paddingVertical: 0,
  },
  sendInnerBtn: {
    paddingLeft: 6,
  },
});
