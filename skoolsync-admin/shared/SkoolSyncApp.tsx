import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";

type Props = { appRole: "admin" | "teacher" | "family"; apiBase: string };

export default function SkoolSyncApp({ appRole, apiBase }: Props) {
  const [schoolId, setSchoolId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [message, setMessage] = useState("Sign in to your school account");
  const [students, setStudents] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [className, setClassName] = useState("Grade 7");
  const [admission, setAdmission] = useState("");

  const title = appRole === "admin" ? "SkoolSync Admin" : appRole === "teacher" ? "SkoolSync Teacher" : "SkoolSync Family";

  async function request(path: string, options: any = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Request failed");
    return data;
  }

  async function signIn() {
    try {
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ school_id: Number(schoolId), username, password }) });
      setToken(data.access_token);
      const profile = await fetch(`${apiBase}/me`, { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.json());
      setSchoolName(profile.school_name || "");
      setMessage(`Signed in to ${profile.school_name || "your school"}`);
    } catch (e: any) { Alert.alert("Sign-in failed", e.message); }
  }

  async function loadStudents() {
    try { setStudents(await request("/students")); }
    catch (e: any) { Alert.alert("Could not load learners", e.message); }
  }

  async function addStudent() {
    try {
      await request("/students", { method: "POST", body: JSON.stringify({ first_name: firstName, last_name: lastName, class_name: className, admission_number: admission }) });
      setFirstName(""); setLastName(""); setAdmission(""); await loadStudents();
      Alert.alert("Success", "Learner added.");
    } catch (e: any) { Alert.alert("Could not add learner", e.message); }
  }

  async function markAttendance(studentId: number, status: string) {
    try {
      await request("/attendance", { method: "POST", body: JSON.stringify({ student_id: studentId, attendance_date: new Date().toISOString().slice(0, 10), status }) });
      Alert.alert("Saved", `${status} recorded.`);
    } catch (e: any) { Alert.alert("Attendance not saved", e.message); }
  }

  useEffect(() => { if (token && appRole !== "family") loadStudents(); }, [token]);

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>SKOOLSYNC</Text><Text style={styles.heading}>{title}</Text>
      <Text style={styles.sub}>{message}</Text>
      {!token ? <View style={styles.card}>
        <Text style={styles.label}>School ID</Text><TextInput style={styles.input} keyboardType="numeric" value={schoolId} onChangeText={setSchoolId} placeholder="Enter school ID" />
        <Text style={styles.label}>Username</Text><TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Administrator / teacher username" />
        <Text style={styles.label}>Password</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
        <Pressable style={styles.button} onPress={signIn}><Text style={styles.buttonText}>Sign in</Text></Pressable>
        <Text style={styles.hint}>School registration is available through the API at /docs in this starter version.</Text>
      </View> : <>
        <View style={styles.card}><Text style={styles.label}>School</Text><Text style={styles.school}>{schoolName}</Text>
          {appRole === "admin" && <>
            <Text style={styles.section}>Add learner</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />
            <TextInput style={styles.input} value={className} onChangeText={setClassName} placeholder="Class" />
            <TextInput style={styles.input} value={admission} onChangeText={setAdmission} placeholder="Admission number" />
            <Pressable style={styles.button} onPress={addStudent}><Text style={styles.buttonText}>Add learner</Text></Pressable>
          </>}
          {appRole !== "family" && <Pressable style={styles.secondary} onPress={loadStudents}><Text style={styles.secondaryText}>Refresh learner list</Text></Pressable>}
        </View>
        {students.map(s => <View key={s.id} style={styles.row}><View style={{flex:1}}><Text style={styles.name}>{s.first_name} {s.last_name}</Text><Text style={styles.hint}>{s.class_name} · {s.admission_number}</Text></View>
          {appRole === "teacher" && <Pressable style={styles.present} onPress={() => markAttendance(s.id, "Present")}><Text style={styles.presentText}>Present</Text></Pressable>}
        </View>)}
        <Pressable style={styles.secondary} onPress={() => { setToken(""); setStudents([]); setMessage("Signed out"); }}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
      </>}
      <Text style={styles.footer}>A connected school community</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f3f6fb"},container:{padding:22,paddingTop:35},
  brand:{fontSize:14,fontWeight:"900",letterSpacing:3,color:"#2864c5"},
  heading:{fontSize:27,fontWeight:"800",color:"#14233d",marginTop:8},
  sub:{fontSize:14,color:"#65738a",marginTop:7,marginBottom:20},
  card:{backgroundColor:"#fff",padding:18,borderRadius:16,marginBottom:15},
  label:{fontSize:12,fontWeight:"700",color:"#53627a",marginBottom:6},
  input:{backgroundColor:"#f4f6fa",borderRadius:9,padding:12,marginBottom:12,color:"#18243a"},
  button:{backgroundColor:"#2864c5",padding:14,borderRadius:10,alignItems:"center",marginTop:5},
  buttonText:{color:"#fff",fontWeight:"800"},hint:{fontSize:11,color:"#7b8798",marginTop:10},
  section:{fontSize:17,fontWeight:"800",marginTop:18,marginBottom:12,color:"#14233d"},
  school:{fontSize:18,fontWeight:"800",color:"#14233d"},
  row:{backgroundColor:"#fff",padding:14,borderRadius:12,marginBottom:9,flexDirection:"row",alignItems:"center"},
  name:{fontSize:15,fontWeight:"700",color:"#17253d"},present:{backgroundColor:"#e5f5ec",padding:10,borderRadius:8},
  presentText:{color:"#187346",fontWeight:"800"},secondary:{borderWidth:1,borderColor:"#2864c5",padding:13,borderRadius:10,alignItems:"center",marginTop:10},
  secondaryText:{color:"#2864c5",fontWeight:"800"},footer:{textAlign:"center",color:"#9aa5b5",marginTop:25,fontSize:11}
});
