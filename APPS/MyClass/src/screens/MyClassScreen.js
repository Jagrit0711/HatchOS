import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getMySubjects, getCurrentUser, createAssignment, createResource, logout, getUserDetails } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';

const MyClassScreen = ({ navigation }) => {
  const { logout: appLogout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [addType, setAddType] = useState(''); // 'assignment' or 'resource'
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxGrade, setMaxGrade] = useState('100');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;
      
      // Get full user details from server
      const userDetails = await getUserDetails(currentUser._id);
      setUser(userDetails || currentUser);
      
      const mySubjects = await getMySubjects();
      setSubjects(mySubjects);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openAddModal = (type, subject) => {
    setAddType(type);
    setSelectedSubject(subject);
    setShowAddModal(true);
    // Reset form
    setTitle('');
    setDescription('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
    setMaxGrade('100');
    setSelectedFile(null);
  };

  const handleAdd = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      if (addType === 'assignment') {
        if (!dueDate) {
          Alert.alert('Error', 'Please enter a due date');
          return;
        }
        
        const assignmentData = {
          title,
          description,
          dueDate: new Date(dueDate).toISOString(),
          maxGrade: parseInt(maxGrade) || 100,
          subjectId: selectedSubject._id,
        };
        
        if (selectedFile) {
          assignmentData.attachmentName = selectedFile.name;
          assignmentData.attachmentUri = selectedFile.uri;
          assignmentData.attachmentSize = selectedFile.size;
        }
        
        await createAssignment(assignmentData);
        Alert.alert('Success', 'Assignment created successfully!');
      } else if (addType === 'resource') {
        if (!selectedFile) {
          Alert.alert('Error', 'Please upload a file');
          return;
        }
        
        const resourceData = {
          title,
          description,
          fileName: selectedFile.name,
          fileUri: selectedFile.uri,
          fileSize: selectedFile.size,
          subjectId: selectedSubject._id,
        };
        
        await createResource(resourceData);
        Alert.alert('Success', 'Resource uploaded successfully!');
      }

      setShowAddModal(false);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to add. Please try again.');
      console.error('Add error:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            appLogout();
          },
        },
      ]
    );
  };

  const renderSubjectCard = (subject) => {
    return (
    <TouchableOpacity
      key={subject._id}
      style={styles.subjectCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('SubjectDetail', { subject })}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.subjectGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.subjectHeader}>
          <View style={styles.subjectTitleRow}>
            <View>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectCode}>{subject.code}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </View>

        <View style={styles.subjectStats}>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.statText}>{subject.assignmentCount || 0} Assignments</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="folder-outline" size={18} color="#fff" />
            <Text style={styles.statText}>{subject.resourceCount || 0} Resources</Text>
          </View>
        </View>

        {user?.role === 'teacher' && (
          <View style={styles.teacherActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                openAddModal('assignment', subject);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                openAddModal('resource', subject);
              }}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Resource</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Class</Text>
            <Text style={styles.headerSubtitle}>
              {user?.role === 'teacher' ? 'Teaching' : 'Enrolled'} • {subjects.length} Subjects
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileMenu(true)}
          >
            {user?.profile_photo ? (
              <Image
                source={{ uri: user.profile_photo }}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-circle" size={40} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.doodleEmoji}>📚✨</Text>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No subjects yet</Text>
            <Text style={styles.emptySubtext}>
              {user?.role === 'teacher' 
                ? 'Create a new subject to get started'
                : 'Wait for your teacher to add you to a subject'}
            </Text>
            <Text style={styles.doodleBottom}>🎒📖✏️</Text>
          </View>
        ) : (
          subjects.map(renderSubjectCard)
        )}
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileMenuContent}>
            <View style={styles.profileHeader}>
              <View style={styles.profileIconContainer}>
                {user?.profile_photo ? (
                  <Image
                    source={{ uri: user.profile_photo }}
                    style={styles.profileImageLarge}
                  />
                ) : (
                  <Ionicons name="person-circle" size={80} color="#667eea" />
                )}
              </View>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.profileOptions}>
              {user?.role === 'teacher' && user?.teaching_classes && (
                <View style={styles.infoCard}>
                  <Ionicons name="school" size={20} color="#667eea" />
                  <View style={styles.infoCardText}>
                    <Text style={styles.infoLabel}>Teaching Classes</Text>
                    <Text style={styles.infoValue}>{user.teaching_classes}</Text>
                  </View>
                </View>
              )}

              {user?.role === 'student' && (
                <>
                  {user?.grade && (
                    <View style={styles.infoCard}>
                      <Ionicons name="ribbon" size={20} color="#667eea" />
                      <View style={styles.infoCardText}>
                        <Text style={styles.infoLabel}>Grade</Text>
                        <Text style={styles.infoValue}>{user.grade}</Text>
                      </View>
                    </View>
                  )}
                  {user?.class && (
                    <View style={styles.infoCard}>
                      <Ionicons name="people" size={20} color="#667eea" />
                      <View style={styles.infoCardText}>
                        <Text style={styles.infoLabel}>Class</Text>
                        <Text style={styles.infoValue}>{user.class}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.menuOption} onPress={() => {
                setShowProfileMenu(false);
                Alert.alert('Subjects', `You have ${subjects.length} subjects enrolled/teaching`);
              }}>
                <Ionicons name="book" size={24} color="#667eea" />
                <Text style={styles.menuOptionText}>My Subjects ({subjects.length})</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuOption, styles.logoutOption]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={24} color="#e74c3c" />
                <Text style={[styles.menuOptionText, styles.logoutText]}>Logout</Text>
                <Ionicons name="chevron-forward" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeProfileButton}
              onPress={() => setShowProfileMenu(false)}
            >
              <Text style={styles.closeProfileText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Assignment/Resource Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {addType === 'assignment' ? 'Assignment' : 'Resource'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={`Enter ${addType} title`}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />

              {addType === 'assignment' && (
                <>
                  <Text style={styles.label}>Due Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.hint}>Enter date in format: 2025-10-15</Text>
                  
                  <Text style={styles.label}>Maximum Grade</Text>
                  <TextInput
                    style={styles.input}
                    value={maxGrade}
                    onChangeText={setMaxGrade}
                    placeholder="100"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  <Text style={styles.hint}>Total points/marks for this assignment</Text>
                  
                  <FileUpload 
                    label="Attachment (Optional)"
                    onFileSelected={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                </>
              )}

              {addType === 'resource' && (
                <>
                  <FileUpload 
                    label="Upload Resource File *"
                    onFileSelected={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>Add {addType}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  profileButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  subjectCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  subjectGradient: {
    padding: 20,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectEmoji: {
    fontSize: 32,
  },
  subjectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  teacherActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  doodleEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  doodleBottom: {
    fontSize: 32,
    marginTop: 15,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: -10,
    marginBottom: 15,
  },
  profileMenuContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileIconContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileOptions: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  infoCardText: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutOption: {
    marginTop: 10,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#e74c3c',
  },
  closeProfileButton: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default MyClassScreen;
