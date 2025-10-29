import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, Video } from 'expo-av';
import { AuthContext } from '../context/AuthContext';
import { groupAPI, uploadFile, SERVER_URL } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function GroupChatScreen({ route, navigation }) {
  const { group } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [groupInfo, setGroupInfo] = useState(group);
  const [memberDetails, setMemberDetails] = useState({}); // Cache for member names
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageList, setImageList] = useState([]);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ 
      title: group.name,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupSettings', { group: groupInfo })}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
    loadMessages();
    loadGroupInfo();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [groupInfo]);

  const loadGroupInfo = async () => {
    try {
      const response = await groupAPI.getGroup(group.id);
      const groupData = response.data;
      setGroupInfo(groupData);
      
      // Fetch member details
      const { userAPI } = require('../services/api');
      const members = {};
      for (const memberId of groupData.members || []) {
        try {
          const userResponse = await userAPI.getUser(memberId);
          members[memberId] = userResponse.data.name;
        } catch (err) {
          members[memberId] = 'Unknown User';
        }
      }
      setMemberDetails(members);
    } catch (error) {
      console.error('Error loading group info:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await groupAPI.getGroupMessages(group.id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (type = 'text', content = '', fileData = null) => {
    if (type === 'text' && !content.trim()) return;

    const messageData = {
      sender_id: user.id,
      group_id: group.id,
      type,
      content: content.trim(),
      ...(fileData && {
        file_url: fileData.file_url,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
      }),
    };

    try {
      const { messageAPI } = require('../services/api');
      const response = await messageAPI.sendMessage(messageData);
      setMessages([...messages, response.data.data]);
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      if (error.response?.data?.error) {
        Alert.alert('Message Blocked', error.response.data.error);
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    }
  };

  const handleSend = () => {
    sendMessage('text', inputText);
  };

  const handleImagePress = (imageUrl) => {
    const images = messages
      .filter(msg => msg.type === 'image')
      .map(msg => ({ uri: `${SERVER_URL}${msg.file_url}` }));
    const index = images.findIndex(img => img.uri === `${SERVER_URL}${imageUrl}`);
    setImageList(images);
    setCurrentImageIndex(index >= 0 ? index : 0);
    setImageViewerVisible(true);
  };

  const handleVideoPress = (videoUrl) => {
    setCurrentVideoUrl(`${SERVER_URL}${videoUrl}`);
    setVideoModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadAndSend('image', result.assets[0].uri);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!result.canceled) {
      await uploadAndSend('video', result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      await uploadAndSend('file', result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need microphone permissions');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await uploadAndSend('audio', uri);
    }
  };

  const uploadAndSend = async (type, fileUri) => {
    try {
      Alert.alert('Uploading', 'Please wait...');
      const fileData = await uploadFile(fileUri, user.id);
      await sendMessage(type, '', fileData);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Could not upload file');
    }
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Share',
      'Choose what to share',
      [
        { text: 'Image', onPress: pickImage },
        { text: 'Video', onPress: pickVideo },
        { text: 'Document', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (senderId) => {
    if (senderId === user.id) return 'You';
    return memberDetails[senderId] || 'Member';
  };

  const renderMessage = ({ item }) => {
    const isMine = item.sender_id === user.id;

    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        {!isMine && (
          <Text style={styles.senderName}>{getSenderName(item.sender_id)}</Text>
        )}
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          {item.type === 'text' && (
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {item.content}
            </Text>
          )}
          {item.type === 'image' && (
            <TouchableOpacity onPress={() => handleImagePress(item.file_url)}>
              <Image
                source={{ uri: `${SERVER_URL}${item.file_url}` }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                📷 {item.file_name}
              </Text>
            </TouchableOpacity>
          )}
          {item.type === 'video' && (
            <TouchableOpacity onPress={() => handleVideoPress(item.file_url)}>
              <View style={styles.videoThumbnail}>
                <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                🎥 {item.file_name}
              </Text>
            </TouchableOpacity>
          )}
          {(item.type === 'audio' || item.type === 'file') && (
            <View>
              <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                {item.type === 'audio' ? '🎵' : '📎'} {item.file_name}
              </Text>
              <Text style={[styles.fileSize, isMine && styles.myMessageText]}>
                {(item.file_size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          )}
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupDetails}>
          {groupInfo.members?.length || 0} members • {groupInfo.type}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={showAttachmentOptions}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>

        {isRecording ? (
          <TouchableOpacity style={styles.recordingButton} onPress={stopRecording}>
            <Text style={styles.recordingText}>🔴 Recording... Tap to stop</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.voiceButton} onPress={startRecording}>
              <Text style={styles.voiceIcon}>🎤</Text>
            </TouchableOpacity>
          </>
        )}

        {inputText.trim() !== '' && (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerClose}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {imageList[currentImageIndex] && (
            <Image
              source={{ uri: imageList[currentImageIndex].uri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={styles.videoModalContainer}>
          <TouchableOpacity 
            style={styles.videoModalClose}
            onPress={() => setVideoModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          {currentVideoUrl && (
            <Video
              source={{ uri: currentVideoUrl }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  groupInfo: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  groupDetails: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#075E54',
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 60,
  },
  myBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  myMessageText: {
    color: '#000',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  attachIcon: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  voiceButton: {
    padding: 8,
    marginLeft: 4,
  },
  voiceIcon: {
    fontSize: 24,
  },
  recordingButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginRight: 4,
  },
  recordingText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendIcon: {
    fontSize: 20,
    color: '#fff',
  },
  videoThumbnail: {
    width: 250,
    height: 140,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 5,
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  videoPlayer: {
    width: width,
    height: height * 0.6,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
});
