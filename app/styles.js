// styles.js
import { StatusBar, StyleSheet } from "react-native";

export const getSharedStyles = (theme = "dark") =>
  StyleSheet.create({
    root: {
      flex: 1,
      // Fundo adaptável ao tema
      backgroundColor: theme === "dark" ? "#050509" : "#F0F0F5",
    },
    scrollContent: {
      paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 32,
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    heroRow: { marginBottom: 24 },

    welcome: {
      color: theme === "dark" ? "#FFF" : "#000",
      fontSize: 26,
      fontWeight: "700",
    },

    subtitle: {
      color: theme === "dark" ? "#9C9CAF" : "#333",
      fontSize: 14,
      marginTop: 4,
    },
    
    // Configurações do Avatar (Manter, mas adaptável se necessário)
    heroAvatarWrapper: { alignItems: "center", marginVertical: 12 },
    heroAvatarBg: {
      width: 72,
      height: 72,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    heroAvatar: { width: 52, height: 52, borderRadius: 26 },

    // Cartões (Cards)
    card: {
      backgroundColor: theme === "dark" ? "#181924" : "#FFF",
      // Coesão visual: borderRadius grande (28px)
      borderRadius: 28, 
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: theme === "dark" ? 0.25 : 0.15,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 14 },
      elevation: 8,
    },

    cardTitle: {
      color: theme === "dark" ? "#FFF" : "#000",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 10,
    },

    // Inputs e Labels
    label: {
      color: theme === "dark" ? "#C7C7D8" : "#333",
      fontSize: 13,
      marginTop: 12,
      marginBottom: 6,
    },

    inputWrapper: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme === "dark" ? "rgba(255,255,255,0.10)" : "#E0E0E0",
      backgroundColor: theme === "dark" ? "rgba(14,15,24,0.9)" : "#FAFAFA",
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    input: { height: 44, color: theme === "dark" ? "#FFF" : "#000", fontSize: 14 },

    // Botões
    primaryBtn: { borderRadius: 18, overflow: "hidden", marginTop: 20 },
    primaryBtnGradient: {
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnLabel: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "700",
    },

    // Links
    linkText: {
      color: "#FF7A2F",
      fontSize: 14,
      fontWeight: "500",
      alignSelf: "flex-end",
      marginTop: 8,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      gap: 5,
    },
    bottomText: { color: theme === "dark" ? "#9C9CAF" : "#333", fontSize: 14 },
    bottomLink: { color: "#FF7A2F", fontSize: 14, fontWeight: "600" },
  });