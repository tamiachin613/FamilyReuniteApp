import { Stack } from 'expo-router';

export default function MissedPersonLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="status-update" options={{ title: 'Status Update' }} />
            <Stack.Screen name="match-suggestions" options={{ title: 'Match Suggestions' }} />
            <Stack.Screen name="messaging" options={{ title: 'Messages' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="upload-profile" options={{ title: 'Upload Profile' }} />
            <Stack.Screen name="contact-info" options={{ title: 'Contact Info' }} />
            <Stack.Screen name="edit-report/[id]" options={{ title: 'Edit Report' }} />
        </Stack>
    );
}