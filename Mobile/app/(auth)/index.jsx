import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { Link } from "expo-router";
import styles from "../../assets/styles/login.styles";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { useAlert } from "../../context/AlertContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login, isCheckingAuth, sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } = useAuthStore();
  const { showAlert } = useAlert();

  // Forgot Password Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert({ title: "Missing Fields", message: "Please enter both email and password", type: "info" });
      return;
    }
    const result = await login(email.trim(), password);

    if (!result.success) {
      showAlert({ title: "Login Failed", message: result.error || "Invalid credentials", type: "error" });
    }
  };

  const handleOpenForgotModal = () => {
    setResetEmail(email || "");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotStep(1);
    setForgotModalVisible(true);
  };

  const handleCloseForgotModal = () => {
    setForgotModalVisible(false);
    setForgotStep(1);
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!resetEmail.trim()) {
      showAlert({ title: "Missing Email", message: "Please enter your registered email address", type: "info" });
      return;
    }

    setForgotLoading(true);
    const res = await sendForgotPasswordOtp(resetEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      showAlert({ title: "OTP Sent", message: res.message || "OTP code sent to your email", type: "success" });
      setForgotStep(2);
    } else {
      showAlert({ title: "Error", message: res.error || "Failed to send OTP", type: "error" });
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      showAlert({ title: "Missing OTP", message: "Please enter the 6-digit OTP code", type: "info" });
      return;
    }

    setForgotLoading(true);
    const res = await verifyForgotPasswordOtp(resetEmail.trim(), otpCode.trim());
    setForgotLoading(false);

    if (res.success) {
      showAlert({ title: "Verified", message: "OTP code verified successfully!", type: "success" });
      setForgotStep(3);
    } else {
      showAlert({ title: "Verification Failed", message: res.error || "Invalid OTP code", type: "error" });
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword) {
      showAlert({ title: "Missing Password", message: "Please enter a new password", type: "info" });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ title: "Weak Password", message: "Password must be at least 6 characters long", type: "info" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert({ title: "Password Mismatch", message: "New passwords do not match", type: "info" });
      return;
    }

    setForgotLoading(true);
    const res = await resetPassword(resetEmail.trim(), otpCode.trim(), newPassword);
    setForgotLoading(false);

    if (res.success) {
      setForgotStep(4);
    } else {
      showAlert({ title: "Reset Failed", message: res.error || "Failed to reset password", type: "error" });
    }
  };

  if (isCheckingAuth) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ILLUSTRATION */}
        <View style={styles.topIllustration}>
          <Image
            source={require("../../assets/images/i.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={handleOpenForgotModal}>
                  <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: "600" }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, { marginTop: 6 }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        visible={forgotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseForgotModal}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, elevation: 5 }}>
            {/* CLOSE BUTTON */}
            <TouchableOpacity
              onPress={handleCloseForgotModal}
              style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
            >
              <Ionicons name="close-circle-outline" size={26} color="#666" />
            </TouchableOpacity>

            {/* STEP 1: ENTER EMAIL */}
            {forgotStep === 1 && (
              <View>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Ionicons name="key-outline" size={40} color={COLORS.primary} />
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 8 }}>
                    Forgot Password
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginTop: 4 }}>
                    Enter your email to receive a 6-digit OTP code.
                  </Text>
                </View>

                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputContainer, { marginTop: 6, marginBottom: 20 }]}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter registered email"
                    placeholderTextColor={COLORS.placeholderText}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendOtp}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 2 && (
              <View>
                <TouchableOpacity
                  onPress={() => setForgotStep(1)}
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                >
                  <Ionicons name="arrow-back" size={16} color="#666" />
                  <Text style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>Back</Text>
                </TouchableOpacity>

                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.primary} />
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 8 }}>
                    Enter OTP
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginTop: 4 }}>
                    Code sent to {resetEmail}
                  </Text>
                </View>

                <Text style={styles.label}>6-Digit OTP</Text>
                <View style={[styles.inputContainer, { marginTop: 6, marginBottom: 20 }]}>
                  <TextInput
                    style={[styles.input, { textAlign: "center", letterSpacing: 8, fontSize: 20, fontWeight: "bold" }]}
                    placeholder="123456"
                    placeholderTextColor={COLORS.placeholderText}
                    value={otpCode}
                    onChangeText={(val) => setOtpCode(val.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyOtp}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSendOtp} style={{ alignSelf: "center", marginTop: 14 }}>
                  <Text style={{ fontSize: 12, color: COLORS.primary }}>Resend OTP Code</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {forgotStep === 3 && (
              <View>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Ionicons name="lock-closed-outline" size={40} color={COLORS.primary} />
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 8 }}>
                    New Password
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginTop: 4 }}>
                    Set your new account password.
                  </Text>
                </View>

                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputContainer, { marginTop: 6, marginBottom: 14 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={COLORS.placeholderText}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>

                <Text style={styles.label}>Confirm New Password</Text>
                <View style={[styles.inputContainer, { marginTop: 6, marginBottom: 20 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={COLORS.placeholderText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleResetPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 4: SUCCESS */}
            {forgotStep === 4 && (
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#22c55e" />
                <Text style={{ fontSize: 22, fontWeight: "bold", color: "#333", marginTop: 10 }}>
                  Success!
                </Text>
                <Text style={{ fontSize: 13, color: "#666", textAlign: "center", marginTop: 6, marginBottom: 20 }}>
                  Your password has been reset successfully. You can now log in with your new password.
                </Text>

                <TouchableOpacity
                  style={[styles.button, { width: "100%" }]}
                  onPress={handleCloseForgotModal}
                >
                  <Text style={styles.buttonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}