import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEGREDOS_STORAGE_KEY = '@geovault:segredos';

export default function NovoSegredoScreen() {
  const [texto, setTexto] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  // Lógica do botão de abrir câmera
  const handleAbrirCamera = async () => {
    if (!cameraPermission?.granted) {
      const permissionResponse = await requestCameraPermission();
      if (!permissionResponse.granted) {
        Alert.alert('Permissão necessária', 'Você precisa permitir o uso da câmera para tirar a foto do segredo.');
        return;
      }
    }

    setIsCameraOpen(true);
  };

  // Lógica após tirar a foto
  const handleTirarFoto = async () => {
    try {
      const foto = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!foto?.uri) {
        Alert.alert('Erro', 'Não foi possível capturar a foto. Tente novamente.');
        return;
      }

      setFotoUri(foto.uri);
      setIsCameraOpen(false);
    } catch {
      Alert.alert('Erro', 'Falha ao tirar a foto.');
    }
  };

  // Lógica de salvar no armazenamento local
  const handleSalvarSegredo = async () => {
    if (!texto) {
      Alert.alert('Erro', 'Digite um segredo primeiro!');
      return;
    }

    try {
      const permissionResponse = await Location.requestForegroundPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Você precisa permitir o GPS para salvar o segredo no mapa.');
        return;
      }

      const localizacao = await Location.getCurrentPositionAsync({});

      const novoSegredo = {
        id: Date.now().toString(),
        texto: texto.trim(),
        fotoUri,
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
      };

      const segredosSalvos = await AsyncStorage.getItem(SEGREDOS_STORAGE_KEY);
      const listaAtual = segredosSalvos ? JSON.parse(segredosSalvos) : [];
      const novaLista = [...listaAtual, novoSegredo];

      await AsyncStorage.setItem(SEGREDOS_STORAGE_KEY, JSON.stringify(novaLista));

      Alert.alert('Sucesso', 'Segredo salvo no cofre!');
      setTexto('');
      setFotoUri(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o segredo.');
    }
  };

  // --- RENDERIZAÇÃO DA CÂMERA EM TELA CHEIA ---
  if (isCameraOpen) {
    return (
      <View style={styles.container}>
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />

        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.btnCapturar} onPress={handleTirarFoto}>
            <Text style={styles.btnText}>Capturar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancelar} onPress={() => setIsCameraOpen(false)}>
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDERIZAÇÃO DO FORMULÁRIO NORMAL ---
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Qual o seu segredo neste local?</Text>

      <TextInput
        style={styles.input}
        placeholder="Escreva algo marcante..."
        placeholderTextColor="#666"
        value={texto}
        onChangeText={setTexto}
        multiline
      />

      <View style={styles.fotoContainer}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.previewFoto} />
        ) : (
          <TouchableOpacity style={styles.btnFotoOutline} onPress={handleAbrirCamera}>
            <Text style={styles.btnFotoText}>📷 Adicionar Foto ao Segredo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvarSegredo}>
        <Text style={styles.btnSalvarText}>Salvar Segredo e Localização 📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', padding: 20 },
  label: { color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 8, minHeight: 100, textAlignVertical: 'top' },
  fotoContainer: { marginVertical: 20, alignItems: 'center' },
  previewFoto: { width: '100%', height: 200, borderRadius: 8 },
  btnFotoOutline: { borderWidth: 1, borderColor: '#007bff', borderStyle: 'dashed', padding: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnFotoText: { color: '#007bff', fontSize: 16 },
  btnSalvar: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnSalvarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cameraOverlay: { flex: 1, justifyContent: 'space-evenly', paddingBottom: 40, flexDirection: 'row', alignItems: 'flex-end' },
  btnCapturar: { backgroundColor: '#28a745', padding: 15, borderRadius: 30 },
  btnCancelar: { backgroundColor: '#dc3545', padding: 15, borderRadius: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
