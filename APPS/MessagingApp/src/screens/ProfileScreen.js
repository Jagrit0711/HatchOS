import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { api, uploadFile, SERVER_URL } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await logout();
            // Navigation will be handled by AuthContext
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleSavePhone = async () => {
    if (phone && !/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/users/${user.id}`, { phone });
      if (updateUser) {
        updateUser({ ...user, phone });
      }
      Alert.alert('Success', 'Phone number updated successfully');
      setIsEditingPhone(false);
    } catch (error) {
      console.error('Phone update error:', error);
      Alert.alert('Error', 'Failed to update phone number');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePhotoUpload = async () => {
    try {
      // For web, use HTML file input
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              setUploading(true);
              const fileData = await uploadFile(file, user.id);
              const photoUrl = fileData.file_url;
              
              await api.put(`/users/${user.id}`, { profile_photo: photoUrl });
              if (updateUser) {
                updateUser({ ...user, profile_photo: photoUrl });
              }
              
              Alert.alert('Success', 'Profile photo updated!');
              setUploading(false);
            } catch (error) {
              console.error('Photo upload error:', error);
              Alert.alert('Error', 'Failed to upload photo');
              setUploading(false);
            }
          }
        };
        input.click();
        return;
      }

      // For mobile, use ImagePicker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploading(true);
        const fileData = await uploadFile(result.assets[0].uri, user.id);
        const photoUrl = fileData.file_url;
        
        await api.put(`/users/${user.id}`, { profile_photo: photoUrl });
        if (updateUser) {
          updateUser({ ...user, profile_photo: photoUrl });
        }
        
        Alert.alert('Success', 'Profile photo updated!');
        setUploading(false);
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
      setUploading(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'teacher') return 'school';
    if (role === 'admin') return 'shield-checkmark';
    return 'person';
  };

  const getRoleColor = (role) => {
    if (role === 'teacher') return '#FF6B6B';
    if (role === 'admin') return '#FFD93D';
    return '#6BCB77';
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <TouchableOpacity onPress={handleProfilePhotoUpload} style={styles.avatarContainer}>
          {user.profile_photo ? (
            <Image source={{ uri: `${SERVER_URL}${user.profile_photo}` }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarLarge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.cameraIconBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
          {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}
        </TouchableOpacity>
        
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={getRoleIcon(user.role)} size={16} color="#fff" />
          <Text style={styles.roleText}>
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </Text>
        </View>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={200} style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="mail" size={20} color="#075E54" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="call" size={20} color="#075E54" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            {isEditingPhone ? (
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter 10-digit phone"
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            ) : (
              <Text style={styles.infoValue}>{phone || 'Not set'}</Text>
            )}
          </View>
          {!isEditingPhone ? (
            <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
              <Ionicons name="create-outline" size={20} color="#25D366" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSavePhone} disabled={saving}>
              <Ionicons name="checkmark" size={24} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>

        {user.grade && (
          <View style={styles.infoCard}>
            <Ionicons name="school" size={20} color="#075E54" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Class</Text>
              <Text style={styles.infoValue}>
                Grade {user.grade} - Section {user.section}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="ellipse" size={12} color="#25D366" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{user.status || 'Online'}</Text>
          </View>
        </View>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400} style={styles.logoutSection}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animatable.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>HatchOS Messaging v1.0</Text>
        <Text style={styles.footerSubtext}>Made for Schools 📚</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#075E54',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#25D366',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingText: {
    marginTop: 5,
    color: '#fff',
    fontSize: 12,
  },
  avatarText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  phoneInput: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#25D366',
    paddingBottom: 4,
  },
  logoutSection: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    gap: 10,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCC',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
