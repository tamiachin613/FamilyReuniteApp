import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// CountUp Component for React Native
const CountUp = ({ end, duration = 1.5, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const animatedValue = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: end,
        duration: duration * 1000,
        useNativeDriver: false,
      }).start();

      animatedValue.addListener(({ value }) => {
        setCount(Math.floor(value));
      });
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      animatedValue.removeAllListeners();
    };
  }, [end, duration, delay]);

  return <Text style={styles.countText}>{count}</Text>;
};

// Card Component for React Native
const Card = ({ person }) => {
  return (
    <TouchableOpacity style={styles.card}>
      <Image
        source={{
          uri: person.image || person.photo || 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Missing-person-icon.jpg'
        }}
        style={styles.cardImage}

      />
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{person.name}</Text>
        <Text style={styles.cardDetails}>Age: {person.age || 'Unknown'}</Text>
        <Text style={styles.cardDetails}>Last Seen: {person.lastSeen || person.location || 'Unknown'}</Text>
        {person.status === 'found' && (
          <View style={styles.foundBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.foundText}>Found</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// SearchComponent for React Native
const SearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, location, or description..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      {isLoading && <ActivityIndicator style={styles.searchLoader} color="#3b82f6" />}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Card person={item} />}
        ListEmptyComponent={
          !isLoading && searchQuery ? (
            <Text style={styles.noResultsText}>No results found</Text>
          ) : null
        }
      />
    </View>
  );
};

const Homepage = () => {
  const [persons, setPersons] = useState([]);
  const [missingPersons, setMissingPersons] = useState([]);
  const [foundPersons, setFoundPersons] = useState([]);
  const [matchSuggestions, setMatchSuggestions] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState(6);
  const [showFoundPersons, setShowFoundPersons] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState({
    missingCount: 0,
    foundCount: 0,
    activeSearches: 0,
    totalReports: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const scrollY = useState(new Animated.Value(0))[0];

  const fetchStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('http://localhost:5000/api/search/statistics');
      const data = await response.json();
      if (data) {
        setStatistics({
          missingCount: data.missingCount || 0,
          foundCount: data.foundCount || 0,
          activeSearches: data.activeSearches || 0,
          totalReports: data.totalReports || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics({
        missingCount: missingPersons.length,
        foundCount: foundPersons.length,
        activeSearches: (missingPersons.length + foundPersons.length) * 1.5,
        totalReports: missingPersons.length + foundPersons.length,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchRecentMatchSuggestions = async () => {
    setIsLoadingMatches(true);
    try {
      const response = await fetch('http://localhost:5000/api/matches/recent');
      const data = await response.json();
      if (Array.isArray(data)) {
        setMatchSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching match suggestions:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const fetchPersonMatches = async (personId) => {
    setIsLoadingMatches(true);
    try {
      const response = await fetch(`http://localhost:5000/api/matches/suggestions/${personId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setMatchSuggestions(data);
        const person = persons.find(p => p.id === parseInt(personId));
        setSelectedPerson(person);
        setIsMatchModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching person matches:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const updateMatchStatus = async (matchId, status) => {
    try {
      await fetch(`http://localhost:5000/api/matches/suggestions/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setMatchSuggestions(prev =>
        prev.map(match => match.id === matchId ? { ...match, status } : match)
      );
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/missedPerson/approved-reports');
      const data = await response.json();
      if (Array.isArray(data)) {
        const processedData = data.map(person => ({
          ...person,
          status: person.status ? person.status.toLowerCase() : 'missing',
          isFoundPerson: person.status && person.status.toLowerCase() === 'found',
        }));

        const missing = processedData.filter(person => !person.status || person.status === 'missing');
        const found = processedData.filter(person => person.status === 'found');

        setMissingPersons(missing);
        setFoundPersons(found);
        setPersons(missing);

        if (data.length > 0) {
          fetchRecentMatchSuggestions();
        }
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error fetching persons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const highConfidenceMatches = matchSuggestions.filter(
    match => match.confidenceScore >= 80 && match.status === 'pending'
  );

  const handleLoadMore = () => {
    const newCount = Math.min(visibleCards + 4, missingPersons.length);
    setVisibleCards(newCount);
  };

  const renderPersonCard = ({ item }) => {
    const hasMatch = matchSuggestions.some(
      match => (match.matchId === item.id || parseInt(match.person_id) === item.id) &&
        match.confidenceScore >= 75 && match.status === 'pending'
    );

    return (
      <View style={styles.cardWrapper}>
        {hasMatch && (
          <TouchableOpacity
            style={styles.matchBadge}
            onPress={() => fetchPersonMatches(item.id)}
          >
            <Text style={styles.matchBadgeText}>Potential Match!</Text>
          </TouchableOpacity>
        )}
        <Card person={item} />
      </View>
    );
  };

  const StatCard = ({ title, value, icon, color, delay }) => (
    <LinearGradient
      colors={['#ffffff', '#f8fafc']}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}10` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueContainer}>
        {isLoadingStats ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <CountUp end={value} duration={1.5} delay={delay} />
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#1e3a8a', '#1d4ed8', '#2563eb']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Animated.Text style={[styles.heroTitle]}>
              Find Your Missed Ones
            </Animated.Text>
            <Text style={styles.heroSubtitle}>
              Helping you find missing family members and reconnect with your loved ones.
            </Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={[styles.heroButton, styles.searchButton]}
                onPress={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Ionicons name={isSearchOpen ? 'close' : 'search'} size={20} color="#1e3a8a" />
                <Text style={styles.searchButtonText}>
                  {isSearchOpen ? 'Close Search' : 'Search Missing'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroButton, styles.profilesButton]}
                onPress={() => {
                  // Scroll to profiles section
                }}
              >
                <Text style={styles.profilesButtonText}>View Profiles</Text>
                <Ionicons name="arrow-down" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Match Suggestions Alert */}
        {highConfidenceMatches.length > 0 && (
          <LinearGradient
            colors={['#f0fdf4', '#eff6ff']}
            style={styles.matchAlert}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.matchAlertContent}>
              <Ionicons name="people" size={20} color="#22c55e" />
              <Text style={styles.matchAlertText}>
                We found {highConfidenceMatches.length} potential{' '}
                {highConfidenceMatches.length === 1 ? 'match' : 'matches'} with high confidence!
              </Text>
              <TouchableOpacity
                style={styles.matchAlertButton}
                onPress={() => {
                  setMatchSuggestions(highConfidenceMatches);
                  setIsMatchModalOpen(true);
                }}
              >
                <Text style={styles.matchAlertButtonText}>View Matches</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* Search Component */}
        {isSearchOpen && <SearchComponent />}

        {/* Missing Persons Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MISSING PERSON PROFILES</Text>
            <View style={styles.sectionUnderline} />
            {foundPersons.length > 0 && (
              <TouchableOpacity
                style={styles.jumpButton}
                onPress={() => {
                  // Scroll to found persons section
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.jumpButtonText}>View Found Persons</Text>
                <Ionicons name="arrow-down" size={14} color="#16a34a" />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#2563eb" />
          ) : (
            <>
              <FlatList
                data={missingPersons.slice(0, visibleCards)}
                keyExtractor={(item, index) => `missing-${item.id || index}`}
                renderItem={renderPersonCard}
                numColumns={2}
                columnWrapperStyle={styles.cardRow}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No missing persons found.</Text>
                  </View>
                }
              />
              {visibleCards < missingPersons.length && (
                <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                  <Text style={styles.loadMoreText}>Show More Missing Persons</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Found Persons Section */}
        {foundPersons.length > 0 && (
          <View style={[styles.section, styles.foundSection]}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  // Scroll to missing persons section
                }}
              >
                <Ionicons name="arrow-up" size={16} color="#2563eb" />
                <Text style={styles.backButtonText}>Back to Missing Persons</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, styles.foundTitle]}>FOUND PERSON PROFILES</Text>
              <View style={[styles.sectionUnderline, styles.foundUnderline]} />
              <Text style={styles.foundDescription}>
                These individuals have been successfully located and reunited with their families.
              </Text>
            </View>

            <FlatList
              data={showFoundPersons ? foundPersons : foundPersons.slice(0, 4)}
              keyExtractor={(item, index) => `found-${item.id || index}`}
              renderItem={({ item }) => <Card person={item} />}
              numColumns={2}
              columnWrapperStyle={styles.cardRow}
              scrollEnabled={false}
            />

            {!showFoundPersons && foundPersons.length > 4 && (
              <TouchableOpacity
                style={[styles.loadMoreButton, styles.foundLoadMore]}
                onPress={() => setShowFoundPersons(true)}
              >
                <Text style={styles.loadMoreText}>Show More Found Persons</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Statistics Section */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FAMILY REUNITING STATISTICS</Text>
            <View style={styles.sectionUnderline} />
            <Text style={styles.statsDescription}>
              Our platform has helped countless families reconnect with their loved ones.
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              title="Missing Persons"
              value={statistics.missingCount}
              icon="people"
              color="#2563eb"
              delay={0.1}
            />
            <StatCard
              title="Found Persons"
              value={statistics.foundCount}
              icon="person-check"
              color="#16a34a"
              delay={0.2}
            />
            <StatCard
              title="Active Searches"
              value={statistics.activeSearches}
              icon="search"
              color="#9333ea"
              delay={0.3}
            />
            <StatCard
              title="Total Reports"
              value={statistics.totalReports}
              icon="document-text"
              color="#ca8a04"
              delay={0.4}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Donate Button */}
      <TouchableOpacity
        style={styles.donateButton}
        onPress={() => setIsDonateModalOpen(true)}
      >
        <LinearGradient
          colors={['#14b8a6', '#3b82f6']}
          style={styles.donateButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="heart" size={20} color="white" />
          <Text style={styles.donateButtonText}>Donate</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Donation Modal */}
      <Modal
        visible={isDonateModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDonateModalOpen(false)}
      >
        <BlurView intensity={30} style={styles.modalOverlay} tint="light">
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#2563eb', '#9333ea', '#14b8a6']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="heart" size={32} color="white" />
                </View>
                <Text style={styles.modalTitle}>Support Our Mission</Text>
                <Text style={styles.modalSubtitle}>Help reunite families with their loved ones</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsDonateModalOpen(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.inspirationCard}>
                <Text style={styles.inspirationText}>ሰው ለመርዳት ሰው መሆን በቂ ነው!!</Text>
                <Text style={styles.inspirationSubtext}>
                  "Being human is enough to help humanity"
                </Text>
              </View>

              <Text style={styles.orgName}>MEKODONIA CHARITY ASSOCIATION</Text>

              <View style={styles.bankDetails}>
                <Text style={styles.bankTitle}>
                  <Ionicons name="card" size={16} color="#374151" /> Bank Transfer Details
                </Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account Number</Text>
                  <Text style={styles.bankValue}>1000435743122</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank Name</Text>
                  <Text style={styles.bankValue}>Commercial Bank of Ethiopia</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>SWIFT Code</Text>
                  <Text style={styles.bankValue}>SBININBB104</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>IFSC Code</Text>
                  <Text style={styles.bankValue}>SBIN0000691</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCloseFooter]}
                onPress={() => setIsDonateModalOpen(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDonateButton]}
                onPress={() => setIsDonateModalOpen(false)}
              >
                <Ionicons name="heart" size={16} color="white" />
                <Text style={styles.modalDonateButtonText}>Thank You</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Match Suggestions Modal */}
      <Modal
        visible={isMatchModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsMatchModalOpen(false)}
      >
        <BlurView intensity={30} style={styles.modalOverlay} tint="light">
          <View style={[styles.modalContainer, styles.matchModalContainer]}>
            <LinearGradient
              colors={['#16a34a', '#3b82f6']}
              style={styles.matchModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.matchModalTitle}>
                {selectedPerson
                  ? `Potential Matches for ${selectedPerson.name}`
                  : 'Potential Matches Found'}
              </Text>
              <TouchableOpacity onPress={() => setIsMatchModalOpen(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.matchModalBody}>
              {isLoadingMatches ? (
                <ActivityIndicator style={styles.loader} size="large" color="#16a34a" />
              ) : matchSuggestions.length > 0 ? (
                <>
                  <Text style={styles.matchModalDescription}>
                    We've found potential matches based on name, age, location, and other details.
                  </Text>
                  {matchSuggestions.map((match) => (
                    <View key={match.id} style={styles.matchCard}>
                      <Image
                        source={{ uri: match.photo || 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Missing-person-icon.jpg' }}
                        style={styles.matchImage}
                      />
                      <View style={styles.matchDetails}>
                        <View style={styles.matchHeader}>
                          <Text style={styles.matchName}>{match.name}</Text>
                          <View style={[
                            styles.confidenceBadge,
                            match.confidenceScore >= 90 ? styles.highConfidence :
                              match.confidenceScore >= 75 ? styles.mediumConfidence :
                                styles.lowConfidence
                          ]}>
                            <Ionicons name="pie-chart" size={12} color="white" />
                            <Text style={styles.confidenceText}>{match.confidenceScore}%</Text>
                          </View>
                        </View>
                        <View style={styles.matchInfoRow}>
                          <Text style={styles.matchInfoLabel}>Age:</Text>
                          <Text style={styles.matchInfoValue}>{match.age || 'Unknown'}</Text>
                        </View>
                        <View style={styles.matchInfoRow}>
                          <Text style={styles.matchInfoLabel}>Sex:</Text>
                          <Text style={styles.matchInfoValue}>{match.sex || 'Unknown'}</Text>
                        </View>
                        <View style={styles.matchInfoRow}>
                          <Text style={styles.matchInfoLabel}>Location:</Text>
                          <Text style={styles.matchInfoValue}>{match.location || 'Unknown'}</Text>
                        </View>
                        <View style={styles.matchActions}>
                          <TouchableOpacity
                            style={[styles.matchActionButton, styles.confirmButton]}
                            onPress={() => updateMatchStatus(match.id, 'confirmed')}
                            disabled={match.status !== 'pending'}
                          >
                            <Ionicons name="checkmark" size={16} color="white" />
                            <Text style={styles.matchActionText}>Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.matchActionButton, styles.rejectButton]}
                            onPress={() => updateMatchStatus(match.id, 'rejected')}
                            disabled={match.status !== 'pending'}
                          >
                            <Ionicons name="close" size={16} color="white" />
                            <Text style={styles.matchActionText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noMatchesText}>No match suggestions found.</Text>
              )}
              <TouchableOpacity
                style={styles.closeMatchModalButton}
                onPress={() => setIsMatchModalOpen(false)}
              >
                <Text style={styles.closeMatchModalText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
  },
  searchButton: {
    backgroundColor: 'white',
  },
  searchButtonText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  profilesButton: {
    backgroundColor: '#2563eb',
  },
  profilesButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  matchAlert: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  matchAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  matchAlertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  matchAlertButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  matchAlertButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  foundSection: {
    backgroundColor: '#f0fdf4',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  foundTitle: {
    color: '#166534',
  },
  sectionUnderline: {
    width: 96,
    height: 4,
    backgroundColor: '#2563eb',
    borderRadius: 2,
    marginVertical: 12,
  },
  foundUnderline: {
    backgroundColor: '#22c55e',
  },
  jumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    gap: 8,
    marginTop: 12,
  },
  jumpButtonText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  foundDescription: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    marginTop: 8,
  },
  statsDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    width: (width - 48) / 2,
    position: 'relative',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
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
  foundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  foundText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  matchBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    marginTop: 16,
    gap: 8,
  },
  foundLoadMore: {
    backgroundColor: '#16a34a',
  },
  loadMoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  statValueContainer: {
    minHeight: 48,
    justifyContent: 'center',
  },
  countText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  donateButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  donateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 32,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: height * 0.85,
  },
  modalHeader: {
    padding: 20,
    position: 'relative',
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalHeaderIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalBody: {
    padding: 20,
  },
  inspirationCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 20,
  },
  inspirationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 8,
  },
  inspirationSubtext: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  bankDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bankLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseFooter: {
    backgroundColor: '#6b7280',
  },
  modalDonateButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalDonateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  matchModalContainer: {
    maxHeight: height * 0.9,
  },
  matchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  matchModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  matchModalBody: {
    padding: 20,
    maxHeight: height * 0.7,
  },
  matchModalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  matchDetails: {
    flex: 1,
    padding: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  highConfidence: {
    backgroundColor: '#22c55e',
  },
  mediumConfidence: {
    backgroundColor: '#3b82f6',
  },
  lowConfidence: {
    backgroundColor: '#eab308',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  matchInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  matchInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    width: 60,
  },
  matchInfoValue: {
    fontSize: 12,
    color: '#374151',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  matchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  matchActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  noMatchesText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 32,
  },
  closeMatchModalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  closeMatchModalText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    paddingVertical: 40,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  searchLoader: {
    marginTop: 16,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 16,
  },
});

export default Homepage;