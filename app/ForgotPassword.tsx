// app/forgot-password.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  primary: "#007BFF",
  primaryDark: "#0052CC",
  bg: "#F4F7FB",
  text: "#1A1A1A",
};

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");

  const handleSend = async () => {
    if (!email) {
      Alert.alert("Atenção", "Informe o email.");
      return;
    }

    try {
      await forgotPassword(email.trim());
      Alert.alert(
        "Email enviado",
        "Verifique sua caixa de entrada para redefinir a senha."
      );
      router.back();
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Erro",
        error?.message ?? "Não foi possível enviar o email de recuperação."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.appTitle}>Recuperar senha</Text>
          <Text style={styles.appSubtitle}>
            Enviaremos um link para o seu email
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}></Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu email cadastrado"
            placeholderTextColor="#9FA5C0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSend}>
            <Text style={styles.primaryButtonText}>Enviar link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  appTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  appSubtitle: {
    color: "#E3EEFF",
    fontSize: 14,
    marginTop: 6,
  },
  card: {
    marginTop: 15,
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
    color: COLORS.text,
  },
  input: {
    backgroundColor: "#F5F7FB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E5F2",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
