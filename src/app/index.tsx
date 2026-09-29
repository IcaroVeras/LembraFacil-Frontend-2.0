import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { estaLogado } from "../services/authService";

export default function Inicio() {
  const router = useRouter();

  const [verificandoLogin, setVerificandoLogin] =
    useState(true);

  // =========================================================
  // VERIFICAR LOGIN AO ABRIR O APP
  // =========================================================

  useEffect(() => {
    verificarLogin();
  }, []);

  async function verificarLogin() {
    try {
      const logado = await estaLogado();

      console.log("Usuário logado:", logado);

      if (!logado) {
        router.replace("/login");
        return;
      }

      setVerificandoLogin(false);
    } catch (erro) {
      console.error(
        "Erro ao verificar login:",
        erro
      );

      router.replace("/login");
    }
  }

  // =========================================================
  // CARREGANDO
  // =========================================================

  if (verificandoLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Carregando LembraFácil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================
  // TELA INICIAL
  // =========================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* CABEÇALHO */}

      <View style={styles.header}>
        <Text style={styles.logo}>
          LembraFácil
        </Text>

        <Text style={styles.subtitle}>
          Cuidando da sua rotina com carinho
        </Text>
      </View>

      {/* CONTEÚDO COM ROLAGEM */}

      <ScrollView
        style={styles.content}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.title}>
          Como podemos ajudar?
        </Text>

        {/* ================================================= */}
        {/* IDOSO */}
        {/* ================================================= */}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/idoso")
          }
        >
          <Text style={styles.emoji}>
            👴
          </Text>

          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>
              SOU IDOSO
            </Text>

            <Text style={styles.buttonText}>
              Quero acompanhar minha rotina
            </Text>
          </View>
        </TouchableOpacity>

        {/* ================================================= */}
        {/* FAMILIAR */}
        {/* ================================================= */}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/familia")
          }
        >
          <Text style={styles.emoji}>
            👨‍👩‍👧
          </Text>

          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>
              SOU FAMILIAR
            </Text>

            <Text style={styles.buttonText}>
              Quero acompanhar meu familiar
            </Text>
          </View>
        </TouchableOpacity>

        {/* ================================================= */}
        {/* RECEITA */}
        {/* ================================================= */}

        <TouchableOpacity
          style={styles.recipeButton}
          onPress={() =>
            router.push("/receita")
          }
        >
          <Text style={styles.recipeEmoji}>
            📷
          </Text>

          <Text style={styles.recipeTitle}>
            LER RECEITA
          </Text>

          <Text style={styles.recipeText}>
            Tire uma foto da receita para
            cadastrar os medicamentos
          </Text>
        </TouchableOpacity>

        {/* ================================================= */}
        {/* MEDICAMENTOS */}
        {/* ================================================= */}

        <TouchableOpacity
          style={styles.medicamentosButton}
          onPress={() =>
            router.push("/medicamentos")
          }
        >
          <Text
            style={styles.medicamentosEmoji}
          >
            💊
          </Text>

          <View style={styles.buttonContent}>
            <Text
              style={styles.medicamentosTitle}
            >
              MEUS MEDICAMENTOS
            </Text>

            <Text
              style={styles.medicamentosText}
            >
              Visualizar medicamentos cadastrados
            </Text>
          </View>
        </TouchableOpacity>

        {/* ================================================= */}
        {/* MENSAGENS */}
        {/* ================================================= */}

        <TouchableOpacity
          style={styles.mensagensButton}
          onPress={() =>
            router.push("/mensagens")
          }
        >
          <Text style={styles.mensagensEmoji}>
            💬
          </Text>

          <View style={styles.buttonContent}>
            <Text style={styles.mensagensTitle}>
              MENSAGENS
            </Text>

            <Text style={styles.mensagensText}>
              Acompanhar horários e confirmações
            </Text>
          </View>
        </TouchableOpacity>

        {/* RODAPÉ */}

        <Text style={styles.footer}>
          Simples • Seguro • Fácil de usar
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================================
// ESTILOS
// ===========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  // =========================================================
  // LOADING
  // =========================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 17,
    color: "#555",
    fontWeight: "600",
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    alignItems: "center",
    paddingTop: 25,
    paddingHorizontal: 25,
    paddingBottom: 5,
  },

  logo: {
    fontSize: 38,
    fontWeight: "800",
    color: "#2563EB",
  },

  subtitle: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginTop: 8,
  },

  // =========================================================
  // CONTEÚDO
  // =========================================================

  content: {
    flex: 1,
    paddingHorizontal: 22,
  },

  contentContainer: {
    paddingTop: 30,
    paddingBottom: 35,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 25,
    textAlign: "center",
  },

  // =========================================================
  // BOTÕES PRINCIPAIS
  // =========================================================

  button: {
    minHeight: 95,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 16,
    padding: 18,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  buttonContent: {
    flex: 1,
  },

  emoji: {
    fontSize: 42,
    marginRight: 18,
  },

  buttonTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
  },

  buttonText: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },

  // =========================================================
  // RECEITA
  // =========================================================

  recipeButton: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginTop: 2,
  },

  recipeEmoji: {
    fontSize: 38,
    marginBottom: 5,
  },

  recipeTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  recipeText: {
    color: "#E8EEFF",
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 21,
  },

  // =========================================================
  // MEDICAMENTOS
  // =========================================================

  medicamentosButton: {
    minHeight: 85,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginTop: 15,
    padding: 17,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#DBEAFE",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  medicamentosEmoji: {
    fontSize: 36,
    marginRight: 16,
  },

  medicamentosTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
  },

  medicamentosText: {
    fontSize: 14,
    color: "#666",
    marginTop: 3,
  },

  // =========================================================
  // MENSAGENS
  // =========================================================

  mensagensButton: {
    minHeight: 85,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginTop: 15,
    padding: 17,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#DCFCE7",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  mensagensEmoji: {
    fontSize: 36,
    marginRight: 16,
  },

  mensagensTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16A34A",
  },

  mensagensText: {
    fontSize: 14,
    color: "#666",
    marginTop: 3,
  },

  // =========================================================
  // FOOTER
  // =========================================================

  footer: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginTop: 25,
    paddingBottom: 10,
  },
});