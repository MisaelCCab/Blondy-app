import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const RespirationScreen = ({ navigation }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState('inhale');
  const [timer, setTimer] = useState(4);
  const [rounds, setRounds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalRoundsCompleted, setTotalRoundsCompleted] = useState(0);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const steps = {
    inhale: { duration: 4, text: 'INHALA por la nariz', next: 'hold' },
    hold: { duration: 7, text: 'MANTÉN la respiración', next: 'exhale' },
    exhale: { duration: 8, text: 'EXHALA por la boca', next: 'inhale' }
  };

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
      
      const response = await fetch('https://31.220.50.7/progress', {
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

  // Función para calcular puntuación basada en rondas completadas
  const calculateScore = (roundsCompleted) => {
    // Puntuación máxima de 100, basada en rondas completadas
    // 3 rondas = 60 puntos, 4 rondas = 80 puntos, 5+ rondas = 100 puntos
    let score = Math.min(100, roundsCompleted * 20);
    return Math.max(40, score); // Mínimo 40 puntos por intentar
  };

  useEffect(() => {
    let interval;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (isActive && timer === 0) {
      const nextStep = steps[currentStep].next;
      if (nextStep === 'inhale') {
        const newRounds = rounds + 1;
        setRounds(newRounds);
        setTotalRoundsCompleted(prev => prev + 1);
        
        // Guardar progreso cada 3 rondas completadas
        if (newRounds % 3 === 0) {
          const endTime = new Date();
          const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;
          
          saveProgress({
            exerciseType: 'respiration',
            duration: duration,
            roundsCompleted: 3,
            score: calculateScore(3)
          }).then(success => {
            if (success) {
              Alert.alert(
                '¡Progreso Guardado!',
                `Has completado ${newRounds} rondas de respiración.`,
                [{ text: 'Continuar' }]
              );
            }
          });
        }
      }
      setCurrentStep(nextStep);
      setTimer(steps[nextStep].duration);
      
      // Animación de respiración
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: currentStep === 'inhale' ? 1.3 : 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timer, currentStep]);

  const startExercise = () => {
    setIsActive(true);
    setCurrentStep('inhale');
    setTimer(4);
    setRounds(0);
    setStartTime(new Date());
  };

  const stopExercise = async () => {
    if (startTime && rounds > 0) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);
      
      // Guardar progreso al detener el ejercicio
      const success = await saveProgress({
        exerciseType: 'respiration',
        duration: duration,
        roundsCompleted: rounds,
        score: calculateScore(rounds)
      });

      if (success) {
        Alert.alert(
          'Ejercicio Pausado',
          `Completaste ${rounds} rondas de respiración.\nDuración: ${duration} segundos`,
          [{ text: 'Continuar' }]
        );
      }
    }
    
    setIsActive(false);
  };

  const resetExercise = () => {
    setIsActive(false);
    setCurrentStep('inhale');
    setTimer(4);
    setRounds(0);
  };

  const completeExercise = async () => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);
      
      // Guardar progreso final
      const success = await saveProgress({
        exerciseType: 'respiration',
        duration: duration,
        roundsCompleted: rounds,
        score: calculateScore(rounds)
      });

      if (success) {
        Alert.alert(
          '¡Ejercicio Completado!',
          `Felicidades! Completaste ${rounds} rondas de respiración 4-7-8.\nDuración total: ${duration} segundos`,
          [
            { 
              text: 'Continuar', 
              onPress: () => {
                setIsActive(false);
                setRounds(0);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Ejercicio Completado',
          `Completaste ${rounds} rondas de respiración.\n(El progreso no se pudo guardar)`,
          [{ text: 'Continuar' }]
        );
      }
    }
  };

  const getCircleColor = () => {
    switch (currentStep) {
      case 'inhale': return ['#A7C584', '#6B8A47'];
      case 'hold': return ['#F6C915', '#F8D95B'];
      case 'exhale': return ['#EAE3C0', '#F0EBD5'];
      default: return ['#A7C584', '#6B8A47'];
    }
  };

  const getPerformanceLevel = () => {
    if (rounds >= 5) return { level: 'Excelente', color: '#6B8A47', message: '¡Dominas la técnica!' };
    if (rounds >= 3) return { level: 'Muy Bueno', color: '#A7C584', message: 'Vas por buen camino' };
    if (rounds >= 1) return { level: 'Buen Comienzo', color: '#F6C915', message: 'Sigue practicando' };
    return { level: 'Comienza', color: '#EAE3C0', message: 'Inicia tu práctica' };
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
          <Text style={styles.title}>Ejercicio de Respiración</Text>
          <Text style={styles.subtitle}>Técnica 4-7-8 para calmar la ansiedad</Text>

          <View style={styles.circleContainer}>
            <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient
                colors={getCircleColor()}
                style={styles.circleGradient}
              >
                <Text style={styles.timerText}>{timer}s</Text>
                <Text style={styles.stepText}>{steps[currentStep].text}</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{rounds}</Text>
              <Text style={styles.statLabel}>Rondas Actuales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalRoundsCompleted}</Text>
              <Text style={styles.statLabel}>Total Rondas</Text>
            </View>
          </View>

          <View style={styles.performance}>
            <Text style={styles.performanceTitle}>Nivel:</Text>
            <Text style={[styles.performanceLevel, { color: getPerformanceLevel().color }]}>
              {getPerformanceLevel().level}
            </Text>
            <Text style={styles.performanceMessage}>
              {getPerformanceLevel().message}
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>Instrucciones:</Text>
            <Text style={styles.instruction}>• Inhala por 4 segundos</Text>
            <Text style={styles.instruction}>• Mantén por 7 segundos</Text>
            <Text style={styles.instruction}>• Exhala por 8 segundos</Text>
            <Text style={styles.instruction}>• Repite 3-5 rondas para mejores resultados</Text>
          </View>

          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>Beneficios:</Text>
            <Text style={styles.benefit}>✓ Reduce el estrés y la ansiedad</Text>
            <Text style={styles.benefit}>✓ Mejora la oxigenación</Text>
            <Text style={styles.benefit}>✓ Ayuda a conciliar el sueño</Text>
            <Text style={styles.benefit}>✓ Mejora la concentración</Text>
          </View>

          <View style={styles.buttonContainer}>
            {!isActive ? (
              <>
                <TouchableOpacity style={styles.startButton} onPress={startExercise}>
                  <LinearGradient
                    colors={['#6B8A47', '#A7C584']}
                    style={styles.buttonGradient}
                  >
                    <MaterialIcons name="play-arrow" size={24} color="#fff" />
                    <Text style={styles.buttonText}>
                      {rounds > 0 ? 'Continuar' : 'Comenzar'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {rounds > 0 && (
                  <TouchableOpacity style={styles.completeButton} onPress={completeExercise}>
                    <Text style={styles.completeButtonText}>Finalizar Ejercicio</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
                <LinearGradient
                  colors={['#F6C915', '#F8D95B']}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="pause" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Pausar</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
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
    alignItems: 'center',
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
  circleContainer: {
    marginVertical: 30,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3B1E',
  },
  stepText: {
    fontSize: 16,
    color: '#2D3B1E',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B8A47',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B8A47',
    marginTop: 5,
  },
  performance: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  performanceTitle: {
    fontSize: 16,
    color: '#2D3B1E',
    marginBottom: 5,
  },
  performanceLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  performanceMessage: {
    fontSize: 14,
    color: '#2D3B1E',
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
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
  benefits: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
  },
  benefit: {
    fontSize: 16,
    color: '#2D3B1E',
    marginBottom: 5,
  },
  buttonContainer: {
    width: '100%',
  },
  startButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  stopButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  completeButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#A7C584',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#6B8A47',
    fontSize: 16,
    fontWeight: '600',
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

export default RespirationScreen;