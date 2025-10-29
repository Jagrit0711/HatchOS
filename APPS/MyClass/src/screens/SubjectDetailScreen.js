import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  getAssignments, 
  getResources, 
  getCurrentUser,
  deleteAssignment,
  deleteResource,
  updateAssignment,
  updateResource,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} from '../services/api';
import FileUpload from '../components/FileUpload';
import { getFileUrl } from '../utils/fileUpload';

const SubjectDetailScreen = ({ route, navigation }) => {
  const { subject } = route.params;
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments');
  const [user, setUser] = useState(null);
  
  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editMaxGrade, setEditMaxGrade] = useState('100');
  const [editFile, setEditFile] = useState(null);
  
  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitAssignmentId, setSubmitAssignmentId] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNotes, setSubmitNotes] = useState('');
  
  // Grade modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeAssignmentId, setGradeAssignmentId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      const [assignmentsData, resourcesData] = await Promise.all([
        getAssignments(subject._id),
        getResources(subject._id),
      ]);
      
      console.log('Loaded resources:', resourcesData);
      
      // Check if student has submitted each assignment
      if (currentUser?.role === 'student') {
        for (let assignment of assignmentsData) {
          const subs = await getSubmissions(assignment._id);
          console.log(`Assignment ${assignment.title}:`, {
            assignmentId: assignment._id,
            submissionsCount: subs.length,
            currentUserId: currentUser._id,
            currentUserIdAlt: currentUser.id,
          });
          
          // Compare both _id and id fields to handle any format differences
          const mySub = subs.find(s => {
            const match = s.student_id === currentUser._id || 
                         s.student_id === currentUser.id ||
                         s.studentId === currentUser._id ||
                         s.studentId === currentUser.id;
            
            if (match) {
              console.log('Found matching submission:', {
                submissionId: s._id,
                studentId: s.student_id,
                matched: true
              });
            }
            return match;
          });
          
          assignment.hasSubmitted = !!mySub;
          assignment.grade = mySub?.grade;
          assignment.submissionData = mySub; // Store full submission data
          
          console.log(`Assignment ${assignment.title} - hasSubmitted:`, assignment.hasSubmitted);
        }
      } else if (currentUser?.role === 'teacher') {
        // Add submission counts for teachers
        for (let assignment of assignmentsData) {
          const subs = await getSubmissions(assignment._id);
          assignment.submissionCount = subs.length;
        }
      }
      
      setAssignments(assignmentsData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading subject data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (type, item) => {
    Alert.alert(
      `Delete ${type}?`,
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'assignment') {
                await deleteAssignment(item._id);
              } else {
                await deleteResource(item._id);
              }
              Alert.alert('Success', `✅ ${type} deleted!`);
              onRefresh();
            } catch (error) {
              Alert.alert('Error', `Failed to delete ${type}`);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (type, item) => {
    setEditType(type);
    setEditItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    
    if (type === 'assignment' && item.dueDate) {
      const date = new Date(item.dueDate);
      setEditDueDate(date.toISOString().split('T')[0]);
      setEditMaxGrade(item.maxGrade?.toString() || '100');
    } else {
      setEditDueDate('');
    }
    
    setEditFile(null);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      console.log('handleEdit called', {
        editType,
        editFile,
        editTitle,
        editDescription
      });
      
      if (!editTitle.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      if (editType === 'assignment') {
        const data = {
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
          maxGrade: parseInt(editMaxGrade) || 100,
        };
        
        if (editFile) {
          data.attachmentName = editFile.name;
          data.attachmentUri = editFile.uri;
          data.attachmentSize = editFile.size;
          console.log('Updating assignment with file data:', data);
        }
        
        await updateAssignment(editItem._id, data);
        Alert.alert('Success', 'Assignment updated!');
      } else {
        const data = {
          title: editTitle,
          description: editDescription,
        };
        
        if (editFile) {
          data.fileName = editFile.name;
          data.fileUri = editFile.uri;
          data.fileSize = editFile.size;
          console.log('Updating resource with file data:', data);
        } else {
          console.log('No editFile, updating resource without file');
        }
        
        console.log('Calling updateResource:', editItem._id, data);
        await updateResource(editItem._id, data);
        console.log('updateResource completed');
        Alert.alert('Success', 'Resource updated!');
      }

      setShowEditModal(false);
      onRefresh();
    } catch (error) {
      console.error('handleEdit error:', error);
      Alert.alert('Error', 'Failed to update. Please try again.');
    }
  };

  const openSubmitModal = (assignmentId) => {
    setSubmitAssignmentId(assignmentId);
    setSubmitFile(null);
    setSubmitNotes('');
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (!submitFile) {
        Alert.alert('Error', 'Please upload your assignment file');
        return;
      }

      await submitAssignment(submitAssignmentId, {
        fileName: submitFile.name,
        fileUri: submitFile.uri,
        fileSize: submitFile.size,
        notes: submitNotes,
      });

      Alert.alert('Success', 'Assignment submitted successfully!');
      setShowSubmitModal(false);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assignment');
    }
  };

  const openGradeModal = async (assignmentId) => {
    try {
      const subs = await getSubmissions(assignmentId);
      setSubmissions(subs);
      setGradeAssignmentId(assignmentId);
      setSelectedSubmission(null);
      setShowGradeModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load submissions');
    }
  };

  const handleGrade = async () => {
    try {
      if (!grade.trim()) {
        Alert.alert('Error', 'Please enter a grade');
        return;
      }

      await gradeSubmission(selectedSubmission._id, {
        grade,
        feedback,
      });

      Alert.alert('Success', '✅ Submission graded!');
      setSelectedSubmission(null);
      const subs = await getSubmissions(gradeAssignmentId);
      setSubmissions(subs);
    } catch (error) {
      Alert.alert('Error', 'Failed to grade submission');
    }
  };

  const getFileIcon = (url) => {
    if (!url) return 'document-text';
    const lower = url.toLowerCase();
    if (lower.includes('.pdf')) return 'document-text';
    if (lower.includes('.ppt') || lower.includes('.pptx')) return 'easel';
    if (lower.includes('.doc') || lower.includes('.docx')) return 'document';
    if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('.jpeg')) return 'image';
    if (lower.includes('.mp4') || lower.includes('.mov')) return 'videocam';
    if (lower.includes('http')) return 'link';
    return 'document-attach';
  };

  const getFileColor = (url) => {
    if (!url) return '#667eea';
    const lower = url.toLowerCase();
    if (lower.includes('.pdf')) return '#e74c3c';
    if (lower.includes('.ppt') || lower.includes('.pptx')) return '#e67e22';
    if (lower.includes('.doc') || lower.includes('.docx')) return '#3498db';
    if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('.jpeg')) return '#9b59b6';
    if (lower.includes('.mp4') || lower.includes('.mov')) return '#1abc9c';
    return '#667eea';
  };

  const handleOpenResource = async (resource) => {
    if (resource.url) {
      const canOpen = await Linking.canOpenURL(resource.url);
      if (canOpen) {
        Linking.openURL(resource.url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    }
  };

  const renderAssignment = (assignment) => {
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date();
    const isTeacher = user?.role === 'teacher';
    const hasSubmitted = assignment.hasSubmitted || false;
    
    return (
      <TouchableOpacity 
        key={assignment._id} 
        style={styles.card}
        onPress={() => navigation.navigate('AssignmentDetail', { assignment, user })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="clipboard" size={24} color="#667eea" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{assignment.title}</Text>
            {assignment.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>{assignment.description}</Text>
            )}
            {dueDate && (
              <View style={[styles.dueDateBadge, isOverdue && styles.overdueBadge]}>
                <Ionicons 
                  name={isOverdue ? 'alert-circle' : 'calendar'} 
                  size={14} 
                  color={isOverdue ? '#e74c3c' : '#667eea'} 
                />
                <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
                  Due: {dueDate.toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {/* Attachment indicator */}
            {assignment.attachmentName && (
              <View style={styles.attachmentIndicator}>
                <Ionicons name="attach" size={14} color="#999" />
                <Text style={styles.attachmentText}>{assignment.attachmentName}</Text>
              </View>
            )}
            
            {!isTeacher && !hasSubmitted && (
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={(e) => {
                  e.stopPropagation();
                  openSubmitModal(assignment._id);
                }}
              >
                <Ionicons name="cloud-upload" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Assignment</Text>
              </TouchableOpacity>
            )}
            
            {!isTeacher && hasSubmitted && (
              <View style={styles.submittedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                <Text style={styles.submittedText}>Submitted</Text>
                {assignment.grade && (
                  <Text style={styles.gradeText}>Grade: {assignment.grade}</Text>
                )}
              </View>
            )}
            
            {isTeacher && (
              <TouchableOpacity 
                style={styles.viewSubmissionsButton}
                onPress={(e) => {
                  e.stopPropagation();
                  openGradeModal(assignment._id);
                }}
              >
                <Ionicons name="list" size={18} color="#667eea" />
                <Text style={styles.viewSubmissionsText}>
                  View Submissions ({assignment.submissionCount || 0})
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.cardActions}>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
            {isTeacher && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditModal('assignment', assignment);
                  }}
                >
                  <Ionicons name="create-outline" size={22} color="#667eea" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete('assignment', assignment);
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderResource = (resource) => {
    const isTeacher = user?.role === 'teacher';
    // Support both new (fileName/fileUri) and old (url) formats
    // Check for non-empty values
    const hasFile = !!(
      (resource.fileName && resource.fileName.trim()) || 
      (resource.fileUri && resource.fileUri.trim()) || 
      (resource.url && resource.url.trim())
    );
    const displayUri = getFileUrl(resource.fileUri) || resource.url;
    const displayName = resource.fileName || (resource.url ? 'Link' : null);
    const isImage = displayName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
    
    return (
      <TouchableOpacity
        key={resource._id}
        style={styles.resourceCard}
        onPress={() => navigation.navigate('ResourceDetail', { resource })}
        activeOpacity={0.7}
      >
        {/* Thumbnail Section */}
        {hasFile && (
          <View style={styles.resourceThumbnailContainer}>
            {isImage && displayUri ? (
              <Image 
                source={{ uri: displayUri }} 
                style={styles.resourceThumbnail}
                resizeMode="cover"
              />
            ) : resource.url ? (
              <View style={styles.resourceDocIcon}>
                <Ionicons name="link" size={48} color="#667eea" />
              </View>
            ) : (
              <View style={styles.resourceDocIcon}>
                <Ionicons name="document-text" size={48} color="#667eea" />
              </View>
            )}
          </View>
        )}
        
        {/* Content Section */}
        <View style={styles.resourceContent}>
          <View style={styles.resourceTitleRow}>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
          {resource.description && (
            <Text style={styles.resourceDescription} numberOfLines={2}>
              {resource.description}
            </Text>
          )}
          
          {/* File Info */}
          {hasFile && (
            <View style={styles.resourceFileInfo}>
              <Ionicons name="attach" size={14} color="#999" />
              <Text style={styles.resourceFileName} numberOfLines={1}>
                {displayName || 'Attached file'}
              </Text>
              {resource.fileSize && (
                <Text style={styles.resourceFileSize}>
                  • {(resource.fileSize / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          )}
          
          {/* Action Buttons - Teacher Only */}
          {isTeacher && (
            <View style={styles.resourceActions}>
              <TouchableOpacity 
                style={styles.resourceActionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  openEditModal('resource', resource);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#667eea" />
                <Text style={styles.resourceActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.resourceActionButton, styles.deleteButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete('resource', resource);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                <Text style={[styles.resourceActionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{subject.name}</Text>
            <Text style={styles.headerSubtitle}>{subject.code}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assignments' && styles.activeTab]}
          onPress={() => setActiveTab('assignments')}
        >
          <Ionicons
            name="clipboard"
            size={20}
            color={activeTab === 'assignments' ? '#667eea' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'assignments' && styles.activeTabText]}>
            Assignments ({assignments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
          onPress={() => setActiveTab('resources')}
        >
          <Ionicons
            name="folder"
            size={20}
            color={activeTab === 'resources' ? '#667eea' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
            Resources ({resources.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'assignments' ? (
          assignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.doodleEmoji}>📝✨</Text>
              <Ionicons name="clipboard-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No assignments yet</Text>
              <Text style={styles.doodleBottom}>🎯📋</Text>
            </View>
          ) : (
            assignments.map(renderAssignment)
          )
        ) : (
          resources.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.doodleEmoji}>📁✨</Text>
              <Ionicons name="folder-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No resources yet</Text>
              <Text style={styles.doodleBottom}>📚💡</Text>
            </View>
          ) : (
            resources.map(renderResource)
          )
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                ✏️ Edit {editType === 'assignment' ? 'Assignment' : 'Resource'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter title"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />

              {editType === 'assignment' && (
                <>
                  <Text style={styles.label}>Due Date</Text>
                  <TextInput
                    style={styles.input}
                    value={editDueDate}
                    onChangeText={setEditDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.hint}>Enter date in format: 2025-10-15</Text>
                  
                  <Text style={styles.label}>Maximum Grade</Text>
                  <TextInput
                    style={styles.input}
                    value={editMaxGrade}
                    onChangeText={setEditMaxGrade}
                    placeholder="100"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  
                  <FileUpload 
                    label="Update Attachment (Optional)"
                    onFileSelected={setEditFile}
                    selectedFile={editFile}
                  />
                </>
              )}

              {editType === 'resource' && (
                <>
                  <FileUpload 
                    label="Update Resource File (Optional)"
                    onFileSelected={setEditFile}
                    selectedFile={editFile}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.submitButtonModal} onPress={handleEdit}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>Update</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Submit Assignment Modal */}
      <Modal
        visible={showSubmitModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📤 Submit Assignment</Text>
              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <FileUpload 
                label="Upload Your Assignment"
                onFileSelected={setSubmitFile}
                selectedFile={submitFile}
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={submitNotes}
                onChangeText={setSubmitNotes}
                placeholder="Any notes for your teacher..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <TouchableOpacity style={styles.submitButtonModal} onPress={handleSubmit}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>Submit Assignment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Grade Submissions Modal */}
      <Modal
        visible={showGradeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Submissions</Text>
              <TouchableOpacity onPress={() => setShowGradeModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {submissions.length === 0 ? (
                <View style={styles.emptySubmissions}>
                  <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No submissions yet</Text>
                </View>
              ) : (
                submissions.map((sub) => (
                  <View key={sub._id} style={styles.submissionCard}>
                    <View style={styles.submissionHeader}>
                      <Ionicons name="person-circle" size={32} color="#667eea" />
                      <View style={styles.submissionInfo}>
                        <Text style={styles.submissionStudent}>{sub.studentName}</Text>
                        <Text style={styles.submissionDate}>
                          {new Date(sub.submitted_at).toLocaleString()}
                        </Text>
                      </View>
                      {sub.grade && (
                        <View style={styles.gradeBadge}>
                          <Text style={styles.gradeBadgeText}>{sub.grade}</Text>
                        </View>
                      )}
                    </View>
                    
                    {(sub.fileName || sub.url) && (
                      <View style={styles.submissionFileSection}>
                        {sub.fileUri && sub.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <View style={styles.submissionImageContainer}>
                            <Image 
                              source={{ uri: sub.fileUri }} 
                              style={styles.submissionThumbnail}
                              resizeMode="cover"
                            />
                            <Text style={styles.submissionFileName}>{sub.fileName}</Text>
                          </View>
                        ) : sub.fileName ? (
                          <View style={styles.submissionFileInfo}>
                            <Ionicons name="document" size={24} color="#667eea" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.submissionFileName} numberOfLines={1}>
                                {sub.fileName}
                              </Text>
                              {sub.fileSize && (
                                <Text style={styles.fileSize}>
                                  {(sub.fileSize / 1024).toFixed(1)} KB
                                </Text>
                              )}
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            style={styles.fileNameBadge}
                            onPress={() => Linking.openURL(sub.url)}
                          >
                            <Ionicons name="link" size={16} color="#667eea" />
                            <Text style={styles.fileName} numberOfLines={1}>
                              {sub.url}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    
                    {sub.notes && (
                      <Text style={styles.submissionNotes}>"{sub.notes}"</Text>
                    )}
                    
                    <TouchableOpacity
                      style={styles.gradeButton}
                      onPress={() => {
                        setSelectedSubmission(sub);
                        setGrade(sub.grade || '');
                        setFeedback(sub.feedback || '');
                      }}
                    >
                      <Ionicons name="create" size={18} color="#667eea" />
                      <Text style={styles.gradeButtonText}>
                        {sub.grade ? 'Update Grade' : 'Grade Submission'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              
              {selectedSubmission && (
                <View style={styles.gradeForm}>
                  <Text style={styles.gradeFormTitle}>
                    Grading: {selectedSubmission.studentName}
                  </Text>
                  
                  {/* Show submitted file/image */}
                  {(selectedSubmission.fileName || selectedSubmission.url) && (
                    <View style={styles.submittedFileSection}>
                      <Text style={styles.sectionLabel}>Submitted File</Text>
                      {selectedSubmission.fileUri && selectedSubmission.fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                        <View style={styles.submittedImageContainer}>
                          <Image 
                            source={{ uri: getFileUrl(selectedSubmission.fileUri) }} 
                            style={styles.submittedImage}
                            resizeMode="contain"
                          />
                          <Text style={styles.submittedFileName}>{selectedSubmission.fileName}</Text>
                          {selectedSubmission.fileSize && (
                            <Text style={styles.submittedFileSize}>
                              {(selectedSubmission.fileSize / 1024).toFixed(1)} KB
                            </Text>
                          )}
                        </View>
                      ) : selectedSubmission.fileName ? (
                        <View style={styles.submittedDocumentContainer}>
                          <Ionicons name="document-text" size={48} color="#667eea" />
                          <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.submittedFileName} numberOfLines={2}>
                              {selectedSubmission.fileName}
                            </Text>
                            {selectedSubmission.fileSize && (
                              <Text style={styles.submittedFileSize}>
                                {(selectedSubmission.fileSize / 1024).toFixed(1)} KB
                              </Text>
                            )}
                          </View>
                        </View>
                      ) : selectedSubmission.url ? (
                        <TouchableOpacity 
                          style={styles.submittedUrlContainer}
                          onPress={() => Linking.openURL(selectedSubmission.url)}
                        >
                          <Ionicons name="link" size={20} color="#667eea" />
                          <Text style={styles.submittedUrl} numberOfLines={2}>
                            {selectedSubmission.url}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      
                      {selectedSubmission.notes && (
                        <View style={styles.studentNotesContainer}>
                          <Text style={styles.sectionLabel}>Student Notes</Text>
                          <Text style={styles.studentNotesText}>"{selectedSubmission.notes}"</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  <Text style={styles.label}>Grade</Text>
                  <TextInput
                    style={styles.input}
                    value={grade}
                    onChangeText={setGrade}
                    placeholder="e.g., A+, 95, Excellent"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.label}>Feedback (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder="Provide feedback..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                  />
                  
                  <TouchableOpacity style={styles.submitButtonModal} onPress={handleGrade}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.submitGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.submitText}>Submit Grade ✅</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardActions: {
    alignItems: 'center',
    gap: 8,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    color: '#999',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  // New Resource Card Styles
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resourceThumbnailContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  resourceThumbnail: {
    width: '100%',
    height: '100%',
  },
  resourceDocIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
  },
  resourceContent: {
    padding: 15,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resourceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  resourceFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resourceFileName: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
    flex: 1,
  },
  resourceFileSize: {
    fontSize: 12,
    color: '#999',
  },
  resourceActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  resourceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
    gap: 6,
  },
  deleteButton: {
    borderColor: '#e74c3c',
  },
  resourceActionText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  deleteText: {
    color: '#e74c3c',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#667eea20',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  overdueBadge: {
    backgroundColor: '#e74c3c20',
  },
  dueDateText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  overdueText: {
    color: '#e74c3c',
  },
  urlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#667eea',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#27ae6020',
    borderRadius: 8,
  },
  submittedText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: '600',
  },
  gradeText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  viewSubmissionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  viewSubmissionsText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: -10,
    marginBottom: 15,
  },
  submitButtonModal: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
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
  emptySubmissions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  submissionCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  submissionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  submissionStudent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submissionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fileNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 13,
    color: '#667eea',
    flex: 1,
  },
  submissionFileSection: {
    marginBottom: 12,
  },
  submissionImageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  submissionThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  submissionFileName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  submissionFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 8,
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  submissionNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  gradeButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  gradeForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  gradeFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 15,
  },
  submittedFileSection: {
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  submittedImageContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  submittedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  submittedFileName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  submittedFileSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  submittedDocumentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  submittedUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  submittedUrl: {
    fontSize: 13,
    color: '#667eea',
    marginLeft: 10,
    flex: 1,
  },
  studentNotesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  studentNotesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default SubjectDetailScreen;
