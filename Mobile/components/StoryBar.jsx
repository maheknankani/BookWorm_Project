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

const INSTAGRAM_GRADIENT = [
  "#CA1D7E",
  "#E35157",
  "#F2703F",
  "#F99C4B",
];

export default function StoryBar({
  storyGroups = [],
  currentUser,
  onOpenCreateStory,
  onSelectStoryGroup,
}) {
  const currentUserGroup = storyGroups.find((g) => g.isCurrentUser);
  const otherGroups = storyGroups.filter((g) => !g.isCurrentUser);

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
                      <Ionicons name="person" size={26} color="#8e8e8e" />
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
                    <Ionicons name="person" size={26} color="#8e8e8e" />
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  avatarItem: {
    alignItems: "center",
    marginHorizontal: 7,
    width: 72,
  },
  avatarWrapper: {
    position: "relative",
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  viewedRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 1.5,
    borderWidth: 1.5,
    borderColor: "#c7c7c7",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  whiteGap: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
    backgroundColor: "#ffffff",
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
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
    width: 22,
    height: 22,
    borderRadius: 11,
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
    marginTop: 5,
    fontSize: 11.5,
    fontWeight: "400",
    color: "#262626",
    textAlign: "center",
    width: 70,
  },
});
