import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const NewsDetailPage = () => {
  const { id } = useLocalSearchParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      // Fetch the news article details
      const response = await fetch(`http://localhost:5000/api/news/${id}`);
      if (!response.ok) {
        throw new Error('News article not found');
      }
      const data = await response.json();
      setNews(data);

      // Mark the news article as read
      await fetch(`http://localhost:5000/api/news/read/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Fetch related articles
      const relatedResponse = await fetch(
        `http://localhost:5000/api/news/${id}/related`
      );
      if (relatedResponse.ok) {
        const relatedData = await relatedResponse.json();
        setRelatedArticles(relatedData);
      }

      // Check if article is saved
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const savedResponse = await fetch(
          `http://localhost:5000/api/news/${id}/saved`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          setIsSaved(savedData.saved);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUrl = () => {
    // For React Native, we'll use a deep link or web URL
    return `myapp://news/${id}`;
  };

  const getShareText = () => {
    return `Check out this article: ${news?.title || 'News Article'}`;
  };

  const handleSocialShare = async (platform) => {
    const url = getCurrentUrl();
    const text = getShareText();

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        return;
    }

    try {
      await Linking.openURL(shareUrl);
    } catch (error) {
      Alert.alert('Error', 'Unable to open sharing dialog');
    }
  };

  const handleNativeShare = async () => {
    try {
      const result = await Share.share({
        message: `${getShareText()}\n${getCurrentUrl()}`,
        title: news?.title,
      });
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to share article');
    }
  };

  const handleSaveArticle = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      Alert.alert('Login Required', 'Please login to save articles', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    setSaveLoading(true);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:5000/api/news/${id}/save`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        const message = isSaved
          ? 'Article removed from saved items'
          : 'Article saved successfully';
        Alert.alert('Success', message);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to save article');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: getCurrentUrl(),
      });
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Article Not Found</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.push('/news')}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.errorButtonText}>Back to News</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const paragraphs = news?.excerpt ? news.excerpt.split('\n') : [];
  const imageUrl = news?.image
    ? `http://localhost:5000/${news.image.replace(/\\/g, '/')}`
    : 'https://via.placeholder.com/800x400/1e3a8a/ffffff?text=News+Image';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Image Background */}
      <View style={styles.heroSection}>
        <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <View style={styles.heroContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/news')}
            >
              <Ionicons name="arrow-back" size={18} color="white" />
              <Text style={styles.backButtonText}>Back to News</Text>
            </TouchableOpacity>

            <Text style={styles.heroTitle}>{news?.title}</Text>

            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <View style={styles.metaIcon}>
                  <Ionicons name="person" size={14} color="white" />
                </View>
                <Text style={styles.metaText}>{news?.postedBy}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#93c5fd" />
                <Text style={styles.metaText}>
                  {news?.date ? new Date(news.date).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={14} color="#93c5fd" />
                <Text style={styles.metaText}>{news?.views || 0} views</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Article Content */}
      <View style={styles.contentContainer}>
        <View style={styles.articleCard}>
          <View style={styles.articleContent}>
            {/* Social Share Section */}
            <View style={styles.shareSection}>
              <Text style={styles.shareLabel}>Share this article:</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleSocialShare('facebook')}
                >
                  <Ionicons name="logo-facebook" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, styles.twitterButton]}
                  onPress={() => handleSocialShare('twitter')}
                >
                  <Ionicons name="logo-twitter" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, styles.linkedinButton]}
                  onPress={() => handleSocialShare('linkedin')}
                >
                  <Ionicons name="logo-linkedin" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, styles.whatsappButton]}
                  onPress={() => handleSocialShare('whatsapp')}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, styles.shareButton]}
                  onPress={handleNativeShare}
                >
                  <Ionicons name="share-social" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Excerpt Section */}
            {paragraphs.length > 0 && (
              <View style={styles.excerptContainer}>
                {paragraphs.map((paragraph, index) => (
                  <Text key={index} style={styles.excerptText}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            )}

            {/* Main Content */}
            <View style={styles.contentText}>
              <Text style={styles.contentParagraph}>{news?.content}</Text>
            </View>

            {/* Tags Section */}
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>News</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Updates</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Family Reuniting</Text>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveArticle}
                disabled={saveLoading}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? '#2563eb' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.saveButtonText,
                    isSaved && styles.saveButtonTextActive,
                  ]}
                >
                  {saveLoading
                    ? 'Saving...'
                    : isSaved
                    ? 'Saved'
                    : 'Save for later'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Back to News Button */}
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.backToNewsButton}
            onPress={() => router.push('/news')}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.backToNewsText}>Back to News</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareArticleButton}
            onPress={handleNativeShare}
          >
            <Ionicons name="share-social" size={20} color="#374151" />
            <Text style={styles.shareArticleText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="newspaper-outline" size={24} color="#2563eb" />
              <Text style={styles.relatedTitle}>Related Articles</Text>
            </View>

            <View style={styles.relatedGrid}>
              {relatedArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.relatedCard}
                  onPress={() => router.push(`/news/${article.id}`)}
                >
                  <Image
                    source={{
                      uri: article.image
                        ? `http://localhost:5000/${article.image.replace(/\\/g, '/')}`
                        : 'https://via.placeholder.com/120x80/1e3a8a/ffffff?text=News',
                    }}
                    style={styles.relatedImage}
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedArticleTitle} numberOfLines={2}>
                      {article.title}
                    </Text>
                    <Text style={styles.relatedExcerpt} numberOfLines={2}>
                      {article.excerpt || 'Read more about this article...'}
                    </Text>
                    <View style={styles.relatedMeta}>
                      <Ionicons name="time-outline" size={12} color="#6b7280" />
                      <Text style={styles.relatedDate}>
                        {article.date ? new Date(article.date).toLocaleDateString() : 'Unknown'}
                      </Text>
                      <Ionicons name="eye-outline" size={12} color="#6b7280" />
                      <Text style={styles.relatedViews}>
                        {article.views || 0} views
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Article</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Article Link</Text>
              <View style={styles.linkContainer}>
                <TextInput
                  style={styles.linkInput}
                  value={getCurrentUrl()}
                  editable={false}
                />
                <TouchableOpacity
                  style={[styles.copyButton, copySuccess && styles.copyButtonSuccess]}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.copyButtonText}>
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSocialButtons}>
                <TouchableOpacity
                  style={[styles.modalSocialButton, styles.modalFacebook]}
                  onPress={() => {
                    handleSocialShare('facebook');
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons name="logo-facebook" size={20} color="white" />
                  <Text style={styles.modalSocialText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSocialButton, styles.modalTwitter]}
                  onPress={() => {
                    handleSocialShare('twitter');
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons name="logo-twitter" size={20} color="white" />
                  <Text style={styles.modalSocialText}>Twitter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSocialButton, styles.modalLinkedin]}
                  onPress={() => {
                    handleSocialShare('linkedin');
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons name="logo-linkedin" size={20} color="white" />
                  <Text style={styles.modalSocialText}>LinkedIn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSocialButton, styles.modalWhatsapp]}
                  onPress={() => {
                    handleSocialShare('whatsapp');
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text style={styles.modalSocialText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  errorButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  heroSection: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    lineHeight: 40,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  metaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    color: 'white',
    fontSize: 12,
  },
  contentContainer: {
    marginTop: -30,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  articleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  articleContent: {
    padding: 20,
  },
  shareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  shareLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
  },
  twitterButton: {
    backgroundColor: '#1da1f2',
  },
  linkedinButton: {
    backgroundColor: '#0077b5',
  },
  whatsappButton: {
    backgroundColor: '#25d366',
  },
  shareButton: {
    backgroundColor: '#6b7280',
  },
  excerptContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 24,
  },
  excerptText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  contentText: {
    marginBottom: 24,
  },
  contentParagraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  saveButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButtonTextActive: {
    color: '#2563eb',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  backToNewsButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToNewsText: {
    color: 'white',
    fontWeight: '600',
  },
  shareArticleButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareArticleText: {
    color: '#374151',
    fontWeight: '600',
  },
  relatedSection: {
    marginTop: 32,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  relatedGrid: {
    gap: 12,
  },
  relatedCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  relatedContent: {
    flex: 1,
    padding: 12,
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  relatedExcerpt: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relatedDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  relatedViews: {
    fontSize: 10,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width - 40,
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  linkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    backgroundColor: '#f9fafb',
  },
  copyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  copyButtonSuccess: {
    backgroundColor: '#22c55e',
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  modalSocialButtons: {
    gap: 12,
  },
  modalSocialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modalFacebook: {
    backgroundColor: '#1877f2',
  },
  modalTwitter: {
    backgroundColor: '#1da1f2',
  },
  modalLinkedin: {
    backgroundColor: '#0077b5',
  },
  modalWhatsapp: {
    backgroundColor: '#25d366',
  },
  modalSocialText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default NewsDetailPage;