// app/comunicados.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
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

type Comunicado = {
  id: string;
  title: string;
  date: string;
  body: string;
};

const MOCK: Comunicado[] = [
  {
    id: "1",
    title: "Novo documento disponível: Ata_27AGO",
    date: "14/10/2019",
    body:
      "Um novo documento está disponível na área do condomínio. Acesse em Documentos para visualizar.",
  },
  {
    id: "2",
    title: "Weekend PET",
    date: "17/09/2019",
    body:
      "Evento pet no clube. Traga seu pet e participe! Consulte mais informações na administração.",
  },
  {
    id: "3",
    title: "Aviso inadimplência",
    date: "17/09/2019",
    body:
      "Caso tenha pendências, regularize o quanto antes para evitar juros e multas.",
  },
];

export default function ComunicadosScreen() {
  const renderItem = ({ item }: { item: Comunicado }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>

      <Text style={styles.cardBody} numberOfLines={4}>
        {item.body}
      </Text>

      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
        <Text style={styles.actionText}>Ver detalhes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Comunicados</Text>
        <Text style={styles.headerSubtitle}>Veja avisos e atualizações do condomínio</Text>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList
          data={MOCK}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 18 }}
          showsVerticalScrollIndicator={false}
        />
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
    marginTop: -18,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: { flex: 1, color: COLORS.text, fontWeight: "700", fontSize: 14 },
  cardDate: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  cardBody: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },

  actionBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: { color: COLORS.primary, fontWeight: "600" },
});
