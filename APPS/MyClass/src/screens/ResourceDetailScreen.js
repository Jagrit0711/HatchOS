import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getFileUrl } from '../utils/fileUpload';

const ResourceDetailScreen = ({ route, navigation }) => {
  const { resource } = route.params;
  
  console.log('Resource data:', resource);
  
  // Support both new (fileName/fileUri) and old (url) formats
  // Check for non-empty values
  const hasFile = !!(
    (resource.fileName && resource.fileName.trim()) || 
    (resource.fileUri && resource.fileUri.trim()) || 
    (resource.url && resource.url.trim())
  );
  const displayUri = getFileUrl(resource.fileUri) || resource.url;
  const displayName = resource.fileName || (resource.url ? 'Link' : 'File');
  const isImage = displayName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
  
  console.log('File check:', {
    hasFile,
    fileName: resource.fileName,
    fileUri: resource.fileUri,
    url: resource.url,
    displayUri,
    displayName,
    isImage
  });

  const handleOpenFile = () => {
    const fileUrl = displayUri;
    if (fileUrl) {
      Linking.openURL(fileUrl);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resource</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{resource.title}</Text>
          {resource.description && (
            <Text style={styles.description}>{resource.description}</Text>
          )}
        </View>

        {/* File/Link Section */}
        <View style={styles.attachmentSection}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          
          {hasFile ? (
            <TouchableOpacity 
              style={styles.attachmentCard}
              onPress={handleOpenFile}
              activeOpacity={0.7}
            >
              {isImage && displayUri ? (
                <View style={styles.imageThumbnailContainer}>
                  <Image 
                    source={{ uri: displayUri }} 
                    style={styles.imageThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="eye-outline" size={32} color="#fff" />
                    <Text style={styles.overlayText}>Tap to view full image</Text>
                  </View>
                </View>
              ) : resource.url ? (
                <View style={styles.documentThumbnail}>
                  <Ionicons name="link" size={64} color="#667eea" />
                  <Text style={styles.documentText}>Tap to open link</Text>
                </View>
              ) : (
                <View style={styles.documentThumbnail}>
                  <Ionicons name="document-text" size={64} color="#667eea" />
                  <Text style={styles.documentText}>Tap to open document</Text>
                </View>
              )}
              
              <View style={styles.fileInfo}>
                <View style={styles.fileInfoRow}>
                  <Ionicons name="attach" size={18} color="#333" />
                  <Text style={styles.fileName}>{displayName}</Text>
                </View>
                {resource.fileSize && (
                  <View style={styles.fileInfoRow}>
                    <Ionicons name="document-outline" size={18} color="#999" />
                    <Text style={styles.fileSize}>
                      {(resource.fileSize / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : resource.url ? (
            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => Linking.openURL(resource.url)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIcon}>
                <Ionicons name="link" size={32} color="#667eea" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>External Link</Text>
                <Text style={styles.linkUrl} numberOfLines={2}>{resource.url}</Text>
              </View>
              <Ionicons name="open-outline" size={24} color="#667eea" />
            </TouchableOpacity>
          ) : (
            <View style={styles.noAttachment}>
              <Ionicons name="folder-open-outline" size={48} color="#ccc" />
              <Text style={styles.noAttachmentText}>No attachments</Text>
            </View>
          )}
        </View>

        {/* Metadata Section */}
        <View style={styles.metadataSection}>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={20} color="#999" />
            <Text style={styles.metadataText}>
              Added {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      {hasFile && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.openButton}
            onPress={handleOpenFile}
          >
            <Ionicons name="open-outline" size={22} color="#fff" />
            <Text style={styles.openButtonText}>Open File</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  attachmentSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  attachmentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  imageThumbnailContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  documentThumbnail: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
  },
  documentText: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 12,
    fontWeight: '600',
  },
  fileInfo: {
    padding: 15,
    backgroundColor: '#fff',
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  fileSize: {
    fontSize: 14,
    color: '#999',
    marginLeft: 10,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#667eea30',
  },
  linkIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  linkContent: {
    flex: 1,
  },
  linkLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  linkUrl: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  noAttachment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noAttachmentText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  metadataSection: {
    backgroundColor: '#fff',
    padding: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  actionBar: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ResourceDetailScreen;
