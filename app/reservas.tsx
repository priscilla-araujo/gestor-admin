// app/reservas.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";

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
};

type Reserva = {
  area: "ginasio";
  uid: string;
  nome: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  createdAt: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function isoToBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function isValidISODate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}
function isValidHM(v: string) {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [hh, mm] = v.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export default function ReservasScreen() {
  // ✅ mudança 1: pegar isGestor também
  const { user, isGestor } = useAuth();

  const [openForm, setOpenForm] = useState(false);

  const [nome, setNome] = useState("");
  const [dataISO, setDataISO] = useState("");
  const [horaHM, setHoraHM] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingLast, setLoadingLast] = useState(false);

  // ✅ gestor: lista de todas
  const [loadingAll, setLoadingAll] = useState(false);
  const [allReservas, setAllReservas] = useState<Reserva[]>([]);

  const [msg, setMsg] = useState<{ type: "error" | "success" | ""; text: string }>({
    type: "",
    text: "",
  });

  const [lastReserva, setLastReserva] = useState<Reserva | null>(null);

  // iOS modals
  const [iosDateModal, setIosDateModal] = useState(false);
  const [iosTimeModal, setIosTimeModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const reservasRef = useMemo(() => collection(db, "reservas"), []);

  // ✅ usuário comum: última reserva dele (sem orderBy)
  async function carregarUltimaReserva() {
    if (!user?.uid) {
      setLastReserva(null);
      return;
    }

    setLoadingLast(true);
    try {
      const qLast = query(
        reservasRef,
        where("uid", "==", user.uid),
        where("area", "==", "ginasio")
      );
      const snap = await getDocs(qLast);

      if (snap.empty) {
        setLastReserva(null);
        return;
      }

      let latest: Reserva | null = null;
      snap.forEach((d) => {
        const data = d.data() as Reserva;
        if (!latest || (data.createdAt ?? 0) > (latest.createdAt ?? 0)) {
          latest = data;
        }
      });

      setLastReserva(latest);
    } catch (e) {
      console.log("Erro ao carregar última reserva:", e);
      setLastReserva(null);
    } finally {
      setLoadingLast(false);
    }
  }

  // ✅ gestor: carregar todas as reservas (sem orderBy)
  async function carregarTodasReservas() {
    if (!isGestor) {
      setAllReservas([]);
      return;
    }

    setLoadingAll(true);
    try {
      const qAll = query(reservasRef);
      const snap = await getDocs(qAll);

      const list: Reserva[] = snap.docs
        .map((d) => d.data() as Reserva)
        .filter((r) => !!r?.data && !!r?.hora && !!r?.nome);

      // ordena no app (desc)
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      setAllReservas(list);
    } catch (e) {
      console.log("Erro ao carregar todas reservas:", e);
      setAllReservas([]);
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    // usuário: sempre
    carregarUltimaReserva();
    // gestor: também
    carregarTodasReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isGestor]);

  const openDatePicker = () => {
    setMsg({ type: "", text: "" });

    if (Platform.OS === "web") return;

    if (Platform.OS === "android") {
      const base =
        dataISO && isValidISODate(dataISO) ? new Date(`${dataISO}T00:00:00`) : new Date();
      DateTimePickerAndroid.open({
        value: isNaN(base.getTime()) ? new Date() : base,
        mode: "date",
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === "dismissed" || !selected) return;
          setDataISO(toISODate(selected));
        },
      });
      return;
    }

    const base =
      dataISO && isValidISODate(dataISO) ? new Date(`${dataISO}T00:00:00`) : new Date();
    setTempDate(base);
    setIosDateModal(true);
  };

  const openTimePicker = () => {
    setMsg({ type: "", text: "" });

    if (Platform.OS === "web") return;

    if (Platform.OS === "android") {
      const base =
        horaHM && isValidHM(horaHM) ? new Date(`1970-01-01T${horaHM}:00`) : new Date();
      DateTimePickerAndroid.open({
        value: isNaN(base.getTime()) ? new Date() : base,
        mode: "time",
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === "dismissed" || !selected) return;
          setHoraHM(toHM(selected));
        },
      });
      return;
    }

    const base =
      horaHM && isValidHM(horaHM) ? new Date(`1970-01-01T${horaHM}:00`) : new Date();
    setTempTime(base);
    setIosTimeModal(true);
  };

  function makeSlotId(area: string, data: string, hora: string) {
    const horaSafe = hora.replace(":", "-");
    return `${area}_${data}_${horaSafe}`;
  }

  async function handleAgendar() {
    setMsg({ type: "", text: "" });

    if (!user?.uid) {
      setMsg({ type: "error", text: "Você precisa estar logado para agendar." });
      return;
    }

    const nomeTrim = nome.trim();
    if (!nomeTrim || !dataISO || !horaHM) {
      setMsg({ type: "error", text: "Preencha nome, data e hora." });
      return;
    }
    if (!isValidISODate(dataISO)) {
      setMsg({ type: "error", text: "Data inválida. Use YYYY-MM-DD (ex: 2026-01-07)." });
      return;
    }
    if (!isValidHM(horaHM)) {
      setMsg({ type: "error", text: "Hora inválida. Use HH:mm (ex: 14:30)." });
      return;
    }

    setLoading(true);
    try {
      const area = "ginasio" as const;
      const slotId = makeSlotId(area, dataISO, horaHM);

      const payload: Reserva = {
        area,
        uid: user.uid,
        nome: nomeTrim,
        data: dataISO,
        hora: horaHM,
        createdAt: Date.now(),
      };

      await setDoc(doc(db, "reservas", slotId), payload);

      setLastReserva(payload);
      setMsg({ type: "success", text: "Agendamento realizado com sucesso!" });

      // ✅ gestor: recarrega tudo
      if (isGestor) await carregarTodasReservas();
    } catch (e: any) {
      console.log("Erro ao agendar:", e);

      const code = e?.code || "";
      if (code === "permission-denied") {
        setMsg({
          type: "error",
          text: "Já existe agendamento para essa data e horário. Solicito que agende outro horário.",
        });
      } else {
        setMsg({ type: "error", text: "Erro ao agendar. Verifique o Firebase/Firestore." });
      }
    } finally {
      setLoading(false);
    }
  }

  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Reservas</Text>
        <Text style={styles.headerSubtitle}>Agende a utilização de áreas comuns</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Áreas disponíveis</Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.85}
              onPress={() => setOpenForm((v) => !v)}
            >
              <View style={styles.tileIcon}>
                <Ionicons name="barbell-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.tileLabel}>Ginásio</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Logo abaixo do quadrado (usuário vê a própria última) */}
          {loadingLast ? (
            <View style={styles.bookingBox}>
              <Text style={styles.bookingTitle}>Agendamento</Text>
              <Text style={styles.bookingText}>Carregando...</Text>
            </View>
          ) : lastReserva ? (
            <View style={styles.bookingBox}>
              <Text style={styles.bookingTitle}>Agendamento</Text>
              <Text style={styles.bookingText}>
                Nome: {lastReserva.nome}
                {"\n"}
                Data: {isoToBR(lastReserva.data)}
                {"\n"}
                Hora: {lastReserva.hora}
              </Text>
            </View>
          ) : (
            <View style={styles.bookingBox}>
              <Text style={styles.bookingTitle}>Agendamento</Text>
              <Text style={styles.bookingText}>Nenhum agendamento encontrado.</Text>
            </View>
          )}

          {openForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Agendar Ginásio</Text>

              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
                style={styles.input}
                placeholderTextColor="#9AA3B2"
              />

              <Text style={styles.label}>Data</Text>
              {isWeb ? (
                <TextInput
                  value={dataISO}
                  onChangeText={setDataISO}
                  placeholder="YYYY-MM-DD (ex: 2026-01-07)"
                  style={styles.input}
                  placeholderTextColor="#9AA3B2"
                />
              ) : (
                <TouchableOpacity style={styles.pickerBtn} activeOpacity={0.85} onPress={openDatePicker}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.pickerText}>{dataISO ? isoToBR(dataISO) : "Selecionar data"}</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>Hora</Text>
              {isWeb ? (
                <TextInput
                  value={horaHM}
                  onChangeText={setHoraHM}
                  placeholder="HH:mm (ex: 14:30)"
                  style={styles.input}
                  placeholderTextColor="#9AA3B2"
                />
              ) : (
                <TouchableOpacity style={styles.pickerBtn} activeOpacity={0.85} onPress={openTimePicker}>
                  <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.pickerText}>{horaHM ? horaHM : "Selecionar hora"}</Text>
                </TouchableOpacity>
              )}

              {!!msg.text && (
                <View style={[styles.msgBox, msg.type === "error" ? styles.msgError : styles.msgSuccess]}>
                  <Text style={styles.msgText}>{msg.text}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, loading ? { opacity: 0.7 } : null]}
                activeOpacity={0.85}
                onPress={handleAgendar}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? "Agendando..." : "Agendar"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ✅ NOVO: lista para o gestor */}
          {isGestor && (
            <View style={styles.allBox}>
              <View style={styles.allHeaderRow}>
                <Text style={styles.allTitle}>Todas as reservas</Text>

                <TouchableOpacity
                  style={styles.refreshBtn}
                  activeOpacity={0.85}
                  onPress={carregarTodasReservas}
                >
                  <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.refreshText}>Atualizar</Text>
                </TouchableOpacity>
              </View>

              {loadingAll ? (
                <View style={{ paddingTop: 10 }}>
                  <ActivityIndicator />
                </View>
              ) : allReservas.length === 0 ? (
                <Text style={styles.allEmpty}>Nenhuma reserva encontrada.</Text>
              ) : (
                <FlatList
                  data={allReservas}
                  keyExtractor={(r, idx) => `${r.uid}_${r.area}_${r.data}_${r.hora}_${idx}`}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.allItem}>
                      <Text style={styles.allItemTitle}>{item.nome}</Text>
                      <Text style={styles.allItemSub}>
                        Área: {item.area} • {isoToBR(item.data)} • {item.hora}
                      </Text>
                      <Text style={styles.allItemSub2}>UID: {item.uid}</Text>
                    </View>
                  )}
                />
              )}
            </View>
          )}
        </View>
      </View>

      {/* iOS MODAL - DATA */}
      <Modal transparent visible={iosDateModal} animationType="fade" onRequestClose={() => setIosDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecionar data</Text>

            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                if (selected) setTempDate(selected);
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setIosDateModal(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  setDataISO(toISODate(tempDate));
                  setIosDateModal(false);
                }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* iOS MODAL - HORA */}
      <Modal transparent visible={iosTimeModal} animationType="fade" onRequestClose={() => setIosTimeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecionar hora</Text>

            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              is24Hour
              onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                if (selected) setTempTime(selected);
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setIosTimeModal(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  setHoraHM(toHM(tempTime));
                  setIosTimeModal(false);
                }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>OK</Text>
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
  headerSubtitle: { color: "#E3EEFF", fontSize: 13, marginTop: 4, marginBottom: 8 },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

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

  sectionTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14, marginBottom: 12 },
  grid: { flexDirection: "row", alignItems: "flex-start" },
  tile: { width: 110, alignItems: "center", marginRight: 14 },
  tileIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { marginTop: 10, fontSize: 12, fontWeight: "600", color: COLORS.text },

  bookingBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F2F6FF",
    borderWidth: 1,
    borderColor: "#DEE7FF",
  },
  bookingTitle: { fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  bookingText: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },

  form: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  formTitle: { fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.text, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: "#FFF",
  },
  pickerBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
  },
  pickerText: { marginLeft: 10, color: COLORS.text, fontWeight: "600" },

  msgBox: { marginTop: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  msgError: { backgroundColor: "#FFE9E9", borderColor: "#FFB8B8" },
  msgSuccess: { backgroundColor: "#E9FFF0", borderColor: "#B8FFD0" },
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

  // ✅ gestor list styles
  allBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  allHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  allTitle: { fontWeight: "800", color: COLORS.text },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFF",
  },
  refreshText: { fontWeight: "800", color: COLORS.primary, fontSize: 12 },
  allEmpty: { marginTop: 10, color: COLORS.muted },

  allItem: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allItemTitle: { fontWeight: "900", color: COLORS.text },
  allItemSub: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  allItemSub2: { marginTop: 2, color: COLORS.muted, fontSize: 11 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 10 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFF",
  },
  modalBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modalBtnText: { color: COLORS.text, fontWeight: "700" },
  modalBtnTextPrimary: { color: "#FFF" },
});
