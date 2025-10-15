import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ListeningScreen = ({ navigation }) => {
  const [expandedTip, setExpandedTip] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
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

  const listeningTips = [
    {
      id: 1,
      title: 'Escucha sin Interrumpir',
      description: 'Practica la contención verbal',
      content: 'Permite que la otra persona termine completamente su idea antes de responder. Cuenta mentalmente hasta 3 después de que hayan terminado para asegurarte de que no van a añadir nada más.',
      steps: [
        'Mantén contacto visual con quien habla',
        'Resiste el impulso de terminar sus frases',
        'Cuenta mentalmente hasta 3 después de que terminen',
        'Asiente con la cabeza para mostrar que estás escuchando',
        'Solo entonces formula tu respuesta'
      ]
    },
    {
      id: 2,
      title: 'Parafrasear y Validar',
      description: 'Demuestra que has comprendido',
      content: 'Repite con tus propias palabras lo que has entendido y valida los sentimientos de la otra persona. Esto crea conexión y asegura una comunicación clara.',
      steps: [
        'Escucha atentamente el mensaje completo',
        'Comienza con "Si te entiendo bien..."',
        'Parafrasea el contenido principal',
        'Reconoce los sentimientos: "Parece que te sientes..."',
        'Pregunta: "¿Es eso correcto?"'
      ]
    },
    {
      id: 3,
      title: 'Eliminar Distracciones',
      description: 'Enfoque total en el interlocutor',
      content: 'Apaga dispositivos electrónicos y elimina distracciones visuales. Tu atención completa es el mayor regalo que puedes dar a quien te habla.',
      steps: [
        'Guarda tu teléfono fuera de la vista',
        'Apaga o silencia notificaciones',
        'Busca un lugar tranquilo para conversar',
        'Posiciona tu cuerpo frente al interlocutor',
        'Mantén las manos libres (no sostengas objetos)'
      ]
    },
    {
      id: 4,
      title: 'Preguntas Abiertas',
      description: 'Profundiza en la comprensión',
      content: 'Utiliza preguntas que no puedan responderse con un simple "sí" o "no". Esto anima a la otra persona a compartir más información y perspectivas.',
      steps: [
        'Evita preguntas que comiencen con "¿Es...?"',
        'Usa: "¿Qué piensas sobre...?"',
        'Pregunta: "¿Cómo te hizo sentir...?"',
        'Utiliza: "¿Puedes contarme más sobre...?"',
        'Finaliza con: "¿Hay algo más que quieras compartir?"'
      ]
    },
    {
      id: 5,
      title: 'Lenguaje Corporal Receptivo',
      description: 'Comunica apertura sin palabras',
      content: 'Tu cuerpo habla tanto como tus palabras. Una postura abierta y receptiva anima a los demás a compartir más abiertamente.',
      steps: [
        'Mantén los brazos sin cruzar',
        'Inclínate ligeramente hacia adelante',
        'Asiente periódicamente con la cabeza',
        'Mantén una expresión facial relajada',
        'Usa gestos con las palmas abiertas'
      ]
    },
    {
      id: 6,
      title: 'Escucha del Silencio',
      description: 'Valorar los espacios en blanco',
      content: 'Los silencios en la conversación son oportunidades para la reflexión. No sientas la necesidad de llenar cada pausa con palabras.',
      steps: [
        'Permite pausas naturales en la conversación',
        'Usa el silencio para procesar lo escuchado',
        'Observa el lenguaje corporal durante las pausas',
        'Resiste la urgencia de hablar inmediatamente',
        'Reconoce que el silencio puede ser productivo'
      ]
    }
  ];

  const toggleTip = (tipId) => {
    setExpandedTip(expandedTip === tipId ? null : tipId);
  };

  const shareTip = async (tip) => {
    try {
      const shareContent = {
        title: tip.title,
        message: `${tip.title}\n\n${tip.content}\n\nPasos:\n${tip.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nDescargué Blondy para más tips de comunicación`,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing tip:', error);
    }
  };

  const renderSteps = (steps) => {
    return steps.map((step, index) => (
      <View key={index} style={styles.stepItem}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.stepText}>{step}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6B8A47', '#A7C584']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Escucha Activa</Text>
        <Text style={styles.headerSubtitle}>Conecta profundamente mediante la escucha consciente</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.introSection}>
            <LinearGradient
              colors={['#6B8A47', '#8FAE6B']}
              style={styles.introCard}
            >
              <MaterialIcons name="hearing" size={32} color="#fff" />
              <Text style={styles.introTitle}>¿Qué es la Escucha Activa?</Text>
              <Text style={styles.introText}>
                La escucha activa es la habilidad de comprender completamente lo que otra persona está diciendo, tanto en contenido como en sentimiento. No se trata solo de oír, sino de entender.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Técnicas de Escucha Activa</Text>
            
            <View style={styles.tipsList}>
              {listeningTips.map((tip) => (
                <View key={tip.id} style={styles.tipCard}>
                  <TouchableOpacity 
                    style={styles.tipHeader}
                    onPress={() => toggleTip(tip.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tipInfo}>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                      <Text style={styles.tipDescription}>{tip.description}</Text>
                    </View>
                    <MaterialIcons 
                      name={expandedTip === tip.id ? "expand-less" : "expand-more"} 
                      size={24} 
                      color="#6B8A47" 
                    />
                  </TouchableOpacity>

                  {expandedTip === tip.id && (
                    <View style={styles.tipContent}>
                      <Text style={styles.tipFullContent}>{tip.content}</Text>
                      
                      {tip.steps && tip.steps.length > 0 && (
                        <View style={styles.stepsContainer}>
                          <Text style={styles.stepsTitle}>Cómo practicarlo:</Text>
                          {renderSteps(tip.steps)}
                        </View>
                      )}

                      <TouchableOpacity 
                        style={styles.shareButton}
                        onPress={() => shareTip(tip)}
                      >
                        <MaterialIcons name="share" size={20} color="#6B8A47" />
                        <Text style={styles.shareButtonText}>Compartir Técnica</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.benefitsSection}>
            <LinearGradient
              colors={['#A7C584', '#C4D8A8']}
              style={styles.benefitsCard}
            >
              <Text style={styles.benefitsTitle}>Beneficios de la Escucha Activa</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={20} color="#2D3B1E" />
                  <Text style={styles.benefitText}>Mejora las relaciones personales y profesionales</Text>
                </View>
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={20} color="#2D3B1E" />
                  <Text style={styles.benefitText}>Reduce malentendidos y conflictos</Text>
                </View>
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={20} color="#2D3B1E" />
                  <Text style={styles.benefitText}>Aumenta la confianza y el respeto mutuo</Text>
                </View>
                <View style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={20} color="#2D3B1E" />
                  <Text style={styles.benefitText}>Facilita la resolución de problemas</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.finalTip}>
            <LinearGradient
              colors={['#F6C915', '#F8D95B']}
              style={styles.finalTipGradient}
            >
              <MaterialIcons name="lightbulb" size={32} color="#2D3B1E" />
              <Text style={styles.finalTipTitle}>Recuerda</Text>
              <Text style={styles.finalTipText}>
                La escucha activa es como un músculo: se fortalece con la práctica constante. Comienza aplicando una técnica a la vez y observa cómo transforma tus conversaciones.
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  introSection: {
    marginBottom: 25,
  },
  introCard: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  tipsList: {
    gap: 15,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#6B8A47',
  },
  tipContent: {
    padding: 18,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F6F9F5',
  },
  tipFullContent: {
    fontSize: 14,
    color: '#2D3B1E',
    lineHeight: 20,
    marginBottom: 15,
  },
  stepsContainer: {
    marginBottom: 15,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B8A47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2D3B1E',
    lineHeight: 18,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    borderRadius: 10,
    marginTop: 10,
  },
  shareButtonText: {
    color: '#6B8A47',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  benefitsSection: {
    marginBottom: 25,
  },
  benefitsCard: {
    padding: 25,
    borderRadius: 20,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#2D3B1E',
    marginLeft: 10,
    lineHeight: 20,
  },
  finalTip: {
    marginBottom: 40,
  },
  finalTipGradient: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F6C915',
  },
  finalTipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginTop: 15,
    marginBottom: 10,
  },
  finalTipText: {
    fontSize: 16,
    color: '#2D3B1E',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ListeningScreen;