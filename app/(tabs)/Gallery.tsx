import { useState, useCallback, useEffect } from 'react';
import { FlatList, Image, StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from 'react-native-vector-icons'; // Import Ionicons for icons

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<{ uri: string; width: number; height: number; size: string }[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [postType, setPostType] = useState<'base64' | 'multipart'>('base64');  // Add postType state
  const { width } = useWindowDimensions();
  const margin = 5;
  const columnCount = Math.max(2, Math.floor(width / 120));

  // Calculate tile size ensuring no overflow
  const tileSize = Math.floor((width - margin * (columnCount + 1)) / columnCount);

  // Fetch the post type from AsyncStorage whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchPostType = async () => {
        try {
          const savedPostType = await AsyncStorage.getItem('imagePostType');
          if (savedPostType) {
            setPostType(savedPostType as 'base64' | 'multipart');  // Update post type state
          }
        } catch (error) {
          console.error('Error fetching post type from AsyncStorage', error);
        }
      };
      fetchPostType(); // Fetch post type when the screen is focused
    }, []) // Empty dependency array ensures it only runs when the screen is focused
  );

  const fetchPhotos = async () => {
    try {
      const photoFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const imageFiles = photoFiles.filter(file => file.endsWith('.jpg'));
      const photoURIs = imageFiles.map(file => FileSystem.documentDirectory + file);

      const photoData = await Promise.all(
        photoURIs.map(async (uri) => {
          return new Promise<{ uri: string; width: number; height: number; size: string }>(resolve => {
            Image.getSize(uri, async (width, height) => {
              const fileInfo = await FileSystem.getInfoAsync(uri);
              const sizeInKB = fileInfo.exists ? fileInfo.size / 1024 : 0;
              const sizeFormatted = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${Math.round(sizeInKB)} KB`;

              resolve({ uri, width, height, size: sizeFormatted });
            }, () => resolve({ uri, width: 0, height: 0, size: '0 KB' }));
          });
        })
      );

      setPhotos(photoData);
    } catch (error) {
      console.error('Error reading photos:', error);
    }
  };

  // Use focus effect to load images when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
      const intervalId = setInterval(fetchPhotos, 5000); // Poll every 5 seconds for new images

      return () => clearInterval(intervalId); // Cleanup interval when leaving the screen
    }, [])
  );

  const toggleSelection = (uri: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uri)) {
        newSet.delete(uri);
      } else {
        newSet.add(uri);
      }
      return newSet;
    });
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) {
      Alert.alert("No Selection", "Please select at least one image to delete.");
      return;
    }

    Alert.alert("Delete Images?", "Are you sure you want to delete the selected images?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          for (const uri of selectedPhotos) {
            try {
              await FileSystem.deleteAsync(uri);
            } catch (error) {
              console.error(`Failed to delete ${uri}`, error);
            }
          }
          setSelectedPhotos(new Set());
          fetchPhotos();
        },
      },
    ]);
  };

  const postSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) {
      Alert.alert("No Selection", "Please select at least one image to post.");
      return;
    }
  
    const apiUrl = await AsyncStorage.getItem('apiUrl');
    console.log("API URL: ", apiUrl);  // Log the API URL
  
    if (!apiUrl) {
      Alert.alert("API URL Missing", "Please configure the API URL in settings.");
      return;
    }
  
    if (postType === 'base64') {
      // Handle base64 upload
      const images = [];
  
      for (const uri of selectedPhotos) {
        try {
          const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          images.push({ uri, base64: `data:image/jpeg;base64,${base64Data}` });
        } catch (error) {
          console.error('Error converting image to base64:', error);
          Alert.alert("Error", "There was an error converting the image to base64.");
          return;
        }
      }
  
      const payload = { images };
  
      try {
        const response = await fetch(`${apiUrl}/upload/base64`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
  
        if (response.ok) {
          Alert.alert("Success", "Images posted successfully!");
          setSelectedPhotos(new Set());
          fetchPhotos(); // Refresh the gallery after posting
        } else {
          const errorMessage = await response.text();
          throw new Error(`Failed to post images. Response: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error posting images:', error);
        Alert.alert("Error", `There was an error posting the images. ${error}`);
      }
    } else if (postType === 'multipart') {
      // Handle multipart upload
      const formData = new FormData();
  
      for (const uri of selectedPhotos) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const file = {
          uri,
          name: fileInfo.uri.split('/').pop(), // Get the file name
          type: 'image/jpeg', // Assuming the images are JPEGs
        };
        formData.append('images[]', file);  // Make sure the field name is images[]
      }
  
      try {
        const response = await fetch(`${apiUrl}/upload/multipart`, {
          method: 'POST',
          body: formData,
        });
  
        if (response.ok) {
          Alert.alert("Success", "Images posted successfully!");
          setSelectedPhotos(new Set());
          fetchPhotos(); // Refresh the gallery after posting
        } else {
          const errorMessage = await response.text();
          throw new Error(`Failed to post images. Response: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error posting images:', error);
        Alert.alert("Error", `There was an error posting the images. ${error}`);
      }
    }
  };
  
  

  const renderItem = ({ item }: { item: { uri: string; width: number; height: number; size: string } }) => {
    const isSelected = selectedPhotos.has(item.uri);

    return (
      <TouchableOpacity
        onLongPress={() => toggleSelection(item.uri)}
        onPress={() => toggleSelection(item.uri)}
        style={[
          styles.imageContainer,
          { width: tileSize, height: tileSize, borderColor: isSelected ? "red" : "transparent", borderWidth: isSelected ? 3 : 0 }
        ]}
      >
        <Image source={{ uri: item.uri }} style={styles.image} />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{item.width} x {item.height}</Text>
          <Text style={styles.overlayTextRight}>{item.size}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Check if images are selected
  const isSelected = selectedPhotos.size > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isSelected ? 'red' : 'gray' }]} 
          onPress={deleteSelectedPhotos} 
          disabled={!isSelected}
        >
          <Ionicons name="trash-bin" size={20} color="white" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isSelected ? 'blue' : 'gray' }]} 
          onPress={postSelectedPhotos} 
          disabled={!isSelected}
        >
          <Ionicons name="paper-plane" size={20} color="white" />
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={columnCount}
        contentContainerStyle={styles.gallery}
        style={{ paddingHorizontal: margin }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 10,
  },
  gallery: {
    padding: 5,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    width: 120,
  },
  buttonText: {
    marginLeft: 5,
    color: 'white',
    fontWeight: 'bold',
  },
  imageContainer: {
    padding: 4,
    position: 'relative',
    borderRadius: 8,
  },
  image: {
    flex: 1,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  overlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlayTextRight: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});
