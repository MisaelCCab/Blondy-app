import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ParaphraseScreen = ({ navigation }) => {
  const [currentText, setCurrentText] = useState('');
  const [userParaphrase, setUserParaphrase] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const texts = [
    "La práctica constante es fundamental para mejorar nuestras habilidades de comunicación",
    "Escuchar activamente significa prestar atención completa al mensaje del interlocutor",
    "La claridad en el mensaje evita malentendidos y mejora la comprensión mutua",
    "La confianza al hablar se desarrolla mediante la exposición gradual a situaciones desafiantes",
    "La empatía nos permite conectar mejor con las emociones de quienes nos escuchan"
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

  // Función para calcular puntuación basada en la longitud y complejidad
  const calculateScore = (originalText, userText) => {
    const originalWords = originalText.split(' ').length;
    const userWords = userText.split(' ').length;
    
    // Puntuación basada en:
    // - No copiar exactamente el texto (30%)
    // - Longitud similar (30%)
    // - Complejidad del vocabulario (40%)
    
    let score = 0;
    
    // Verificar que no sea una copia exacta
    if (originalText.toLowerCase() !== userText.toLowerCase()) {
      score += 30;
    }
    
    // Verificar longitud similar (±40%)
    const lengthRatio = userWords / originalWords;
    if (lengthRatio >= 0.6 && lengthRatio <= 1.4) {
      score += 30;
    }
    
    // Puntuación base por completar el ejercicio
    score += 40;
    
    return Math.min(100, score);
  };

  const startExercise = () => {
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    setCurrentText(randomText);
    setUserParaphrase('');
    setShowFeedback(false);
    setStartTime(new Date());
  };

  const checkParaphrase = async () => {
    if (!userParaphrase.trim()) {
      Alert.alert('Error', 'Por favor escribe tu versión de la frase');
      return;
    }

    const endTime = new Date();
    const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;
    const score = calculateScore(currentText, userParaphrase);

    // Guardar progreso en el servidor
    const success = await saveProgress({
      exerciseType: 'paraphrase',
      duration: duration,
      roundsCompleted: 1,
      score: score
    });

    setShowFeedback(true);
    setExerciseCount(prev => prev + 1);

    if (!success) {
      Alert.alert(
        'Información', 
        'El ejercicio se completó pero el progreso no se pudo guardar en el servidor.',
        [{ text: 'Entendido' }]
      );
    }
  };

  const nextExercise = () => {
    startExercise();
  };

  const getPerformanceFeedback = (score) => {
    if (score >= 90) return { message: '¡Excelente! Has captado perfectamente la esencia del mensaje.', color: '#6B8A47' };
    if (score >= 70) return { message: '¡Muy bien! Tu parafraseo es claro y efectivo.', color: '#A7C584' };
    if (score >= 50) return { message: 'Buen trabajo. Sigue practicando para mejorar.', color: '#F6C915' };
    return { message: 'Sigue intentándolo. Recuerda mantener el significado original.', color: '#EAE3C0' };
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F6F9F5', '#EAE3C0']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Ejercicio de Parafraseo</Text>
          <Text style={styles.subtitle}>Practica reformular ideas con tus propias palabras</Text>

          {!currentText ? (
            <View style={styles.startContainer}>
              <Text style={styles.instructions}>
                Este ejercicio te ayudará a mejorar tu comprensión y expresión verbal.
                Lee la frase y escríbela con tus propias palabras manteniendo el significado original.
              </Text>
              
              <View style={styles.stats}>
                <Text style={styles.statsText}>
                  Ejercicios completados: {exerciseCount}
                </Text>
              </View>

              <TouchableOpacity style={styles.startButton} onPress={startExercise}>
                <LinearGradient
                  colors={['#6B8A47', '#A7C584']}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="play-arrow" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Comenzar Ejercicio</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.exerciseContainer}>
              <View style={styles.originalTextContainer}>
                <Text style={styles.sectionTitle}>Frase Original:</Text>
                <Text style={styles.originalText}>"{currentText}"</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.sectionTitle}>Tu Versión:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Escribe aquí tu versión de la frase..."
                  value={userParaphrase}
                  onChangeText={setUserParaphrase}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#A7C584"
                />
                <Text style={styles.charCount}>
                  {userParaphrase.length} caracteres
                </Text>
              </View>

              {!showFeedback ? (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.checkButton} onPress={checkParaphrase}>
                    <LinearGradient
                      colors={['#F6C915', '#F8D95B']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons name="check" size={24} color="#fff" />
                      <Text style={styles.buttonText}>Verificar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.cancelButton} onPress={startExercise}>
                    <Text style={styles.cancelButtonText}>Cambiar Frase</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackTitle}>¡Buen trabajo!</Text>
                  
                  <View style={styles.performance}>
                    <Text style={styles.performanceTitle}>Tu desempeño:</Text>
                    <Text style={styles.performanceText}>
                      {getPerformanceFeedback(calculateScore(currentText, userParaphrase)).message}
                    </Text>
                  </View>
                  
                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Consejos para mejorar:</Text>
                    <Text style={styles.tip}>✓ Mantén el significado original</Text>
                    <Text style={styles.tip}>✓ Usa tus propias palabras</Text>
                    <Text style={styles.tip}>✓ Sé claro y conciso</Text>
                    <Text style={styles.tip}>✓ Mantén la esencia del mensaje</Text>
                    <Text style={styles.tip}>✓ Evita copiar la estructura exacta</Text>
                  </View>

                  <View style={styles.nextButtonContainer}>
                    <Text style={styles.counter}>Ejercicios completados: {exerciseCount}</Text>
                    <TouchableOpacity style={styles.nextButton} onPress={nextExercise}>
                      <LinearGradient
                        colors={['#6B8A47', '#A7C584']}
                        style={styles.buttonGradient}
                      >
                        <MaterialIcons name="skip-next" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Siguiente Frase</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#2D3B1E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  stats: {
    marginBottom: 30,
  },
  statsText: {
    fontSize: 16,
    color: '#6B8A47',
    fontWeight: '600',
    textAlign: 'center',
  },
  exerciseContainer: {
    flex: 1,
  },
  originalTextContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B8A47',
    marginBottom: 10,
  },
  originalText: {
    fontSize: 16,
    color: '#2D3B1E',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 2,
    borderColor: '#A7C584',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2D3B1E',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B8A47',
    textAlign: 'right',
    marginTop: 5,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  checkButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cancelButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#A7C584',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B8A47',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6B8A47',
    textAlign: 'center',
    marginBottom: 20,
  },
  performance: {
    backgroundColor: 'rgba(167, 197, 132, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 5,
  },
  performanceText: {
    fontSize: 14,
    color: '#2D3B1E',
    lineHeight: 20,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
  },
  tip: {
    fontSize: 16,
    color: '#2D3B1E',
    marginBottom: 8,
  },
  nextButtonContainer: {
    alignItems: 'center',
  },
  counter: {
    fontSize: 16,
    color: '#6B8A47',
    marginBottom: 15,
    fontWeight: '600',
  },
  nextButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    width: '100%',
  },
  startButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    width: '100%',
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

export default ParaphraseScreen;