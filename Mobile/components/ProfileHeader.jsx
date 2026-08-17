import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "../store/authStore";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import styles from "../assets/styles/profile.styles";
import { formatMemberSince } from "../lib/utils";
import COLORS from "../constants/colors";

export default function ProfileHeader({
  booksSharedCount = 0,
  booksSavedCount = 0,
  avgRating = "0.0",
  onEditPress,
  onLogoutPress,
  onAvatarPress,
}) {
  const { user } = useAuthStore();

  if (!user) return null;

  const handleUsername = `@${user.username?.toLowerCase().replace(/\s+/g, "") || "user"}`;

  return (
    <View style={styles.card}>
      {/* TOP USER INFO SECTION */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onAvatarPress}
          activeOpacity={0.85}
        >
          <Image
            source={{
              uri:
                user.profileImage ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
            }}
            style={styles.avatar}
          />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-sharp" size={12} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{user.username}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Ionicons name="at-outline" size={13} color={COLORS.primary} />
            <Text style={styles.handleText}>{handleUsername.replace("@", "")}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Ionicons name="mail-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.emailText}>{user.email}</Text>
          </View>
          <View style={styles.memberBadge}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={COLORS.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.memberText}>
              Joined {user.createdAt ? formatMemberSince(user.createdAt) : "Recently"}
            </Text>
          </View>
        </View>
      </View>

      {/* BIO SECTION */}
      {user.bio ? (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 12, paddingHorizontal: 2 }}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 13, color: COLORS.textDark, lineHeight: 18, fontStyle: "italic" }}>
            "{user.bio}"
          </Text>
        </View>
      ) : null}

      {/* GENRE & READING GOAL BADGES */}
      {(user.favoriteGenre || user.readingGoal) ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {user.favoriteGenre ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: COLORS.inputBackground,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Ionicons name="heart" size={12} color={COLORS.primary} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textPrimary }}>
                {user.favoriteGenre}
              </Text>
            </View>
          ) : null}

          {user.readingGoal ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: COLORS.inputBackground,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Ionicons name="trophy-outline" size={12} color="#f4b400" />
              <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textDark }}>
                {user.readingGoal}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* DYNAMIC STATS GRID (3 COLUMNS) */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statNumber}>{booksSharedCount}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="book-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.statLabel}>Shared</Text>
          </View>
        </View>

        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statNumber}>{booksSavedCount}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="bookmark-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{avgRating}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="star-outline" size={12} color="#f4b400" />
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>

      {/* ACTION BUTTONS ROW */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Ionicons name="create-outline" size={18} color={COLORS.white} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}