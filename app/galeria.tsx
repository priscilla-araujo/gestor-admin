// app/galeria.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
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

type PhotoItem = {
  id: string;
  source: any;
  caption: string;
};

const PHOTOS: PhotoItem[] = [
  { id: "1", source: require("../assets/images/1.jpg"), caption: "Fachada do condomínio" },
  { id: "2", source: require("../assets/images/2.jpg"), caption: "Área comum do condomínio" },
  { id: "3", source: require("../assets/images/3.jpg"), caption: "Entrada / jardim" },
];

export default function GaleriaScreen() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PhotoItem | null>(null);

  const gap = 6; // espaçamento entre as fotos
  const screenW = Dimensions.get("window").width;
  const size = Math.floor((screenW - 16 * 2 - gap * 2) / 3); // 16 padding + 2 gaps

  const openZoom = (item: PhotoItem) => {
    setSelected(item);
    setOpen(true);
  };

  const renderItem = ({ item }: { item: PhotoItem }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => openZoom(item)}>
      <Image source={item.source} style={[styles.thumb, { width: size, height: size }]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Galeria</Text>
        <Text style={styles.headerSubtitle}>Fotos do condomínio</Text>
      </LinearGradient>

      {/* ✅ Agora com espaço em cima */}
      <View style={styles.content}>
        <FlatList
          data={PHOTOS}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ paddingBottom: 18, gap }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* ✅ ZOOM (tela cheia por cima das outras) */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomClose} onPress={() => setOpen(false)} activeOpacity={0.85}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>

          {selected && (
            <>
              <Image source={selected.source} style={styles.zoomImage} resizeMode="contain" />
              <Text style={styles.zoomCaption}>{selected.caption}</Text>
            </>
          )}
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

  // ✅ espaçamento para não ficar colado no header
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12, // 👈 AQUI resolve o “colado”
    backgroundColor: COLORS.bg,
  },

  thumb: {
    borderRadius: 10,
    backgroundColor: "#EEE",
  },

  // ZOOM
  zoomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  zoomClose: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomImage: {
    width: "100%",
    height: "70%",
  },
  zoomCaption: {
    marginTop: 12,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
