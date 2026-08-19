import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../constants/colors";

const INSTAGRAM_GRADIENT = ["#CA1D7E", "#E35157", "#F2703F", "#F99C4B"];

export default function StoryBar({
  storyGroups = [],
  currentUser,
  onOpenCreateStory,
  onSelectStoryGroup,
}) {
  const safeGroups = Array.isArray(storyGroups) ? storyGroups : [];
  const currentUserGroup = safeGroups.find((g) => g && g.isCurrentUser);
  const otherGroups = safeGroups.filter((g) => g && !g.isCurrentUser);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* YOUR STORY (CURRENT USER) */}
        <TouchableOpacity
          style={styles.avatarItem}
          onPress={() => {
            if (currentUserGroup && currentUserGroup.stories.length > 0) {
              onSelectStoryGroup(currentUserGroup);
            } else {
              onOpenCreateStory();
            }
          }}
          activeOpacity={0.85}
        >
          <View style={styles.avatarWrapper}>
            {currentUserGroup && currentUserGroup.stories.length > 0 ? (
              <LinearGradient
                colors={INSTAGRAM_GRADIENT}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientRing}
              >
                <View style={styles.whiteGap}>
                  {currentUser?.profileImage ? (
                    <Image
                      source={{ uri: currentUser.profileImage }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={28} color="#8e8e8e" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.defaultAvatarContainer}>
                {currentUser?.profileImage ? (
                  <Image
                    source={{ uri: currentUser.profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={28} color="#8e8e8e" />
                  </View>
                )}
              </View>
            )}

            {/* BLUE (+) PLUS BADGE */}
            <TouchableOpacity
              style={styles.addBadge}
              onPress={onOpenCreateStory}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.avatarLabel} numberOfLines={1}>
            Your story
          </Text>
        </TouchableOpacity>

        {/* OTHER COMMUNITY MEMBERS' STORIES */}
        {otherGroups.map((group) => {
          const author = group.user;
          const isUnviewed = group.hasUnviewed;

          return (
            <TouchableOpacity
              key={author._id}
              style={styles.avatarItem}
              onPress={() => onSelectStoryGroup(group)}
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrapper}>
                {isUnviewed ? (
                  <LinearGradient
                    colors={INSTAGRAM_GRADIENT}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientRing}
                  >
                    <View style={styles.whiteGap}>
                      {author?.profileImage ? (
                        <Image
                          source={{ uri: author.profileImage }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>
                            {author?.username ? author.username[0].toUpperCase() : "U"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.viewedRing}>
                    <View style={styles.whiteGap}>
                      {author?.profileImage ? (
                        <Image
                          source={{ uri: author.profileImage }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>
                            {author?.username ? author.username[0].toUpperCase() : "U"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.avatarLabel} numberOfLines={1}>
                {author?.username || "user"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  avatarItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 76,
  },
  avatarWrapper: {
    position: "relative",
    width: 76,
    height: 76,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  viewedRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 1.5,
    borderWidth: 1.5,
    borderColor: "#c7c7c7",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  whiteGap: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    backgroundColor: "#ffffff",
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: "700",
    color: "#262626",
  },
  addBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#0095f6",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  avatarLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textPrimary,
    textAlign: "center",
    width: 74,
  },
});
