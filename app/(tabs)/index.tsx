import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Button, View, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadioButton } from 'react-native-paper'; // Import from react-native-paper

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [imageQuality, setImageQuality] = useState('HD'); // Default to HD
  const [imagePostType, setImagePostType] = useState('multipart'); // Default to multipart

  useEffect(() => {
    // Load saved URL, image quality, and image post type from AsyncStorage when the component mounts
    const loadSettings = async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('apiUrl');
        const savedImageQuality = await AsyncStorage.getItem('imageQuality');
        const savedImagePostType = await AsyncStorage.getItem('imagePostType');

        if (savedUrl) {
          setUrl(savedUrl);
        }
        if (savedImageQuality) {
          setImageQuality(savedImageQuality);
        }
        if (savedImagePostType) {
          setImagePostType(savedImagePostType);
        }
      } catch (error) {
        console.error('Error loading settings from AsyncStorage', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveUrl = async () => {
    try {
      await AsyncStorage.setItem('apiUrl', url);
      Alert.alert('Success', 'API URL saved successfully');
    } catch (error) {
      console.error('Error saving URL to AsyncStorage', error);
    }
  };

  const handleImageQualityChange = async (quality) => {
    setImageQuality(quality); // Update state
    try {
      await AsyncStorage.setItem('imageQuality', quality); // Save to AsyncStorage immediately
    } catch (error) {
      console.error('Error saving image quality to AsyncStorage', error);
    }
  };

  const handleImagePostTypeChange = async (type) => {
    setImagePostType(type); // Update state
    try {
      await AsyncStorage.setItem('imagePostType', type); // Save to AsyncStorage immediately
    } catch (error) {
      console.error('Error saving image post type to AsyncStorage', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Settings</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter API URL"
          placeholderTextColor="#ccc"
        />
        <Button title="Save URL" onPress={handleSaveUrl} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Image Quality</Text>
        <View style={styles.radioGroup}>
          {['UHD', 'HD', 'SD'].map((quality) => (
            <View key={quality} style={styles.radioOption}>
              <RadioButton
                value={quality}
                status={imageQuality === quality ? 'checked' : 'unchecked'}
                onPress={() => handleImageQualityChange(quality)} // Save immediately on selection
              />
              <Text style={styles.radioText}>{quality}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Image Post Type</Text>
        <View style={styles.radioGroup}>
          {['multipart', 'base64'].map((type) => (
            <View key={type} style={styles.radioOption}>
              <RadioButton
                value={type}
                status={imagePostType === type ? 'checked' : 'unchecked'}
                onPress={() => handleImagePostTypeChange(type)} // Save immediately on selection
              />
              <Text style={styles.radioText}>
                {type === 'multipart' ? 'Multipart Transfer' : 'Base64 Post'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'black', // Black background for the settings page
  },
  section: {
    marginBottom: 30, // Space between sections
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    color: 'white', // White text color for the input field
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioText: {
    color: 'white',
    marginLeft: 10,
  },
});
