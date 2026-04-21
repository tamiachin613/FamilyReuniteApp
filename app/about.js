import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const AboutPage = () => {
    const features = [
        {
            icon: 'search-outline',
            title: 'Advanced Search',
            description: 'Powerful search algorithms to help locate missing persons using multiple criteria and matching systems.'
        },
        {
            icon: 'people-outline',
            title: 'Community Support',
            description: 'A network of volunteers, family members, and professionals working together to reunite families.'
        },
        {
            icon: 'shield-outline',
            title: 'Secure Platform',
            description: 'Industry-standard security measures to protect sensitive information and ensure user privacy.'
        },
        {
            icon: 'help-buoy-outline',
            title: '24/7 Support',
            description: 'Round-the-clock assistance for urgent cases and ongoing support for families in need.'
        }
    ];

    const stats = [
        { icon: 'people', number: '1,000+', label: 'Families Helped' },
        { icon: 'globe-outline', number: '50+', label: 'Countries Reached' },
        { icon: 'trending-up', number: '85%', label: 'Success Rate' },
        { icon: 'time-outline', number: '24/7', label: 'Support Available' }
    ];

    const steps = [
        { number: '1', title: 'Report', description: 'Create an account and submit a detailed missing person report with photos and information', color: '#3b82f6' },
        { number: '2', title: 'Search', description: 'Our community and advanced algorithms work together to search and identify potential matches', color: '#10b981' },
        { number: '3', title: 'Reunite', description: 'When matches are found, we facilitate safe communication and coordinate reunification efforts', color: '#8b5cf6' }
    ];

    const coreValues = [
        'Compassion and empathy',
        'Privacy and security',
        'Community collaboration',
        'Innovation and technology'
    ];

    const valueColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#f9fafb', '#ffffff']}
                style={styles.gradientBackground}
            >
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <View style={styles.heroIconContainer}>
                        <LinearGradient
                            colors={['#dbeafe', '#bfdbfe']}
                            style={styles.heroIconGradient}
                        >
                            <Ionicons name="heart" size={40} color="#2563eb" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.title}>About Family Reunite</Text>
                    <Text style={styles.subtitle}>
                        We are dedicated to reuniting families and bringing missing loved ones home.
                        Our platform combines technology, community support, and compassion to help families find their missing members.
                    </Text>
                </View>

                {/* Mission Section */}
                <View style={styles.section}>
                    <View style={styles.missionCard}>
                        <View style={styles.missionIconContainer}>
                            <LinearGradient
                                colors={['#d1fae5', '#a7f3d0']}
                                style={styles.missionIconGradient}
                            >
                                <Ionicons name="bulb-outline" size={32} color="#059669" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.sectionTitle}>Our Mission</Text>

                        <View style={styles.missionContent}>
                            <View style={styles.missionTextContainer}>
                                <Text style={styles.missionText}>
                                    Family Reunite was born from the understanding that every family deserves to be whole.
                                    We believe that no one should have to face the pain of a missing loved one alone.
                                </Text>
                                <Text style={styles.missionText}>
                                    Our mission is to provide a comprehensive, secure, and user-friendly platform that
                                    connects families with the resources, community support, and technology they need
                                    to find their missing members.
                                </Text>
                                <Text style={styles.missionText}>
                                    We work tirelessly to ensure that every missing person report receives the attention
                                    it deserves and that families have access to the tools and support they need during
                                    their most difficult times.
                                </Text>
                            </View>

                            <LinearGradient
                                colors={['#eff6ff', '#ecfdf5']}
                                style={styles.valuesCard}
                            >
                                <Text style={styles.valuesTitle}>Our Core Values</Text>
                                {coreValues.map((value, index) => (
                                    <View key={index} style={styles.valueItem}>
                                        <View style={[styles.valueDot, { backgroundColor: valueColors[index % valueColors.length] }]} />
                                        <Text style={styles.valueText}>{value}</Text>
                                    </View>
                                ))}
                            </LinearGradient>
                        </View>
                    </View>
                </View>

                {/* Features Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How We Help</Text>
                    <Text style={styles.sectionSubtitle}>
                        Our platform provides comprehensive tools and support to maximize the chances of successful reunification
                    </Text>

                    <View style={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureCard}>
                                <LinearGradient
                                    colors={['#dbeafe', '#bfdbfe']}
                                    style={styles.featureIconContainer}
                                >
                                    <Ionicons name={feature.icon} size={24} color="#2563eb" />
                                </LinearGradient>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Statistics Section */}
                <View style={styles.section}>
                    <LinearGradient
                        colors={['#2563eb', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statsCard}
                    >
                        <Text style={styles.statsTitle}>Our Impact</Text>
                        <Text style={styles.statsSubtitle}>
                            Together, we're making a difference in reuniting families worldwide
                        </Text>

                        <View style={styles.statsGrid}>
                            {stats.map((stat, index) => (
                                <View key={index} style={styles.statItem}>
                                    <View style={styles.statIconContainer}>
                                        <Ionicons name={stat.icon} size={32} color="white" />
                                    </View>
                                    <Text style={styles.statNumber}>{stat.number}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </LinearGradient>
                </View>

                {/* How It Works Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <Text style={styles.sectionSubtitle}>
                        Our streamlined process makes it easy to report missing persons and coordinate search efforts
                    </Text>

                    <View style={styles.stepsContainer}>
                        {steps.map((step, index) => (
                            <View key={index} style={styles.stepCard}>
                                <LinearGradient
                                    colors={[`${step.color}20`, `${step.color}10`]}
                                    style={styles.stepNumberContainer}
                                >
                                    <Text style={[styles.stepNumber, { color: step.color }]}>{step.number}</Text>
                                </LinearGradient>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDescription}>{step.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Call to Action Section */}
                <View style={styles.section}>
                    <LinearGradient
                        colors={['#1f2937', '#111827']}
                        style={styles.ctaCard}
                    >
                        <Text style={styles.ctaTitle}>Join Our Mission</Text>
                        <Text style={styles.ctaSubtitle}>
                            Whether you're looking for a missing loved one or want to help others,
                            you can make a difference in reuniting families.
                        </Text>
                        <View style={styles.ctaButtons}>
                            <TouchableOpacity
                                style={styles.ctaPrimaryButton}
                                onPress={() => router.push('/register')}
                            >
                                <Text style={styles.ctaPrimaryText}>Get Started</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.ctaSecondaryButton}
                                onPress={() => router.push('/contact')}
                            >
                                <Text style={styles.ctaSecondaryText}>Contact Us</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </LinearGradient>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    gradientBackground: {
        flex: 1,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 48,
    },
    heroIconContainer: {
        marginBottom: 24,
    },
    heroIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 600,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 48,
    },
    missionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    missionIconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    missionIconGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    missionContent: {
        marginTop: 16,
    },
    missionTextContainer: {
        marginBottom: 24,
    },
    missionText: {
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 24,
        marginBottom: 16,
    },
    valuesCard: {
        borderRadius: 12,
        padding: 20,
    },
    valuesTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    valueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    valueDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    valueText: {
        fontSize: 15,
        color: '#4b5563',
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
        maxWidth: 600,
        alignSelf: 'center',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureCard: {
        width: (width - 56) / 2,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    statsCard: {
        borderRadius: 16,
        padding: 32,
    },
    statsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    statsSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: (width - 88) / 2,
        alignItems: 'center',
        marginBottom: 24,
    },
    statIconContainer: {
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    stepsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    stepCard: {
        width: (width - 56) / 2,
        alignItems: 'center',
        marginBottom: 24,
    },
    stepNumberContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    stepNumber: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 18,
    },
    ctaCard: {
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 12,
    },
    ctaSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    ctaButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    ctaPrimaryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    ctaPrimaryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    ctaSecondaryButton: {
        borderWidth: 1,
        borderColor: 'white',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    ctaSecondaryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AboutPage;