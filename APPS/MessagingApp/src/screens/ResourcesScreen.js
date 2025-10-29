import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { messageAPI, SERVER_URL } from '../services/api';

export default function ResourcesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, images, videos, documents

  useEffect(() => {
    if (user) {
      loadResources();
    }
  }, [user, filter]);

  const loadResources = async () => {
    try {
      // Get all messages with files from user's conversations
      const convResponse = await messageAPI.getConversations(user.id);
      const conversations = convResponse.data;
      
      let allFiles = [];
      
      // Extract files from all conversations
      for (const conv of conversations) {
        const messagesResponse = conv.type === 'direct'
          ? await messageAPI.getDirectMessages(user.id, conv.partner.id)
          : await messageAPI.getGroupMessages(conv.group.id);
        
        const messages = messagesResponse.data;
        
        // Filter messages that have files (type is not 'text')
        const filesInConv = messages
          .filter(msg => msg.type !== 'text' && msg.file_url)
          .map(msg => ({
            id: msg.id,
            url: msg.file_url,
            name: msg.file_name,
            size: msg.file_size,
            type: msg.type, // 'image', 'video', 'audio', 'file'
            messageId: msg.id,
            sender: conv.type === 'direct' ? 
              (msg.sender_id === user.id ? 'You' : conv.partner.name) : 
              'Unknown',
            conversationName: conv.type === 'direct' ? conv.partner.name : conv.group.name,
            conversationType: conv.type,
            timestamp: msg.timestamp,
          }));
        
        allFiles = [...allFiles, ...filesInConv];
      }

      // Filter by type if needed
      if (filter !== 'all') {
        allFiles = allFiles.filter(file => {
          if (filter === 'images') return file.type === 'image';
          if (filter === 'videos') return file.type === 'video';
          if (filter === 'documents') return file.type === 'file' || file.type === 'audio';
          return true;
        });
      }

      // Sort by timestamp (newest first)
      allFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setResources(allFiles);
    } catch (error) {
      console.error('Error loading resources:', error);
      Alert.alert('Error', 'Failed to load resources');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'image') return 'image';
    if (fileType === 'video') return 'videocam';
    if (fileType === 'audio') return 'musical-notes';
    return 'document';
  };

  const getFileColor = (fileType) => {
    if (fileType === 'image') return '#FF6B6B';
    if (fileType === 'video') return '#4ECDC4';
    if (fileType === 'audio') return '#95E1D3';
    return '#FFA07A';
  };

  const handleFilePress = (file) => {
    const fileUrl = `${SERVER_URL}${file.url}`;
    Linking.openURL(fileUrl).catch(() => {
      Alert.alert('Error', 'Cannot open file');
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderResource = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={index * 50}
      style={styles.resourceCard}
    >
      <TouchableOpacity 
        style={styles.resourceContent}
        onPress={() => handleFilePress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: getFileColor(item.type) }]}>
          <Ionicons name={getFileIcon(item.type)} size={24} color="#fff" />
        </View>
        
        <View style={styles.resourceInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resourceMeta}>
            {formatFileSize(item.size)} • {formatDate(item.timestamp)}
          </Text>
          <Text style={styles.resourceSource}>
            From: {item.conversationName}
          </Text>
          <Text style={styles.resourceSender}>
            By: {item.sender}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    </Animatable.View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <Ionicons name="folder-open" size={28} color="#fff" style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.headerTitle}>Resources</Text>
          <Text style={styles.headerSubtitle}>All shared files and media</Text>
        </View>
      </Animatable.View>

      <View style={styles.filterContainer}>
        {['all', 'images', 'videos', 'documents'].map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.filterTextActive
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {resources.length === 0 ? (
        <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No resources yet</Text>
          <Text style={styles.emptySubtext}>
            Files shared in your chats will appear here
          </Text>
        </Animatable.View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResource}
          keyExtractor={(item, index) => `${item.messageId}-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#075E54',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#25D366',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resourceInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resourceMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  resourceSource: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  resourceSender: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
