// app/home.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";

const COLORS = {
  primary: "#007BFF",
  primaryDark: "#0052CC",
  bg: "#F4F7FB",
  cardBg: "#FFFFFF",
  iconBg: "#0063E0",
  text: "#1A1A1A",
};

type Tile = {
  id: string;
  label: string;
  iconFamily: "Ionicons" | "MaterialIcons";
  iconName: string;
};

type UserProfile = {
  name?: string;
  condoName?: string;
};

const tiles: Tile[] = [
  { id: "1", label: "Boletos", iconFamily: "Ionicons", iconName: "barcode-outline" },
  { id: "2", label: "Comunicados", iconFamily: "Ionicons", iconName: "megaphone-outline" },
  { id: "3", label: "Reservas", iconFamily: "Ionicons", iconName: "calendar-outline" },
  { id: "4", label: "Formas de\npagamento", iconFamily: "MaterialIcons", iconName: "payment" },
  { id: "5", label: "Documentos", iconFamily: "Ionicons", iconName: "document-text-outline" },
  { id: "6", label: "Galeria de\nfotos", iconFamily: "Ionicons", iconName: "images-outline" },
  { id: "7", label: "Prestação\nde contas", iconFamily: "Ionicons", iconName: "stats-chart-outline" },
  { id: "8", label: "Solicitações", iconFamily: "Ionicons", iconName: "checkmark-done-outline" },
  { id: "9", label: "Ocorrências", iconFamily: "Ionicons", iconName: "alert-circle-outline" },
  { id: "10", label: "Assembleias", iconFamily: "Ionicons", iconName: "people-outline" },
  { id: "11", label: "Fale com o\nPorteiro", iconFamily: "Ionicons", iconName: "chatbubbles-outline" },
  { id: "12", label: "Visitantes", iconFamily: "Ionicons", iconName: "person-add-outline" },
];

const renderTileIcon = (item: Tile) => {
  const size = 26;
  const color = "#FFFFFF";

  if (item.iconFamily === "MaterialIcons") {
    return <MaterialIcons name={item.iconName as any} size={size} color={color} />;
  }

  return <Ionicons name={item.iconName as any} size={size} color={color} />;
};

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 🔹 Buscar nome e nome do condomínio do Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({});
        }
      } catch (err) {
        console.log("Erro ao buscar perfil:", err);
        setProfile({});
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.log(error);
    }
  };

  const renderTile = ({ item }: { item: Tile }) => (
  <TouchableOpacity
    style={styles.tile}
    onPress={() => {
      if (item.label === "Comunicados") {
        router.push("/comunicados");
      }
    }}
  >
    <View style={styles.tileIconWrapper}>{renderTileIcon(item)}</View>
    <Text style={styles.tileLabel}>{item.label}</Text>
  </TouchableOpacity>
);


  const displayName = profile?.name || user?.displayName || "Morador";
  const displayCondoName = profile?.condoName || "Seu condomínio";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo(a),</Text>

            {loadingProfile ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.userName}>{displayName}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.condoName}>{displayCondoName}</Text>
        <Text style={styles.condoSubtitle}>
          Acesse os principais serviços do seu condomínio
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.gridCard}>
          <FlatList
            data={tiles}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            renderItem={renderTile}
            scrollEnabled={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    color: "#E3EEFF",
    fontSize: 14,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  condoName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 18,
  },
  condoSubtitle: {
    color: "#E3EEFF",
    fontSize: 13,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -24,
  },
  gridCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  row: {
    justifyContent: "space-around",
  },
  tile: {
    width: 90,
    alignItems: "center",
    marginBottom: 16,
  },
  tileIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tileLabel: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "500",
  },
});

export default HomeScreen;
