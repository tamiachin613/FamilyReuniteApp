import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const Login = () => {
    const params = useLocalSearchParams();
    const navigation = useNavigation();
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Check if we have a pre-filled email from registration
    useEffect(() => {
        if (params.verifiedEmail) {
            setCredentials((prev) => ({
                ...prev,
                email: params.verifiedEmail,
            }));

            // Show success message if provided
            if (params.message) {
                setMessage({
                    type: 'success',
                    text: params.message,
                });
            }
        }
    }, [params.verifiedEmail, params.message]);

    // Function to determine redirect path based on user role
    const getRedirectPath = (role) => {
        // If we have a specific redirect path from registration, use that
        if (params.redirectAfterLogin) {
            return params.redirectAfterLogin;
        }

        // Otherwise determine based on role
        switch (role) {
            case 'Family Member':
                return '/family';
            case 'Volunteer':
                return '/voluntary';
            case 'Missed Person':
                return '/missedperson';
            case 'Admin':
                return '/admin';
            default:
                return '/';
        }
    };

    const handleChange = (name, value) => {
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async () => {
        if (!credentials.email || !credentials.password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Using fetch instead of axios
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials. Please try again.');
            }

            // Store token in AsyncStorage
            await AsyncStorage.setItem('token', data.token);

            // Decode token to get user role
            const decodedToken = jwtDecode(data.token);
            const userRole = decodedToken.role;

            // Store user role in AsyncStorage
            await AsyncStorage.setItem('userType', userRole);

            setMessage({
                type: 'success',
                text: `Login successful! Redirecting to your dashboard...`,
            });

            // Redirect after a short delay
            setTimeout(() => {
                const redirectPath = getRedirectPath(userRole);
                router.replace(redirectPath);
            }, 1500);
        } catch (err) {
            console.error('Login error:', err);
            Alert.alert(
                'Login Failed',
                err.message || 'Invalid credentials. Please try again.'
            );
            setMessage({
                type: 'error',
                text: err.message || 'Invalid credentials. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

                    {message.text ? (
                        <View
                            style={[
                                styles.messageContainer,
                                message.type === 'success' ? styles.successMessage : styles.errorMessage,
                            ]}
                        >
                            <Text
                                style={
                                    message.type === 'success' ? styles.successText : styles.errorText
                                }
                            >
                                {message.type === 'success' ? '✓ ' : '✕ '}
                                {message.text}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#9ca3af"
                                value={credentials.email}
                                onChangeText={(value) => handleChange('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.passwordHeader}>
                                <Text style={styles.label}>Password</Text>
                                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#9ca3af"
                                value={credentials.password}
                                onChangeText={(value) => handleChange('password', value)}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text style={styles.buttonText}>Signing in...</Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={styles.signupLink}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f3ff',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#3730a3',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 24,
    },
    messageContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    successMessage: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    errorMessage: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    successText: {
        color: '#166534',
        fontSize: 14,
    },
    errorText: {
        color: '#991b1b',
        fontSize: 14,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    forgotPassword: {
        fontSize: 12,
        color: '#4f46e5',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    button: {
        backgroundColor: '#4f46e5',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#818cf8',
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    signupLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4f46e5',
    },
});

export default Login;