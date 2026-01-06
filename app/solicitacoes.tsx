// app/solicitacoes.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
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
  query,
  updateDoc,
  where,
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
  warnBg: "#FFF7E6",
  warnBorder: "#FFD58A",
};

type StatusSolic = "aberta" | "em_andamento" | "concluida";

type Solicitacao = {
  id: string;
  uid: string;
  assunto: string;
  descricao: string;
  status: StatusSolic;
  createdAt: number;
};

function formatWhen(ts: number) {
  try {
    return new Date(ts).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function SolicitacoesScreen() {
  const { user, isGestor } = useAuth();

  // form
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [sending, setSending] = useState(false);

  // lista
  const [items, setItems] = useState<Solicitacao[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // mensagens
  const [msg, setMsg] = useState<{ type: "error" | "success" | ""; text: string }>({
    type: "",
    text: "",
  });

  // modal edição (somente gestor)
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [editAssunto, setEditAssunto] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editStatus, setEditStatus] = useState<StatusSolic>("aberta");
  const [savingEdit, setSavingEdit] = useState(false);

  const solicitacoesRef = useMemo(() => collection(db, "solicitacoes"), []);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoadingList(false);
      return;
    }

    setLoadingList(true);

    // ✅ IMPORTANTÍSSIMO:
    // removemos orderBy do Firestore para NÃO precisar de índice composto.
    // ordenamos aqui no app por createdAt desc.
    const q = isGestor
      ? query(solicitacoesRef)
      : query(solicitacoesRef, where("uid", "==", user.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Solicitacao[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            uid: v.uid ?? "",
            assunto: v.assunto ?? "",
            descricao: v.descricao ?? "",
            status: (v.status ?? "aberta") as StatusSolic,
            createdAt: v.createdAt ?? 0,
          };
        });

        // ✅ ordena para aparecer “logo abaixo” do formulário (mais recente primeiro)
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        setItems(list);
        setLoadingList(false);
      },
      (err) => {
        console.log("ERRO Firestore (solicitacoes):", err);
        setLoadingList(false);
      }
    );

    return () => unsub();
  }, [user?.uid, isGestor, solicitacoesRef]);

  async function handleEnviar() {
    setMsg({ type: "", text: "" });

    if (!user?.uid) {
      setMsg({ type: "error", text: "Você precisa estar logado para enviar." });
      return;
    }

    const a = assunto.trim();
    const d = descricao.trim();

    if (!a || !d) {
      setMsg({ type: "error", text: "Preencha assunto e descrição." });
      return;
    }

    setSending(true);
    try {
      const now = Date.now();

      // ✅ cria no Firestore
      await addDoc(solicitacoesRef, {
        uid: user.uid,
        assunto: a,
        descricao: d,
        status: "aberta",
        createdAt: now,
      });

      // ✅ limpa o formulário
      setAssunto("");
      setDescricao("");
      setMsg({ type: "success", text: "Solicitação enviada com sucesso!" });

      // Obs: ela vai aparecer automaticamente abaixo pelo onSnapshot + sort.
    } catch (e) {
      console.log("Erro ao enviar solicitacao:", e);
      setMsg({ type: "error", text: "Erro ao enviar. Verifique o Firestore." });
    } finally {
      setSending(false);
    }
  }

  function openEdit(item: Solicitacao) {
    setEditId(item.id);
    setEditAssunto(item.assunto);
    setEditDescricao(item.descricao);
    setEditStatus(item.status);
    setEditOpen(true);
  }

  async function handleSalvarEdicao() {
    if (!isGestor || !editId) return;

    setMsg({ type: "", text: "" });

    const a = editAssunto.trim();
    const d = editDescricao.trim();

    if (!a || !d) {
      setMsg({ type: "error", text: "Assunto e descrição não podem ficar vazios." });
      return;
    }

    setSavingEdit(true);
    try {
      await updateDoc(doc(db, "solicitacoes", editId), {
        assunto: a,
        descricao: d,
        status: editStatus,
      });

      setEditOpen(false);
      setMsg({ type: "success", text: "Solicitação atualizada!" });
    } catch (e) {
      console.log("Erro ao editar solicitacao:", e);
      setMsg({ type: "error", text: "Erro ao editar. Verifique regras do Firestore." });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleApagar(id: string) {
    if (!isGestor) return;
    setMsg({ type: "", text: "" });

    try {
      await deleteDoc(doc(db, "solicitacoes", id));
      setMsg({ type: "success", text: "Solicitação apagada." });
    } catch (e) {
      console.log("Erro ao apagar solicitacao:", e);
      setMsg({ type: "error", text: "Erro ao apagar. Verifique regras do Firestore." });
    }
  }

  function statusLabel(s: StatusSolic) {
    if (s === "aberta") return "Aberta";
    if (s === "em_andamento") return "Em andamento";
    return "Concluída";
  }

  function statusStyle(s: StatusSolic) {
    if (s === "concluida") return styles.badgeSuccess;
    if (s === "em_andamento") return styles.badgeWarn;
    return styles.badgeNeutral;
  }

  const renderItem = (item: Solicitacao) => (
    <View key={item.id} style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle} numberOfLines={2}>
          {item.assunto}
        </Text>

        <View style={[styles.badge, statusStyle(item.status)]}>
          <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.ticketDate}>{formatWhen(item.createdAt)}</Text>

      <Text style={styles.ticketBody}>{item.descricao}</Text>

      {isGestor && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.smallBtn} activeOpacity={0.85} onPress={() => openEdit(item)}>
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={styles.smallBtnText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallBtn, styles.smallBtnDanger]}
            activeOpacity={0.85}
            onPress={() => handleApagar(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#B00020" />
            <Text style={[styles.smallBtnText, { color: "#B00020" }]}>Apagar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Solicitações</Text>
        <Text style={styles.headerSubtitle}>
          {isGestor ? "Gerencie as solicitações dos moradores" : "Envie solicitações para o gestor"}
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* FORM */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nova solicitação</Text>

            <Text style={styles.label}>Assunto</Text>
            <TextInput
              value={assunto}
              onChangeText={setAssunto}
              placeholder="Ex: Lâmpada queimada no corredor"
              placeholderTextColor="#9AA3B2"
              style={styles.input}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva o problema / pedido..."
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

            <TouchableOpacity
              style={[styles.primaryBtn, sending ? { opacity: 0.7 } : null]}
              onPress={handleEnviar}
              activeOpacity={0.85}
              disabled={sending}
            >
              <Text style={styles.primaryBtnText}>{sending ? "Enviando..." : "Enviar"}</Text>
            </TouchableOpacity>
          </View>

          {/* LISTA logo abaixo */}
          <View style={styles.listWrap}>
            <Text style={styles.sectionTitle}>
              {isGestor ? "Todas as solicitações" : "Minhas solicitações"}
            </Text>

            {loadingList ? (
              <View style={{ paddingTop: 10 }}>
                <ActivityIndicator />
              </View>
            ) : items.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma solicitação encontrada.</Text>
            ) : (
              items.map(renderItem)
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL EDITAR (somente gestor) */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Editar solicitação</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setEditOpen(false)}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Assunto</Text>
            <TextInput
              value={editAssunto}
              onChangeText={setEditAssunto}
              placeholder="Assunto"
              placeholderTextColor="#9AA3B2"
              style={styles.input}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              value={editDescricao}
              onChangeText={setEditDescricao}
              placeholder="Descrição"
              placeholderTextColor="#9AA3B2"
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {(["aberta", "em_andamento", "concluida"] as StatusSolic[]).map((s) => {
                const active = editStatus === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusPill, active ? styles.statusPillActive : null]}
                    activeOpacity={0.85}
                    onPress={() => setEditStatus(s)}
                  >
                    <Text style={[styles.statusPillText, active ? styles.statusPillTextActive : null]}>
                      {statusLabel(s)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setEditOpen(false)} activeOpacity={0.85}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, savingEdit ? { opacity: 0.7 } : null]}
                onPress={handleSalvarEdicao}
                activeOpacity={0.85}
                disabled={savingEdit}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>
                  {savingEdit ? "Salvando..." : "Salvar"}
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

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
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

  primaryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "800" },

  listWrap: { marginTop: 14 },

  sectionTitle: { color: COLORS.text, fontWeight: "800", marginBottom: 10 },

  ticketCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  ticketTitle: { flex: 1, color: COLORS.text, fontWeight: "800", fontSize: 14 },
  ticketDate: { color: COLORS.muted, fontSize: 12, marginBottom: 8 },
  ticketBody: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "800", color: COLORS.text },
  badgeNeutral: { backgroundColor: "#F2F4F8", borderColor: COLORS.border },
  badgeWarn: { backgroundColor: COLORS.warnBg, borderColor: COLORS.warnBorder },
  badgeSuccess: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
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
  smallBtnDanger: { backgroundColor: "#FFECEC", borderColor: "#FFD0D0" },
  smallBtnText: { fontWeight: "800", color: COLORS.primary },

  emptyText: { color: COLORS.muted, textAlign: "center", marginTop: 12 },

  // Modal editar
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

  statusRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statusPill: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  statusPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusPillText: { fontWeight: "800", color: COLORS.text, fontSize: 12 },
  statusPillTextActive: { color: "#FFF" },

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
