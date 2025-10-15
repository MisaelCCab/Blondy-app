import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CustomInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType, 
  autoCapitalize,
  icon 
}) => {
  return (
    <View style={styles.container}>
      {icon && (
        <MaterialIcons 
          name={icon} 
          size={20} 
          color="#6B8A47" // Verde oscuro para los iconos
          style={styles.icon} 
        />
      )}
      <TextInput
        style={[styles.input, icon && styles.inputWithIcon]}
        placeholder={placeholder}
        placeholderTextColor="#A7C584" // Verde claro para placeholder
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F9F5', // Fondo claro
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: '#A7C584', // Borde verde claro
    shadowColor: '#6B8A47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#2D3B1E', // Texto oscuro
    paddingVertical: 15,
    fontSize: 16,
  },
  inputWithIcon: {
    marginLeft: 5,
  },
});

export default CustomInput;