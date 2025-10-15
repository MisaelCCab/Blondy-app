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

const SelfMasteryTipsScreen = ({ navigation }) => {
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

  const tipsCategories = [
    {
      id: 1,
      title: 'Control de Nervios',
      icon: 'psychology',
      color: ['#6B8A47', '#A7C584'],
      tips: [
        {
          id: 1,
          title: 'Respiración 4-7-8',
          description: 'Técnica para calmar el sistema nervioso',
          content: 'Inhala por 4 segundos, mantén la respiración por 7 segundos y exhala por 8 segundos. Repite 4 veces. Esta técnica activa el sistema parasimpático y reduce la ansiedad inmediatamente.',
          steps: [
            'Siéntate en una posición cómoda',
            'Inhala profundamente por la nariz contando hasta 4',
            'Mantén la respiración contando hasta 7',
            'Exhala completamente por la boca contando hasta 8',
            'Repite el ciclo 3-4 veces'
          ]
        },
        {
          id: 2,
          title: 'Técnica de Grounding',
          description: 'Conecta con el presente',
          content: 'Usa tus sentidos para anclarte en el momento presente. Nombra 5 cosas que ves, 4 que puedes tocar, 3 que escuchas, 2 que hueles y 1 que saboreas.',
          steps: [
            '5 cosas que puedes ver a tu alrededor',
            '4 cosas que puedes sentir/tocar',
            '3 sonidos que puedes escuchar',
            '2 aromas que puedes percibir',
            '1 sabor que puedes identificar'
          ]
        },
        {
          id: 3,
          title: 'Postura de Poder',
          description: 'Confianza corporal',
          content: 'Mantén una postura erguida con los hombros hacia atrás y el pecho abierto durante 2 minutos antes de una situación estresante. Esto aumenta la testosterona y reduce el cortisol.',
          steps: [
            'Párate con los pies separados al ancho de hombros',
            'Coloca las manos en las caderas',
            'Eleva el pecho y echa los hombros ligeramente hacia atrás',
            'Mantén la cabeza erguida',
            'Sostén esta postura por 2 minutos'
          ]
        }
      ]
    },
    {
      id: 2,
      title: 'Manejo del Miedo',
      icon: 'visibility-off',
      color: ['#F6C915', '#F8D95B'],
      tips: [
        {
          id: 4,
          title: 'Visualización Positiva',
          description: 'Prepara tu mente para el éxito',
          content: 'Visualiza el escenario ideal con todos los detalles. Imagina cómo te sientes, qué dices y cómo reaccionan los demás. Tu cerebro no distingue entre lo real y lo vívidamente imaginado.',
          steps: [
            'Cierra los ojos y respira profundamente',
            'Imagina la situación exitosa en detalle',
            'Incluye sonidos, colores y sensaciones',
            'Visualiza las reacciones positivas',
            'Siente la confianza y satisfacción'
          ]
        },
        {
          id: 5,
          title: 'Exposición Gradual',
          description: 'Enfrenta tus miedos paso a paso',
          content: 'Divide el miedo en pequeños pasos manejables. Comienza con la situación menos amenazante y avanza gradualmente hacia el escenario más temido.',
          steps: [
            'Identifica tu mayor miedo',
            'Crea una escala del 1 al 10',
            'Comienza con situaciones de nivel 2-3',
            'Practica cada nivel hasta sentirte cómodo',
            'Avanza al siguiente nivel gradualmente'
          ]
        },
        {
          id: 6,
          title: 'Reestructuración Cognitiva',
          description: 'Cambia tu diálogo interno',
          content: 'Identifica pensamientos negativos automáticos y reemplázalos por afirmaciones realistas y positivas. En lugar de "voy a fracasar", piensa "es una oportunidad para aprender".',
          steps: [
            'Identifica el pensamiento negativo',
            'Cuestiona su veracidad',
            'Busca evidencia contraria',
            'Formula un pensamiento alternativo',
            'Repite la nueva creencia'
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'Concentración',
      icon: 'center-focus-strong',
      color: ['#A7C584', '#C4D8A8'],
      tips: [
        {
          id: 7,
          title: 'Técnica Pomodoro',
          description: 'Enfoque en intervalos',
          content: 'Trabaja en bloques de 25 minutos seguidos de descansos de 5 minutos. Después de 4 ciclos, toma un descanso más largo de 15-30 minutos.',
          steps: [
            'Elige una tarea específica',
            'Configura un temporizador de 25 minutos',
            'Trabaja sin interrupciones',
            'Toma un descanso de 5 minutos',
            'Repite el ciclo'
          ]
        },
        {
          id: 8,
          title: 'Meditación de Atención Plena',
          description: 'Entrena tu foco',
          content: 'Practica observar tus pensamientos sin juzgarlos. Cuando la mente divague, gentilmente regresa tu atención al presente.',
          steps: [
            'Siéntate cómodamente',
            'Enfócate en tu respiración',
            'Observa los pensamientos sin aferrarte',
            'Cuando divagues, regresa suavemente',
            'Practica por 5-10 minutos diarios'
          ]
        },
        {
          id: 9,
          title: 'Eliminación de Distracciones',
          description: 'Crea un ambiente de enfoque',
          content: 'Prepara tu espacio de trabajo eliminando distracciones digitales y físicas. Usa ruido blanco si es necesario y comunica tu necesidad de concentración.',
          steps: [
            'Silencia notificaciones',
            'Limpia tu espacio de trabajo',
            'Establece límites con otros',
            'Usa auriculares con ruido blanco',
            'Ten todo lo necesario a mano'
          ]
        }
      ]
    },
    {
      id: 4,
      title: 'Autoconfianza',
      icon: 'self-improvement',
      color: ['#EAE3C0', '#F0EBD5'],
      tips: [
        {
          id: 10,
          title: 'Afirmaciones Diarias',
          description: 'Programa tu mente para el éxito',
          content: 'Repite afirmaciones positivas específicas y creíbles cada mañana. La repición constante crea nuevas vías neuronales de confianza.',
          steps: [
            'Elige 3-5 afirmaciones específicas',
            'Repítelas en voz alta cada mañana',
            'Visualízate viviendo esas afirmaciones',
            'Usa el tiempo presente',
            'Sé consistente'
          ]
        },
        {
          id: 11,
          title: 'Registro de Logros',
          description: 'Construye evidencia de tu capacidad',
          content: 'Mantén un diario donde registres tus éxitos, por pequeños que sean. Revisa esta lista cuando dudes de tus capacidades.',
          steps: [
            'Crea un diario de logros',
            'Escribe 3 éxitos diarios',
            'Incluye desafíos superados',
            'Revisa semanalmente',
            'Celebra cada avance'
          ]
        },
        {
          id: 12,
          title: 'Lenguaje Corporal Confiado',
          description: 'Actúa como la persona que quieres ser',
          content: 'Tu postura afecta tu estado mental. Mantén contacto visual, habla claramente y usa gestos abiertos para aumentar tu sensación de confianza.',
          steps: [
            'Mantén contacto visual 60-70% del tiempo',
            'Habla con un tono claro y firme',
            'Usa gestos con las palmas abiertas',
            'Sonríe genuinamente',
            'Evita cruzar brazos y piernas'
          ]
        }
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
        message: `${tip.title}\n\n${tip.content}\n\nDescargué Blondy para más tips de autodominio`,
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
        <Text style={styles.headerTitle}>Tips de Autodominio</Text>
        <Text style={styles.headerSubtitle}>Domina tus emociones, controla tu destino</Text>
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
          {tipsCategories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              <LinearGradient
                colors={category.color}
                style={styles.categoryHeader}
              >
                <MaterialIcons name={category.icon} size={24} color="#2D3B1E" />
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </LinearGradient>

              <View style={styles.tipsList}>
                {category.tips.map((tip) => (
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
                            <Text style={styles.stepsTitle}>Pasos a seguir:</Text>
                            {renderSteps(tip.steps)}
                          </View>
                        )}

                        <TouchableOpacity 
                          style={styles.shareButton}
                          onPress={() => shareTip(tip)}
                        >
                          <MaterialIcons name="share" size={20} color="#6B8A47" />
                          <Text style={styles.shareButtonText}>Compartir Tip</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.finalTip}>
            <LinearGradient
              colors={['#EAE3C0', '#F0EBD5']}
              style={styles.finalTipGradient}
            >
              <MaterialIcons name="lightbulb" size={32} color="#6B8A47" />
              <Text style={styles.finalTipTitle}>Recuerda</Text>
              <Text style={styles.finalTipText}>
                El autodominio no se logra de la noche a la mañana. Practica estos tips regularmente y celebra cada pequeño progreso. La consistencia es la clave del éxito.
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginLeft: 10,
  },
  tipsList: {
    gap: 12,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
    overflow: 'hidden',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
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
    padding: 15,
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
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B8A47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  finalTip: {
    marginTop: 20,
    marginBottom: 40,
  },
  finalTipGradient: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7C584',
  },
  finalTipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B8A47',
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

export default SelfMasteryTipsScreen;