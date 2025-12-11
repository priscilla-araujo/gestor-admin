// app/index.tsx  → Tela de Login
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

import BlueButton from "../components/BlueButton";
import { useAuth } from "../context/AuthContext";

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }

    try {
      await login(email.trim(), password);
      // depois de logar vai para a Home
      router.replace("/home");
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Erro ao entrar",
        error?.message ?? "Verifique suas credenciais."
      );
    }
  };

  const goToForgot = () => {
    router.push("/forgot");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.container}>
        <Text style={styles.title}>gestorAdmin</Text>
        <Text style={styles.subtitle}>Faça login para acessar o condomínio</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <BlueButton title="Entrar" onPress={handleLogin} />

        <TouchableOpacity onPress={goToForgot}>
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#007BFF",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    color: "#555",
  },
  input: {
    backgroundColor: "#f0f0f0",
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 15,
  },
  forgotText: {
    marginTop: 14,
    textAlign: "center",
    color: "#007BFF",
    fontWeight: "500",
  },
});

export default LoginScreen;
