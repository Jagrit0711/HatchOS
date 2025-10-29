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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { messageAPI, uploadFile, SERVER_URL } from '../services/api';

const { width, height } = Dimensions.get('window');

// Audio Player Component
function AudioPlayer({ fileUrl, fileName, isMine }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const playPauseAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fileUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setDuration(status.durationMillis);
              setPosition(status.positionMillis);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio');
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const formatDuration = (millis) => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioPlayer}>
      <TouchableOpacity onPress={playPauseAudio} style={styles.playButton}>
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color={isMine ? "#fff" : "#075E54"} 
        />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <View style={styles.waveform}>
          <View style={[styles.waveBar, isMine && styles.myWaveBar]} />
          <View style={[styles.waveBar, isMine && styles.myWaveBar]} />
          <View style={[styles.waveBar, isMine && styles.myWaveBar]} />
          <View style={[styles.waveBar, isMine && styles.myWaveBar]} />
          <View style={[styles.waveBar, isMine && styles.myWaveBar]} />
        </View>
        <Text style={[styles.audioDuration, isMine && styles.myMessageText]}>
          {position > 0 ? formatDuration(position) : formatDuration(duration || 0)}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { partner } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageList, setImageList] = useState([]);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: partner.name });
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getDirectMessages(user.id, partner.id);
      setMessages(response.data);
      
      // Mark unread messages as read
      response.data.forEach((msg) => {
        if (msg.receiver_id === user.id && !msg.read) {
          messageAPI.markAsRead(msg.id);
        }
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (type = 'text', content = '', fileData = null) => {
    if (type === 'text' && !content.trim()) return;

    const messageData = {
      sender_id: user.id,
      receiver_id: partner.id,
      type,
      content: content.trim(),
      ...(fileData && {
        file_url: fileData.file_url,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
      }),
    };

    try {
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
    // For web, use HTML file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          await uploadAndSend('image', file, { fileName: file.name, fileSize: file.size });
        }
      };
      input.click();
      return;
    }

    // For mobile
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      await uploadAndSend('image', result.assets[0].uri, result.assets[0]);
    }
  };

  const pickVideo = async () => {
    // For web, use HTML file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          await uploadAndSend('video', file, { fileName: file.name, fileSize: file.size });
        }
      };
      input.click();
      return;
    }

    // For mobile
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      await uploadAndSend('video', result.assets[0].uri, result.assets[0]);
    }
  };

  const pickDocument = async () => {
    // For web, use HTML file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          await uploadAndSend('file', file, { fileName: file.name, fileSize: file.size });
        }
      };
      input.click();
      return;
    }

    // For mobile
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      await uploadAndSend('file', result.assets[0].uri, result.assets[0]);
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
    if (!recording) return;
    
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await uploadAndSend('audio', uri, null);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save voice message');
      setRecording(null);
    }
  };

  const uploadAndSend = async (type, fileUri, fileAsset = null) => {
    try {
      Alert.alert('Uploading', 'Please wait while we upload your file...');
      
      // Use the file asset if available (for better web support)
      const uploadUri = fileAsset?.file || fileUri;
      const fileData = await uploadFile(uploadUri, user.id);
      
      await sendMessage(type, '', fileData);
      Alert.alert('Success', 'File sent successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Could not upload file. Please try again.');
    }
  };

  const showAttachmentOptions = () => {
    console.log('Attachment button clicked!');
    
    // For web, directly show file picker with multiple types
    if (Platform.OS === 'web') {
      console.log('Opening web file picker...');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx,.txt';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('File selected:', file.name, file.type, file.size);
          // Determine file type
          let fileType = 'file';
          if (file.type.startsWith('image/')) {
            fileType = 'image';
          } else if (file.type.startsWith('video/')) {
            fileType = 'video';
          }
          await uploadAndSend(fileType, file, { fileName: file.name, fileSize: file.size });
        }
      };
      input.click();
      return;
    }

    // For mobile, show alert options
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

  const renderMessage = ({ item }) => {
    const isMine = item.sender_id === user.id;

    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
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
              <View style={styles.fileInfo}>
                <Ionicons name="image" size={14} color={isMine ? "#fff" : "#666"} />
                <Text style={[styles.fileName, isMine && styles.myMessageText]}>
                  {item.file_name}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {item.type === 'audio' && (
            <AudioPlayer 
              fileUrl={`${SERVER_URL}${item.file_url}`}
              fileName={item.file_name}
              isMine={isMine}
            />
          )}
          {item.type === 'video' && (
            <TouchableOpacity onPress={() => handleVideoPress(item.file_url)}>
              <View style={styles.videoThumbnail}>
                <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={styles.fileInfo}>
                <Ionicons name="videocam" size={16} color={isMine ? "#fff" : "#666"} />
                <Text style={[styles.fileName, isMine && styles.myMessageText]}>
                  {item.file_name}
                </Text>
              </View>
              <Text style={[styles.fileSize, isMine && styles.myMessageText]}>
                {(item.file_size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </TouchableOpacity>
          )}
          {item.type === 'file' && (
            <View>
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={16} color={isMine ? "#fff" : "#666"} />
                <Text style={[styles.fileName, isMine && styles.myMessageText]}>
                  {item.file_name}
                </Text>
              </View>
              <Text style={[styles.fileSize, isMine && styles.myMessageText]}>
                {(item.file_size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
              {formatTime(item.timestamp)}
            </Text>
            {isMine && (
              <Ionicons 
                name={item.read ? "checkmark-done" : "checkmark"} 
                size={16} 
                color={isMine ? "#B2F5EA" : "#999"}
              />
            )}
          </View>
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
      <View style={styles.partnerInfo}>
        <Text style={styles.partnerStatus}>
          {partner.status === 'online' ? '🟢 Online' : '⚫ Offline'}
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
          <Ionicons name="attach" size={24} color="#666" />
        </TouchableOpacity>

        {isRecording ? (
          <TouchableOpacity style={styles.recordingButton} onPress={stopRecording}>
            <Ionicons name="stop-circle" size={20} color="#FF6B6B" />
            <Text style={styles.recordingText}>Recording... Tap to stop</Text>
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
              <Ionicons name="mic" size={24} color="#666" />
            </TouchableOpacity>
          </>
        )}

        {inputText.trim() !== '' && (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#fff" />
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
  partnerInfo: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  partnerStatus: {
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
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    marginRight: 4,
  },
  myMessageTime: {
    color: '#555',
  },
  messageStatus: {
    fontSize: 12,
    color: '#4FC3F7',
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
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fileName: {
    fontSize: 13,
    color: '#666',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  waveBar: {
    flex: 1,
    backgroundColor: '#CCC',
    borderRadius: 2,
    height: '60%',
  },
  myWaveBar: {
    backgroundColor: '#E0E0E0',
  },
  audioDuration: {
    fontSize: 12,
    color: '#666',
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
