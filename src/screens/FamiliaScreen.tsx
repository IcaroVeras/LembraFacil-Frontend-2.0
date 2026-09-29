import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import {
  atualizarMeuCuidador,
  buscarMeuCuidador,
} from "../services/cuidadoresService";

export default function FamiliaScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  // ==============================================
  // CARREGAR DADOS DO DJANGO
  // ==============================================

  async function carregarCuidador() {
    try {
      const cuidador =
        await buscarMeuCuidador();

      setNome(cuidador.nome || "");
      setTelefone(
        cuidador.telefone || ""
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar familiar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível carregar os dados do familiar."
      );
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarCuidador();
    }, [])
  );

  // ==============================================
  // SALVAR
  // ==============================================

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o nome do familiar."
      );

      return;
    }

    if (!telefone.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o telefone do familiar."
      );

      return;
    }

    try {
      setSalvando(true);

      const atualizado =
        await atualizarMeuCuidador(
          nome,
          telefone
        );

      setNome(atualizado.nome);
      setTelefone(
        atualizado.telefone || ""
      );

      Alert.alert(
        "Salvo",
        "Dados do familiar salvos com sucesso."
      );
    } catch (erro) {
      console.error(
        "Erro ao salvar familiar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível salvar os dados."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ==============================================
  // CARREGANDO
  // ==============================================

  if (carregando) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.carregandoContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#256D5B"
          />

          <Text
            style={
              styles.carregandoTexto
            }
          >
            Carregando familiar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==============================================
  // TELA
  // ==============================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.voltar}
            >
              ← Voltar
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            Área da família 👨‍👩‍👧
          </Text>

          <Text
            style={styles.subtitle}
          >
            Cadastre os dados do
            familiar responsável.
          </Text>

          {/* FORMULÁRIO */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              👤 Familiar responsável
            </Text>

            <Text
              style={styles.label}
            >
              Nome
            </Text>

            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do familiar"
              placeholderTextColor="#9CA3AF"
            />

            <Text
              style={styles.label}
            >
              Telefone / WhatsApp
            </Text>

            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="Ex.: 81999999999"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[
                styles.botaoSalvar,
                salvando &&
                  styles.botaoDesabilitado,
              ]}
              disabled={salvando}
              onPress={salvar}
            >
              {salvando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.botaoSalvarTexto
                  }
                >
                  Salvar familiar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* STATUS */}

          <View style={styles.status}>
            <Text
              style={styles.statusIcon}
            >
              🟢
            </Text>

            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.statusTitle
                }
              >
                Rotina de hoje
              </Text>

              <Text
                style={
                  styles.statusText
                }
              >
                Os medicamentos e
                confirmações serão
                acompanhados pelo
                LembraFácil.
              </Text>
            </View>
          </View>

          {/* MEDICAMENTOS */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              💊 Medicamentos
            </Text>

            <Text
              style={styles.cardText}
            >
              Os medicamentos cadastrados
              podem ser acompanhados pela
              área de mensagens.
            </Text>
          </View>

          {/* ALERTAS */}

          <View style={styles.card}>
            <Text
              style={styles.cardTitle}
            >
              🚨 Alertas
            </Text>

            <Text
              style={styles.cardText}
            >
              O telefone cadastrado será
              utilizado na próxima etapa
              para avisar o familiar.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F7F8FA",
    },

    carregandoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    carregandoTexto: {
      marginTop: 12,
      color: "#666",
      fontSize: 16,
    },

    content: {
      padding: 22,
      paddingBottom: 50,
    },

    voltar: {
      fontSize: 18,
      color: "#256D5B",
      fontWeight: "700",
      marginBottom: 25,
    },

    title: {
      fontSize: 30,
      fontWeight: "800",
      color: "#222",
    },

    subtitle: {
      fontSize: 17,
      color: "#666",
      marginTop: 8,
      marginBottom: 28,
      lineHeight: 24,
    },

    status: {
      backgroundColor: "#FFF",
      borderRadius: 18,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
      elevation: 3,
    },

    statusIcon: {
      fontSize: 35,
      marginRight: 15,
    },

    statusTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222",
    },

    statusText: {
      color: "#666",
      marginTop: 4,
      lineHeight: 21,
    },

    card: {
      backgroundColor: "#FFF",
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      elevation: 3,
    },

    cardTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: "#222",
      marginBottom: 15,
    },

    cardText: {
      fontSize: 16,
      color: "#666",
      lineHeight: 23,
    },

    label: {
      fontSize: 15,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 7,
    },

    input: {
      borderWidth: 1,
      borderColor: "#D1D5DB",
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 13,
      fontSize: 16,
      color: "#111827",
      marginBottom: 17,
    },

    botaoSalvar: {
      backgroundColor: "#256D5B",
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 50,
      marginTop: 3,
    },

    botaoDesabilitado: {
      opacity: 0.6,
    },

    botaoSalvarTexto: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
  });