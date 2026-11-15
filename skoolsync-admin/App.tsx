import React from "react";
import SkoolSyncApp from "./shared/SkoolSyncApp";
import { API_BASE_URL } from "./src/config";

export default function App() {
  return <SkoolSyncApp appRole="admin" apiBase={API_BASE_URL} />;
}
