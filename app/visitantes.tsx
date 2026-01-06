// app/visitantes.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebaseConfig"; // ✅ IMPORTA storage

const COLORS = {
  primary: "#007BFF",
  primaryDark: "#0052CC",
  bg: "#F4F7FB",
  cardBg: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E6EBF5",
};

type PickedImage = { uri: string };

type Visitante = {
  id: string;
  visitorName: string;
  visitorDoc: string;
  visitorPhone: string;
  residentName: string;
  residentDoc: string;
  apartment: string;
  block: string;
  photoUrl?: string;
  createdByUid?: string | null;
};

export default function VisitantesScreen() {
  const { user, isGestor } = useAuth();

  // Dados do visitante
  const [visitorName, setVisitorName] = useState("");
  const [visitorDoc, setVisitorDoc] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");

  // Dados do morador responsável
  const [residentName, setResidentName] = useState("");
  const [residentDoc, setResidentDoc] = useState("");
  const [apartment, setApartment] = useState("");
  const [block, setBlock] = useState("");

  // Foto
  const [photo, setPhoto] = useState<PickedImage | null>(null);

  const [saving, setSaving] = useState(false);

  // Lista
  const [items, setItems] = useState<Visitante[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const visitantesRef = useMemo(() => collection(db, "visitantes"), []);

  const isValid =
    visitorName.trim() &&
    visitorDoc.trim() &&
    visitorPhone.trim() &&
    residentName.trim() &&
    residentDoc.trim() &&
    apartment.trim() &&
    block.trim();

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Permita acesso à galeria para escolher a foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 4],
    });

    if (result.canceled) return;

    setPhoto({ uri: result.assets[0].uri });
  }

  async function uploadPhotoIfAny(docId: string) {
    if (!photo) return "";

    const response = await fetch(photo.uri);
    const blob = await response.blob();

    const fileRef = ref(storage, `visitantes/${docId}.jpg`);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  }

  async function onSubmit() {
    if (!user?.uid) {
      Alert.alert("Atenção", "Você precisa estar logado para cadastrar.");
      return;
    }

    if (!isValid) {
      Alert.alert("Faltam dados", "Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      // 1) cria doc no Firestore (sem foto ainda)
      const docRef = await addDoc(visitantesRef, {
        visitorName: visitorName.trim(),
        visitorDoc: visitorDoc.trim(),
        visitorPhone: visitorPhone.trim(),

        residentName: residentName.trim(),
        residentDoc: residentDoc.trim(),
        apartment: apartment.trim(),
        block: block.trim(),

        photoUrl: "",
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
      });

      // 2) upload da foto (se tiver)
      const photoUrl = await uploadPhotoIfAny(docRef.id);

      // 3) atualiza fotoUrl se subiu
      if (photoUrl) {
        const { setDoc, doc } = await import("firebase/firestore");
        await setDoc(doc(db, "visitantes", docRef.id), { photoUrl }, { merge: true });
      }

      Alert.alert("Sucesso", "Visitante cadastrado com sucesso!");

      // limpa form
      setVisitorName("");
      setVisitorDoc("");
      setVisitorPhone("");
      setResidentName("");
      setResidentDoc("");
      setApartment("");
      setBlock("");
      setPhoto(null);
    } catch (e: any) {
      console.log("Erro ao salvar visitante:", e);
      Alert.alert("Erro", e?.message ?? "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Lista: gestor vê todos / usuário vê só os dele
  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoadingList(false);
      return;
    }

    setLoadingList(true);

    const q = isGestor
      ? query(visitantesRef)
      : query(visitantesRef, where("createdByUid", "==", user.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Visitante[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            visitorName: v.visitorName ?? "",
            visitorDoc: v.visitorDoc ?? "",
            visitorPhone: v.visitorPhone ?? "",
            residentName: v.residentName ?? "",
            residentDoc: v.residentDoc ?? "",
            apartment: v.apartment ?? "",
            block: v.block ?? "",
            photoUrl: v.photoUrl ?? "",
            createdByUid: v.createdByUid ?? null,
          };
        });

        setItems(list);
        setLoadingList(false);
      },
      (err) => {
        console.log("ERRO Firestore (visitantes):", err);
        setLoadingList(false);
      }
    );

    return () => unsub();
  }, [user?.uid, isGestor, visitantesRef]);

  const renderItem = ({ item }: { item: Visitante }) => (
    <View style={styles.listCard}>
      <View style={styles.listRow}>
        <View style={styles.avatar}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>{item.visitorName}</Text>
          <Text style={styles.listSub}>
            Doc: {item.visitorDoc} • Tel: {item.visitorPhone}
          </Text>
          <Text style={styles.listSub}>
            Morador: {item.residentName} • Ap: {item.apartment} • Bloco: {item.block}
          </Text>
          {isGestor && (
            <Text style={styles.listSub2}>UID: {item.createdByUid ?? "-"}</Text>
          )}
        </View>
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

        <Text style={styles.headerTitle}>Visitantes</Text>
        <Text style={styles.headerSubtitle}>
          {isGestor ? "Visualize todos os visitantes cadastrados" : "Cadastre visitantes para agilizar a portaria"}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 18 }}>
            {/* FORM (usuário e gestor podem cadastrar, se quiser travar gestor me avisa) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Foto do visitante</Text>

              <TouchableOpacity style={styles.photoBox} onPress={pickPhoto} activeOpacity={0.9}>
                {photo ? (
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.photoText}>Toque para adicionar uma foto</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dados do visitante</Text>

              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={visitorName}
                onChangeText={setVisitorName}
                placeholder="Ex: João Silva"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Número de documentação *</Text>
              <TextInput
                style={styles.input}
                value={visitorDoc}
                onChangeText={setVisitorDoc}
                placeholder="Ex: BI/Passaporte"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Telefone de contato *</Text>
              <TextInput
                style={styles.input}
                value={visitorPhone}
                onChangeText={setVisitorPhone}
                placeholder="Ex: +351 9xx xxx xxx"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dados do morador responsável</Text>

              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={residentName}
                onChangeText={setResidentName}
                placeholder="Ex: Amanda Calixta"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Documento *</Text>
              <TextInput
                style={styles.input}
                value={residentDoc}
                onChangeText={setResidentDoc}
                placeholder="Ex: NIF/CPF"
                placeholderTextColor="#9CA3AF"
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Apartamento *</Text>
                  <TextInput
                    style={styles.input}
                    value={apartment}
                    onChangeText={setApartment}
                    placeholder="Ex: 203"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={{ width: 110 }}>
                  <Text style={styles.label}>Bloco *</Text>
                  <TextInput
                    style={styles.input}
                    value={block}
                    onChangeText={setBlock}
                    placeholder="Ex: B"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!isValid || saving) && { opacity: 0.6 }]}
              activeOpacity={0.9}
              onPress={onSubmit}
              disabled={!isValid || saving}
            >
              {saving ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.submitText}>Salvando...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>Cadastrar visitante</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helpText}>
              * Campos obrigatórios. O porteiro poderá conferir os dados no sistema.
            </Text>

            {/* LISTA */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.listHeader}>
                {isGestor ? "Todos os visitantes cadastrados" : "Meus visitantes cadastrados"}
              </Text>

              {loadingList ? (
                <View style={{ paddingTop: 10 }}>
                  <ActivityIndicator />
                </View>
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(i) => i.id}
                  renderItem={renderItem}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>Nenhum visitante encontrado.</Text>
                  }
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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

  cardTitle: { color: COLORS.text, fontWeight: "800", fontSize: 14, marginBottom: 10 },

  label: { color: COLORS.muted, fontSize: 12, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
  },

  photoBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  photo: { width: "100%", height: 220 },
  photoPlaceholder: { height: 160, alignItems: "center", justifyContent: "center", gap: 8 },
  photoText: { color: COLORS.primary, fontWeight: "700" },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  submitText: { color: "#fff", fontWeight: "900" },

  helpText: { color: COLORS.muted, fontSize: 12, marginTop: 10, lineHeight: 16 },

  listHeader: { fontWeight: "900", color: COLORS.text, marginTop: 6, marginBottom: 10 },
  emptyText: { color: COLORS.muted, textAlign: "center", marginTop: 8 },

  listCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  listRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#D8E6FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  listTitle: { fontWeight: "900", color: COLORS.text },
  listSub: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  listSub2: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
});
