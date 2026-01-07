// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false, // ✅ remove a barra preta e o título ("visitantes", etc)
        tabBarButton: HapticTab,
      }}
    >
      {/* ✅ SUA HOME (se sua home está em app/home.tsx, então é "home") */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* ✅ Suas telas do app */}
      <Tabs.Screen
        name="comunicados"
        options={{
          title: "Comunicados",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="megaphone.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reservas"
        options={{
          title: "Reservas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="visitantes"
        options={{
          title: "Visitantes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill.badge.plus" color={color} />
          ),
        }}
      />

      {/* ✅ Se você NÃO quer que apareçam na barra de baixo, esconda */}
      <Tabs.Screen name="boletos" options={{ href: null }} />
      <Tabs.Screen name="documentos" options={{ href: null }} />
      <Tabs.Screen name="galeria" options={{ href: null }} />
      <Tabs.Screen name="solicitacoes" options={{ href: null }} />
      <Tabs.Screen name="assembleias" options={{ href: null }} />
      <Tabs.Screen name="contatos" options={{ href: null }} />

      {/* ✅ remove telas do template */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
