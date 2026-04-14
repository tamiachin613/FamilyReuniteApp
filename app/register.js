import { router } from 'expo-router';
import { useState } from 'react';
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

const Register = () => {
    const [step, setStep] = useState(1);
    const [user, setUser] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Family Member',
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerificationForm, setShowVerificationForm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Function to determine redirect path based on user role
    const getRedirectPath = (role) => {
        switch (role) {
            case 'Family Member':
                return '/family';
            case 'Volunteer':
                return '/voluntary';
            case 'Missed Person':
                return '/missedperson';
            default:
                return '/login';
        }
    };

    // Password strength validation function
    const validatePassword = (password) => {
        const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (password.length < 8) {
            setPasswordError('Password should be at least 8 characters long.');
            setPasswordSuccess('');
            return false;
        } else if (!strongPasswordRegex.test(password)) {
            setPasswordError(
                'Password must include at least one letter, one number, and one special character.'
            );
            setPasswordSuccess('');
            return false;
        } else {
            setPasswordError('');
            setPasswordSuccess('Strong password!');
            return true;
        }
    };

    // Handle next step in multi-step form
    const handleNextStep = () => {
        if (step === 1 && (!user.username || !user.email)) {
            Alert.alert('Error', 'Please fill in all fields before proceeding.');
            return;
        }

        if (step === 2) {
            if (!validatePassword(user.password)) {
                return;
            }

            if (user.password !== user.confirmPassword) {
                setConfirmPasswordError('Passwords do not match.');
                return;
            } else {
                setConfirmPasswordError('');
            }
        }

        setMessage({ type: '', text: '' });
        setStep(step + 1);
    };

    // Handle previous step in multi-step form
    const handlePrevStep = () => {
        setStep(step - 1);
        setMessage({ type: '', text: '' });
    };

    // Handle form submission
    const handleRegister = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        if (user.password !== user.confirmPassword) {
            setConfirmPasswordError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (!validatePassword(user.password)) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong. Please try again.');
            }

            setMessage({
                type: 'success',
                text: 'Registration successful! Please check your email for the verification code.',
            });
            setShowVerificationForm(true);
        } catch (err) {
            console.error('Error:', err);
            Alert.alert('Registration Failed', err.message || 'Something went wrong. Please try again.');
            setMessage({
                type: 'error',
                text: err.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle verification code submission
    const handleVerifyCode = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5000/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    code: verificationCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid verification code. Please try again.');
            }

            const redirectPath = getRedirectPath(user.role);

            setMessage({
                type: 'success',
                text: `Email verified successfully! Redirecting to ${user.role} dashboard...`,
            });

            setTimeout(() => {
                router.push({
                    pathname: '/login',
                    params: {
                        verifiedEmail: user.email,
                        redirectAfterLogin: redirectPath,
                        message: `Account created successfully! Please log in to access your ${user.role} dashboard.`,
                    },
                });
            }, 3000);
        } catch (err) {
            console.error('Error:', err);
            Alert.alert('Verification Failed', err.message || 'Invalid verification code. Please try again.');
            setMessage({
                type: 'error',
                text: err.message || 'Invalid verification code. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength indicator component
    const PasswordStrengthIndicator = ({ password }) => {
        if (!password) return null;

        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        const getColor = () => {
            if (strength <= 2) return '#ef4444';
            if (strength <= 3) return '#eab308';
            return '#22c55e';
        };

        return (
            <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBackground}>
                    <View
                        style={[
                            styles.strengthBarFill,
                            { width: `${(strength / 5) * 100}%`, backgroundColor: getColor() },
                        ]}
                    />
                </View>
            </View>
        );
    };

    // Progress bar component
    const ProgressBar = () => {
        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressLabels}>
                    {['Account Info', 'Security', 'Role'].map((label, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.progressLabel,
                                index + 1 <= step ? styles.progressLabelActive : styles.progressLabelInactive,
                            ]}
                        >
                            {label}
                        </Text>
                    ))}
                </View>
                <View style={styles.progressBarBackground}>
                    <View
                        style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]}
                    />
                </View>
            </View>
        );
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
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join our community today</Text>

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

                    {!showVerificationForm ? (
                        <View>
                            <ProgressBar />

                            {step === 1 && (
                                <View style={styles.formGroup}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Full Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Welekulu semeneh"
                                            placeholderTextColor="#9ca3af"
                                            value={user.username}
                                            onChangeText={(text) => setUser({ ...user, username: text })}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="welekulu@example.com"
                                            placeholderTextColor="#9ca3af"
                                            value={user.email}
                                            onChangeText={(text) => setUser({ ...user, email: text })}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>
                            )}

                            {step === 2 && (
                                <View style={styles.formGroup}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Create a strong password"
                                            placeholderTextColor="#9ca3af"
                                            value={user.password}
                                            onChangeText={(text) => {
                                                setUser({ ...user, password: text });
                                                validatePassword(text);
                                            }}
                                            secureTextEntry
                                        />
                                        <PasswordStrengthIndicator password={user.password} />
                                        {passwordError ? (
                                            <Text style={styles.errorTextSmall}>{passwordError}</Text>
                                        ) : passwordSuccess ? (
                                            <Text style={styles.successTextSmall}>{passwordSuccess}</Text>
                                        ) : null}
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Confirm Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirm your password"
                                            placeholderTextColor="#9ca3af"
                                            value={user.confirmPassword}
                                            onChangeText={(text) =>
                                                setUser({ ...user, confirmPassword: text })
                                            }
                                            secureTextEntry
                                        />
                                        {confirmPasswordError ? (
                                            <Text style={styles.errorTextSmall}>{confirmPasswordError}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            )}

                            {step === 3 && (
                                <View style={styles.formGroup}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Select Your Role</Text>
                                        <View style={styles.roleContainer}>
                                            {['Family Member', 'Volunteer', 'Missed Person'].map((role) => (
                                                <TouchableOpacity
                                                    key={role}
                                                    style={[
                                                        styles.roleButton,
                                                        user.role === role && styles.roleButtonActive,
                                                    ]}
                                                    onPress={() => setUser({ ...user, role })}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.roleButtonText,
                                                            user.role === role && styles.roleButtonTextActive,
                                                        ]}
                                                    >
                                                        {role === 'Missed Person' ? 'Lost Person' : role}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.submitButton}
                                            onPress={handleRegister}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <View style={styles.loadingContainer}>
                                                    <ActivityIndicator size="small" color="#ffffff" />
                                                    <Text style={styles.buttonText}>Creating Account...</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.buttonText}>Create Account</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <View style={styles.navigationButtons}>
                                {step > 1 && (
                                    <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
                                        <Text style={styles.backButtonText}>Back</Text>
                                    </TouchableOpacity>
                                )}
                                {step < 3 && (
                                    <TouchableOpacity
                                        style={[styles.continueButton, step === 1 && styles.continueButtonFull]}
                                        onPress={handleNextStep}
                                    >
                                        <Text style={styles.continueButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.verificationContainer}>
                            <View style={styles.iconContainer}>
                                <View style={styles.iconCircle}>
                                    <Text style={styles.iconText}>📧</Text>
                                </View>
                            </View>
                            <Text style={styles.verificationTitle}>Verify Your Email</Text>
                            <Text style={styles.verificationText}>
                                We've sent a 4-digit code to {user.email}. Please enter it below
                                to verify your account.
                            </Text>
                            <View style={styles.codeInputContainer}>
                                <TextInput
                                    style={styles.codeInput}
                                    placeholder="0000"
                                    placeholderTextColor="#9ca3af"
                                    value={verificationCode}
                                    onChangeText={(text) =>
                                        setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 4))
                                    }
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    textAlign="center"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={handleVerifyCode}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text style={styles.buttonText}>Verifying...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.buttonText}>Verify Code</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={styles.signinLink}>Sign in</Text>
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
    progressContainer: {
        marginBottom: 24,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    progressLabelActive: {
        color: '#4f46e5',
    },
    progressLabelInactive: {
        color: '#9ca3af',
    },
    progressBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4f46e5',
        borderRadius: 4,
        transition: 'width 0.3s ease',
    },
    formGroup: {
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
    strengthContainer: {
        marginTop: 8,
    },
    strengthBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    errorTextSmall: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    successTextSmall: {
        color: '#22c55e',
        fontSize: 12,
        marginTop: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    roleButtonText: {
        fontSize: 14,
        color: '#374151',
    },
    roleButtonTextActive: {
        color: '#ffffff',
    },
    buttonContainer: {
        paddingTop: 16,
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 12,
        borderRadius: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
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
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4f46e5',
    },
    backButtonText: {
        color: '#4f46e5',
        fontSize: 14,
        fontWeight: '500',
    },
    continueButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: '#4f46e5',
    },
    continueButtonFull: {
        flex: 1,
        marginLeft: 0,
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    verificationContainer: {
        paddingVertical: 16,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 64,
        height: 64,
        backgroundColor: '#e0e7ff',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 32,
    },
    verificationTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1f2937',
    },
    verificationText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    codeInputContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    codeInput: {
        width: 120,
        paddingVertical: 12,
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 4,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        textAlign: 'center',
    },
    verifyButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 12,
        borderRadius: 8,
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
    signinLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4f46e5',
    },
});

export default Register;