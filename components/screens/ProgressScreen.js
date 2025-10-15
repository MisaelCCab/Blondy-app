import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ navigation, route }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [progressData, setProgressData] = useState({
    exercises: [],
    vocalExercises: [],
    speechChallenges: [],
    stats: {}
  });

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

    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        await loadAllProgress(userObj.id);
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAllProgress = async (userId) => {
    try {
      console.log('=== INICIANDO CARGA DE PROGRESO ===');
      console.log('User ID:', userId);
      
      // Cargar progreso de ejercicios regulares
      const exercisesResponse = await fetch(`http://31.220.50.7:3001/progress/stats/${userId}`);
      if (!exercisesResponse.ok) {
        throw new Error(`Error en ejercicios regulares: ${exercisesResponse.status}`);
      }
      const exercisesData = await exercisesResponse.json();
      console.log('Ejercicios regulares:', exercisesData);

      // Cargar progreso de ejercicios vocales
      const vocalResponse = await fetch(`http://31.220.50.7:3001/vocal-exercises/progress/${userId}`);
      if (!vocalResponse.ok) {
        throw new Error(`Error en ejercicios vocales: ${vocalResponse.status}`);
      }
      const vocalData = await vocalResponse.json();
      console.log('Ejercicios vocales respuesta:', vocalData);

      // Cargar estadísticas de ejercicios vocales
      const vocalStatsResponse = await fetch(`http://31.220.50.7:3001/vocal-exercises/stats/${userId}`);
      const vocalStatsData = await vocalStatsResponse.json();
      console.log('Estadísticas vocales:', vocalStatsData);

      // Cargar retos de habla
      const speechChallengesResponse = await fetch(`http://31.220.50.7:3001/speech-challenges/${userId}`);
      const speechChallengesData = await speechChallengesResponse.json();
      console.log('Retos de habla:', speechChallengesData);

      const progressDataToSet = {
        exercises: exercisesData.success ? exercisesData.stats : [],
        vocalExercises: vocalData.success ? vocalData.progress : [],
        speechChallenges: speechChallengesData.success ? speechChallengesData.challenges : [],
        stats: {
          vocal: vocalStatsData.success ? vocalStatsData.stats : {}
        }
      };

      console.log('=== DATOS FINALES A SETEAR ===');
      console.log('Ejercicios regulares count:', progressDataToSet.exercises.length);
      console.log('Ejercicios vocales count:', progressDataToSet.vocalExercises.length);
      console.log('Retos de habla count:', progressDataToSet.speechChallenges.length);
      console.log('Retos de habla datos:', progressDataToSet.speechChallenges);

      setProgressData(progressDataToSet);
      
    } catch (error) {
      console.error('Error completo cargando progreso:', error);
      console.error('No se pudieron cargar los datos de progreso');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const getExerciseIcon = (exerciseType) => {
    switch (exerciseType) {
      case 'respiration':
        return { icon: 'air', name: 'Respiración' };
      case 'paraphrase':
        return { icon: 'repeat', name: 'Parafrasear' };
      case 'pauses':
        return { icon: 'pause-circle', name: 'Pausas' };
      default:
        return { icon: 'fitness-center', name: exerciseType };
    }
  };

  const getVocalExerciseStatus = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'Completado', color: '#6B8A47', icon: 'check-circle' };
      case 'in_progress':
        return { text: 'En Progreso', color: '#F6C915', icon: 'play-circle' };
      default:
        return { text: 'No Iniciado', color: '#CCCCCC', icon: 'radio-button-unchecked' };
    }
  };

  const getSpeechChallengeStatus = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'Completado', color: '#6B8A47', icon: 'check-circle' };
      case 'in_progress':
        return { text: 'En Progreso', color: '#F6C915', icon: 'play-circle' };
      case 'skipped':
        return { text: 'Saltado', color: '#FF6B6B', icon: 'cancel' };
      default:
        return { text: 'Pendiente', color: '#CCCCCC', icon: 'schedule' };
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    const mins = Number(minutes);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No completado';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función segura para formatear puntuación
  const formatScore = (score) => {
    if (score === null || score === undefined || isNaN(score)) {
      return '0.0';
    }
    return Number(score).toFixed(1);
  };

  // Calcular estadísticas generales
  const calculateOverallStats = () => {
    const totalExerciseSessions = progressData.exercises.reduce((sum, ex) => sum + (Number(ex.totalSessions) || 0), 0);
    const totalExerciseTime = progressData.exercises.reduce((sum, ex) => sum + (Number(ex.totalTime) || 0), 0);
    const completedVocalChallenges = progressData.vocalExercises.filter(v => v.status === 'completed').length;
    const inProgressVocalChallenges = progressData.vocalExercises.filter(v => v.status === 'in_progress').length;
    
    // Estadísticas de retos de habla
    const completedSpeechChallenges = progressData.speechChallenges.filter(c => c.status === 'completed').length;
    const inProgressSpeechChallenges = progressData.speechChallenges.filter(c => c.status === 'in_progress').length;
    const pendingSpeechChallenges = progressData.speechChallenges.filter(c => c.status === 'pending').length;
    const totalSpeechChallenges = progressData.speechChallenges.length;

    return {
      totalExerciseSessions,
      totalExerciseTime,
      completedVocalChallenges,
      inProgressVocalChallenges,
      totalVocalChallenges: progressData.vocalExercises.length,
      completedSpeechChallenges,
      inProgressSpeechChallenges,
      pendingSpeechChallenges,
      totalSpeechChallenges
    };
  };

  const overallStats = calculateOverallStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B8A47" />
        <Text style={styles.loadingText}>Cargando tu progreso...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6B8A47']}
            tintColor="#6B8A47"
          />
        }
      >
        {/* Header */}
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
            <View style={styles.headerContent}>
              <Text style={styles.title}>Mi Progreso</Text>
              <Text style={styles.subtitle}>
                {user?.name ? `Bienvenido, ${user.name}` : 'Resumen de tu actividad'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Estadísticas Generales */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="fitness-center" size={32} color="#6B8A47" />
              <Text style={styles.statNumber}>{overallStats.totalExerciseSessions}</Text>
              <Text style={styles.statLabel}>Sesiones de Ejercicios</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="timer" size={32} color="#F6C915" />
              <Text style={styles.statNumber}>
                {formatDuration(overallStats.totalExerciseTime)}
              </Text>
              <Text style={styles.statLabel}>Tiempo Total</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={32} color="#6B8A47" />
              <Text style={styles.statNumber}>
                {overallStats.completedVocalChallenges}/{overallStats.totalVocalChallenges}
              </Text>
              <Text style={styles.statLabel}>Retos Vocales</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={32} color="#A7C584" />
              <Text style={styles.statNumber}>
                {overallStats.completedSpeechChallenges}
              </Text>
              <Text style={styles.statLabel}>Retos de Habla</Text>
            </View>
          </View>
        </Animated.View>

        {/* Retos de Habla */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Retos de Habla</Text>
            <Text style={styles.sectionSubtitle}>
              {overallStats.completedSpeechChallenges} de {overallStats.totalSpeechChallenges} retos completados
            </Text>
          </View>
          
          {progressData.speechChallenges.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="record-voice-over" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>Aún no tienes retos de habla asignados</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('SpeechChallenges')}
              >
                <Text style={styles.emptyStateButtonText}>Ver Retos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.speechChallengesList}>
              {progressData.speechChallenges
                .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))
                .slice(0, 5) // Mostrar solo los 5 más recientes
                .map((challenge, index) => {
                  const statusInfo = getSpeechChallengeStatus(challenge.status);
                  const levelInfo = getLevelInfo(challenge.challenge_level);
                  
                  return (
                    <TouchableOpacity 
                      key={challenge.id} 
                      style={styles.speechChallengeCard}
                      onPress={() => navigation.navigate('SpeechChallenges')}
                    >
                      <LinearGradient
                        colors={['#FFFFFF', '#F6F9F5']}
                        style={styles.speechChallengeGradient}
                      >
                        <View style={styles.speechChallengeHeader}>
                          <View style={styles.challengeTitleContainer}>
                            <Text style={styles.challengeTitle} numberOfLines={2}>
                              {challenge.challenge_title}
                            </Text>
                            <View style={[styles.levelBadge, { backgroundColor: levelInfo.color }]}>
                              <Text style={styles.levelText}>Nvl {challenge.challenge_level}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                            <MaterialIcons 
                              name={statusInfo.icon} 
                              size={16} 
                              color={statusInfo.color} 
                            />
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>
                              {statusInfo.text}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.challengeDescription} numberOfLines={2}>
                          {challenge.challenge_description}
                        </Text>
                        
                        <View style={styles.challengeDates}>
                          <View style={styles.dateInfo}>
                            <MaterialIcons name="event" size={14} color="#6B8A47" />
                            <Text style={styles.dateText}>
                              Asignado: {formatDate(challenge.assigned_date)}
                            </Text>
                          </View>
                          {challenge.completed_date && (
                            <View style={styles.dateInfo}>
                              <MaterialIcons name="check" size={14} color="#6B8A47" />
                              <Text style={styles.dateText}>
                                Completado: {formatDate(challenge.completed_date)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              
              {progressData.speechChallenges.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('SpeechChallenges')}
                >
                  <Text style={styles.viewAllButtonText}>
                    Ver todos los retos ({progressData.speechChallenges.length})
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#6B8A47" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        {/* Ejercicios Vocales */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ejercicios Vocales</Text>
            <Text style={styles.sectionSubtitle}>
              {overallStats.completedVocalChallenges} de {overallStats.totalVocalChallenges} semanas completadas
            </Text>
          </View>
          
          {progressData.vocalExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="voice-chat" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>Aún no has comenzado ejercicios vocales</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('VocalExercises')}
              >
                <Text style={styles.emptyStateButtonText}>Comenzar Ahora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vocalExercisesList}>
              {progressData.vocalExercises.map((exercise, index) => {
                const statusInfo = getVocalExerciseStatus(exercise.status);
                return (
                  <TouchableOpacity 
                    key={exercise.week_number} 
                    style={styles.vocalExerciseCard}
                    onPress={() => navigation.navigate('VocalExercises')}
                  >
                    <LinearGradient
                      colors={['#F6F9F5', '#EAE3C0']}
                      style={styles.vocalExerciseGradient}
                    >
                      <View style={styles.vocalExerciseHeader}>
                        <Text style={styles.weekNumber}>Semana {exercise.week_number}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                          <MaterialIcons 
                            name={statusInfo.icon} 
                            size={16} 
                            color={statusInfo.color} 
                          />
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.vocalExerciseDates}>
                        {exercise.start_date && (
                          <View style={styles.dateInfo}>
                            <MaterialIcons name="play-arrow" size={14} color="#6B8A47" />
                            <Text style={styles.dateText}>
                              Iniciado: {formatDate(exercise.start_date)}
                            </Text>
                          </View>
                        )}
                        {exercise.completion_date && (
                          <View style={styles.dateInfo}>
                            <MaterialIcons name="check" size={14} color="#6B8A47" />
                            <Text style={styles.dateText}>
                              Completado: {formatDate(exercise.completion_date)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Ejercicios Regulares */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ejercicios de Práctica</Text>
            <Text style={styles.sectionSubtitle}>
              {progressData.exercises.length} tipos de ejercicios realizados
            </Text>
          </View>

          {progressData.exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="fitness-center" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>Aún no has realizado ejercicios</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.emptyStateButtonText}>Ir a Ejercicios</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.exercisesList}>
              {progressData.exercises.map((exercise, index) => {
                const iconInfo = getExerciseIcon(exercise.exerciseType);
                const totalSessions = exercise.totalSessions || 0;
                const totalTime = exercise.totalTime || 0;
                const averageScore = exercise.averageScore;
                const lastSession = exercise.lastSession;

                return (
                  <View key={exercise.exerciseType} style={styles.exerciseCard}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F6F9F5']}
                      style={styles.exerciseGradient}
                    >
                      <View style={styles.exerciseHeader}>
                        <View style={styles.exerciseIcon}>
                          <MaterialIcons name={iconInfo.icon} size={24} color="#6B8A47" />
                        </View>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{iconInfo.name}</Text>
                          <Text style={styles.exerciseType}>{exercise.exerciseType}</Text>
                        </View>
                        <View style={styles.exerciseStats}>
                          <Text style={styles.sessionCount}>{totalSessions} sesiones</Text>
                        </View>
                      </View>
                      
                      <View style={styles.exerciseDetails}>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="timer" size={16} color="#6B8A47" />
                          <Text style={styles.detailText}>
                            {formatDuration(totalTime)}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="star" size={16} color="#F6C915" />
                          <Text style={styles.detailText}>
                            Puntuación: {formatScore(averageScore)}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="calendar-today" size={16} color="#6B8A47" />
                          <Text style={styles.detailText}>
                            Última: {formatDate(lastSession)}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Logros */}
        <Animated.View style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>Logros y Metas</Text>
          <View style={styles.achievementsContainer}>
            <View style={styles.achievementCard}>
              <MaterialIcons name="emoji-events" size={32} color="#F6C915" />
              <Text style={styles.achievementTitle}>Principiante</Text>
              <Text style={styles.achievementDescription}>
                Completa tu primera sesión de ejercicios
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${overallStats.totalExerciseSessions > 0 ? 100 : 0}%`,
                      backgroundColor: overallStats.totalExerciseSessions > 0 ? '#6B8A47' : '#CCCCCC'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {overallStats.totalExerciseSessions > 0 ? '¡Completado!' : '0/1 sesiones'}
              </Text>
            </View>

            <View style={styles.achievementCard}>
              <MaterialIcons name="record-voice-over" size={32} color="#6B8A47" />
              <Text style={styles.achievementTitle}>Comunicador Activo</Text>
              <Text style={styles.achievementDescription}>
                Completa 5 retos de habla
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min((overallStats.completedSpeechChallenges / 5) * 100, 100)}%`,
                      backgroundColor: overallStats.completedSpeechChallenges >= 5 ? '#6B8A47' : '#F6C915'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {overallStats.completedSpeechChallenges}/5 retos
              </Text>
            </View>

            <View style={styles.achievementCard}>
              <MaterialIcons name="local-fire-department" size={32} color="#FF6B6B" />
              <Text style={styles.achievementTitle}>Racha de 7 Días</Text>
              <Text style={styles.achievementDescription}>
                Practica durante 7 días consecutivos
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min((overallStats.totalExerciseSessions / 7) * 100, 100)}%`,
                      backgroundColor: overallStats.totalExerciseSessions >= 7 ? '#6B8A47' : '#F6C915'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {overallStats.totalExerciseSessions}/7 sesiones
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// Función para obtener información del nivel (de SpeechChallengesScreen)
const getLevelInfo = (level) => {
  switch (level) {
    case 1: return { name: 'Romper el Hielo', color: '#A7C584' };
    case 2: return { name: 'Interacciones Breves', color: '#F6C915' };
    case 3: return { name: 'Compromiso Largo', color: '#FF6B6B' };
    default: return { name: 'Nivel ' + level, color: '#6B8A47' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F9F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B8A47',
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
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE3C0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B8A47',
    textAlign: 'center',
  },
  // Estilos para Retos de Habla
  speechChallengesList: {
    marginTop: 10,
  },
  speechChallengeCard: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  speechChallengeGradient: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  speechChallengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  challengeTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 5,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B8A47',
    lineHeight: 18,
    marginBottom: 10,
  },
  challengeDates: {
    marginTop: 5,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6B8A47',
    marginLeft: 6,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  viewAllButtonText: {
    color: '#6B8A47',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Estilos existentes para otros componentes
  vocalExercisesList: {
    marginTop: 10,
  },
  vocalExerciseCard: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  vocalExerciseGradient: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  vocalExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  exercisesList: {
    marginTop: 10,
  },
  exerciseCard: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  exerciseGradient: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 2,
  },
  exerciseType: {
    fontSize: 12,
    color: '#6B8A47',
    textTransform: 'capitalize',
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  sessionCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B8A47',
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#2D3B1E',
    marginLeft: 4,
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
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#6B8A47',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementsContainer: {
    marginTop: 10,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginTop: 12,
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B8A47',
    marginBottom: 15,
    lineHeight: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EAE3C0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B8A47',
    fontWeight: '600',
  },
});

export default ProgressScreen;