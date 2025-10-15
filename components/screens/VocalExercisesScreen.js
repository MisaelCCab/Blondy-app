import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const VocalExercisesScreen = ({ navigation, route }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [completedWeeks, setCompletedWeeks] = useState([]);
  const [startedWeeks, setStartedWeeks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);

  // Obtener el userId CORRECTAMENTE desde AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        console.log('📱 User data from storage in VocalExercises:', userData);
        
        if (userData) {
          const userObj = JSON.parse(userData);
          console.log('✅ User ID encontrado:', userObj.id);
          setUserId(userObj.id);
          loadUserProgress(userObj.id);
        } else {
          // Fallback a route.params si no hay datos en storage
          const user = route.params?.user;
          if (user) {
            console.log('⚠️ Usando user de route.params:', user.id);
            setUserId(user.id);
            loadUserProgress(user.id);
          } else {
            console.log('❌ No se pudo obtener userID');
          }
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Cargar progreso del usuario desde el servidor
  const loadUserProgress = async (userId) => {
    try {
      console.log('🔄 Cargando progreso para userID:', userId);
      const response = await fetch(`http://[2a02:4780:10:40ef::1]:3001/vocal-exercises/progress/${userId}`);
      const data = await response.json();
      
      console.log('📊 Respuesta del servidor:', data);
      
      if (data.success) {
        const completed = [];
        const started = [];
        
        data.progress.forEach(item => {
          if (item.status === 'completed') {
            completed.push(item.challenge_id);
          }
          if (item.status === 'in_progress') {
            started.push(item.challenge_id);
          }
        });
        
        console.log('✅ Completados:', completed);
        console.log('🔄 En progreso:', started);
        
        setCompletedWeeks(completed);
        setStartedWeeks(started);
      }
    } catch (error) {
      console.error('❌ Error cargando progreso:', error);
    }
  };

  // Guardar progreso en el servidor
  const saveProgressToServer = async (challengeId, weekNumber, status) => {
    if (!userId) {
      console.error('❌ No hay userID para guardar progreso');
      return;
    }
    
    try {
      console.log('💾 Guardando progreso:', { userId, challengeId, weekNumber, status });
      
      const response = await fetch(`http://[2a02:4780:10:40ef::1]:3001/vocal-exercises/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          weekNumber: weekNumber,
          challengeId: challengeId,
          status: status
        }),
      });
      
      const data = await response.json();
      console.log('✅ Respuesta del servidor al guardar:', data);
      
      if (!data.success) {
        console.error('❌ Error guardando progreso en servidor:', data.error);
      } else {
        // Recargar el progreso después de guardar
        loadUserProgress(userId);
      }
    } catch (error) {
      console.error('❌ Error guardando progreso:', error);
    }
  };

  const challenges = [
    {
      id: 1,
      week: 1,
      title: 'El Cero Interrupciones',
      description: 'Esta semana, concéntrate únicamente en no interrumpir a nadie. Espera a que la otra persona complete su idea o haga una pausa definitiva.',
      duration: '7 días',
      difficulty: 'Media',
      icon: 'do-not-disturb',
      color: ['#6B8A47', '#A7C584'],
      tips: [
        'Practica contando mentalmente hasta 3 antes de responder',
        'Mantén contacto visual para mostrar que estás escuchando',
        'Usa gestos de asentimiento en lugar de interrumpir'
      ]
    },
    {
      id: 2,
      week: 2,
      title: 'Parafraseo Confirmativo',
      description: 'Al finalizar una conversación importante, antes de responder utiliza frases como "Si te he entendido bien me estás diciendo que..." o "Lo que escuché el problema principal es..."',
      duration: '7 días',
      difficulty: 'Media',
      icon: 'repeat',
      color: ['#F6C915', '#F8D95B'],
      tips: [
        'Practica con conversaciones cotidianas primero',
        'Enfócate en captar la idea principal, no los detalles',
        'Usa tus propias palabras para demostrar comprensión'
      ]
    },
    {
      id: 3,
      week: 3,
      title: 'Enfoque 100% No Verbal',
      description: 'En lugar de plantear tu respuesta, céntrate en los detalles no verbales del hablante: tono de voz, lenguaje corporal, contacto visual y gestos.',
      duration: '7 días',
      difficulty: 'Alta',
      icon: 'visibility',
      color: ['#A7C584', '#C4D8A8'],
      tips: [
        'Observa si las palabras coinciden con la emoción del cuerpo',
        'Presta atención a los cambios en el tono de voz',
        'Nota la postura y los gestos de las manos'
      ]
    },
    {
      id: 4,
      week: 4,
      title: 'El Detector de Emociones',
      description: 'Durante esta semana identifica y nombra la emoción detrás del mensaje. Céntrate en si suena frustrado, entusiasmado, preocupado o aliviado.',
      duration: '7 días',
      difficulty: 'Media',
      icon: 'emoji-emotions',
      color: ['#EAE3C0', '#F0EBD5'],
      tips: [
        'Escucha el tono emocional, no solo las palabras',
        'Practica identificando emociones en programas de TV',
        'Valida las emociones que detectes'
      ]
    },
    {
      id: 5,
      week: 5,
      title: 'La Regla de los 5 Segundos',
      description: 'Cuando el hablante termine de hablar, espera intencionalmente 5 segundos antes de emitir cualquier sonido o respuesta.',
      duration: '7 días',
      difficulty: 'Baja',
      icon: 'timer',
      color: ['#6B8A47', '#8FAE6B'],
      tips: [
        'Cuenta mentalmente hasta 5 antes de responder',
        'Usa este tiempo para procesar lo escuchado',
        'Respira profundamente durante la pausa'
      ]
    },
    {
      id: 6,
      week: 6,
      title: 'Solo Preguntas Abiertas',
      description: 'Evita preguntas que se respondan con sí o no. Usa preguntas abiertas que empiecen con "cómo", "qué", "por qué", "cuéntame más sobre".',
      duration: '7 días',
      difficulty: 'Media',
      icon: 'help-outline',
      color: ['#F6C915', '#F8D95B'],
      tips: [
        'Prepara preguntas abiertas comunes',
        'Practica reformulando preguntas cerradas',
        'Enfócate en generar conversación, no interrogatorio'
      ]
    },
    {
      id: 7,
      week: 7,
      title: 'La Búsqueda de la Intención',
      description: 'Pregúntate "¿Qué quiere la otra persona de mí en este momento?" ¿Busca desahogarse, un consejo, validación, o una solución?',
      duration: '7 días',
      difficulty: 'Alta',
      icon: 'psychology',
      color: ['#A7C584', '#C4D8A8'],
      tips: [
        'Observa el contexto de la conversación',
        'Presta atención a lo que NO se dice',
        'Adapta tu respuesta a la necesidad detectada'
      ]
    },
    {
      id: 8,
      week: 8,
      title: 'El Muro Anti Distracciones Digitales',
      description: 'Establece el hábito de dejar tu teléfono en otra habitación o boca abajo durante conversaciones importantes. El 100% de tu atención debe ser visible.',
      duration: '7 días',
      difficulty: 'Baja',
      icon: 'phone-disabled',
      color: ['#EAE3C0', '#F0EBD5'],
      tips: [
        'Crea zonas libres de tecnología',
        'Practica en comidas familiares',
        'Explica tu propósito a quienes te rodean'
      ]
    },
    {
      id: 9,
      week: 9,
      title: 'La Escucha Sin Juicio',
      description: 'Elige a alguien que te cuente un problema y escucha toda la narración sin ofrecer consejos ni emitir juicios. Solo usa frases de validación.',
      duration: '7 días',
      difficulty: 'Alta',
      icon: 'hearing',
      color: ['#6B8A47', '#A7C584'],
      tips: [
        'Practica frases de validación como "Entiendo"',
        'Evita palabras como "deberías" o "podrías"',
        'Enfócate en comprender, no en resolver'
      ]
    },
    {
      id: 10,
      week: 10,
      title: 'El Cambio de Perspectiva',
      description: 'Después de una conversación, reflexiona: "Si yo fuera el hablante, ¿cómo me hubiera sentido escuchado por mí mismo hoy?"',
      duration: '7 días',
      difficulty: 'Media',
      icon: 'swap-horiz',
      color: ['#F6C915', '#F8D95B'],
      tips: [
        'Lleva un diario de reflexiones',
        'Identifica un acierto y una mejora por día',
        'Practica la autocompasión en el proceso'
      ]
    }
  ];

  const openChallengeModal = (challenge) => {
    setSelectedWeek(challenge);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedWeek(null);
  };

  const startChallenge = async (challenge) => {
    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar tu usuario. Por favor, reinicia la app.');
      return;
    }
    
    const newStartedWeeks = [...startedWeeks, challenge.id];
    setStartedWeeks(newStartedWeeks);
    
    // Guardar en servidor
    await saveProgressToServer(challenge.id, challenge.week, 'in_progress');
    
    closeModal();
    Alert.alert(
      `Iniciar Semana ${challenge.week}`,
      `¿Estás listo para comenzar "${challenge.title}"? Este desafío durará ${challenge.duration}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: '¡Comenzar!', 
          onPress: () => {
            Alert.alert(
              '¡Desafío Iniciado!',
              `Has comenzado la Semana ${challenge.week}. Revisa los tips diariamente y practica consistentemente.`,
              [{ text: 'Entendido' }]
            );
          }
        }
      ]
    );
  };

  const completeChallenge = async (challengeId, weekNumber) => {
    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar tu usuario. Por favor, reinicia la app.');
      return;
    }
    
    const newCompletedWeeks = [...completedWeeks, challengeId];
    setCompletedWeeks(newCompletedWeeks);
    
    // Guardar en servidor
    await saveProgressToServer(challengeId, weekNumber, 'completed');
    
    closeModal();
    Alert.alert(
      '¡Felicidades!',
      'Has completado esta semana de entrenamiento. ¡Sigue practicando!',
      [{ text: 'Continuar' }]
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Baja': return '#6B8A47';
      case 'Media': return '#F6C915';
      case 'Alta': return '#FF6B6B';
      default: return '#6B8A47';
    }
  };

  const isChallengeCompleted = (challengeId) => {
    return completedWeeks.includes(challengeId);
  };

  const isChallengeStarted = (challengeId) => {
    return startedWeeks.includes(challengeId);
  };


  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F6F9F5', '#EAE3C0']}
        style={styles.gradient}
      >

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.title}>Ejercicios Vocales</Text>
            <Text style={styles.subtitle}>10 semanas para dominar la comunicación efectiva</Text>
            <Text style={styles.progress}>
              {completedWeeks.length} de {challenges.length} semanas completadas
            </Text>
          </Animated.View>

          <Animated.View style={[
            styles.challengesContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {challenges.map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeCard}
                onPress={() => openChallengeModal(challenge)}
              >
                <LinearGradient
                  colors={challenge.color}
                  style={styles.challengeGradient}
                >
                  {/* Icono de completado en la esquina superior izquierda */}
                  {isChallengeCompleted(challenge.id) && (
                    <View style={styles.completedBadge}>
                      <MaterialIcons name="check-circle" size={20} color="#fff" />
                    </View>
                  )}
                  
                  {/* Icono del desafío en la esquina superior derecha */}
                  <View style={styles.iconContainer}>
                    <MaterialIcons name={challenge.icon} size={28} color="#2D3B1E" />
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.weekNumber}>Semana {challenge.week}</Text>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    
                    <View style={styles.challengeFooter}>
                      <View style={styles.difficultyBadge}>
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(challenge.difficulty) }]}>
                          {challenge.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.durationText}>{challenge.duration}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

        {/* MODAL PARA MOSTRAR DETALLES DEL DESAFÍO */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedWeek && (
                <>
                  {/* Header del Modal */}
                  <LinearGradient
                    colors={selectedWeek.color}
                    style={styles.modalHeader}
                  >
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={closeModal}
                    >
                      <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <View style={styles.modalHeaderContent}>
                      <View style={styles.weekBadge}>
                        <Text style={styles.weekText}>Semana {selectedWeek.week}</Text>
                      </View>
                      <Text style={styles.modalTitle}>{selectedWeek.title}</Text>
                      <View style={styles.modalMeta}>
                        <View style={styles.difficultyContainer}>
                          <Text style={styles.difficultyLabel}>Dificultad: </Text>
                          <Text style={[styles.difficulty, { color: getDifficultyColor(selectedWeek.difficulty) }]}>
                            {selectedWeek.difficulty}
                          </Text>
                        </View>
                        <Text style={styles.duration}>{selectedWeek.duration}</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Contenido del Modal */}
                  <ScrollView 
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Descripción del Desafío</Text>
                      <Text style={styles.description}>{selectedWeek.description}</Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Tips para Esta Semana</Text>
                      {selectedWeek.tips.map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                          <MaterialIcons name="lightbulb" size={20} color="#F6C915" />
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Botones del Modal */}
                  <View style={styles.modalActions}>
                    {/* Solo mostrar botón "Iniciar Desafío" si no está iniciado ni completado */}
                    {!isChallengeStarted(selectedWeek.id) && !isChallengeCompleted(selectedWeek.id) && (
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.primaryButton]}
                        onPress={() => startChallenge(selectedWeek)}
                      >
                        <LinearGradient
                          colors={['#6B8A47', '#A7C584']}
                          style={styles.buttonGradient}
                        >
                          <MaterialIcons name="play-arrow" size={24} color="#fff" />
                          <Text style={styles.primaryButtonText}>Iniciar Desafío</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {/* Mostrar estado si ya está iniciado o completado */}
                    {(isChallengeStarted(selectedWeek.id) || isChallengeCompleted(selectedWeek.id)) && (
                      <View style={styles.statusContainer}>
                        <View style={styles.statusBadge}>
                          <MaterialIcons 
                            name={isChallengeCompleted(selectedWeek.id) ? "check-circle" : "play-circle"} 
                            size={24} 
                            color={isChallengeCompleted(selectedWeek.id) ? "#6B8A47" : "#F6C915"} 
                          />
                          <Text style={[
                            styles.statusText,
                            { color: isChallengeCompleted(selectedWeek.id) ? "#6B8A47" : "#F6C915" }
                          ]}>
                            {isChallengeCompleted(selectedWeek.id) ? "Completado" : "En Progreso"}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.secondaryButtons}>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.secondaryButton]}
                        onPress={closeModal}
                      >
                        <Text style={styles.secondaryButtonText}>Cerrar</Text>
                      </TouchableOpacity>
                      
                      {/* Solo mostrar botón "Completado" si está iniciado pero no completado */}
                      {isChallengeStarted(selectedWeek.id) && !isChallengeCompleted(selectedWeek.id) && (
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.completeButton]}
                          onPress={() => completeChallenge(selectedWeek.id, selectedWeek.week)}
                        >
                          <MaterialIcons name="check" size={20} color="#6B8A47" />
                          <Text style={styles.completeButtonText}>Marcar Completado</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </>
              )}
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
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B8A47',
    textAlign: 'center',
    marginBottom: 15,
  },
  progress: {
    fontSize: 14,
    color: '#6B8A47',
    fontWeight: '600',
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  userInfo: {
    fontSize: 12,
    color: '#6B8A47',
    marginTop: 5,
  },
  challengesContainer: {
    flex: 1,
  },
  challengeCard: {
    height: 140,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  challengeGradient: {
    flex: 1,
    padding: 15,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 5,
  },
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 25,
  },
  weekNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 5,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    textAlign: 'left',
    marginBottom: 8,
    flex: 1,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: 12,
    color: '#2D3B1E',
    fontWeight: '600',
  },
  // Estilos del Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 5,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  weekBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  weekText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  difficulty: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
  },
  modalBody: {
    maxHeight: 400,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B8A47',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#2D3B1E',
    lineHeight: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#2D3B1E',
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAE3C0',
  },
  modalButton: {
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    height: 60,
    marginBottom: 15,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F6F9F5',
    borderWidth: 2,
    borderColor: '#6B8A47',
    marginRight: 10,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B8A47',
    marginLeft: 10,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#6B8A47',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButtonText: {
    color: '#6B8A47',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  debugButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#FF6B6B',
    padding: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default VocalExercisesScreen;