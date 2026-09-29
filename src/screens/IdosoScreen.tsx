import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function IdosoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Olá! 👋</Text>

        <Text style={styles.subtitle}>
          Vamos cuidar da sua rotina.
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/receita")}
        >
          <Text style={styles.icon}>📷</Text>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Ler receita</Text>
            <Text style={styles.cardText}>
              Tire uma foto da sua receita
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>💊</Text>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Meus medicamentos</Text>
            <Text style={styles.cardText}>
              Veja seus medicamentos e horários
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>🔔</Text>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Minha rotina</Text>
            <Text style={styles.cardText}>
              Confira o que precisa fazer hoje
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sos}>
          <Text style={styles.sosIcon}>🆘</Text>
          <Text style={styles.sosTitle}>PRECISO DE AJUDA</Text>
          <Text style={styles.sosText}>
            Avise meu familiar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    padding: 22,
  },

  voltar: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 25,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#222",
  },

  subtitle: {
    fontSize: 19,
    color: "#666",
    marginTop: 5,
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    minHeight: 100,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },

  icon: {
    fontSize: 42,
    marginRight: 18,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
  },

  cardText: {
    fontSize: 15,
    color: "#666",
    marginTop: 5,
  },

  sos: {
    backgroundColor: "#DC2626",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 15,
  },

  sosIcon: {
    fontSize: 42,
  },

  sosTitle: {
    color: "#FFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 8,
  },

  sosText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 5,
  },
});