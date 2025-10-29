import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { groupAPI, userAPI } from '../services/api';

export default function GroupSettingsScreen({ route, navigation }) {
  const { group } = route.params;
  const { user } = useContext(AuthContext);
  const [groupInfo, setGroupInfo] = useState(group);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(group.name);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = groupInfo.admins?.includes(user.id) || groupInfo.created_by === user.id;

  useEffect(() => {
    loadGroupInfo();
    loadMembers();
    if (isAdmin) {
      loadAllUsers();
    }
  }, []);

  const loadGroupInfo = async () => {
    try {
      const response = await groupAPI.getGroup(group.id);
      setGroupInfo(response.data);
    } catch (error) {
      console.error('Error loading group info:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await groupAPI.getGroup(group.id);
      const groupData = response.data;
      
      // Fetch details for each member
      const memberPromises = (groupData.members || []).map(async (memberId) => {
        try {
          const userResponse = await userAPI.getUser(memberId);
          return {
            ...userResponse.data,
            isAdmin: groupData.admins?.includes(memberId) || memberId === groupData.created_by,
            isCreator: memberId === groupData.created_by,
          };
        } catch (err) {
          return null;
        }
      });
      
      const memberDetails = (await Promise.all(memberPromises)).filter(m => m !== null);
      setMembers(memberDetails);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      // Filter out users already in the group
      const filtered = response.data.filter(
        u => !groupInfo.members?.includes(u.id)
      );
      setAllUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      // You'll need to create this endpoint in server.py
      await groupAPI.updateGroup(group.id, { name: newGroupName });
      setGroupInfo({ ...groupInfo, name: newGroupName });
      setEditingName(false);
      Alert.alert('Success', 'Group name updated!');
      navigation.setOptions({ title: newGroupName });
    } catch (error) {
      console.error('Error updating group name:', error);
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    Alert.alert(
      'Remove Member',
      `Remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupAPI.removeMember(group.id, memberId);
              await loadMembers();
              await loadGroupInfo();
              Alert.alert('Success', `${memberName} removed from group`);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleAddMember = async (userId, userName) => {
    try {
      await groupAPI.addMember(group.id, userId);
      await loadMembers();
      await loadGroupInfo();
      await loadAllUsers();
      Alert.alert('Success', `${userName} added to group!`);
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleToggleAdmin = async (memberId, memberName, currentIsAdmin) => {
    const action = currentIsAdmin ? 'Remove admin rights' : 'Make admin';
    
    Alert.alert(
      action,
      `${action} for ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: async () => {
            try {
              // You'll need to create this endpoint in server.py
              await groupAPI.updateMemberRole(group.id, memberId, !currentIsAdmin);
              await loadMembers();
              await loadGroupInfo();
              Alert.alert('Success', `${memberName} is now ${!currentIsAdmin ? 'an admin' : 'a member'}`);
            } catch (error) {
              console.error('Error updating member role:', error);
              Alert.alert('Error', 'Failed to update member role');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{item.name}</Text>
          {item.isCreator && (
            <View style={styles.badge}>
              <Ionicons name="crown" size={12} color="#FFD700" />
              <Text style={styles.badgeText}>Creator</Text>
            </View>
          )}
          {item.isAdmin && !item.isCreator && (
            <View style={styles.badgeAdmin}>
              <Ionicons name="shield-checkmark" size={12} color="#25D366" />
              <Text style={styles.badgeTextAdmin}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberRole}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          {item.grade && ` • Grade ${item.grade}${item.section}`}
        </Text>
      </View>

      {isAdmin && item.id !== user.id && !item.isCreator && (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleAdmin(item.id, item.name, item.isAdmin)}
          >
            <Ionicons 
              name={item.isAdmin ? "shield-outline" : "shield-checkmark"} 
              size={20} 
              color={item.isAdmin ? "#666" : "#25D366"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveMember(item.id, item.name)}
          >
            <Ionicons name="close-circle" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAvailableUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleAddMember(item.id, item.name)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userRole}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          {item.grade && ` • Grade ${item.grade}${item.section}`}
        </Text>
      </View>
      <Ionicons name="add-circle" size={24} color="#25D366" />
    </TouchableOpacity>
  );

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Group Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Name</Text>
          {editingName && isAdmin ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.input}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="Enter group name"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setNewGroupName(groupInfo.name);
                    setEditingName(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateGroupName}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>{groupInfo.name}</Text>
              {isAdmin && (
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <Ionicons name="create-outline" size={20} color="#075E54" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Group Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoText}>
              {groupInfo.type.charAt(0).toUpperCase() + groupInfo.type.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Members:</Text>
            <Text style={styles.infoText}>{members.length}</Text>
          </View>
          {groupInfo.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.infoText}>{groupInfo.description}</Text>
            </View>
          )}
        </View>

        {/* Members List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddMembers(!showAddMembers)}
              >
                <Ionicons name="person-add" size={20} color="#075E54" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddMembers && isAdmin && (
            <View style={styles.addMembersSection}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users to add..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <FlatList
                data={filteredUsers}
                renderItem={renderAvailableUser}
                keyExtractor={(item) => item.id}
                style={styles.availableUsersList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No users available</Text>
                }
              />
            </View>
          )}

          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Leave Group */}
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => {
            Alert.alert(
              'Leave Group',
              'Are you sure you want to leave this group?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await groupAPI.removeMember(group.id, user.id);
                      navigation.navigate('Home');
                      Alert.alert('Success', 'You left the group');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to leave group');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="exit-outline" size={20} color="#FF6B6B" />
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  editNameContainer: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#075E54',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  addButtonText: {
    color: '#075E54',
    fontWeight: '600',
    fontSize: 14,
  },
  addMembersSection: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    maxHeight: 300,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  availableUsersList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 5,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DAA520',
  },
  badgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeTextAdmin: {
    fontSize: 10,
    fontWeight: '600',
    color: '#25D366',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  leaveButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});
