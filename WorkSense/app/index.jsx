import { Redirect } from 'expo-router';

export default function Index() {
    // Automatically redirect the user bypass the initial auth screens
    // To get the backend working, you MUST login first to get the token!
    return <Redirect href="/(auth)/login" />;
}