import { Redirect } from "expo-router";
import React from "react";

export default function TabIndex() {
  // Redireciona o index das tabs para sua Home real
  return <Redirect href="/home" />;
}
