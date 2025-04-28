import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../../components/products/BackButton';
import { ROUTES } from '../../router/routes';
import { backendFetchService } from '../../service/BackendFetchService';
import { colorUsages, common, variables } from '../../theme';

export default function AdminLogin() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const isValid = await backendFetchService.verifyAdminToken();
                if (isValid) {
                    router.replace(ROUTES.ADMIN.DASHBOARD);
                }
            } catch (error) {
                // Not authenticated, stay on login page
            }
        };

        checkAuthStatus();
    }, [router]);

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);

        try {
            const response = await backendFetchService.adminLogin({ username, password });

            if (response.success) {
                // Store the token in a cookie (this will be handled by the API)
                // Redirect to admin dashboard
                router.push('/admin/dashboard');
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <View style={styles.backButtonContainer}>
                    <BackButton href={ROUTES.PRODUITS} />
                </View>
                <Text style={styles.title}>Admin Login</Text>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        secureTextEntry
                    />
                </View>
                {error && <Text style={styles.errorMessage}>{error}</Text>}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: variables.spaceXL,
        backgroundColor: colorUsages.background,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        padding: variables.spaceXL,
        backgroundColor: colorUsages.white,
        borderRadius: 8,
        shadowColor: colorUsages.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButtonContainer: {
        position: 'absolute',
        top: variables.spaceXL,
        left: variables.spaceXL,
    },
    title: {
        ...common.text.h1HighlightInfo,
        textAlign: 'center',
        marginBottom: variables.spaceXL,
        marginTop: variables.spaceBig,
    },
    formGroup: {
        marginBottom: variables.spaceBig,
    },
    label: {
        ...common.text.text,
        marginBottom: variables.spaceSmall,
        color: colorUsages.black,
    },
    input: {
        width: '100%',
        padding: variables.space,
        borderWidth: 1,
        borderColor: colorUsages.borderColor,
        borderRadius: 4,
        fontSize: 16,
    },
    button: {
        width: '100%',
        padding: variables.space,
        backgroundColor: colorUsages.primary,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: colorUsages.lightInfo,
    },
    buttonText: {
        ...common.text.text,
        color: colorUsages.white,
    },
    errorMessage: {
        ...common.text.text,
        color: colorUsages.secondary,
        textAlign: 'center',
        marginBottom: variables.space,
    },
});
