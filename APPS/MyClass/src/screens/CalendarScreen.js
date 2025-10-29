import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { getMySubjects, getAssignments } from '../services/api';

const CalendarScreen = () => {
  const [allAssignments, setAllAssignments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const subjectsData = await getMySubjects();
      setSubjects(subjectsData);
      
      const allAssignmentsData = [];
      for (const subject of subjectsData) {
        const assignments = await getAssignments(subject._id);
        assignments.forEach(assignment => {
          allAssignmentsData.push({
            ...assignment,
            subjectName: subject.name,
            subjectCode: subject.code,
          });
        });
      }
      
      allAssignmentsData.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      
      setAllAssignments(allAssignmentsData);
      
      const marked = {};
      const today = new Date().toISOString().split('T')[0];
      marked[today] = { selected: true, selectedColor: '#667eea' };
      
      allAssignmentsData.forEach(assignment => {
        if (assignment.dueDate) {
          const date = assignment.dueDate.split('T')[0];
          const isOverdue = new Date(date) < new Date(today);
          
          if (marked[date]) {
            marked[date] = { ...marked[date], marked: true, dotColor: isOverdue ? '#e74c3c' : '#764ba2' };
          } else {
            marked[date] = { marked: true, dotColor: isOverdue ? '#e74c3c' : '#764ba2' };
          }
        }
      });
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAssignmentsForDate = (date) => {
    return allAssignments.filter(assignment => {
      if (!assignment.dueDate) return false;
      const dueDate = assignment.dueDate.split('T')[0];
      return dueDate === date;
    });
  };

  const getUpcomingAssignments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allAssignments.filter(assignment => {
      if (!assignment.dueDate) return false;
      const dueDate = new Date(assignment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }).slice(0, 10);
  };

  const getDaysUntil = (dateString) => {
    const due = new Date(dateString);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return diffDays + ' days left';
  };

  const getUrgencyColor = (dateString) => {
    const due = new Date(dateString);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return '#e74c3c';
    if (diffDays <= 2) return '#f39c12';
    return '#27ae60';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderAssignmentCard = (assignment) => (
    <View key={assignment._id} style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          <Text style={styles.subjectChip}>{assignment.subjectCode || assignment.subjectName}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(assignment.dueDate) }]}>
          <Text style={styles.urgencyText}>{getDaysUntil(assignment.dueDate)}</Text>
        </View>
      </View>
      {assignment.description && (
        <Text style={styles.assignmentDescription} numberOfLines={2}>{assignment.description}</Text>
      )}
      <View style={styles.assignmentFooter}>
        <View style={styles.dueDateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dueDate}>{formatDate(assignment.dueDate)}</Text>
        </View>
        {assignment.maxGrade && (
          <View style={styles.gradeContainer}>
            <Ionicons name="trophy-outline" size={16} color="#666" />
            <Text style={styles.maxGrade}>{assignment.maxGrade} pts</Text>
          </View>
        )}
      </View>
    </View>
  );

  const upcomingAssignments = getUpcomingAssignments();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>{allAssignments.length} Total  {upcomingAssignments.length} Upcoming</Text>
      </LinearGradient>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={{ ...markedDates, [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#667eea' }}}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: '#fff', calendarBackground: '#fff', textSectionTitleColor: '#667eea',
              selectedDayBackgroundColor: '#667eea', selectedDayTextColor: '#fff', todayTextColor: '#764ba2',
              dayTextColor: '#2d4150', textDisabledColor: '#d9e1e8', dotColor: '#764ba2',
              selectedDotColor: '#fff', arrowColor: '#667eea', monthTextColor: '#333',
              textDayFontWeight: '400', textMonthFontWeight: 'bold', textDayHeaderFontWeight: '600',
              textDayFontSize: 16, textMonthFontSize: 18, textDayHeaderFontSize: 14
            }}
          />
        </View>
        {selectedDate && getAssignmentsForDate(selectedDate).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignments for {formatDate(selectedDate)}</Text>
            {getAssignmentsForDate(selectedDate).map(renderAssignmentCard)}
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
          {upcomingAssignments.length > 0 ? (
            upcomingAssignments.map(renderAssignmentCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No upcoming assignments</Text>
              <Text style={styles.emptySubtext}>You're all caught up!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
  content: { flex: 1 },
  calendarContainer: { backgroundColor: '#fff', margin: 15, borderRadius: 15, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  assignmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  assignmentInfo: { flex: 1, marginRight: 10 },
  assignmentTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  subjectChip: { fontSize: 12, color: '#667eea', fontWeight: '600', backgroundColor: '#f0f4ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  urgencyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  urgencyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  assignmentDescription: { fontSize: 14, color: '#666', marginBottom: 10, lineHeight: 20 },
  assignmentFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center' },
  dueDate: { fontSize: 13, color: '#666', marginLeft: 5 },
  gradeContainer: { flexDirection: 'row', alignItems: 'center' },
  maxGrade: { fontSize: 13, color: '#666', marginLeft: 5, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 15 },
  emptySubtext: { fontSize: 14, color: '#ccc', marginTop: 5 }
});

export default CalendarScreen;
