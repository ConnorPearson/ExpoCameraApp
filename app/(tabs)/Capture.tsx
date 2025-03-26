import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TouchableOpacity, View, Alert, TouchableWithoutFeedback } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';

export default function App() {
  const [facing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [quality, setQuality] = useState<'UHD' | 'HD' | 'SD'>('HD'); // Default to HD
  const [isProcessing, setIsProcessing] = useState(false); // Controls loading state

  // Fetch image quality setting when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadQualityPreference = async () => {
        const savedQuality = await AsyncStorage.getItem('imageQuality');
        if (savedQuality === 'UHD' || savedQuality === 'HD' || savedQuality === 'SD') {
          setQuality(savedQuality);
        }
      };
      loadQualityPreference();
    }, [])
  );

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  async function captureImage() {
    if (!cameraRef || isProcessing) return;

    setIsProcessing(true); // Start loading

    try {
      const photo = await cameraRef.takePictureAsync();

      // Set resolution based on the stored quality setting
      const targetHeight =
        quality === 'UHD' ? 2048 :
        quality === 'HD' ? 1080 :
        480; // SD

      const aspectRatio = photo.width / photo.height;
      const targetWidth = Math.round(targetHeight * aspectRatio);

      const resizedImage = await ImageManipulator.manipulateAsync(
        photo.uri, 
        [{ resize: { width: targetWidth, height: targetHeight } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileName = `photo_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({ from: resizedImage.uri, to: fileUri });

      Alert.alert('Success', `Image saved (${quality} - ${targetWidth}x${targetHeight})!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save the image.');
      console.error(error);
    }

    setIsProcessing(false); // Stop loading
  }

  return (
    <TouchableWithoutFeedback disabled={!isProcessing} style={styles.blockTouches}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.buttonContainer}>
            {/* Show spinner while processing */}
            {isProcessing ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.captureButton, isProcessing && styles.disabledButton]} 
                  onPress={captureImage}
                  disabled={isProcessing} // Disable button while processing
                >
                  <View style={styles.innerCircle} />
                </TouchableOpacity>
                <Text style={styles.captureText}>Capture</Text>
              </>
            )}
          </View>
        </CameraView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  blockTouches: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'black',
  },
  innerCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'red',
  },
  captureText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5, // Dim the button while processing
  },
});
