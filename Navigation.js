
import React from 'react'; 
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './components/screens/LoginScreen';
import WelcomeScreen from './components/screens/WelcomeScreen';
import RegisterScreen from './components/screens/RegisterScreen';
import HomeScreen from './components/screens/HomeScreen';
import RespirationScreen from './components/screens/RespirationScreen';
import PausesScreen from './components/screens/PausesScreen';
import ParaphraseScreen from './components/screens/ParaphraseScreen';
import VocalExercisesScreen from './components/screens/VocalExercisesScreen';
import ProgressScreen from './components/screens/ProgressScreen';
import SpeechChallengesScreen from './components/screens/SpeechChallengesScreen';
import SpeechRecordingScreen from './components/screens/SpeechRecordingScreen';
import SelfMasteryTipsScreen from './components/screens/SelfMasteryTipsScreen';
import ListeningScreen from './components/screens/ListeningScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: '#000'
          }
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Respiration" 
          component={RespirationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Pauses" 
          component={PausesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Paraphrase" 
          component={ParaphraseScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VocalExercises" 
          component={VocalExercisesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Progress" 
          component={ProgressScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SpeechChallenges" 
          component={SpeechChallengesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SpeechRecording" 
          component={SpeechRecordingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SelfMasteryTips" 
          component={SelfMasteryTipsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Listening" 
          component={ListeningScreen}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
