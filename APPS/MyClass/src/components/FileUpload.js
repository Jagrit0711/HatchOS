import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToServer } from '../utils/fileUpload';
import { getCurrentUser } from '../services/api';

const FileUpload = ({ onFileSelected, selectedFile, label = "Upload File" }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      
      // Get current user
      const user = await getCurrentUser();
      
      // Upload file to server
      const uploadedFile = await uploadFileToServer(file, user._id);
      
      console.log('File uploaded successfully:', uploadedFile);
      
      // Call the callback with the REAL server URL
      onFileSelected({
        uri: uploadedFile.fileUrl,
        name: uploadedFile.fileName,
        size: uploadedFile.fileSize,
      });
      
      // Set thumbnail if it's an image
      if (file.mimeType?.startsWith('image/') || file.type?.startsWith('image/')) {
        setThumbnail(uploadedFile.fileUrl);
      } else {
        setThumbnail(null);
      }
      
      setUploading(false);
      Alert.alert('Success', 'File uploaded successfully!');
    } catch (error) {
      setUploading(false);
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload file');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await handleFileUpload(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await handleFileUpload(file);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return 'cloud-upload-outline';
    
    const name = selectedFile.name?.toLowerCase() || '';
    if (name.endsWith('.pdf')) return 'document-text';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'easel';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'grid';
    if (name.endsWith('.zip') || name.endsWith('.rar')) return 'folder';
    if (selectedFile.mimeType?.startsWith('image/')) return 'image';
    if (selectedFile.mimeType?.startsWith('video/')) return 'videocam';
    return 'document-attach';
  };

  const getFileColor = () => {
    if (!selectedFile) return '#667eea';
    
    const name = selectedFile.name?.toLowerCase() || '';
    if (name.endsWith('.pdf')) return '#e74c3c';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return '#3498db';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return '#e67e22';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return '#27ae60';
    if (selectedFile.mimeType?.startsWith('image/')) return '#9b59b6';
    if (selectedFile.mimeType?.startsWith('video/')) return '#1abc9c';
    return '#667eea';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {uploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.uploadingText}>Uploading file...</Text>
        </View>
      ) : (
        <>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="document-attach" size={20} color="#667eea" />
              <Text style={styles.buttonText}>Document</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="image" size={20} color="#667eea" />
              <Text style={styles.buttonText}>Image</Text>
            </TouchableOpacity>
          </View>

          {selectedFile && (
            <View style={styles.filePreview}>
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: getFileColor() + '20' }]}>
                  <Ionicons name={getFileIcon()} size={32} color={getFileColor()} />
                </View>
              )}
              
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => {
                  onFileSelected(null);
                  setThumbnail(null);
                }}
              >
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    padding: 4,
  },
});

export default FileUpload;
