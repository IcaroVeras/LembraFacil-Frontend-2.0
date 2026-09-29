import { CameraView, useCameraPermissions } from "expo-camera";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { adicionarMedicamento } from "../services/medicamentosService";

type DadosReceita = {
  medicamento: string;
  dosagem: string;
  quantidade: string;
  horario: string;
  frequencia: string;
  duracao: string;
};

const dadosVazios: DadosReceita = {
  medicamento: "",
  dosagem: "",
  quantidade: "",
  horario: "",
  frequencia: "",
  duracao: "",
};

export default function ReceitaScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [cameraAberta, setCameraAberta] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [tirandoFoto, setTirandoFoto] = useState(false);
  const [lendoReceita, setLendoReceita] = useState(false);
  const [textoOCR, setTextoOCR] = useState("");
  const [dadosReceita, setDadosReceita] =
    useState<DadosReceita | null>(null);

  const [permission, requestPermission] =
    useCameraPermissions();

  // =========================================================
  // ABRIR CÂMERA
  // =========================================================

  async function abrirCamera() {
    try {
      if (!permission?.granted) {
        const resultado = await requestPermission();

        if (!resultado.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos acessar a câmera para fotografar a receita."
          );
          return;
        }
      }

      setFoto(null);
      setTextoOCR("");
      setDadosReceita(null);
      setCameraAberta(true);
    } catch (erro) {
      console.log("Erro ao abrir câmera:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível abrir a câmera."
      );
    }
  }

  // =========================================================
  // TIRAR FOTO
  // =========================================================

  async function tirarFoto() {
    if (!cameraRef.current || tirandoFoto) {
      return;
    }

    try {
      setTirandoFoto(true);

      const resultado =
        await cameraRef.current.takePictureAsync({
          quality: 1,
        });

      if (resultado?.uri) {
        setFoto(resultado.uri);
        setTextoOCR("");
        setDadosReceita(null);
        setCameraAberta(false);
      }
    } catch (erro) {
      console.log("Erro ao tirar foto:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível tirar a foto."
      );
    } finally {
      setTirandoFoto(false);
    }
  }

  // =========================================================
  // ESCOLHER FOTO
  // =========================================================

  async function escolherFoto() {
    try {
      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 1,
        });

      if (
        !resultado.canceled &&
        resultado.assets &&
        resultado.assets.length > 0
      ) {
        setFoto(resultado.assets[0].uri);
        setTextoOCR("");
        setDadosReceita(null);
      }
    } catch (erro) {
      console.log("Erro ao escolher foto:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível selecionar a imagem."
      );
    }
  }

  // =========================================================
  // TIRAR OUTRA FOTO
  // =========================================================

  async function tirarOutraFoto() {
    setFoto(null);
    setTextoOCR("");
    setDadosReceita(null);

    await abrirCamera();
  }

  // =========================================================
  // IMAGEM -> BASE64
  // =========================================================

  async function imagemParaBase64(
    uri: string
  ): Promise<string> {
    try {
      const arquivo = new File(uri);
      const base64 = await arquivo.base64();

      if (!base64) {
        throw new Error("Imagem sem conteúdo.");
      }

      return base64;
    } catch (erro) {
      console.log("Erro Base64:", erro);

      throw new Error(
        "Não foi possível preparar a imagem."
      );
    }
  }

  // =========================================================
  // NORMALIZAR DOSAGEM
  // =========================================================

  function normalizarDosagem(valor: string) {
    return valor
      .replace(/\s+/g, " ")
      .replace(/\s*\+\s*/g, " + ")
      .trim()
      .toUpperCase();
  }

  // =========================================================
  // EXTRAIR DADOS
  // =========================================================

  function extrairDadosSeguros(
    texto: string
  ): DadosReceita {
    const resultado: DadosReceita = {
      ...dadosVazios,
    };

    const textoLimpo = texto
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    const linhas = textoLimpo
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean);

    console.log("======= LINHAS OCR =======");

    linhas.forEach((linha, indice) => {
      console.log(indice, linha);
    });

    // =======================================================
    // ENCONTRAR ÁREA DA PRESCRIÇÃO
    // =======================================================

    let indicePrescricao = linhas.findIndex((linha) =>
      /PRESCRIÇÃO|PRESCRICAO/i.test(linha)
    );

    if (indicePrescricao === -1) {
      indicePrescricao = linhas.findIndex((linha) =>
        /USO\s+ORAL|USO\s+INTERNO|USO\s+EXTERNO/i.test(
          linha
        )
      );
    }

    const inicio =
      indicePrescricao >= 0
        ? indicePrescricao
        : 0;

    // =======================================================
    // MEDICAMENTO + DOSAGEM
    //
    // EXEMPLO REAL:
    //
    // 1. ATAKCLAV 875 +125MG
    //
    // medicamento = ATAKCLAV
    // dosagem = 875 + 125MG
    // =======================================================

    for (
      let i = inicio;
      i < linhas.length;
      i++
    ) {
      const linha = linhas[i];

      if (
        /IDENTIFICAÇÃO DO COMPRADOR|IDENTIFICACAO DO COMPRADOR|IDENTIFICAÇÃO DO FORNECEDOR|IDENTIFICACAO DO FORNECEDOR/i.test(
          linha
        )
      ) {
        break;
      }

      // Primeiro remove a numeração:
      //
      // "1. ATAKCLAV 875 +125MG"
      //
      // vira:
      //
      // "ATAKCLAV 875 +125MG"

      const semNumero = linha
        .replace(
          /^\s*\d+\s*[.)º°:-]?\s*/,
          ""
        )
        .trim();

      // Procura a PRIMEIRA sequência numérica que
      // represente uma dosagem.

      const matchDosagem = semNumero.match(
        /\d+(?:[.,]\d+)?\s*(?:\+\s*\d+(?:[.,]\d+)?)?\s*(?:MG|MCG|G|ML|UI)\b/i
      );

      if (!matchDosagem) {
        continue;
      }

      const posicaoDosagem =
        matchDosagem.index ?? -1;

      if (posicaoDosagem <= 0) {
        continue;
      }

      const nomePossivel = semNumero
        .substring(0, posicaoDosagem)
        .trim()
        .replace(/[,:;-]+$/, "")
        .trim();

      // Evitar campos administrativos

      const proibidas = [
        "CRM",
        "UF",
        "CEP",
        "PACIENTE",
        "ENDEREÇO",
        "ENDERECO",
        "BAIRRO",
        "CIDADE",
        "ESTADO",
        "HOSPITAL",
        "SECRETARIA",
        "UNIDADE",
        "TELEFONE",
        "IDENTIFICAÇÃO",
        "IDENTIFICACAO",
        "DATA",
      ];

      const nomeUpper =
        nomePossivel.toUpperCase();

      const proibido =
        proibidas.some((palavra) =>
          nomeUpper.includes(palavra)
        );

      if (
        !proibido &&
        nomePossivel.length >= 3 &&
        /[A-Za-zÀ-ÿ]/.test(nomePossivel)
      ) {
        resultado.medicamento =
          nomePossivel.toUpperCase();

        resultado.dosagem =
          normalizarDosagem(
            matchDosagem[0]
          );

        console.log(
          "MEDICAMENTO ENCONTRADO:",
          resultado.medicamento
        );

        console.log(
          "DOSAGEM ENCONTRADA:",
          resultado.dosagem
        );

        break;
      }
    }

    // =======================================================
    // FALLBACK ESPECIAL
    //
    // Caso o OCR tenha separado:
    //
    // 1. ATAKCLAV
    // 875 +125MG
    // =======================================================

    if (!resultado.medicamento) {
      for (
        let i = inicio;
        i < linhas.length - 1;
        i++
      ) {
        const atual = linhas[i]
          .replace(
            /^\s*\d+\s*[.)º°:-]?\s*/,
            ""
          )
          .trim();

        const proxima = linhas[i + 1];

        const dosagemProxima =
          proxima.match(
            /^\s*(\d+(?:[.,]\d+)?\s*(?:\+\s*\d+(?:[.,]\d+)?)?\s*(?:MG|MCG|G|ML|UI))\b/i
          );

        if (
          dosagemProxima &&
          atual.length >= 3 &&
          /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]+$/.test(
            atual
          )
        ) {
          resultado.medicamento =
            atual.toUpperCase();

          resultado.dosagem =
            normalizarDosagem(
              dosagemProxima[1]
            );

          break;
        }
      }
    }

    // =======================================================
    // QUANTIDADE
    //
    // TOMAR 1 CP
    // =======================================================

    const quantidadeMatch =
      textoLimpo.match(
        /\b(?:TOMAR|USAR|ADMINISTRAR)\s+(\d+(?:[.,]\d+)?)\s*(CP|CPS?|COMPRIMIDOS?|COMPRIMIDO|CÁPSULAS?|CAPSULAS?|CAPS?|GOTAS?|ML)\b/i
      );

    if (quantidadeMatch) {
      resultado.quantidade =
        `${quantidadeMatch[1]} ${quantidadeMatch[2]}`
          .toUpperCase();
    }

    // =======================================================
    // FREQUÊNCIA
    //
    // 12/12 HORAS
    // =======================================================

    const frequenciaMatch =
      textoLimpo.match(
        /\b(\d{1,2})\s*\/\s*(\d{1,2})\s*(HORAS?|H|HS)\b/i
      );

    if (frequenciaMatch) {
      resultado.frequencia =
        `${frequenciaMatch[1]}/${frequenciaMatch[2]} HORAS`;
    }

    // =======================================================
    // A CADA X HORAS
    // =======================================================

    if (!resultado.frequencia) {
      const cadaHoras =
        textoLimpo.match(
          /\bA\s+CADA\s+(\d{1,2})\s+HORAS?\b/i
        );

      if (cadaHoras) {
        resultado.frequencia =
          `A CADA ${cadaHoras[1]} HORAS`;
      }
    }

    // =======================================================
    // X VEZES AO DIA
    // =======================================================

    if (!resultado.frequencia) {
      const vezesDia =
        textoLimpo.match(
          /\b(\d+|UMA|DUAS|TRÊS|TRES|QUATRO)\s+VEZ(?:ES)?\s+AO\s+DIA\b/i
        );

      if (vezesDia) {
        resultado.frequencia =
          vezesDia[0].toUpperCase();
      }
    }

    // =======================================================
    // DURAÇÃO
    //
    // POR 7 DIAS
    // =======================================================

    const duracaoMatch =
      textoLimpo.match(
        /\b(?:POR|DURANTE)\s+(\d+)\s*(DIAS?|SEMANAS?|MESES?)\b/i
      );

    if (duracaoMatch) {
      resultado.duracao =
        `${duracaoMatch[1]} ${duracaoMatch[2]}`
          .toUpperCase();
    }

    // =======================================================
    // HORÁRIO
    //
    // Só coloca se realmente existir na receita.
    // =======================================================

    const horarios =
      textoLimpo.match(
        /\b(?:[01]?\d|2[0-3])[:hH][0-5]\d\b/g
      );

    if (horarios) {
      resultado.horario = [
        ...new Set(horarios),
      ].join(", ");
    }

    console.log(
      "============================"
    );
    console.log("RESULTADO FINAL");
    console.log(
      "Medicamento:",
      resultado.medicamento
    );
    console.log(
      "Dosagem:",
      resultado.dosagem
    );
    console.log(
      "Quantidade:",
      resultado.quantidade
    );
    console.log(
      "Horário:",
      resultado.horario
    );
    console.log(
      "Frequência:",
      resultado.frequencia
    );
    console.log(
      "Duração:",
      resultado.duracao
    );
    console.log(
      "============================"
    );

    return resultado;
  }

  // =========================================================
  // OCR
  // =========================================================

  async function lerReceita() {
    if (!foto || lendoReceita) {
      return;
    }

    try {
      setLendoReceita(true);
      setTextoOCR("");
      setDadosReceita(null);

      const base64 =
        await imagemParaBase64(foto);

      const resposta = await fetch(
        "https://api.ocr.space/parse/image",
        {
          method: "POST",

          headers: {
            apikey: "helloworld",
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            "base64Image=" +
            encodeURIComponent(
              `data:image/jpeg;base64,${base64}`
            ) +
            "&language=por" +
            "&OCREngine=3" +
            "&isOverlayRequired=false" +
            "&detectOrientation=true" +
            "&scale=true",
        }
      );

      if (!resposta.ok) {
        throw new Error(
          `HTTP ${resposta.status}`
        );
      }

      const resultado =
        await resposta.json();

      if (
        resultado.IsErroredOnProcessing
      ) {
        const mensagem =
          Array.isArray(
            resultado.ErrorMessage
          )
            ? resultado.ErrorMessage.join(
                "\n"
              )
            : resultado.ErrorMessage;

        throw new Error(
          mensagem ||
            "Erro ao processar OCR."
        );
      }

      const textoReconhecido =
        resultado.ParsedResults
          ?.map(
            (item: {
              ParsedText?: string;
            }) =>
              item.ParsedText || ""
          )
          .join("\n")
          .trim() || "";

      if (!textoReconhecido) {
        Alert.alert(
          "Não foi possível ler",
          "O OCR não encontrou texto suficiente."
        );
        return;
      }

      console.log(
        "========= TEXTO OCR ========="
      );
      console.log(textoReconhecido);

      setTextoOCR(
        textoReconhecido
      );

      const dados =
        extrairDadosSeguros(
          textoReconhecido
        );

      setDadosReceita(dados);

      Alert.alert(
        "OCR concluído ✅",
        "Confira os dados encontrados antes de cadastrar."
      );
    } catch (erro) {
      console.log(
        "Erro OCR:",
        erro
      );

      Alert.alert(
        "Erro no OCR",
        "Não foi possível ler a receita. Verifique sua internet e tente novamente."
      );
    } finally {
      setLendoReceita(false);
    }
  }

  // =========================================================
  // ALTERAR CAMPO
  // =========================================================

  function atualizarCampo(
    campo: keyof DadosReceita,
    valor: string
  ) {
    setDadosReceita((atual) => {
      if (!atual) {
        return atual;
      }

      return {
        ...atual,
        [campo]: valor,
      };
    });
  }

  // =========================================================
  // SALVAR
  // =========================================================

  async function salvarMedicamento() {
    if (!dadosReceita) {
      return;
    }

    if (
      !dadosReceita.medicamento.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Informe o medicamento."
      );
      return;
    }

    if (
      !dadosReceita.dosagem.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Informe a dosagem."
      );
      return;
    }

    if (
      !dadosReceita.horario.trim()
    ) {
      Alert.alert(
        "Defina o primeiro horário",
        `A receita informa ${
          dadosReceita.frequencia ||
          "a frequência"
        }, mas precisamos saber a hora da primeira dose. Digite, por exemplo, 08:00.`
      );
      return;
    }

    try {
      await adicionarMedicamento({
        medicamento:
          dadosReceita.medicamento.trim(),

        dosagem:
          dadosReceita.dosagem.trim(),

        quantidade:
          dadosReceita.quantidade.trim(),

        horario:
          dadosReceita.horario.trim(),

        frequencia:
          dadosReceita.frequencia.trim(),

        duracao:
          dadosReceita.duracao.trim(),
      });

      Alert.alert(
        "Medicamento cadastrado ✅",
        "O medicamento foi salvo com sucesso.",
        [
          {
            text: "Ver medicamentos",
            onPress: () =>
              router.push(
                "/medicamentos"
              ),
          },
          {
            text: "OK",
          },
        ]
      );
    } catch (erro) {
      console.log(
        "Erro ao salvar:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível cadastrar o medicamento."
      );
    }
  }

  // =========================================================
  // CÂMERA ABERTA
  // =========================================================

  if (cameraAberta) {
    return (
      <View
        style={
          styles.cameraContainer
        }
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />

        <TouchableOpacity
          style={styles.cancelar}
          onPress={() =>
            setCameraAberta(false)
          }
        >
          <Text
            style={
              styles.cancelarText
            }
          >
            Cancelar
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.cameraButtons
          }
        >
          <TouchableOpacity
            style={styles.capture}
            onPress={tirarFoto}
            disabled={tirandoFoto}
          >
            {tirandoFoto ? (
              <ActivityIndicator
                size="large"
                color="#2563EB"
              />
            ) : (
              <View
                style={
                  styles.captureInner
                }
              />
            )}
          </TouchableOpacity>

          <Text
            style={
              styles.cameraInstruction
            }
          >
            Fotografar receita
          </Text>
        </View>
      </View>
    );
  }

  // =========================================================
  // TELA PRINCIPAL
  // =========================================================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
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

        <Text
          style={styles.title}
        >
          📷 Ler receita
        </Text>

        <Text
          style={styles.subtitle}
        >
          Fotografe sua receita para
          identificar somente as
          informações que estiverem
          escritas.
        </Text>

        {/* FOTO */}

        {foto ? (
          <View
            style={
              styles.previewContainer
            }
          >
            <Image
              source={{ uri: foto }}
              style={styles.preview}
              resizeMode="contain"
            />

            <Text
              style={
                styles.previewText
              }
            >
              Foto da receita
            </Text>

            <TouchableOpacity
              style={
                styles.novaFotoButton
              }
              onPress={
                tirarOutraFoto
              }
            >
              <Text
                style={
                  styles.novaFotoText
                }
              >
                📷 Tirar outra foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.continuarButton
              }
              onPress={
                lerReceita
              }
              disabled={
                lendoReceita
              }
            >
              {lendoReceita ? (
                <>
                  <ActivityIndicator
                    color="#FFF"
                  />

                  <Text
                    style={
                      styles.continuarText
                    }
                  >
                    LENDO...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.continuarText
                  }
                >
                  🔎 LER RECEITA
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={
              styles.cameraBox
            }
          >
            <Text
              style={
                styles.cameraIcon
              }
            >
              📄
            </Text>

            <Text
              style={
                styles.cameraTitle
              }
            >
              Fotografe sua receita
            </Text>

            <Text
              style={
                styles.cameraText
              }
            >
              O aplicativo vai ler
              somente aquilo que estiver
              escrito na receita.
            </Text>
          </View>
        )}

        {/* RESULTADO */}

        {dadosReceita && (
          <View
            style={
              styles.resultadoContainer
            }
          >
            <Text
              style={
                styles.resultadoTitulo
              }
            >
              📋 Informações da receita
            </Text>

            <Text
              style={styles.aviso}
            >
              ⚠️ Confira os dados antes
              de criar qualquer lembrete.
            </Text>

            <Text
              style={
                styles.inputLabel
              }
            >
              💊 Medicamento *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: Dipirona"
              placeholderTextColor="#888"
              value={
                dadosReceita.medicamento
              }
              onChangeText={(valor) =>
                atualizarCampo(
                  "medicamento",
                  valor
                )
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              💊 Dosagem *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: 500MG"
              placeholderTextColor="#888"
              value={
                dadosReceita.dosagem
              }
              onChangeText={(valor) =>
                atualizarCampo(
                  "dosagem",
                  valor
                )
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              🔢 Quantidade
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: 1 CP"
              placeholderTextColor="#888"
              value={
                dadosReceita.quantidade
              }
              onChangeText={(valor) =>
                atualizarCampo(
                  "quantidade",
                  valor
                )
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              ⏰ Horário da primeira dose *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: 08:00"
              placeholderTextColor="#888"
              value={
                dadosReceita.horario
              }
              onChangeText={(valor) =>
                atualizarCampo(
                  "horario",
                  valor
                )
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              🔄 Frequência
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: 12/12 HORAS"
              placeholderTextColor="#888"
              value={
                dadosReceita.frequencia
              }
              onChangeText={(valor) =>
                atualizarCampo(
                  "frequencia",
                  valor
                )
              }
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              📅 Duração
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: 7 DIAS"
              placeholderTextColor="#888"
              value={
                dadosReceita.duracao
              }
              onChangeText={(valor) =>
                atualizarCampo(
                  "duracao",
                  valor
                )
              }
            />

            <TouchableOpacity
              style={
                styles.confirmarButton
              }
              onPress={
                salvarMedicamento
              }
            >
              <Text
                style={
                  styles.confirmarText
                }
              >
                ✅ CONFIRMAR E CADASTRAR
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TEXTO RECONHECIDO */}

        {textoOCR ? (
          <View
            style={
              styles.ocrContainer
            }
          >
            <Text
              style={
                styles.ocrTitulo
              }
            >
              🔎 Texto reconhecido
            </Text>

            <Text
              style={
                styles.ocrAviso
              }
            >
              O texto abaixo é o que o
              OCR conseguiu ler da
              imagem. Confira a receita
              original antes de
              cadastrar.
            </Text>

            <View
              style={
                styles.ocrTextoBox
              }
            >
              <Text
                style={
                  styles.ocrTexto
                }
              >
                {textoOCR}
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={abrirCamera}
        >
          <Text
            style={styles.buttonText}
          >
            📷 ABRIR CÂMERA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.galleryButton
          }
          onPress={
            escolherFoto
          }
        >
          <Text
            style={
              styles.galleryText
            }
          >
            🖼️ Escolher uma foto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.listaButton
          }
          onPress={() =>
            router.push(
              "/medicamentos"
            )
          }
        >
          <Text
            style={
              styles.listaButtonText
            }
          >
            📋 ABRIR MEUS MEDICAMENTOS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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

  content: {
    padding: 22,
    paddingBottom: 50,
  },

  voltar: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 25,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#222",
  },

  subtitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 8,
    marginBottom: 25,
    lineHeight: 27,
  },

  cameraBox: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 3,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2563EB",
  },

  cameraIcon: {
    fontSize: 60,
  },

  cameraTitle: {
    fontSize: 23,
    fontWeight: "800",
    marginTop: 15,
  },

  cameraText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginTop: 10,
  },

  button: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
  },

  galleryButton: {
    padding: 18,
    alignItems: "center",
  },

  galleryText: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "700",
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  camera: {
    flex: 1,
  },

  cameraButtons: {
    position: "absolute",
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  capture: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  captureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#2563EB",
  },

  cancelar: {
    position: "absolute",
    left: 25,
    top: 50,
    zIndex: 10,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  cancelarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  cameraInstruction: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },

  previewContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 10,
    elevation: 3,
  },

  preview: {
    width: "100%",
    height: 280,
    borderRadius: 15,
  },

  previewText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    padding: 10,
  },

  novaFotoButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    marginTop: 5,
  },

  novaFotoText: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "800",
  },

  continuarButton: {
    backgroundColor: "#16A34A",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  continuarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },

  resultadoContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    elevation: 3,
  },

  resultadoTitulo: {
    fontSize: 23,
    fontWeight: "900",
    color: "#222",
    marginBottom: 10,
  },

  aviso: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    color: "#92400E",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    color: "#222",
    marginBottom: 5,
  },

  confirmarButton: {
    backgroundColor: "#16A34A",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    marginTop: 20,
  },

  confirmarText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  ocrContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  ocrTitulo: {
    fontSize: 21,
    fontWeight: "900",
    color: "#1E3A8A",
    marginBottom: 10,
  },

  ocrAviso: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 12,
  },

  ocrTextoBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  ocrTexto: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
  },

  listaButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 15,
    padding: 17,
    alignItems: "center",
    marginTop: 12,
  },

  listaButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "900",
  },
});