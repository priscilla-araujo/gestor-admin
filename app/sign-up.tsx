// app/sign-up.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

const COLORS = {
  primary: "#007BFF",
  primaryDark: "#0052CC",
  bg: "#F4F7FB",
  text: "#1A1A1A",
};

const SignUpScreen: React.FC = () => {
  const [name, setName] = useState("");
  const [condoName, setCondoName] = useState("");
  const [floor, setFloor] = useState("");
  const [block, setBlock] = useState("");
  const [fraction, setFraction] = useState(""); // opcional
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;

    // ✅ validar campos obrigatórios
    if (!name || !condoName || !floor || !block || !email || !password) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha todos os campos, exceto fração que é opcional."
      );
      return;
    }

    try {
      setLoading(true);

      // ✅ criar usuário no Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // ✅ salvar dados
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });

        const userRef = doc(db, "users", cred.user.uid);
        await setDoc(userRef, {
          name,
          condoName,
          floor,
          block,
          fraction: fraction ? fraction : null,
          email: email.trim(),
          createdAt: serverTimestamp(),
        });
      }

      // ✅ evita que o app “pule” de tela por login automático
      await signOut(auth);

      // ✅ limpar (opcional)
      setName("");
      setCondoName("");
      setFloor("");
      setBlock("");
      setFraction("");
      setEmail("");
      setPassword("");

      // ✅ volta pro login (index) de forma garantida
      router.dismissAll();
      router.replace("./");

      // ✅ alerta por cima do login
      setTimeout(() => {
        Alert.alert("Cadastro realizado!", "Usuário criado com sucesso.");
      }, 250);
    } catch (error: any) {
      console.log("Erro no cadastro:", error);

      let message = "Não foi possível gravar o cadastro. Tente novamente.";

      if (error?.code === "auth/email-already-in-use") {
        message = "Este email já está cadastrado. Use outro email ou faça login.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Email inválido. Verifique e tente novamente.";
      } else if (error?.code === "auth/weak-password") {
        message = "Senha fraca. Use pelo menos 6 caracteres.";
      } else if (error?.code === "auth/operation-not-allowed") {
        message =
          "Cadastro por email/senha não está ativado no Firebase (Authentication).";
      } else if (error?.code === "auth/network-request-failed") {
        message = "Falha de rede. Verifique sua internet e tente novamente.";
      } else if (typeof error?.message === "string") {
        message = error.message;
      }

      Alert.alert("Erro ao cadastrar", message);
    } finally {
      setLoading(false);
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
          <Text style={styles.appTitle}>Criar conta</Text>
          <Text style={styles.appSubtitle}>
            Preencha seus dados do condomínio
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações pessoais</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="#9FA5C0"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.sectionTitle}>Condomínio</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do condomínio"
            placeholderTextColor="#9FA5C0"
            value={condoName}
            onChangeText={setCondoName}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <TextInput
                style={styles.input}
                placeholder="Andar"
                placeholderTextColor="#9FA5C0"
                value={floor}
                onChangeText={setFloor}
              />
            </View>
            <View style={styles.col}>
              <TextInput
                style={styles.input}
                placeholder="Bloco"
                placeholderTextColor="#9FA5C0"
                value={block}
                onChangeText={setBlock}
              />
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Fração (opcional)"
            placeholderTextColor="#9FA5C0"
            value={fraction}
            onChangeText={setFraction}
          />

          <Text style={styles.sectionTitle}>Acesso</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9FA5C0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#9FA5C0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Gravar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 10 }}
            onPress={() => {
              router.dismissAll();
              router.replace("./");
            }}
          >
            <Text style={styles.linkText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 80,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  appTitle: { color: "#FFF", fontSize: 24, fontWeight: "700" },
  appSubtitle: { color: "#E3EEFF", fontSize: 14, marginTop: 6 },
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F5F7FB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E5F2",
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  linkText: {
    marginTop: 4,
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "500",
  },
});

export default SignUpScreen;
