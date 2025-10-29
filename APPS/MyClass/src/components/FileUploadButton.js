import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const FileUploadButton = ({ onFileSelected, selectedFile }) => {
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        onFileSelected(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
        <Ionicons name="cloud-upload-outline" size={24} color="#667eea" />
        <Text style={styles.uploadText}>
          {selectedFile ? 'Change File' : 'Upload File'}
        </Text>
      </TouchableOpacity>
      {selectedFile && (
        <View style={styles.fileInfo}>
          <Ionicons name="document-attach" size={16} color="#667eea" />
          <Text style={styles.fileName} numberOfLines={1}>
            {selectedFile.name}
          </Text>
          <Text style={styles.fileSize}>
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#667eea10',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    gap: 10,
  },
  uploadText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
});

export default FileUploadButton;
