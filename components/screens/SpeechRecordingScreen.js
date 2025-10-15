import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SpeechRecordingScreen = ({ navigation }) => {
  const videoRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechTitle, setSpeechTitle] = useState('');
  const [speechNotes, setSpeechNotes] = useState('');
  const [savedSpeeches, setSavedSpeeches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted' && cameraStatus === 'granted');
      loadSavedSpeeches();
    })();
  }, []);

  const loadSavedSpeeches = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const userObj = JSON.parse(userData);
        const speeches = await AsyncStorage.getItem(`speeches_${userObj.id}`);
        if (speeches) {
          setSavedSpeeches(JSON.parse(speeches));
        }
      }
    } catch (error) {
      console.error('Error loading speeches:', error);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'No se pudo seleccionar el video');
    }
  };

  const recordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'No se pudo grabar el video');
    }
  };

  const saveSpeech = async () => {
    if (!speechTitle.trim()) {
      Alert.alert('Error', 'Ingresa un título para tu discurso');
      return;
    }

    if (!selectedVideo) {
      Alert.alert('Error', 'No hay video seleccionado');
      return;
    }

    setLoading(true);

    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'No se encontraron datos de usuario');
        return;
      }

      const userObj = JSON.parse(userData);
      
      const speechData = {
        id: Date.now().toString(),
        title: speechTitle,
        notes: speechNotes,
        videoUri: selectedVideo.uri,
        duration: selectedVideo.duration || 0,
        date: new Date().toISOString(),
      };

      const existingSpeeches = await AsyncStorage.getItem(`speeches_${userObj.id}`);
      const speeches = existingSpeeches ? JSON.parse(existingSpeeches) : [];
      speeches.unshift(speechData);

      await AsyncStorage.setItem(`speeches_${userObj.id}`, JSON.stringify(speeches));
      setSavedSpeeches(speeches);
      
      Alert.alert('Éxito', 'Discurso guardado correctamente');
      resetSelection();
      setShowForm(false);
    } catch (error) {
      console.error('Save speech error:', error);
      Alert.alert('Error', 'No se pudo guardar el discurso');
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedVideo(null);
    setSpeechTitle('');
    setSpeechNotes('');
    setIsPlaying(false);
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const handlePlaySpeech = (speech) => {
    setSelectedVideo({ uri: speech.videoUri });
    setShowForm(false);
  };

  const deleteSpeech = async (speechId) => {
    Alert.alert(
      'Eliminar Discurso',
      '¿Estás seguro de que quieres eliminar este discurso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const userData = await AsyncStorage.getItem('userData');
              if (userData) {
                const userObj = JSON.parse(userData);
                const existingSpeeches = await AsyncStorage.getItem(`speeches_${userObj.id}`);
                if (existingSpeeches) {
                  const speeches = JSON.parse(existingSpeeches);
                  const filteredSpeeches = speeches.filter(speech => speech.id !== speechId);
                  await AsyncStorage.setItem(`speeches_${userObj.id}`, JSON.stringify(filteredSpeeches));
                  setSavedSpeeches(filteredSpeeches);
                }
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'No se pudo eliminar el discurso');
            }
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openTitleModal = () => {
    setTempTitle(speechTitle);
    setShowTitleModal(true);
  };

  const openNotesModal = () => {
    setTempNotes(speechNotes);
    setShowNotesModal(true);
  };

  const saveTitle = () => {
    setSpeechTitle(tempTitle);
    setShowTitleModal(false);
  };

  const saveNotes = () => {
    setSpeechNotes(tempNotes);
    setShowNotesModal(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8A47" />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="videocam-off" size={64} color="#FF6B6B" />
        <Text style={styles.permissionTitle}>Permisos Requeridos</Text>
        <Text style={styles.permissionText}>
          Necesitamos acceso a la cámara y galería para grabar y seleccionar videos.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F6F9F5', '#EAE3C0']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#6B8A47', '#A7C584']}
              style={styles.headerGradient}
            >
              <Text style={styles.title}>Grabar Discurso</Text>
              <Text style={styles.subtitle}>Practica y mejora tus habilidades de oratoria</Text>
            </LinearGradient>
          </View>

          {/* Selección de Video */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seleccionar o Grabar Video</Text>
            
            <View style={styles.videoSelectionContainer}>
              {!selectedVideo ? (
                <View style={styles.selectionButtons}>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={recordVideo}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#FF8E8E']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons name="videocam" size={32} color="#fff" />
                      <Text style={styles.buttonText}>Grabar Video</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={pickVideo}
                  >
                    <LinearGradient
                      colors={['#6B8A47', '#8FAE6B']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons name="video-library" size={32} color="#fff" />
                      <Text style={styles.buttonText}>Seleccionar de Galería</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.videoPreviewContainer}>
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedVideo.uri }}
                    style={styles.videoPreview}
                    useNativeControls={false}
                    resizeMode="cover"
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                      }
                    }}
                  />
                  
                  <View style={styles.videoControls}>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={togglePlayPause}
                    >
                      <MaterialIcons 
                        name={isPlaying ? "pause" : "play-arrow"} 
                        size={32} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.videoActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={resetSelection}
                      >
                        <MaterialIcons name="replay" size={24} color="#fff" />
                        <Text style={styles.actionText}>Cambiar Video</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={() => setShowForm(true)}
                      >
                        <MaterialIcons name="save" size={24} color="#fff" />
                        <Text style={styles.actionText}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Consejos */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Consejos para tu discurso:</Text>
              <Text style={styles.tip}>• Mantén una postura erguida y confiada</Text>
              <Text style={styles.tip}>• Habla claro y a ritmo moderado</Text>
              <Text style={styles.tip}>• Mantén contacto visual con la cámara</Text>
              <Text style={styles.tip}>• Usa gestos naturales con las manos</Text>
              <Text style={styles.tip}>• Practica tu discurso antes de grabar</Text>
            </View>
          </View>

          {/* Formulario para guardar */}
          {showForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Guardar Discurso</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Título del Discurso *</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={openTitleModal}
                >
                  <Text style={styles.inputText}>
                    {speechTitle || 'Toca para agregar título...'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notas (opcional)</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={openNotesModal}
                >
                  <Text style={styles.inputText}>
                    {speechNotes || 'Toca para agregar notas...'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.formButton, styles.confirmButton]}
                  onPress={saveSpeech}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Guardar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Discursos Guardados */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Discursos</Text>
              <Text style={styles.sectionSubtitle}>
                {savedSpeeches.length} discurso{savedSpeeches.length !== 1 ? 's' : ''} guardado{savedSpeeches.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {savedSpeeches.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="video-library" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>Aún no tienes discursos guardados</Text>
                <Text style={styles.emptyStateSubtext}>
                  Graba tu primer discurso arriba
                </Text>
              </View>
            ) : (
              <View style={styles.speechesList}>
                {savedSpeeches.map((speech) => (
                  <View key={speech.id} style={styles.speechCard}>
                    <View style={styles.speechContent}>
                      <View style={styles.speechHeader}>
                        <View style={styles.speechInfo}>
                          <Text style={styles.speechTitle} numberOfLines={2}>
                            {speech.title}
                          </Text>
                          <Text style={styles.speechDate}>
                            {new Date(speech.date).toLocaleDateString('es-ES')}
                          </Text>
                        </View>
                        <Text style={styles.speechDuration}>
                          {formatTime(speech.duration)}
                        </Text>
                      </View>
                      
                      {speech.notes && (
                        <Text style={styles.speechNotes} numberOfLines={2}>
                          {speech.notes}
                        </Text>
                      )}
                      
                      <View style={styles.speechActions}>
                        <TouchableOpacity
                          style={styles.speechActionButton}
                          onPress={() => handlePlaySpeech(speech)}
                        >
                          <MaterialIcons name="play-circle" size={20} color="#6B8A47" />
                          <Text style={styles.speechActionText}>Reproducir</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.speechActionButton}
                          onPress={() => deleteSpeech(speech.id)}
                        >
                          <MaterialIcons name="delete" size={20} color="#FF6B6B" />
                          <Text style={[styles.speechActionText, { color: '#FF6B6B' }]}>
                            Eliminar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modal para título */}
        <Modal
          visible={showTitleModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Título del Discurso</Text>
              <TextInput
                style={styles.modalInput}
                value={tempTitle}
                onChangeText={setTempTitle}
                placeholder="Ingresa el título de tu discurso"
                multiline={true}
                maxLength={100}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowTitleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={saveTitle}
                >
                  <Text style={styles.confirmButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para notas */}
        <Modal
          visible={showNotesModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notas del Discurso</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={tempNotes}
                onChangeText={setTempNotes}
                placeholder="Agrega notas sobre tu discurso..."
                multiline={true}
                maxLength={500}
                textAlignVertical="top"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowNotesModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={saveNotes}
                >
                  <Text style={styles.confirmButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F6F9F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B8A47',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B8A47',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#6B8A47',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B8A47',
  },
  videoSelectionContainer: {
    marginBottom: 15,
  },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectionButton: {
    width: '48%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  videoPreviewContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 300,
  },
  videoPreview: {
    flex: 1,
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  playButton: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#6B8A47',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
  },
  tip: {
    fontSize: 14,
    color: '#6B8A47',
    marginBottom: 4,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F6F9F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAE3C0',
    minHeight: 50,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 14,
    color: '#2D3B1E',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B8A47',
  },
  confirmButton: {
    backgroundColor: '#6B8A47',
  },
  cancelButtonText: {
    color: '#6B8A47',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B8A47',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B8A47',
    textAlign: 'center',
  },
  speechesList: {
    marginTop: 10,
  },
  speechCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  speechContent: {
    padding: 15,
  },
  speechHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  speechInfo: {
    flex: 1,
    marginRight: 10,
  },
  speechTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 4,
  },
  speechDate: {
    fontSize: 12,
    color: '#6B8A47',
  },
  speechDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B8A47',
  },
  speechNotes: {
    fontSize: 14,
    color: '#6B8A47',
    lineHeight: 18,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  speechActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  speechActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  speechActionText: {
    fontSize: 12,
    color: '#6B8A47',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F6F9F5',
    borderWidth: 1,
    borderColor: '#EAE3C0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
  },
  notesInput: {
    minHeight: 100,
    maxHeight: 200,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});

export default SpeechRecordingScreen;