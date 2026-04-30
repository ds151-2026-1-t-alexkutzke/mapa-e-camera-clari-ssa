import { useCallback, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const SEGREDOS_STORAGE_KEY = '@geovault:segredos';

// Define o formato que o segredo terá
interface Segredo {
  id: string;
  texto: string;
  fotoUri: string | null;
  latitude: number;
  longitude: number;
}

export default function MapaScreen() {
  const [segredos, setSegredos] = useState<Segredo[]>([]);

  // Carrega os dados toda vez que a tela é aberta
  useFocusEffect(
    useCallback(() => {
      carregarSegredos();
    }, [])
  );

  const carregarSegredos = async () => {
    try {
      const dados = await AsyncStorage.getItem(SEGREDOS_STORAGE_KEY);
      const lista: Segredo[] = dados ? JSON.parse(dados) : [];
      setSegredos(lista);
    } catch {
      setSegredos([]);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: segredos[0]?.latitude ?? -25.4284,
          longitude: segredos[0]?.longitude ?? -49.2733,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >

        {segredos.map((segredo) => (
          <Marker
            key={segredo.id}
            coordinate={{ latitude: segredo.latitude, longitude: segredo.longitude }}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>{segredo.texto}</Text>
                {segredo.fotoUri ? (
                  <Image source={{ uri: segredo.fotoUri }} style={styles.calloutImage} />
                ) : (
                  <Text style={styles.calloutSemFoto}>Sem foto</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

      </MapView>

      {segredos.length === 0 && (
        <View style={styles.avisoContainer}>
          <Text style={styles.avisoText}>Nenhum segredo salvo ainda. Vá na outra aba!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  calloutContainer: { width: 170, padding: 6 },
  calloutText: { fontWeight: 'bold', textAlign: 'center' },
  calloutImage: { width: '100%', height: 90, borderRadius: 8, marginTop: 6 },
  calloutSemFoto: { marginTop: 6, textAlign: 'center', color: '#666' },
  avisoContainer: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 20 },
  avisoText: { color: '#fff' }
});
