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

const AssignmentDetailScreen = ({ route, navigation }) => {
  const { assignment, user } = route.params;
  
  const hasFile = assignment.attachmentName || assignment.attachmentUri;
  const fileUrl = getFileUrl(assignment.attachmentUri);
  const isImage = assignment.attachmentName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
  const isTeacher = user?.role === 'teacher';

  const handleOpenFile = () => {
    if (fileUrl) {
      Linking.openURL(fileUrl);
    }
  };

  const getDaysUntil = (dateString) => {
    const due = new Date(dateString);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: '#e74c3c' };
    if (diffDays === 0) return { text: 'Due today', color: '#f39c12' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: '#f39c12' };
    return { text: `${diffDays} days left`, color: '#27ae60' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const dueStatus = assignment.dueDate ? getDaysUntil(assignment.dueDate) : null;

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
          <Text style={styles.headerTitle}>Assignment</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Title and Info Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{assignment.title}</Text>
          
          {/* Due Date Badge */}
          {assignment.dueDate && dueStatus && (
            <View style={[styles.dueDateBadge, { backgroundColor: dueStatus.color + '20' }]}>
              <Ionicons name="calendar" size={16} color={dueStatus.color} />
              <Text style={[styles.dueDateText, { color: dueStatus.color }]}>
                {dueStatus.text}
              </Text>
            </View>
          )}

          {/* Max Grade */}
          {assignment.maxGrade && (
            <View style={styles.gradeBadge}>
              <Ionicons name="trophy" size={16} color="#667eea" />
              <Text style={styles.gradeText}>Worth {assignment.maxGrade} points</Text>
            </View>
          )}

          {/* Full Due Date */}
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={18} color="#999" />
            <Text style={styles.dateText}>{formatDate(assignment.dueDate)}</Text>
          </View>

          {/* Description */}
          {assignment.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Instructions</Text>
              <Text style={styles.description}>{assignment.description}</Text>
            </View>
          )}
        </View>

        {/* Attachments Section */}
        {hasFile && (
          <View style={styles.attachmentSection}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            
            <TouchableOpacity 
              style={styles.attachmentCard}
              onPress={handleOpenFile}
              activeOpacity={0.7}
            >
              {isImage && fileUrl ? (
                <View style={styles.imageThumbnailContainer}>
                  <Image 
                    source={{ uri: fileUrl }} 
                    style={styles.imageThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="eye-outline" size={32} color="#fff" />
                    <Text style={styles.overlayText}>Tap to view full image</Text>
                  </View>
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
                  <Text style={styles.fileName}>{assignment.attachmentName}</Text>
                </View>
                {assignment.attachmentSize && (
                  <View style={styles.fileInfoRow}>
                    <Ionicons name="document-outline" size={18} color="#999" />
                    <Text style={styles.fileSize}>
                      {(assignment.attachmentSize / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Submission Info for Students */}
        {!isTeacher && (
          <View style={styles.submissionSection}>
            <Text style={styles.sectionTitle}>Your Submission</Text>
            {assignment.hasSubmitted || assignment.submitted ? (
              <View style={styles.submittedCard}>
                <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
                <Text style={styles.submittedText}>Assignment Submitted</Text>
                {assignment.grade && (
                  <View style={styles.gradeCard}>
                    <Text style={styles.gradeLabel}>Grade:</Text>
                    <Text style={styles.gradeValue}>{assignment.grade}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.notSubmittedCard}>
                <Ionicons name="alert-circle-outline" size={48} color="#f39c12" />
                <Text style={styles.notSubmittedText}>Not yet submitted</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {!isTeacher && !(assignment.hasSubmitted || assignment.submitted) && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Assignment</Text>
          </TouchableOpacity>
        )}
        {isTeacher && (
          <TouchableOpacity 
            style={styles.viewSubmissionsButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="people-outline" size={22} color="#667eea" />
            <Text style={styles.viewSubmissionsButtonText}>View Submissions</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 15,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  gradeText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
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
  submissionSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  submittedCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  submittedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    marginTop: 15,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    gap: 10,
  },
  gradeLabel: {
    fontSize: 16,
    color: '#666',
  },
  gradeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  notSubmittedCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  notSubmittedText: {
    fontSize: 16,
    color: '#f39c12',
    marginTop: 15,
  },
  actionBar: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewSubmissionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  viewSubmissionsButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AssignmentDetailScreen;
