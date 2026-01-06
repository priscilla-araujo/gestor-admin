// app/assembleias.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
  updateDoc,
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

type Assembleia = {
  id: string;
  title: string;
  date: string; // ISO
  description: string;
  createdAt: number;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// input simples: "2026-01-06 19:30" -> ISO
function toISOFromInput(v: string) {
  const s = v.trim();
  // aceita "YYYY-MM-DDTHH:mm" também
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function AssembleiasScreen() {
  const { isGestor } = useAuth();

  const [items, setItems] = useState<Assembleia[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // modal detalhes (todos)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<Assembleia | null>(null);

  // modal criar/editar (gestor)
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dateInput, setDateInput] = useState(""); // "YYYY-MM-DD HH:mm"
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState<{ type: "error" | "success" | ""; text: string }>({
    type: "",
    text: "",
  });

  // ⚠️ mantém "Assembleias" com A maiúsculo
  const assembleiasRef = useMemo(() => collection(db, "Assembleias"), []);

  useEffect(() => {
    const q = query(assembleiasRef, orderBy("date", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Assembleia[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            title: v.title ?? v.Title ?? "Assembleia",
            date: v.date ?? new Date().toISOString(),
            description: v.description ?? v.Description ?? "",
            createdAt: v.createdAt ?? 0,
          };
        });

        setItems(list);
        setLoadingList(false);
      },
      (err) => {
        console.log("ERRO Firestore (Assembleias):", err);
        setLoadingList(false);
      }
    );

    return () => unsub();
  }, [assembleiasRef]);

  const openDetails = (item: Assembleia) => {
    setSelected(item);
    setDetailsOpen(true);
  };

  const openCreate = () => {
    setMsg({ type: "", text: "" });
    setEditId(null);
    setTitle("");
    setDateInput("");
    setDescription("");
    setEditOpen(true);
  };

  const openEdit = (item: Assembleia) => {
    setMsg({ type: "", text: "" });
    setEditId(item.id);
    setTitle(item.title);
    // mostra em formato amigável
    const d = new Date(item.date);
    const pad = (n: number) => String(n).padStart(2, "0");
    setDateInput(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    setDescription(item.description);
    setEditOpen(true);
  };

  async function handleSave() {
    if (!isGestor) return;

    setMsg({ type: "", text: "" });

    const t = title.trim();
    const desc = description.trim();
    const iso = toISOFromInput(dateInput);

    if (!t || !desc || !iso) {
      setMsg({
        type: "error",
        text: "Preencha título, descrição e uma data válida (ex: 2026-01-06 19:30).",
      });
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "Assembleias", editId), {
          title: t,
          description: desc,
          date: iso,
        });
        setMsg({ type: "success", text: "Assembleia atualizada!" });
      } else {
        await addDoc(assembleiasRef, {
          title: t,
          description: desc,
          date: iso,
          createdAt: Date.now(),
        });
        setMsg({ type: "success", text: "Assembleia criada!" });
      }

      setEditOpen(false);
    } catch (e) {
      console.log("Erro ao salvar assembleia:", e);
      setMsg({ type: "error", text: "Erro ao salvar. Verifique regras do Firestore." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!isGestor) return;
    setMsg({ type: "", text: "" });

    try {
      await deleteDoc(doc(db, "Assembleias", id));
      setMsg({ type: "success", text: "Assembleia excluída." });
    } catch (e) {
      console.log("Erro ao excluir assembleia:", e);
      setMsg({ type: "error", text: "Erro ao excluir. Verifique regras do Firestore." });
    }
  }

  const renderItem = ({ item }: { item: Assembleia }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
      </View>

      <Text style={styles.cardBody} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openDetails(item)} activeOpacity={0.85}>
          <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Ver detalhes</Text>
        </TouchableOpacity>

        {isGestor && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.smallBtn} onPress={() => openEdit(item)} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.smallBtnText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallBtn, styles.smallBtnDanger]}
              onPress={() => handleDelete(item.id)}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#B00020" />
              <Text style={[styles.smallBtnText, { color: "#B00020" }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Assembleias</Text>
        <Text style={styles.headerSubtitle}>Veja as reuniões do condomínio</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* ✅ botão criar somente gestor */}
        {isGestor && (
          <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={openCreate}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.createBtnText}>Adicionar assembleia</Text>
          </TouchableOpacity>
        )}

        {loadingList ? (
          <View style={{ paddingTop: 12 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 18 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma assembleia cadastrada.</Text>}
          />
        )}
      </View>

      {/* MODAL DETALHES (todos) */}
      <Modal visible={detailsOpen} transparent animationType="fade" onRequestClose={() => setDetailsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Detalhes</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailsOpen(false)}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selected && (
              <>
                <Text style={styles.detailsTitle}>{selected.title}</Text>
                <Text style={styles.detailsDate}>{formatDate(selected.date)}</Text>
                <Text style={styles.detailsBody}>{selected.description}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL CRIAR/EDITAR (gestor) */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>{editId ? "Editar assembleia" : "Nova assembleia"}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setEditOpen(false)}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Assembleia Geral"
              placeholderTextColor="#9AA3B2"
              style={styles.input}
            />

            <Text style={styles.label}>Data e hora</Text>
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD HH:mm (ex: 2026-01-06 19:30)"
              placeholderTextColor="#9AA3B2"
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Pauta e informações..."
              placeholderTextColor="#9AA3B2"
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            {!!msg.text && (
              <View style={[styles.msgBox, msg.type === "error" ? styles.msgError : styles.msgSuccess]}>
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setEditOpen(false)} activeOpacity={0.85}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, saving ? { opacity: 0.7 } : null]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>
                  {saving ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // ✅ espaço (sem colar no header)
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  createBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  createBtnText: { color: "#FFF", fontWeight: "900" },

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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  cardTitle: { flex: 1, color: COLORS.text, fontWeight: "700", fontSize: 14 },
  cardDate: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  cardBody: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },

  rowActions: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionText: { color: COLORS.primary, fontWeight: "700" },

  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFF",
  },
  smallBtnDanger: {
    backgroundColor: "#FFECEC",
    borderColor: "#FFD0D0",
  },
  smallBtnText: { fontWeight: "800", color: COLORS.primary },

  emptyText: { color: COLORS.muted, textAlign: "center", marginTop: 12 },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTop: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  modalTitle: { flex: 1, fontWeight: "900", color: COLORS.text },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F8",
  },

  detailsTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text, marginTop: 6 },
  detailsDate: { color: COLORS.muted, marginTop: 6, marginBottom: 10, fontSize: 12 },
  detailsBody: { color: COLORS.text, lineHeight: 18 },

  label: { fontSize: 12, color: COLORS.text, fontWeight: "800", marginBottom: 6, marginTop: 10 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: "#FFF",
  },
  textarea: { height: 110 },

  msgBox: { marginTop: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  msgError: { backgroundColor: COLORS.dangerBg, borderColor: COLORS.dangerBorder },
  msgSuccess: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  msgText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14, gap: 10 },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFF",
  },
  modalBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modalBtnText: { color: COLORS.text, fontWeight: "800" },
  modalBtnTextPrimary: { color: "#FFF" },
});
