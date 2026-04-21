import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { router, usePathname, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import io from 'socket.io-client';

const { width } = Dimensions.get('window');

// Card Component
const Card = ({ person, onEdit }) => {
  const imageUrl = person.image || person.photo || 
    'https://upload.wikimedia.org/wikipedia/commons/6/6d/Missing-person-icon.jpg';
  
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{person.name}</Text>
        <Text style={styles.cardDetails}>Age: {person.age || 'Unknown'}</Text>
        <Text style={styles.cardDetails}>Last Seen: {person.lastSeen || person.location || 'Unknown'}</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color="#7c3aed" />
          <Text style={styles.editButtonText}>Edit Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Profile Image Component
const ProfileImage = ({ familyPhoto, onImageUpload, isUploading }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <View style={styles.profileImageContainer}>
      <View style={styles.profileImageWrapper}>
        {imageError ? (
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={60} color="#9ca3af" />
          </View>
        ) : (
          <Image
            source={{ uri: familyPhoto || 'https://via.placeholder.com/180' }}
            style={styles.profileImage}
            onError={handleImageError}
          />
        )}
        <TouchableOpacity 
          style={styles.profileImageEdit}
          onPress={onImageUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="camera" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.profileImageEditIcon}>
        <Ionicons name="create" size={14} color="#ffffff" />
      </View>
    </View>
  );
};

const MissedPerson = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [familyPhoto, setFamilyPhoto] = useState(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [userName, setUserName] = useState('Missing Person');
  const [expandedCategory, setExpandedCategory] = useState('Main');
  const [isLoading, setIsLoading] = useState(false);
  const [approvedReports, setApprovedReports] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const pathname = usePathname();
  const isHomePage = pathname === '/missedperson';
  
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Menu items configuration
  const menuItems = [
    { category: 'Main', items: [
      { path: '/missedperson', label: 'Dashboard', icon: 'home', description: 'View your dashboard' },
      { path: '/missedperson/status-update', label: 'Status Update', icon: 'document-text', description: 'Update your status' },
      { path: '/missedperson/match-suggestions', label: 'View Match Suggestions', icon: 'search', description: 'Search for family members' },
    ]},
    { category: 'Communication', items: [
      { path: '/missedperson/messaging', label: 'Messages', icon: 'mail', description: 'View your messages', badge: unreadMessageCount },
      { path: '/missedperson/notifications', label: 'Notifications', icon: 'notifications', description: 'View your notifications', badge: notificationCount },
    ]},
    { category: 'Profile', items: [
      { path: '/missedperson/upload-profile', label: 'Upload Profile', icon: 'cloud-upload', description: 'Update your profile information' },
      { path: '/missedperson/contact-info', label: 'Contact Info', icon: 'call', description: 'Update your contact information' },
    ]},
    { category: 'Account', items: [
      { path: '/logout', label: 'Logout', icon: 'log-out', description: 'Sign out of your account' },
    ]},
  ];

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsMobileMenuOpen(false));
    } else {
      setIsMobileMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleImageUpload = async () => {
    Alert.alert('Upload Photo', 'This feature requires a file picker. In a production app, you would use expo-image-picker.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: () => console.log('Image picker would open here') }
    ]);
  };

  const fetchApprovedReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/missedPerson/approved-reports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setApprovedReports(data);
    } catch (error) {
      console.error('Error fetching approved reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/upload', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.username) setUserName(data.username);
      if (data.photo) {
        const photoUrl = data.photo.startsWith('http') 
          ? data.photo 
          : `http://localhost:5000${data.photo}`;
        setFamilyPhoto(photoUrl);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleEditReport = (personId) => {
    router.push(`/missedperson/edit-report/${personId}`);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/login');
        }
      }
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApprovedReports();
    await fetchUserProfile();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const initSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const newSocket = io('http://localhost:5000', {
        auth: { token },
      });

      setSocket(newSocket);
      newSocket.emit('getUnreadCount');

      newSocket.on('unreadCount', (data) => {
        if (data.success) {
          setUnreadMessageCount(data.data.totalUnreadCount - 1);
        }
      });

      newSocket.on('newMessage', () => {
        newSocket.emit('getUnreadCount');
      });

      newSocket.on('messagesMarkedAsRead', () => {
        newSocket.emit('getUnreadCount');
      });

      return () => {
        newSocket.disconnect();
      };
    };

    initSocket();
    fetchUserProfile();
    fetchApprovedReports();

    const storedName = AsyncStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, [fetchApprovedReports]);

  const chunkArray = (array, size) => {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
      chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
  };

  const personRows = approvedReports.length > 0 ? chunkArray(approvedReports, 2) : [];

  const renderMenuItem = (item, isActive) => (
    <TouchableOpacity
      key={item.path}
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      onPress={() => {
        if (item.path === '/logout') {
          handleLogout();
        } else {
          router.push(item.path);
          toggleMobileMenu();
        }
      }}
    >
      <View style={[styles.menuIconContainer, isActive && styles.menuIconContainerActive]}>
        <Ionicons name={item.icon} size={20} color={isActive ? '#ffffff' : '#a5b4fc'} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
          {item.label}
        </Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      {item.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Mobile Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleMobileMenu}
      >
        <LinearGradient
          colors={['#4f46e5', '#2563eb']}
          style={styles.menuButtonGradient}
        >
          <Ionicons name="menu" size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Sidebar */}
      <Modal
        visible={isMobileMenuOpen}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMobileMenu}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <LinearGradient
              colors={['#1e3a8a', '#312e81', '#1e1b4b']}
              style={styles.sidebarGradient}
            >
              <View style={styles.sidebarHeader}>
                <TouchableOpacity onPress={toggleMobileMenu} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Home Icon */}
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => {
                  router.push('/');
                  toggleMobileMenu();
                }}
              >
                <LinearGradient
                  colors={['#2563eb', '#4f46e5']}
                  style={styles.homeButtonGradient}
                >
                  <Ionicons name="home" size={24} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>

              <ScrollView style={styles.sidebarMenu}>
                {menuItems.map((category, idx) => (
                  <View key={idx} style={styles.menuCategory}>
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => toggleCategory(category.category)}
                    >
                      <Text style={styles.categoryTitle}>{category.category}</Text>
                      <Ionicons
                        name={expandedCategory === category.category ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                    
                    {expandedCategory === category.category && (
                      <View style={styles.categoryItems}>
                        {category.items.map(item => 
                          renderMenuItem(item, pathname === item.path)
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.sidebarFooter}>
                <Text style={styles.footerText}>Family Reunite v1.0</Text>
                <TouchableOpacity>
                  <Text style={styles.helpLink}>Help</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={toggleMobileMenu}
          />
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isHomePage ? (
          <>
            {/* Profile Header */}
            <View style={styles.headerCard}>
              <LinearGradient
                colors={['#4f46e5', '#3b82f6']}
                style={styles.headerBanner}
              />
              <View style={styles.profileSection}>
                <ProfileImage
                  familyPhoto={familyPhoto}
                  onImageUpload={handleImageUpload}
                  isUploading={isPhotoUploading}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.welcomeText}>Welcome back, {userName}</Text>
                  <Text style={styles.userSubtext}>Here's your current status and information</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>Missed Person</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Reports Section */}
            <View style={styles.reportsSection}>
              <View style={styles.reportsHeader}>
                <Text style={styles.reportsTitle}>Missing Persons Reports</Text>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => router.push('/missedperson/upload-profile')}
                >
                  <Ionicons name="create-outline" size={18} color="#ffffff" />
                  <Text style={styles.updateButtonText}>Update Profile</Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text style={styles.loaderText}>Loading reports...</Text>
                </View>
              ) : personRows.length > 0 ? (
                personRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.cardRow}>
                    {row.map((person) => (
                      <Card
                        key={person.id || person._id}
                        person={person}
                        onEdit={() => handleEditReport(person.id || person._id)}
                      />
                    ))}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyStateTitle}>No reports found.</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Click "Update Profile" to create a new report
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 100,
  },
  menuButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: '100%',
    zIndex: 200,
  },
  sidebarGradient: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  homeButton: {
    alignItems: 'center',
    marginVertical: 16,
  },
  homeButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarMenu: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuCategory: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  categoryItems: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#4f46e5',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconContainerActive: {
    backgroundColor: '#6366f1',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e0e7ff',
  },
  menuLabelActive: {
    color: '#ffffff',
  },
  menuDescription: {
    fontSize: 11,
    color: '#a5b4fc',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sidebarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  helpLink: {
    fontSize: 12,
    color: '#a5b4fc',
  },
  overlayTouchable: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    marginTop: 80,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBanner: {
    height: 80,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -40,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  profileImageEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4f46e5',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileImageEditIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#4f46e5',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  reportsSection: {
    padding: 16,
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  cardRow: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default MissedPerson;