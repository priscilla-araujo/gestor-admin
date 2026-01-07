import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primary: "#007BFF",
  primaryDark: "#0052CC",
  bg: "#F4F7FB",
  cardBg: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E6EBF5",
};

// 🔹 Dados fictícios (informativos)
const CONTACTS = {
  phoneMain: "+351 912 345 678",
  phoneSecondary: "+351 213 334 455",
  condoEmail: "contato@condominioexemplo.pt",
  sindicoEmail: "sindico@condominioexemplo.pt",
};

export default function ContatosScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Contatos</Text>
        <Text style={styles.headerSubtitle}>
          Informações de contato do condomínio
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Telefones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Telefones</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.infoLabel}>Portaria / Administração</Text>
              <Text style={styles.infoValue}>{CONTACTS.phoneMain}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.infoLabel}>Emergências</Text>
              <Text style={styles.infoValue}>{CONTACTS.phoneSecondary}</Text>
            </View>
          </View>
        </View>

        {/* Emails */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>E-mails</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.infoLabel}>Condomínio</Text>
              <Text style={styles.infoValue}>{CONTACTS.condoEmail}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.infoLabel}>Síndico</Text>
              <Text style={styles.infoValue}>{CONTACTS.sindicoEmail}</Text>
            </View>
          </View>
        </View>

        {/* Observação */}
        <View style={styles.card}>
          <Text style={styles.noteText}>
            Estes contatos são apenas informativos. Para solicitações formais,
            utilize os canais indicados pelo condomínio.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 10,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  headerSubtitle: { color: "#E3EEFF", fontSize: 13, marginTop: 4 },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 13,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  infoValue: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  noteText: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
});
