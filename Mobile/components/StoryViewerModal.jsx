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
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
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
  const [activeStory, setActiveStory] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const stories = storyGroup?.stories || [];
  const currentStory = stories[storyIndex] || activeStory;
  const isAuthor = currentStory?.user?._id === currentUser?._id || storyGroup?.isCurrentUser;

  // Gesture handling for Swipe-Down-to-Close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 15;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            panY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && stories.length > 0) {
      setStoryIndex(0);
      setActiveStory(stories[0]);
      panY.setValue(0);
    }
  }, [visible, storyGroup]);

  useEffect(() => {
    if (!visible || !currentStory) return;

    setActiveStory(currentStory);
    markViewed(currentStory._id);

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });

    if (!showComments && !showViewers && !isPaused) {
      animation.start(({ finished }) => {
        if (finished) {
          nextStory();
        }
      });
    } else {
      progressAnim.stopAnimation();
    }

    return () => progressAnim.stopAnimation();
  }, [visible, storyIndex, showComments, showViewers, isPaused]);

  const markViewed = async (storyId) => {
    try {
      await fetch(`${API_URL}/stories/${storyId}/view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("View record error:", err);
    }
  };

  const nextStory = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentStory) return;
    try {
      const response = await fetch(`${API_URL}/stories/${currentStory._id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setActiveStory((prev) => ({
          ...prev,
          likes: data.likes,
        }));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentStory) return;
    try {
      const response = await fetch(`${API_URL}/stories/${currentStory._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setActiveStory((prev) => ({
          ...prev,
          comments: data.comments,
        }));
        setCommentText("");
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const fetchViewers = async () => {
    if (!currentStory) return;
    try {
      setLoadingViewers(true);
      setShowViewers(true);
      const response = await fetch(`${API_URL}/stories/${currentStory._id}/viewers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setViewersList(data.viewers || []);
      }
    } catch (err) {
      console.error("Viewers fetch error:", err);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleDeleteStory = () => {
    if (!currentStory) return;
    Alert.alert("Delete Story", "Are you sure you want to delete this story?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/stories/${currentStory._id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              if (onStoryDeleted) onStoryDeleted(currentStory._id);
              onClose();
            }
          } catch (err) {
            console.error("Delete error:", err);
          }
        },
      },
    ]);
  };

  if (!currentStory) return null;

  const isLiked = currentStory.likes?.some((id) => id.toString() === currentUser?._id);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: panY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* MEDIA DISPLAY (FULL BACKGROUND) */}
        {currentStory.mediaUrl ? (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={styles.fullMedia}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.quoteCardBackground}>
            <Ionicons name="quote" size={48} color="#81c784" style={{ marginBottom: 16 }} />
            <Text style={styles.quoteCardText}>"{currentStory.quote}"</Text>
            {currentStory.bookTitle ? (
              <Text style={styles.quoteBookTitle}>— {currentStory.bookTitle}</Text>
            ) : null}
          </View>
        )}

        {/* TAP & HOLD DETECTORS (LEFT / RIGHT TOUCH ZONES WITH PRESS IN / OUT HOLD-TO-PAUSE) */}
        <TouchableWithoutFeedback
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          onPress={prevStory}
        >
          <View style={styles.leftTouchZone} />
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          onPress={nextStory}
        >
          <View style={styles.rightTouchZone} />
        </TouchableWithoutFeedback>

        {/* CONTROLS OVERLAY (HIDDEN ON HOLD-TO-PAUSE) */}
        {!isPaused && (
          <KeyboardAvoidingView
            style={styles.overlayControls}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* TOP PROGRESS BARS */}
            <View style={styles.progressBarContainer}>
              {stories.map((s, idx) => (
                <View key={s._id} style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          idx === storyIndex
                            ? progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                              })
                            : idx < storyIndex
                            ? "100%"
                            : "0%",
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* AUTHOR HEADER */}
            <View style={styles.authorHeader}>
              <View style={styles.authorInfo}>
                {storyGroup?.user?.profileImage ? (
                  <Image
                    source={{ uri: storyGroup.user.profileImage }}
                    style={styles.authorAvatar}
                  />
                ) : (
                  <View style={styles.authorAvatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {storyGroup?.user?.username ? storyGroup.user.username[0].toUpperCase() : "U"}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.authorName}>{storyGroup?.user?.username || "user"}</Text>
                  <Text style={styles.timeAgo}>Expires in 24h</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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

            {/* OVERLAY TEXT / CAPTION */}
            {currentStory.caption ? (
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{currentStory.caption}</Text>
              </View>
            ) : null}

            {/* BOTTOM ACTION BAR */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleLikeToggle} style={styles.footerActionBtn}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={26}
                  color={isLiked ? "#ff3040" : "#ffffff"}
                />
                <Text style={styles.footerActionText}>{currentStory.likes?.length || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowComments(!showComments)}
                style={styles.footerActionBtn}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
                <Text style={styles.footerActionText}>{currentStory.comments?.length || 0}</Text>
              </TouchableOpacity>

              {isAuthor && (
                <TouchableOpacity onPress={fetchViewers} style={styles.footerActionBtn}>
                  <Ionicons name="eye-outline" size={24} color="#ffffff" />
                  <Text style={styles.footerActionText}>{currentStory.viewers?.length || 0}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* COMMENTS SHEET */}
            {showComments && (
              <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Replies</Text>
                  <TouchableOpacity onPress={() => setShowComments(false)}>
                    <Ionicons name="close" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.sheetScroll}>
                  {currentStory.comments?.map((c, i) => (
                    <View key={i} style={styles.commentItem}>
                      <Text style={styles.commentAuthor}>{c.user?.username || "user"}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Send message..."
                    placeholderTextColor={COLORS.placeholderText}
                  />
                  <TouchableOpacity onPress={handleAddComment} style={styles.sendBtn}>
                    <Ionicons name="send" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* VIEWERS SHEET */}
            {showViewers && (
              <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Story Views ({viewersList.length})</Text>
                  <TouchableOpacity onPress={() => setShowViewers(false)}>
                    <Ionicons name="close" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                {loadingViewers ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView style={styles.sheetScroll}>
                    {viewersList.map((v, i) => (
                      <View key={i} style={styles.viewerRow}>
                        <Ionicons name="person-circle" size={32} color={COLORS.primary} />
                        <Text style={styles.viewerName}>{v.user?.username || "user"}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullMedia: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  quoteCardBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1b4323",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  quoteCardText: {
    color: "#ffffff",
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
  },
  quoteBookTitle: {
    color: "#81c784",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  leftTouchZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.3,
    zIndex: 10,
  },
  rightTouchZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.7,
    zIndex: 10,
  },
  overlayControls: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 25,
    justifyContent: "space-between",
    zIndex: 20,
  },
  progressBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
  },
  authorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  authorAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarLetter: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  authorName: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  timeAgo: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
  },
  iconBtn: {
    padding: 6,
  },
  captionContainer: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  captionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 30,
  },
  footerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  footerActionText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: height * 0.45,
    zIndex: 40,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  sheetScroll: {
    maxHeight: 180,
    marginVertical: 10,
  },
  commentItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textDark,
  },
  sendBtn: {
    backgroundColor: "#0095f6",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  viewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
});
