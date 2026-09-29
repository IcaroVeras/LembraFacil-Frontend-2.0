import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  listarMedicamentos,
  Medicamento,
} from "../services/medicamentosService";

import {
  confirmarRegistro,
  criarRegistro,
  listarRegistros,
  RegistroMedicamento,
} from "../services/registrosService";

import {
  buscarMeuCuidador,
} from "../services/cuidadoresService";

export default function MensagensScreen() {
  const router = useRouter();

  const [medicamentos, setMedicamentos] =
    useState<Medicamento[]>([]);

  const [registros, setRegistros] =
    useState<RegistroMedicamento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [confirmandoId, setConfirmandoId] =
    useState<string | null>(null);

  const [avisandoId, setAvisandoId] =
    useState<string | null>(null);

  // =====================================================
  // DATA DE HOJE
  // =====================================================

  function obterDataHoje(): string {
    const agora = new Date();

    const ano = agora.getFullYear();

    const mes = String(
      agora.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      agora.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  // =====================================================
  // CARREGAR DADOS DO DJANGO
  // =====================================================

  async function carregarDados() {
    try {
      const [
        listaMedicamentos,
        listaRegistros,
      ] = await Promise.all([
        listarMedicamentos(),
        listarRegistros(),
      ]);

      setMedicamentos(
        listaMedicamentos
      );

      setRegistros(
        listaRegistros
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar mensagens:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível carregar os medicamentos."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  // =====================================================
  // ATUALIZA AO ENTRAR NA TELA
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  // =====================================================
  // PUXAR PARA ATUALIZAR
  // =====================================================

  function atualizarLista() {
    setAtualizando(true);
    carregarDados();
  }

  // =====================================================
  // LOCALIZAR REGISTRO DE HOJE
  // =====================================================

  function buscarRegistroHoje(
    medicamentoId: string
  ): RegistroMedicamento | undefined {
    const hoje = obterDataHoje();

    return registros.find(
      (registro) =>
        String(registro.medicamento) ===
          String(medicamentoId) &&
        registro.data === hoje
    );
  }

  // =====================================================
  // CONFIRMAR MEDICAMENTO
  // =====================================================

  async function confirmarMedicamento(
    medicamento: Medicamento
  ) {
    try {
      setConfirmandoId(
        medicamento.id
      );

      let registro =
        buscarRegistroHoje(
          medicamento.id
        );

      // Se ainda não existir registro
      // para hoje, cria como pendente.
      if (!registro) {
        registro =
          await criarRegistro(
            medicamento.id,
            medicamento.horario
          );
      }

      // Salva no Django como TOMADO.
      const registroAtualizado =
        await confirmarRegistro(
          registro.id
        );

      // Atualiza a lista local.
      setRegistros(
        (listaAtual) => {
          const registroJaExiste =
            listaAtual.some(
              (item) =>
                item.id ===
                registroAtualizado.id
            );

          if (registroJaExiste) {
            return listaAtual.map(
              (item) =>
                item.id ===
                registroAtualizado.id
                  ? registroAtualizado
                  : item
            );
          }

          return [
            registroAtualizado,
            ...listaAtual,
          ];
        }
      );

      Alert.alert(
        "Confirmado",
        `${medicamento.medicamento} foi marcado como tomado.`
      );
    } catch (erro) {
      console.error(
        "Erro ao confirmar medicamento:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível confirmar o medicamento."
      );
    } finally {
      setConfirmandoId(null);
    }
  }

  // =====================================================
  // AVISAR FAMILIAR PELO WHATSAPP
  // =====================================================

  async function avisarFamiliar(
    medicamento: Medicamento
  ) {
    try {
      setAvisandoId(
        medicamento.id
      );

      // Busca o familiar/cuidador
      // cadastrado no Django.
      const cuidador =
        await buscarMeuCuidador();

      if (
        !cuidador.telefone ||
        !cuidador.telefone.trim()
      ) {
        Alert.alert(
          "Telefone não cadastrado",
          "Cadastre o telefone do familiar na Área da Família."
        );

        return;
      }

      // Remove espaços, parênteses,
      // hífens etc.
      let telefone =
        cuidador.telefone.replace(
          /\D/g,
          ""
        );

      if (!telefone) {
        Alert.alert(
          "Telefone inválido",
          "O telefone do familiar não é válido."
        );

        return;
      }

      // Se foi cadastrado como:
      // 81999999999
      // transforma em:
      // 5581999999999
      if (
        telefone.length === 10 ||
        telefone.length === 11
      ) {
        telefone =
          `55${telefone}`;
      }

      const nomeFamiliar =
        cuidador.nome?.trim()
          ? cuidador.nome.trim()
          : "familiar";

      const nomeMedicamento =
        medicamento.medicamento ||
        "Medicamento";

      const horario =
        medicamento.horario ||
        "horário não informado";

      const dosagem =
        medicamento.dosagem
          ? `\n💊 Dosagem: ${medicamento.dosagem}`
          : "";

      const mensagem =
        `🚨 Alerta LembraFácil\n\n` +
        `Olá, ${nomeFamiliar}!\n\n` +
        `O medicamento ${nomeMedicamento}, ` +
        `previsto para ${horario}, ` +
        `ainda não foi confirmado como tomado.` +
        `${dosagem}\n\n` +
        `Por favor, verifique a rotina do paciente.\n\n` +
        `LembraFácil 💚`;

      const url =
        `https://wa.me/${telefone}` +
        `?text=${encodeURIComponent(
          mensagem
        )}`;

      const podeAbrir =
        await Linking.canOpenURL(
          url
        );

      if (!podeAbrir) {
        Alert.alert(
          "WhatsApp",
          "Não foi possível abrir o WhatsApp neste aparelho."
        );

        return;
      }

      await Linking.openURL(url);
    } catch (erro) {
      console.error(
        "Erro ao avisar familiar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível abrir a mensagem para o familiar."
      );
    } finally {
      setAvisandoId(null);
    }
  }

  // =====================================================
  // CARREGANDO
  // =====================================================

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
            Carregando medicamentos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // TELA
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* CABEÇALHO */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.voltar}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.voltarTexto
            }
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View>
          <Text
            style={styles.titulo}
          >
            Mensagens
          </Text>

          <Text
            style={
              styles.subtitulo
            }
          >
            Acompanhe os medicamentos
          </Text>
        </View>
      </View>

      {/* LISTA */}

      <ScrollView
        contentContainerStyle={
          styles.conteudo
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              atualizando
            }
            onRefresh={
              atualizarLista
            }
          />
        }
      >
        {medicamentos.length ===
        0 ? (
          <View
            style={styles.vazio}
          >
            <Text
              style={
                styles.vazioIcone
              }
            >
              💊
            </Text>

            <Text
              style={
                styles.vazioTitulo
              }
            >
              Nenhum medicamento
            </Text>

            <Text
              style={
                styles.vazioTexto
              }
            >
              Cadastre um medicamento
              para acompanhar os
              horários aqui.
            </Text>
          </View>
        ) : (
          medicamentos.map(
            (item) => {
              const registro =
                buscarRegistroHoje(
                  item.id
                );

              const confirmado =
                registro?.status ===
                "tomado";

              const atrasado =
                registro?.status ===
                "atrasado";

              const confirmando =
                confirmandoId ===
                item.id;

              const avisando =
                avisandoId ===
                item.id;

              return (
                <View
                  style={
                    styles.card
                  }
                  key={item.id}
                >
                  {/* TOPO */}

                  <View
                    style={
                      styles.cardTopo
                    }
                  >
                    <View
                      style={[
                        styles.status,

                        confirmado
                          ? styles.statusConfirmado
                          : atrasado
                          ? styles.statusAtrasado
                          : styles.statusPendente,
                      ]}
                    />

                    <View
                      style={
                        styles.info
                      }
                    >
                      <Text
                        style={
                          styles.medicamento
                        }
                      >
                        {
                          item.medicamento
                        }
                      </Text>

                      <Text
                        style={
                          styles.detalhes
                        }
                      >
                        {item.dosagem ||
                          "Sem dosagem"}

                        {" • "}

                        {item.horario ||
                          "Sem horário"}
                      </Text>
                    </View>
                  </View>

                  {/* FREQUÊNCIA */}

                  {item.frequencia ? (
                    <Text
                      style={
                        styles.extra
                      }
                    >
                      Frequência:{" "}
                      {
                        item.frequencia
                      }
                    </Text>
                  ) : null}

                  {/* DURAÇÃO */}

                  {item.duracao ? (
                    <Text
                      style={
                        styles.extra
                      }
                    >
                      Duração:{" "}
                      {item.duracao}
                    </Text>
                  ) : null}

                  {/* CONFIRMADO */}

                  {confirmado ? (
                    <View
                      style={
                        styles.confirmadoBox
                      }
                    >
                      <Text
                        style={
                          styles.confirmadoTexto
                        }
                      >
                        ✓ Medicamento
                        confirmado como
                        tomado
                      </Text>

                      {registro?.confirmado_em ? (
                        <Text
                          style={
                            styles.confirmadoHorario
                          }
                        >
                          Confirmação
                          salva no
                          sistema
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <>
                      {/* PENDENTE OU ATRASADO */}

                      <View
                        style={
                          atrasado
                            ? styles.atrasadoBox
                            : styles.alertaBox
                        }
                      >
                        <Text
                          style={
                            atrasado
                              ? styles.atrasadoTitulo
                              : styles.alertaTitulo
                          }
                        >
                          {atrasado
                            ? "Medicamento atrasado"
                            : "Medicamento pendente"}
                        </Text>

                        <Text
                          style={
                            atrasado
                              ? styles.atrasadoTexto
                              : styles.alertaTexto
                          }
                        >
                          {atrasado
                            ? "O horário passou e o medicamento ainda não foi confirmado."
                            : "Ainda não há confirmação de que este medicamento foi tomado."}
                        </Text>
                      </View>

                      {/* BOTÃO CONFIRMAR */}

                      <TouchableOpacity
                        style={[
                          styles.botaoConfirmar,

                          confirmando &&
                            styles.botaoDesabilitado,
                        ]}
                        disabled={
                          confirmando ||
                          avisando
                        }
                        onPress={() =>
                          confirmarMedicamento(
                            item
                          )
                        }
                      >
                        {confirmando ? (
                          <ActivityIndicator
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text
                            style={
                              styles.botaoConfirmarTexto
                            }
                          >
                            ✓ Tomei o
                            medicamento
                          </Text>
                        )}
                      </TouchableOpacity>

                      {/* AVISAR FAMILIAR */}

                      <TouchableOpacity
                        style={[
                          styles.botaoFamiliar,

                          avisando &&
                            styles.botaoDesabilitado,
                        ]}
                        disabled={
                          avisando ||
                          confirmando
                        }
                        onPress={() =>
                          avisarFamiliar(
                            item
                          )
                        }
                      >
                        {avisando ? (
                          <ActivityIndicator
                            color="#256D5B"
                          />
                        ) : (
                          <Text
                            style={
                              styles.botaoFamiliarTexto
                            }
                          >
                            📱 Avisar
                            familiar
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            }
          )
        )}

        <Text
          style={styles.rodape}
        >
          LembraFácil • Cuidando da
          sua rotina
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// =======================================================
// ESTILOS
// =======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F4F7F6",
    },

    carregandoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    carregandoTexto: {
      marginTop: 12,
      color: "#6B7280",
      fontSize: 16,
    },

    header: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },

    voltar: {
      marginRight: 15,
    },

    voltarTexto: {
      fontSize: 38,
      color: "#256D5B",
      lineHeight: 40,
    },

    titulo: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#1F2937",
    },

    subtitulo: {
      fontSize: 14,
      color: "#6B7280",
      marginTop: 2,
    },

    conteudo: {
      padding: 18,
      paddingBottom: 40,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,

      elevation: 3,

      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 5,

      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    cardTopo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },

    status: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },

    statusConfirmado: {
      backgroundColor: "#22C55E",
    },

    statusPendente: {
      backgroundColor: "#EF4444",
    },

    statusAtrasado: {
      backgroundColor: "#F59E0B",
    },

    info: {
      flex: 1,
    },

    medicamento: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1F2937",
    },

    detalhes: {
      color: "#6B7280",
      marginTop: 4,
      fontSize: 15,
    },

    extra: {
      color: "#6B7280",
      fontSize: 14,
      marginBottom: 8,
    },

    alertaBox: {
      backgroundColor: "#FEF2F2",
      padding: 14,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 14,
    },

    alertaTitulo: {
      color: "#B91C1C",
      fontWeight: "bold",
      fontSize: 16,
    },

    alertaTexto: {
      color: "#7F1D1D",
      marginTop: 5,
      lineHeight: 20,
    },

    atrasadoBox: {
      backgroundColor: "#FFFBEB",
      padding: 14,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 14,
    },

    atrasadoTitulo: {
      color: "#B45309",
      fontWeight: "bold",
      fontSize: 16,
    },

    atrasadoTexto: {
      color: "#92400E",
      marginTop: 5,
      lineHeight: 20,
    },

    confirmadoBox: {
      backgroundColor: "#F0FDF4",
      padding: 14,
      borderRadius: 12,
      marginTop: 8,
    },

    confirmadoTexto: {
      color: "#15803D",
      fontWeight: "600",
      fontSize: 16,
    },

    confirmadoHorario: {
      color: "#16A34A",
      marginTop: 6,
      fontSize: 13,
    },

    botaoConfirmar: {
      backgroundColor: "#256D5B",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      minHeight: 50,
    },

    botaoDesabilitado: {
      opacity: 0.6,
    },

    botaoConfirmarTexto: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 16,
    },

    botaoFamiliar: {
      borderWidth: 1,
      borderColor: "#256D5B",
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 50,
    },

    botaoFamiliarTexto: {
      color: "#256D5B",
      fontWeight: "bold",
      fontSize: 16,
    },

    vazio: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 30,
      alignItems: "center",
      marginTop: 30,
    },

    vazioIcone: {
      fontSize: 45,
    },

    vazioTitulo: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1F2937",
      marginTop: 10,
    },

    vazioTexto: {
      color: "#6B7280",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 21,
    },

    rodape: {
      textAlign: "center",
      color: "#9CA3AF",
      marginTop: 10,
    },
  });