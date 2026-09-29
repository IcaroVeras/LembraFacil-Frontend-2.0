import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { fazerLogin } from "../services/authService";

export default function Login() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert(
        "Atenção",
        "Digite o usuário e a senha."
      );
      return;
    }

    try {
      setCarregando(true);

      await fazerLogin(
        usuario.trim(),
        senha
      );

      router.replace("/");
    } catch (erro) {
      console.error("Erro no login:", erro);

      Alert.alert(
        "Não foi possível entrar",
        "Verifique seu usuário, senha e a conexão com o servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>
            LembraFácil
          </Text>

          <Text style={styles.subtitle}>
            Cuidando da sua rotina com carinho
          </Text>

          <View style={styles.card}>
            <Text style={styles.title}>
              Entrar
            </Text>

            <Text style={styles.description}>
              Entre na sua conta para acessar seus medicamentos.
            </Text>

            <Text style={styles.label}>
              Usuário
            </Text>

            <TextInput
              style={styles.input}
              value={usuario}
              onChangeText={setUsuario}
              placeholder="Digite seu usuário"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!carregando}
            />

            <Text style={styles.label}>
              Senha
            </Text>

            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!carregando}
              onSubmitEditing={entrar}
            />

            <TouchableOpacity
              style={[
                styles.loginButton,
                carregando && styles.loginButtonDisabled,
              ]}
              onPress={entrar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  ENTRAR
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            🔒 Seus dados ficam protegidos
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  logo: {
    fontSize: 42,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 17,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 35,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 25,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#222",
    textAlign: "center",
  },

  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#222",
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
  },

  loginButton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  footer: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginTop: 25,
  },
});