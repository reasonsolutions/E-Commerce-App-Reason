import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Profile = {
    CustomerProfileCode: number;
    CustomerName: string;
    Address: string;
    StreetName: string;
    CityName: string;
    Zipcode: number;
    CountryCode: number;
    MobileNumber: number;
    EmailID: string;
    CartDetailsCount: number
};

type ProfileScreenProps = {
    navigation: {
        navigate: (screen: string) => void;
    };
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                setProfile({
                    CustomerProfileCode: parsed.CustomerProfileCode,
                    CustomerName: parsed.CustomerName,
                    Address: parsed.Address,
                    StreetName: parsed.StreetName,
                    CityName: parsed.CityName,
                    Zipcode: parsed.Zipcode,
                    CountryCode: parsed.CountryCode,
                    MobileNumber: parsed.MobileNumber,
                    EmailID: parsed.EmailID,
                    CartDetailsCount: parsed.CartDetailsCount,
                });
            }
        };
        fetchProfile();
    }, []);

    return (
        <View style={styles.container}>
            {/* Profile Info Section */}
            <View style={{ alignItems: 'center', width: '100%', marginBottom: 18 }}>
                <Text style={styles.name}>{profile?.CustomerName || 'John Doe'}</Text>
                <Text style={styles.email}>{profile?.EmailID || 'john.doe@email.com'}</Text>
            </View>

            {/* Info Card */}
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    padding: 20,
                    width: '100%',
                    marginBottom: 24,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                }}
            >
                <Text style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>Address: </Text>
                    {profile?.Address || '123 Main St'}
                </Text>
                <Text style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>City: </Text>
                    {profile?.CityName || 'City'}
                </Text>
                <Text style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>Zipcode: </Text>
                    {profile?.Zipcode || '00000'}
                </Text>
                <Text style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>Mobile: </Text>
                    {profile?.MobileNumber || '0000000000'}
                </Text>
            </View>

            {/* Cart Details */}
            
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('OrderScreen')}
            >
                <Text style={styles.buttonText}>View your Orders</Text>
            </TouchableOpacity>
        <TouchableOpacity
            style={[styles.button, { backgroundColor: '#d32f2f', marginTop: 12 }]}
            onPress={async () => {
                await AsyncStorage.removeItem('userData');
                navigation.navigate('Login');
            }}
        >
            <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        marginTop: 0,
        paddingVertical: 32,
        paddingHorizontal: 16,
        borderRadius: 0,
        backgroundColor: '#f8f9fa',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 8 },
        alignItems: 'center',
        paddingTop: StatusBar.currentHeight || 0,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e3e6ea',
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#0078D4',
    },
    avatarImg: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 42,
        color: '#0078D4',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 6,
        color: '#222',
        textAlign: 'center',
    },
    email: {
        fontSize: 16,
        color: '#555',
        marginBottom: 28,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#0078D4',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 10,
        marginTop: 16,
        shadowColor: '#0078D4',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 17,
        letterSpacing: 0.5,
    },
});

export default ProfileScreen;