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
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

// Configurar el manejo de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SpeechChallengesScreen = ({ navigation, route }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [challenges, setChallenges] = useState([]);
  const [todayChallenge, setTodayChallenge] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Configurar notificaciones
  useEffect(() => {
    configureNotifications();
    loadUserData();
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

  const configureNotifications = async () => {
    try {
      console.log('🔔 Iniciando configuración de notificaciones...');
      
      // Verificar si estamos en Expo Go
      if (!Constants.expoConfig?.extra?.eas?.projectId) {
        console.log('⚠️ No se puede configurar notificaciones push en Expo Go sin projectId');
        console.log('💡 Para notificaciones push necesitas buildear la app con EAS');
        // Continuamos con notificaciones locales aunque no tengamos projectId
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Estado actual de permisos:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 Nuevo estado de permisos:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificación denegados');
        return;
      }

      // Obtener token de notificación con projectId explícito si está disponible
      try {
        if (Constants.expoConfig?.extra?.eas?.projectId) {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId
          });
          console.log('📱 Token de notificación:', token);
        } else {
          console.log('ℹ️ No hay projectId disponible para notificaciones push');
        }
      } catch (tokenError) {
        console.log('⚠️ No se pudo obtener token de notificación:', tokenError);
      }

      // Programar notificaciones locales
      await scheduleLocalNotifications();
      
    } catch (error) {
      console.error('❌ Error configurando notificaciones:', error);
    }
  };

  const scheduleLocalNotifications = async () => {
    try {

      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Notificaciones anteriores canceladas');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎯 Tu Reto Diario de Comunicación",
          body: "¡Tienes un nuevo reto esperándote! Ábrelo para ver tu desafío de hoy.",
          sound: true,
          data: { screen: 'SpeechChallenges' },
        },
        trigger: {
          hour: 18, // 6:00 PM
          minute: 0,
          repeats: true,
        },
      });
      
      console.log('✅ Notificación diaria programada');
      

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📅 Notificaciones programadas:', scheduledNotifications.length);
      scheduledNotifications.forEach((notif, index) => {
        console.log(`Notificación ${index}:`, notif.content.title);
      });
      
    } catch (error) {
      console.error('❌ Error programando notificaciones locales:', error);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('👤 Cargando datos del usuario...');
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const userObj = JSON.parse(userData);
        console.log('✅ User ID encontrado:', userObj.id);
        setUserId(userObj.id);
        await loadChallenges(userObj.id);
      } else {
        console.log('❌ No se encontraron datos de usuario');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      setLoading(false);
    }
  };

  // Helper function para normalizar fechas
  const normalizeDate = (dateString) => {
    if (!dateString) return '';
    
    // Si ya está en formato YYYY-MM-DD, retornar tal cual
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Si es una fecha completa, extraer solo YYYY-MM-DD
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('❌ Fecha inválida:', dateString);
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.log('❌ Error normalizando fecha:', dateString, error);
      return '';
    }
  };

  // Helper function para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const loadChallenges = async (userId) => {
    try {
      console.log('🔄 Cargando retos para usuario:', userId);
      
      const response = await fetch(`https://31.220.50.7/speech-challenges/${userId}`);
      const data = await response.json();
      
      console.log('📊 Respuesta completa del servidor:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Datos obtenidos exitosamente');
        setChallenges(data.challenges);
        console.log('📋 Total de retos en la respuesta:', data.challenges.length);
        
        // Encontrar el reto de hoy
        const today = getTodayDateString();
        console.log('📅 Buscando reto para hoy:', today);
        
        const todayChallenge = data.challenges.find(challenge => {
          console.log('🔍 Analizando reto:', {
            id: challenge.id,
            assigned_date: challenge.assigned_date,
            status: challenge.status,
            title: challenge.challenge_title
          });
          
          // Comparar fechas normalizadas
          const challengeDate = normalizeDate(challenge.assigned_date);
          const todayNormalized = normalizeDate(today);
          
          const matches = challengeDate === todayNormalized;
          
          console.log('📅 Comparación de fechas:', {
            challengeDate,
            todayNormalized,
            matches
          });
          
          return matches;
        });
        
        console.log('🎯 Reto del día encontrado:', todayChallenge);
        setTodayChallenge(todayChallenge);
        
        // MODIFICACIÓN: Solo asignar nuevo reto si no hay reto para hoy
        // No importa el estado (completed, in_progress, pending), si ya hay un reto asignado para hoy, no asignamos otro
        if (!todayChallenge) {
          console.log('❌ No hay reto para hoy, asignando uno nuevo...');
          await assignDailyChallenge(userId);
        } else {
          console.log('✅ Ya existe un reto para hoy, no se asigna nuevo');
        }
      } else {
        console.log('❌ Error en la respuesta del servidor:', data);
        Alert.alert('Error', 'No se pudieron cargar los retos');
      }
    } catch (error) {
      console.error('❌ Error cargando retos:', error);
      Alert.alert('Error', 'No se pudieron cargar los retos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const assignDailyChallenge = async (userId) => {
    try {
      console.log('🎯 Asignando reto diario para usuario:', userId);
      
      const response = await fetch(`https://31.220.50.7/speech-challenges/assign-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      console.log('📨 Respuesta de asignación:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        if (data.alreadyAssigned) {
          console.log('ℹ️ Ya tenía reto asignado para hoy');
          // Recargar para mostrar el reto existente
          await loadChallenges(userId);
        } else {
          console.log('✅ Nuevo reto asignado exitosamente');
          // Recargar los retos
          await loadChallenges(userId);
        }
      } else {
        console.log('❌ Error en la asignación:', data);
        Alert.alert('Error', 'No se pudo asignar el reto del día');
      }
    } catch (error) {
      console.error('❌ Error asignando reto:', error);
      Alert.alert('Error', 'No se pudo asignar el reto del día: ' + error.message);
    }
  };

  const updateChallengeStatus = async (challengeId, status) => {
    try {
      console.log('🔄 Actualizando estado del reto:', { challengeId, status });
      
      const response = await fetch(`https://31.220.50.7/speech-challenges/${challengeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      console.log('📨 Respuesta de actualización:', data);
      
      if (data.success) {
        let message = '';
        if (status === 'completed') {
          message = '¡Felicidades! Has completado el reto del día.';
        } else if (status === 'in_progress') {
          message = 'Reto marcado como en progreso. ¡Tú puedes!';
        } else if (status === 'skipped') {
          message = 'Reto saltado. Puedes intentarlo de nuevo mañana.';
        }
        
        Alert.alert('✅ Éxito', message);
        await loadChallenges(userId);
      }
    } catch (error) {
      console.error('❌ Error actualizando reto:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Baja': return '#6B8A47';
      case 'Media': return '#F6C915';
      case 'Alta': return '#FF6B6B';
      default: return '#6B8A47';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#6B8A47';
      case 'in_progress': return '#F6C915';
      case 'pending': return '#CCCCCC';
      default: return '#CCCCCC';
    }
  };

  const getLevelInfo = (level) => {
    switch (level) {
      case 1: return { name: 'Romper el Hielo', color: '#A7C584' };
      case 2: return { name: 'Interacciones Breves', color: '#F6C915' };
      case 3: return { name: 'Compromiso Largo', color: '#FF6B6B' };
      default: return { name: 'Nivel ' + level, color: '#6B8A47' };
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChallenges(userId).finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando tus retos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F6F9F5', '#EAE3C0']}
        style={styles.gradient}
      >
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
              <Text style={styles.title}>Retos de Habla</Text>
              <Text style={styles.subtitle}>Supera tus miedos con desafíos graduales</Text>
              
              {todayChallenge && (
                <View style={styles.todayChallengeBadge}>
                  <MaterialIcons name="today" size={20} color="#fff" />
                  <Text style={styles.todayChallengeText}>
                    {todayChallenge.status === 'completed' ? 'Reto Completado' : 
                     todayChallenge.status === 'in_progress' ? 'Reto en Progreso' : 'Reto del Día'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Reto del Día */}
          <Animated.View style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>Reto del Día</Text>
            
            {todayChallenge ? (
              <View style={styles.todayChallengeCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F6F9F5']}
                  style={styles.challengeGradient}
                >
                  <View style={styles.challengeHeader}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>Nivel {todayChallenge.challenge_level}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(todayChallenge.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(todayChallenge.status) }]}>
                        {todayChallenge.status === 'completed' ? 'Completado' : 
                         todayChallenge.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.challengeTitle}>{todayChallenge.challenge_title}</Text>
                  <Text style={styles.challengeDescription}>{todayChallenge.challenge_description}</Text>
                  
                  <View style={styles.challengeFooter}>
                    <View style={styles.difficultyBadge}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor('Media') }]}>
                        Media
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      Asignado: {new Date(todayChallenge.assigned_date).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    {todayChallenge.status === 'pending' && (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={() => updateChallengeStatus(todayChallenge.id, 'in_progress')}
                      >
                        <MaterialIcons name="play-arrow" size={20} color="#fff" />
                        <Text style={styles.primaryButtonText}>Comenzar</Text>
                      </TouchableOpacity>
                    )}
                    
                    {todayChallenge.status === 'in_progress' && (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.successButton]}
                        onPress={() => updateChallengeStatus(todayChallenge.id, 'completed')}
                      >
                        <MaterialIcons name="check" size={20} color="#fff" />
                        <Text style={styles.successButtonText}>Completar</Text>
                      </TouchableOpacity>
                    )}
                    
                    {todayChallenge.status === 'completed' && (
                      <View style={styles.completedMessage}>
                        <MaterialIcons name="celebration" size={24} color="#6B8A47" />
                        <Text style={styles.completedMessageText}>¡Reto completado!</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.secondaryButton]}
                      onPress={() => {
                        Alert.alert(
                          '¿Necesitas ayuda?',
                          'Recuerda: La clave es la exposición gradual. Si te sientes incómodo, puedes saltar este reto y intentarlo mañana.',
                          [
                            { text: 'Entendido' },
                            { 
                              text: 'Saltar Reto', 
                              style: 'destructive',
                              onPress: () => updateChallengeStatus(todayChallenge.id, 'skipped')
                            }
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="help" size={20} color="#6B8A47" />
                      <Text style={styles.secondaryButtonText}>Ayuda</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.emptyChallengeCard}>
                <MaterialIcons name="assignment" size={48} color="#CCCCCC" />
                <Text style={styles.emptyChallengeText}>No hay reto asignado para hoy</Text>
                <Text style={styles.emptyChallengeSubtext}>
                  Un nuevo reto se asignará automáticamente mañana
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Historial de Retos */}
          <Animated.View style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>Tu Progreso</Text>
            
            {challenges.filter(c => c.id !== todayChallenge?.id).length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>Aún no has completado retos</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {challenges
                  .filter(c => c.id !== todayChallenge?.id)
                  .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date)) // Ordenar por fecha más reciente
                  .map((challenge, index) => {
                    const levelInfo = getLevelInfo(challenge.challenge_level);
                    return (
                      <View key={challenge.id} style={styles.historyCard}>
                        <LinearGradient
                          colors={['#FFFFFF', '#F6F9F5']}
                          style={styles.historyGradient}
                        >
                          <View style={styles.historyHeader}>
                            <View style={[styles.historyLevel, { backgroundColor: levelInfo.color }]}>
                              <Text style={styles.historyLevelText}>Nvl {challenge.challenge_level}</Text>
                            </View>
                            <Text style={[styles.historyStatus, { color: getStatusColor(challenge.status) }]}>
                              {challenge.status === 'completed' ? '✅' : 
                               challenge.status === 'in_progress' ? '🔄' : '⏳'}
                            </Text>
                          </View>
                          
                          <Text style={styles.historyTitle}>{challenge.challenge_title}</Text>
                          <Text style={styles.historyDate}>
                            {new Date(challenge.assigned_date).toLocaleDateString('es-ES')}
                          </Text>
                          
                          {challenge.completed_date && (
                            <Text style={styles.completedDate}>
                              Completado: {new Date(challenge.completed_date).toLocaleDateString('es-ES')}
                            </Text>
                          )}
                        </LinearGradient>
                      </View>
                    );
                  })}
              </View>
            )}
          </Animated.View>

          {/* Información de Niveles */}
          <Animated.View style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>Sistema de Niveles</Text>
            
            <View style={styles.levelsContainer}>
              <View style={styles.levelInfo}>
                <View style={[styles.levelDot, { backgroundColor: '#A7C584' }]} />
                <View style={styles.levelTextContainer}>
                  <Text style={styles.levelName}>Nivel 1: Romper el Hielo</Text>
                  <Text style={styles.levelDescription}>
                    Enfocados en la no-verbalidad y pequeñas interacciones
                  </Text>
                </View>
              </View>
              
              <View style={styles.levelInfo}>
                <View style={[styles.levelDot, { backgroundColor: '#F6C915' }]} />
                <View style={styles.levelTextContainer}>
                  <Text style={styles.levelName}>Nivel 2: Interacciones Breves</Text>
                  <Text style={styles.levelDescription}>
                    Interacciones verbales con objetivo específico
                  </Text>
                </View>
              </View>
              
              <View style={styles.levelInfo}>
                <View style={[styles.levelDot, { backgroundColor: '#FF6B6B' }]} />
                <View style={styles.levelTextContainer}>
                  <Text style={styles.levelName}>Nivel 3: Compromiso Largo</Text>
                  <Text style={styles.levelDescription}>
                    Entornos controlados para práctica regular
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
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
    fontSize: 16,
    color: '#6B8A47',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  todayChallengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  todayChallengeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
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
  todayChallengeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
  },
  challengeGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#6B8A47',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelBadge: {
    backgroundColor: '#6B8A47',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 10,
  },
  challengeDescription: {
    fontSize: 16,
    color: '#2D3B1E',
    lineHeight: 22,
    marginBottom: 15,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(107, 138, 71, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#6B8A47',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#6B8A47',
  },
  successButton: {
    backgroundColor: '#6B8A47',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B8A47',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  secondaryButtonText: {
    color: '#6B8A47',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  completedMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  completedMessageText: {
    color: '#6B8A47',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyChallengeCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#EAE3C0',
    borderStyle: 'dashed',
  },
  emptyChallengeText: {
    fontSize: 16,
    color: '#6B8A47',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  emptyChallengeSubtext: {
    fontSize: 14,
    color: '#6B8A47',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#6B8A47',
    textAlign: 'center',
  },
  historyList: {
    marginTop: 10,
  },
  historyCard: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  historyGradient: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyLevel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  historyLevelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 5,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B8A47',
  },
  completedDate: {
    fontSize: 11,
    color: '#6B8A47',
    fontStyle: 'italic',
    marginTop: 5,
  },
  levelsContainer: {
    marginTop: 10,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAE3C0',
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3B1E',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 12,
    color: '#6B8A47',
    lineHeight: 16,
  },
});

export default SpeechChallengesScreen;