import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";

type Props = { appRole: "admin" | "teacher" | "family"; apiBase: string };

export default function SkoolSyncApp({ appRole, apiBase }: Props) {
  const [schoolId, setSchoolId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [schoolName, setSchoolName] = useState("SkoolSync School");
  const [message, setMessage] = useState("Sign in to your school account");
  const [students, setStudents] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [className, setClassName] = useState("Grade 7");
  const [admission, setAdmission] = useState("");
  const [tab, setTab] = useState("home");

  const title = appRole === "admin" ? "SkoolSync Admin" : appRole === "teacher" ? "SkoolSync Teacher" : "SkoolSync Family";
  const roleLabel = appRole === "admin" ? "Admin" : appRole === "teacher" ? "Teacher" : "Student";
  const greetingName = firstName || (appRole === "admin" ? "Admin" : appRole === "teacher" ? "Teacher" : "Student");
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  async function request(path: string, options: any = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Request failed");
    return data;
  }

  async function signIn() {
    try {
      setMessage("Signing you in...");
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ school_id: schoolId, username, password }) });
      setToken(data.access_token);
      const profile = await fetch(`${apiBase}/me`, { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.json()).catch(() => ({}));
      setSchoolName(profile.school_name || "SkoolSync School");
      setFirstName(profile.first_name || profile.name || "");
      setLastName(profile.last_name || "");
      setClassName(profile.class_name || "Grade 7");
      setMessage("Welcome back!");
      try {
        const s = await fetch(`${apiBase}/students`, { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.json()).catch(() => []);
        if (Array.isArray(s)) setStudents(s);
      } catch {}
    } catch (e: any) {
      setMessage(e.message || "Login failed");
    }
  }

  // --- QUICK ACCESS per role - matches your photo ---
  const quickAccess = appRole === "admin"
    ? [
        { icon: "👨‍🎓", label: "Students", sub: `${students.length || 156} Total` },
        { icon: "👩‍🏫", label: "Teachers", sub: "12 Total" },
        { icon: "🏫", label: "Classes", sub: "8 Classes" },
        { icon: "💰", label: "Payments", sub: "View all" },
        { icon: "📝", label: "Results", sub: "Manage" },
        { icon: "📢", label: "Circulars", sub: "Send" },
      ]
    : appRole === "teacher"
    ? [
        { icon: "✅", label: "My Attendance", sub: "Today" },
        { icon: "👨‍🎓", label: "Class Attendance", sub: "Mark" },
        { icon: "📝", label: "Submit Results", sub: "Term" },
        { icon: "📚", label: "Homework", sub: "Assign" },
        { icon: "💬", label: "Messages", sub: "Inbox" },
        { icon: "📢", label: "Circulars", sub: "View" },
      ]
    : [
        { icon: "💰", label: "Fee", sub: "Balance" },
        { icon: "✅", label: "Attendance", sub: "View" },
        { icon: "📚", label: "Homework", sub: "View" },
        { icon: "💬", label: "Messages", sub: "Inbox" },
        { icon: "📢", label: "Circulars", sub: "School" },
        { icon: "👤", label: "Profile", sub: "My child" },
      ];

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.loginWrap}>
          <View style={styles.logoCircle}><Text style={styles.logoText}>S</Text></View>
          <Text style={styles.brand}>SKOOLSYNC</Text>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.sub}>{schoolName} • A connected school community</Text>
          <View style={styles.card}>
            <Text style={styles.label}>School ID</Text>
            <TextInput style={styles.input} value={schoolId} onChangeText={setSchoolId} placeholder="e.g. ABC-001" placeholderTextColor="#94A3B8" />
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" placeholderTextColor="#94A3B8" />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry placeholderTextColor="#94A3B8" />
            <Pressable style={styles.button} onPress={signIn}><Text style={styles.buttonText}>Sign In →</Text></Pressable>
            <Text style={styles.message}>{message}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{greetingName[0]?.toUpperCase() || "S"}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolTop}>{schoolName}</Text>
            <Text style={styles.schoolSub}>Harare • Zimbabwe</Text>
          </View>
          <View style={styles.bell}><Text>🔔</Text><View style={styles.dot} /></View>
        </View>

        {/* GREETING CARD - like ABC photo */}
        <View style={styles.greetCard}>
          <View>
            <Text style={styles.greetHi}>Hi, {greetingName}!</Text>
            <Text style={styles.greetSub}>{today}</Text>
            <View style={styles.rolePill}><Text style={styles.rolePillText}>{roleLabel} • {className}</Text></View>
          </View>
          <View style={styles.greetIcon}><Text style={{ fontSize: 32 }}>👋</Text></View>
        </View>

        {/* STATS - Admin */}
        {appRole === "admin" && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statNum}>{students.length || 156}</Text><Text style={styles.statLabel}>Total Students</Text><Text style={styles.statUp}>↑ 6.5% vs last year</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>12</Text><Text style={styles.statLabel}>Total Teachers</Text><Text style={styles.statUp}>↑ 1 this term</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>8</Text><Text style={styles.statLabel}>Total Classes</Text><Text style={styles.statUp}>Grade 1 - 7</Text></View>
          </View>
        )}

        {/* STATS - Family */}
        {appRole === "family" && (
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Fee Balance</Text>
            <Text style={styles.feeAmount}>$ 120.00</Text>
            <Text style={styles.feeSub}>Due: 30 Nov 2026 • Term 3</Text>
            <Pressable style={styles.payBtn}><Text style={styles.payBtnText}>Pay Now</Text></Pressable>
          </View>
        )}

        {/* QUICK ACCESS */}
        <View style={styles.sectionHead}><Text style={styles.section}>Quick Access</Text><Text style={styles.seeAll}>See All ›</Text></View>
        <View style={styles.grid}>
          {quickAccess.map((q) => (
            <Pressable key={q.label} style={styles.gridItem} onPress={() => setTab(q.label)}>
              <Text style={styles.gridIcon}>{q.icon}</Text>
              <Text style={styles.gridLabel}>{q.label}</Text>
              <Text style={styles.gridSub}>{q.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* PAYMENT TRENDS / ATTENDANCE - like photo */}
        {appRole === "admin" && (
          <View style={styles.card}>
            <Text style={styles.section}>Payment Trends</Text>
            <Text style={styles.trendSub}>Term 3 Collection</Text>
            <View style={styles.bars}>
              <View style={[styles.bar, { height: 40 }]}><Text style={styles.barLabel}>Sep</Text></View>
              <View style={[styles.bar, { height: 70, backgroundColor: "#16A34A" }]}><Text style={styles.barLabel}>Oct</Text></View>
              <View style={[styles.bar, { height: 55 }]}><Text style={styles.barLabel}>Nov</Text></View>
              <View style={[styles.bar, { height: 85, backgroundColor: "#16A34A" }]}><Text style={styles.barLabel}>Dec</Text></View>
            </View>
          </View>
        )}

        {appRole !== "admin" && (
          <View style={styles.card}>
            <Text style={styles.section}>My Attendance</Text>
            <Text style={styles.trendSub}>This Month • {className}</Text>
            <View style={styles.attRow}>
              <View style={styles.attBox}><Text style={styles.attNum}>92%</Text><Text style={styles.attLabel}>Present</Text></View>
              <View style={styles.attBox}><Text style={styles.attNum}>18</Text><Text style={styles.attLabel}>Days Present</Text></View>
              <View style={styles.attBox}><Text style={styles.attNum}>2</Text><Text style={styles.attLabel}>Absent</Text></View>
            </View>
          </View>
        )}

        {/* STUDENTS LIST */}
        <View style={styles.sectionHead}><Text style={styles.section}>Students</Text><Text style={styles.seeAll}>{students.length} total</Text></View>
        {students.length === 0 && (
          <View style={styles.card}><Text style={styles.trendSub}>No students loaded yet. Your school data will appear here after admin adds students.</Text></View>
        )}
        {students.slice(0, 5).map((s: any, i: number) => (
          <View key={i} style={styles.row}>
            <View style={styles.rowAvatar}><Text style={styles.rowAvatarText}>{(s.first_name || s.name || "S")[0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.name}>{s.first_name || s.name || "Student"} {s.last_name || ""}</Text><Text style={styles.trendSub}>{s.class_name || className} • {s.admission_no || "—"}</Text></View>
            <Text style={styles.present}>Present</Text>
          </View>
        ))}

        <Text style={styles.footer}>SkoolSync • A connected school community</Text>
      </ScrollView>

      {/* BOTTOM NAV - like ABC photo */}
      <View style={styles.bottomNav}>
        {["Home", "Attendance", "Homework", "Messages", "Profile"].map((t) => (
          <Pressable key={t} style={styles.navItem} onPress={() => setTab(t)}>
            <Text style={styles.navIcon}>{t === "Home" ? "🏠" : t === "Attendance" ? "✅" : t === "Homework" ? "📚" : t === "Messages" ? "💬" : "👤"}</Text>
            <Text style={[styles.navLabel, (tab === t || (t === "Home" && tab === "home")) && styles.navActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  loginWrap: { padding: 22, paddingTop: 60 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  logoText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  brand: { fontSize: 14, fontWeight: "900", letterSpacing: 3, color: "#16A34A", textAlign: "center", marginTop: 12 },
  heading: { fontSize: 27, fontWeight: "800", color: "#14233d", marginTop: 8, textAlign: "center" },
  sub: { fontSize: 14, color: "#65738a", marginTop: 7, marginBottom: 20, textAlign: "center" },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 12, fontWeight: "700", color: "#53627a", marginBottom: 6 },
  input: { backgroundColor: "#f4f6fa", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, color: "#0F172A" },
  button: { backgroundColor: "#16A34A", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  message: { textAlign: "center", marginTop: 12, color: "#64748B", fontSize: 13 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  schoolTop: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  schoolSub: { fontSize: 12, color: "#64748B" },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  greetCard: { marginHorizontal: 18, backgroundColor: "#16A34A", borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetHi: { color: "#fff", fontSize: 22, fontWeight: "800" },
  greetSub: { color: "#DCFCE7", fontSize: 12, marginTop: 4 },
  rolePill: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 10, alignSelf: "flex-start" },
  rolePillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  greetIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 18, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statNum: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },
  statUp: { fontSize: 10, color: "#16A34A", fontWeight: "700", marginTop: 4 },
  feeCard: { marginHorizontal: 18, marginTop: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  feeLabel: { fontSize: 12, color: "#64748B" },
  feeAmount: { fontSize: 28, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  feeSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  payBtn: { backgroundColor: "#16A34A", padding: 10, borderRadius: 10, alignItems: "center", marginTop: 12 },
  payBtnText: { color: "#fff", fontWeight: "800" },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, marginTop: 18, marginBottom: 12 },
  section: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  seeAll: { fontSize: 12, color: "#16A34A", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
  gridItem: { width: "30%", backgroundColor: "#fff", borderRadius: 16, padding: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  gridIcon: { fontSize: 24 },
  gridLabel: { fontSize: 12, fontWeight: "700", color: "#0F172A", marginTop: 6, textAlign: "center" },
  gridSub: { fontSize: 10, color: "#64748B", marginTop: 2 },
  trendSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginTop: 16, height: 100 },
  bar: { flex: 1, backgroundColor: "#E2E8F0", borderRadius: 8, alignItems: "center", justifyContent: "flex-end", paddingBottom: 6 },
  barLabel: { fontSize: 10, color: "#64748B", fontWeight: "700" },
  attRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  attBox: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, alignItems: "center" },
  attNum: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  attLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginHorizontal: 18, marginBottom: 9 },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowAvatarText: { color: "#16A34A", fontWeight: "800" },
  name: { fontSize: 15, fontWeight: "700", color: "#17253d" },
  present: { backgroundColor: "#DCFCE7", color: "#16A34A", fontWeight: "800", fontSize: 11, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, overflow: "hidden" },
  footer: { textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 14 },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  navItem: { flex: 1, alignItems: "center" },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "700", marginTop: 2 },
  navActive: { color: "#16A34A" },
});