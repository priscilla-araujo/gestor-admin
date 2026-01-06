// app/documentos.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";

const COLORS = {
  primary: "#007BFF",
  primaryDark: "#0052CC",
  bg: "#F4F7FB",
  cardBg: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E6EBF5",
  dangerBg: "#FFE9E9",
  dangerBorder: "#FFB8B8",
  successBg: "#E9FFF0",
  successBorder: "#B8FFD0",
};

type Documento = {
  id: string;
  title: string;
  url: string;
  createdAt: number;
};

export default function DocumentosScreen() {
  const { isGestor } = useAuth();

  const [docsList, setDocsList] = useState<Documento[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // formulário gestor
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState<{ type: "error" | "success" | ""; text: string }>({
    type: "",
    text: "",
  });

  const docsRef = useMemo(() => collection(db, "documentos"), []);

  useEffect(() => {
    const q = query(docsRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Documento[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            title: v.title ?? "Documento",
            url: v.url ?? "",
            createdAt: v.createdAt ?? 0,
          };
        });
        setDocsList(list);
        setLoadingList(false);
      },
      (err) => {
        console.log("ERRO Firestore (documentos):", err);
        setLoadingList(false);
      }
    );

    return () => unsub();
  }, [docsRef]);

  const handleOpen = async (link: string) => {
    try {
      if (!link) return;
      const can = await Linking.canOpenURL(link);
      if (!can) return;
      await Linking.openURL(link);
    } catch (e) {
      console.log("Erro ao abrir documento:", e);
    }
  };

  async function handleAdd() {
    setMsg({ type: "", text: "" });

    const t = title.trim();
    const u = url.trim();

    if (!t || !u) {
      setMsg({ type: "error", text: "Preencha o nome do documento e o link." });
      return;
    }

    setSaving(true);
    try {
      await addDoc(docsRef, {
        title: t,
        url: u,
        createdAt: Date.now(),
      });

      setTitle("");
      setUrl("");
      setMsg({ type: "success", text: "Documento adicionado com sucesso!" });
    } catch (e) {
      console.log("Erro ao salvar documento:", e);
      setMsg({ type: "error", text: "Erro ao salvar. Verifique o Firestore." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, "documentos", id));
    } catch (e) {
      console.log("Erro ao apagar documento:", e);
      setMsg({ type: "error", text: "Erro ao apagar documento." });
    }
  }

  const renderItem = ({ item }: { item: Documento }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => handleOpen(item.url)}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>Toque para abrir / baixar</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {isGestor && (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            activeOpacity={0.85}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={18} color="#B00020" />
          </TouchableOpacity>
        )}
        <Ionicons name="open-outline" size={22} color={COLORS.muted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Documentos</Text>
        <Text style={styles.headerSubtitle}>Arquivos do condomínio</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* 🔐 Área do gestor */}
        {isGestor && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Adicionar documento (Gestor)</Text>

            <Text style={styles.label}>Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Ata Assembleia 01/2026"
              placeholderTextColor="#9AA3B2"
              style={styles.input}
            />

            <Text style={styles.label}>Link (PDF)</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor="#9AA3B2"
              style={styles.input}
              autoCapitalize="none"
            />

            {!!msg.text && (
              <View style={[styles.msgBox, msg.type === "error" ? styles.msgError : styles.msgSuccess]}>
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, saving ? { opacity: 0.7 } : null]}
              activeOpacity={0.85}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>
                {saving ? "Salvando..." : "Adicionar"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Documentos disponíveis</Text>

        {loadingList ? (
          <View style={{ paddingTop: 12 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={docsList}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 18 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum documento cadastrado.</Text>
            }
          />
        )}
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
    paddingTop: 12,
  },

  formCard: {
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
  formTitle: { fontWeight: "800", color: COLORS.text, marginBottom: 6 },
  label: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: "#FFF",
  },

  msgBox: { marginTop: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  msgError: { backgroundColor: COLORS.dangerBg, borderColor: COLORS.dangerBorder },
  msgSuccess: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  msgText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },

  primaryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "800" },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    color: COLORS.text,
    fontWeight: "800",
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFECEC",
    borderWidth: 1,
    borderColor: "#FFD0D0",
  },

  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 12,
  },
});
