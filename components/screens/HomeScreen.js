import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HomeScreen = ({ route, navigation }) => {
  const { user } = route.params || {};
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [stats, setStats] = useState({
    totalExercises: 0,
    totalChallenges: 0,
    consecutiveDays: 0
  });
  const [loading, setLoading] = useState(true);

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

    // Cargar estadísticas al montar el componente
    loadUserStats();
  }, []);

  // Función para cargar las estadísticas del usuario
  const loadUserStats = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userData);
      
      // Obtener el progreso del usuario desde el servidor
      const response = await fetch(`http://31.220.50.7:3000/progress/stats/${user.id}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          calculateStats(result.stats);
        }
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular las estadísticas
  const calculateStats = (progressData) => {
    let totalExercises = 0;
    let totalChallenges = 0;
    const exerciseDates = new Set();

    progressData.forEach(item => {
      // Contar ejercicios (paraphrase, respiration, pauses)
      if (['paraphrase', 'respiration', 'pauses'].includes(item.exerciseType)) {
        totalExercises += item.totalSessions || 0;
      }
      
      // Contar retos (aquí puedes definir qué consideras "retos")
      if (item.exerciseType === 'challenge') {
        totalChallenges += item.totalSessions || 0;
      }

      // Recolectar fechas de ejercicios para calcular días consecutivos
      if (item.lastSession) {
        const date = new Date(item.lastSession).toDateString();
        exerciseDates.add(date);
      }
    });

    // Calcular días consecutivos
    const consecutiveDays = calculateConsecutiveDays(Array.from(exerciseDates));

    setStats({
      totalExercises,
      totalChallenges,
      consecutiveDays
    });
  };

  // Función para calcular días consecutivos
  const calculateConsecutiveDays = (dates) => {
    if (dates.length === 0) return 0;

    // Ordenar fechas de más reciente a más antigua
    const sortedDates = dates
      .map(date => new Date(date))
      .sort((a, b) => b - a);

    let consecutiveDays = 1;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Verificar si hay actividad hoy o ayer
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (!sortedDates.some(date => date.toDateString() === todayStr) &&
        !sortedDates.some(date => date.toDateString() === yesterdayStr)) {
      return 0;
    }

    // Contar días consecutivos hacia atrás
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i - 1]);
      const previousDate = new Date(sortedDates[i]);
      
      const diffTime = currentDate - previousDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays <= 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  };

  const menuItems = [
    {
      id: 1,
      title: 'Retos de Habla',
      description: 'Supera tus miedos con desafíos graduales',
      icon: 'mic',
      color: ['#6B8A47', '#A7C584'],
      screen: 'SpeechChallenges',
      iconType: 'material'
    },
    {
      id: 2,
      title: 'Grabar Video',
      description: 'Practica y graba tus discursos',
      icon: 'videocam',
      color: ['#F6C915', '#F8D95B'],
      screen: 'SpeechRecording',
      iconType: 'material'
    },
    {
      id: 3,
      title: 'Ejercicios Vocales',
      description: 'Mejora tu vocalización',
      icon: 'voice-chat',
      color: ['#A7C584', '#C4D8A8'],
      screen: 'VocalExercises',
      iconType: 'material'
    },
    {
      id: 4,
      title: 'Escucha Activa',
      description: 'Ejercicios de concentración',
      icon: 'headphones',
      color: ['#EAE3C0', '#F0EBD5'],
      screen: 'Listening',
      iconType: 'fontawesome5'
    },
    {
      id: 5,
      title: 'Tips de Autodominio',
      description: 'Controla tus nervios y miedos',
      icon: 'psychology',
      color: ['#6B8A47', '#8FAE6B'],
      screen: 'SelfMasteryTips',
      iconType: 'material'
    },
    {
      id: 6,
      title: 'Mi Progreso',
      description: 'Revisa tu evolución personal',
      icon: 'trending-up',
      color: ['#F6C915', '#F8D95B'],
      screen: 'Progress',
      iconType: 'material'
    }
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Respiración',
      time: '5 min',
      icon: 'air',
      type: 'warmup',
      screen: 'Respiration'
    },
    {
      id: 2,
      title: 'Parafrasear',
      time: '10 min',
      icon: 'repeat',
      type: 'exercise',
      screen: 'Paraphrase'
    },
    {
      id: 3,
      title: 'Pausas',
      time: '8 min',
      icon: 'pause-circle',
      type: 'technique',
      screen: 'Pauses'
    }
  ];

  const handleMenuPress = (item) => {
    if (item.screen && ['Respiration', 'Paraphrase', 'Pauses','VocalExercises','Progress','SpeechChallenges','SpeechRecording','SelfMasteryTips','Listening'].includes(item.screen)) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(
        'Próximamente',
        `Función ${item.title} estará disponible pronto`,
        [{ text: 'Entendido' }]
      );
    }
  };

  const renderIcon = (item) => {
    const iconSize = 28;
    const iconColor = '#2D3B1E';
    
    switch (item.iconType) {
      case 'fontawesome5':
        return <FontAwesome5 name={item.icon} size={iconSize} color={iconColor} />;
      case 'ionicons':
        return <Ionicons name={item.icon} size={iconSize} color={iconColor} />;
      default:
        return <MaterialIcons name={item.icon} size={iconSize} color={iconColor} />;
    }
  };

  // Función para recargar estadísticas cuando el usuario vuelve a esta pantalla
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserStats();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUserStats}
            colors={['#6B8A47']}
            tintColor="#6B8A47"
          />
        }
      >
        {/* Header con bienvenida */}
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <LinearGradient
            colors={['#6B8A47', '#A7C584']}
            style={styles.headerGradient}
          >
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>¡Hola, {user?.name || 'Usuario'}!</Text>
              <Text style={styles.subtitleText}>Tu viaje para mejorar la comunicación comienza aquí</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {loading ? '-' : stats.totalExercises}
                </Text>
                <Text style={styles.statLabel}>Ejercicios</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {loading ? '-' : stats.totalChallenges}
                </Text>
                <Text style={styles.statLabel}>Retos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {loading ? '-' : stats.consecutiveDays}
                </Text>
                <Text style={styles.statLabel}>Días</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Acciones rápidas */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.quickActionCard}
                onPress={() => handleMenuPress(action)}
              >
                <LinearGradient
                  colors={['#EAE3C0', '#F0EBD5']}
                  style={styles.quickActionGradient}
                >
                  <MaterialIcons name={action.icon} size={32} color="#6B8A47" />
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionTime}>{action.time}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Menú principal */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>Explorar Herramientas</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => handleMenuPress(item)}
              >
                <LinearGradient
                  colors={item.color}
                  style={styles.menuGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.iconContainer}>
                    {renderIcon(item)}
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Notificación del día */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <LinearGradient
            colors={['#EAE3C0', '#F0EBD5']}
            style={styles.notificationCard}
          >
            <MaterialIcons name="notifications" size={24} color="#6B8A47" />
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>Consejo del Día</Text>
              <Text style={styles.notificationMessage}>
                {stats.consecutiveDays > 0 
                  ? `¡Llevas ${stats.consecutiveDays} día${stats.consecutiveDays > 1 ? 's' : ''} consecutivo${stats.consecutiveDays > 1 ? 's' : ''}! Sigue así.`
                  : "Haz una pausa antes de responder - te ayuda a procesar mejor la información"
                }
              </Text>
            </View>
          </LinearGradient>
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
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 15,
  },
  quickActionsScroll: {
    marginHorizontal: -5,
  },
  quickActionCard: {
    width: 120,
    height: 120,
    marginHorizontal: 5,
  },
  quickActionGradient: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7C584',
  },
  quickActionTitle: {
    color: '#2D3B1E',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionTime: {
    color: '#6B8A47',
    fontSize: 12,
    marginTop: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: (width - 50) / 2,
    height: 160,
    marginBottom: 15,
  },
  menuGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitle: {
    color: '#2D3B1E',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  menuDescription: {
    color: '#2D3B1E',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#A7C584',
  },
  notificationText: {
    flex: 1,
    marginLeft: 15,
  },
  notificationTitle: {
    color: '#6B8A47',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationMessage: {
    color: '#2D3B1E',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;