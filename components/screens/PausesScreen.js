import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PausesScreen = ({ navigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const exerciseSteps = [
    { 
      text: "Prepárate para hablar", 
      duration: 3,
      type: 'preparation',
      instruction: 'Relájate y prepárate'
    },
    { 
      text: "HABLA: 'La comunicación efectiva requiere...'", 
      duration: 5,
      type: 'speaking',
      instruction: 'Habla con claridad'
    },
    { 
      text: "PAUSA: Espera 3 segundos", 
      duration: 3,
      type: 'pause',
      instruction: 'Mantén el contacto visual'
    },
    { 
      text: "CONTINÚA: '...práctica constante y paciencia'", 
      duration: 4,
      type: 'speaking',
      instruction: 'Continúa con confianza'
    },
    { 
      text: "PAUSA: Reflexiona 2 segundos", 
      duration: 2,
      type: 'pause',
      instruction: 'Piensa en lo siguiente'
    },
    { 
      text: "FINALIZA: 'para lograr resultados duraderos'", 
      duration: 4,
      type: 'speaking',
      instruction: 'Concluye con seguridad'
    }
  ];

  // Función para guardar el progreso en el servidor
const saveProgress = async (exerciseData) => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      console.error('No se encontraron datos de usuario');
      return false;
    }
    
    const user = JSON.parse(userData);
    console.log('Enviando progreso para usuario:', user.id);
    
    const response = await fetch('http://31.220.50.7:3001/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        ...exerciseData
      }),
    });

    // Verificar si la respuesta es JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Respuesta no JSON del servidor:', text);
      return false;
    }

    const result = await response.json();
    console.log('Respuesta del servidor:', result);
    
    if (result.success) {
      console.log('Progreso guardado exitosamente');
      return true;
    } else {
      console.error('Error guardando progreso:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return false;
  }
};

  // Función para calcular la duración total del ejercicio
  const calculateTotalDuration = () => {
    return exerciseSteps.reduce((total, step) => total + step.duration, 0);
  };

  useEffect(() => {
    let interval;
    if (isPlaying && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);

      // Animación de fade
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    } else if (isPlaying && timer === 0) {
      if (currentStep < exerciseSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setTimer(exerciseSteps[currentStep + 1].duration);
      } else {
        // Ejercicio completado
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000); // Duración en segundos
        
        setIsPlaying(false);
        setCompletedRounds(prev => prev + 1);
        
        // Guardar progreso en el servidor
        saveProgress({
          exerciseType: 'pauses',
          duration: duration,
          roundsCompleted: 1,
          score: calculateScore(duration)
        }).then(success => {
          if (success) {
            Alert.alert(
              '¡Ejercicio Completado!',
              `Has terminado una ronda de práctica de pausas.\nDuración: ${duration} segundos`,
              [{ text: 'Continuar' }]
            );
          } else {
            Alert.alert(
              '¡Ejercicio Completado!',
              'Has terminado una ronda de práctica de pausas.\n(El progreso no se pudo guardar)',
              [{ text: 'Continuar' }]
            );
          }
        });
      }
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timer, currentStep]);

  // Función para calcular puntuación basada en la duración
  const calculateScore = (duration) => {
    const expectedDuration = calculateTotalDuration();
    const timeDifference = Math.abs(duration - expectedDuration);
    
    // Puntuación de 0-100 basada en qué tan cerca estuvo del tiempo esperado
    let score = Math.max(0, 100 - (timeDifference * 2));
    return Math.round(score);
  };

  const startExercise = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setTimer(exerciseSteps[0].duration);
    setStartTime(new Date());
    setTotalDuration(calculateTotalDuration());
  };

  const stopExercise = () => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);
      
      // Guardar progreso incluso si no se completó
      saveProgress({
        exerciseType: 'pauses',
        duration: duration,
        roundsCompleted: 0, // No completó la ronda
        score: calculateScore(duration)
      });
    }
    
    setIsPlaying(false);
  };

  const resetExercise = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setTimer(0);
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'speaking': return ['#6B8A47', '#A7C584'];
      case 'pause': return ['#F6C915', '#F8D95B'];
      case 'preparation': return ['#EAE3C0', '#F0EBD5'];
      default: return ['#6B8A47', '#A7C584'];
    }
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
          <Text style={styles.title}>Ejercicio de Pausas</Text>
          <Text style={styles.subtitle}>Aprende a usar pausas estratégicas en tu discurso</Text>

          {isPlaying ? (
            <View style={styles.exerciseActive}>
              <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
                <LinearGradient
                  colors={getStepColor(exerciseSteps[currentStep].type)}
                  style={styles.stepGradient}
                >
                  <Text style={styles.stepText}>{exerciseSteps[currentStep].text}</Text>
                  <Text style={styles.timer}>{timer}s</Text>
                  <Text style={styles.instruction}>
                    {exerciseSteps[currentStep].instruction}
                  </Text>
                </LinearGradient>
              </Animated.View>

              <View style={styles.progress}>
                <Text style={styles.progressText}>
                  Paso {currentStep + 1} de {exerciseSteps.length}
                </Text>
                <Text style={styles.durationText}>
                  Duración total: {totalDuration}s
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
                  <LinearGradient
                    colors={['#F6C915', '#F8D95B']}
                    style={styles.buttonGradient}
                  >
                    <MaterialIcons name="pause" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Pausar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.exerciseInactive}>
              <View style={styles.instructions}>
                <Text style={styles.instructionTitle}>Objetivo del Ejercicio:</Text>
                <Text style={styles.instruction}>• Aprender a usar pausas estratégicas</Text>
                <Text style={styles.instruction}>• Mejorar el ritmo del habla</Text>
                <Text style={styles.instruction}>• Dar tiempo para procesar ideas</Text>
                <Text style={styles.instruction}>• Crear énfasis en el discurso</Text>
              </View>

              <View style={styles.demo}>
                <Text style={styles.demoTitle}>Flujo del ejercicio:</Text>
                {exerciseSteps.map((step, index) => (
                  <View key={index} style={styles.demoStep}>
                    <View style={[styles.demoIcon, 
                      { backgroundColor: 
                        step.type === 'speaking' ? '#6B8A47' : 
                        step.type === 'pause' ? '#F6C915' : '#EAE3C0' 
                      }]}>
                      <MaterialIcons 
                        name={step.type === 'speaking' ? 'mic' : 
                              step.type === 'pause' ? 'pause' : 'access-time'} 
                        size={16} 
                        color="#2D3B1E" 
                      />
                    </View>
                    <Text style={styles.demoText}>{step.text}</Text>
                    <Text style={styles.stepDuration}>{step.duration}s</Text>
                  </View>
                ))}
                <View style={styles.totalDuration}>
                  <Text style={styles.totalDurationText}>
                    Duración total: {calculateTotalDuration()} segundos
                  </Text>
                </View>
              </View>

              <View style={styles.stats}>
                <Text style={styles.statsText}>
                  Rondas completadas: {completedRounds}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.startButton} onPress={startExercise}>
                  <LinearGradient
                    colors={['#6B8A47', '#A7C584']}
                    style={styles.buttonGradient}
                  >
                    <MaterialIcons name="play-arrow" size={24} color="#fff" />
                    <Text style={styles.buttonText}>
                      {completedRounds > 0 ? 'Repetir Ejercicio' : 'Comenzar Ejercicio'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B8A47',
    marginBottom: 30,
    textAlign: 'center',
  },
  exerciseActive: {
    flex: 1,
    minHeight: 600,
  },
  stepContainer: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
  },
  stepGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stepText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3B1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    color: '#2D3B1E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#6B8A47',
    fontWeight: '600',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 14,
    color: '#6B8A47',
  },
  exerciseInactive: {
    flex: 1,
  },
  instructions: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    color: '#2D3B1E',
    marginBottom: 5,
  },
  demo: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 15,
  },
  demoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  demoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  demoText: {
    fontSize: 14,
    color: '#2D3B1E',
    flex: 1,
  },
  stepDuration: {
    fontSize: 12,
    color: '#6B8A47',
    fontWeight: '600',
    marginLeft: 10,
  },
  totalDuration: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#A7C584',
  },
  totalDurationText: {
    fontSize: 14,
    color: '#6B8A47',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stats: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statsText: {
    fontSize: 16,
    color: '#6B8A47',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  startButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  stopButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default PausesScreen;