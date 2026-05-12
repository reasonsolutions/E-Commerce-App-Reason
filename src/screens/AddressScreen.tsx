import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, ScreenHeader } from "../components/ui";
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from "../theme";
import { getDeliveryAddresses, postCreateDeliveryAddress, postPlacedMultipleOrder } from "../api/services";
import { postPlacedMultipleOrderInterface, SavedCartItemInterface } from "../api/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from '../config/storageKeys';

export interface DeliveryAddress {
    OrderDeliveryAddressCode: number;
    CustomerName: string;
    MobileNumber: number | string;
    FullAddress: string;
    CustomerProfileCode: number;
    CreatedDate: string;
    UpdatedDate: string | null;
}

type AddressScreenProps = {
    navigation: {
        goBack: () => void;
        navigate: {
            (screen: string): void;
            (screen: string, params: Record<string, any>): void;
        };
    };
    route: {
        params?: {
            cartItems?: SavedCartItemInterface[];
        };
    };
};

const EMPTY_FORM = { CustomerName: '', MobileNumber: '', FullAddress: '' };

const AddressScreen: React.FC<AddressScreenProps> = ({ route, navigation }) => {
    const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
    const [selectedAddressCode, setSelectedAddressCode] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [profileCode, setProfileCode] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
            if (userData) {
                const user = JSON.parse(userData);
                setProfileCode(user.CustomerProfileCode);
                getDeliveryAddresses(user.CustomerProfileCode).then(response => {
                    if (response.statusCode === 1) {
                        const list: DeliveryAddress[] = response.result || [];
                        setAddresses(list);
                        // Auto-select the most recent address
                        if (list.length > 0 && selectedAddressCode === null) {
                            setSelectedAddressCode(list[list.length - 1].OrderDeliveryAddressCode);
                        }
                    }
                });
            }
        };
        fetchData();
    }, []);

    const handleChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAddress = async () => {
        if (!form.CustomerName.trim() || !form.MobileNumber.trim() || !form.FullAddress.trim()) {
            Alert.alert('Missing fields', 'Please fill in all address fields.');
            return;
        }
        if (!profileCode) return;

        setSubmitting(true);
        try {
            const response = await postCreateDeliveryAddress({
                CustomerName: form.CustomerName.trim(),
                MobileNumber: form.MobileNumber.trim(),
                FullAddress: form.FullAddress.trim(),
                CustomerProfileCode: profileCode,
            });
            if (response.statusCode === 1) {
                const refreshed = await getDeliveryAddresses(profileCode);
                if (refreshed.statusCode === 1) {
                    const list: DeliveryAddress[] = refreshed.result || [];
                    setAddresses(list);
                    // Auto-select the newly created address (last in list)
                    if (list.length > 0) {
                        setSelectedAddressCode(list[list.length - 1].OrderDeliveryAddressCode);
                    }
                }
                setForm(EMPTY_FORM);
            } else {
                Alert.alert('Error', 'Failed to save address. Please try again.');
            }
        } catch (err) {
            console.error('Error creating address:', err);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const buyProducts = async () => {
        if (submitting) return;

        if (!selectedAddressCode) {
            Alert.alert('Select address', 'Please select a delivery address before continuing.');
            return;
        }

        const cartItems = route.params?.cartItems;

        if (!cartItems || cartItems.length === 0) {
            Alert.alert('Empty cart', 'Your cart is empty. Please add items before checking out.');
            return;
        }

        if (!cartItems[0].CartMasterCode) {
            Alert.alert('Cart error', 'There was a problem with your cart. Please go back and try again.');
            return;
        }

        if (!profileCode) {
            Alert.alert('Session expired', 'Please log in again to continue.');
            return;
        }

        setSubmitting(true);
        try {
            const transformedArray = cartItems.map((item: SavedCartItemInterface) => ({
                Inventory_Id: item.Inventory_Id,
                Quantity: item.Quantity,
                Amount: item.Price * item.Quantity,
                DeliveryCharges: 0,
                DeliveryChargesVAT: 0,
                ItemCharges: 0,
                ItemChargesVAT: 0,
                Discount: 0,
                VAT: 0,
                OrderStatus: 1,
            }));

            const payload: postPlacedMultipleOrderInterface = {
                CustomerProfileCode: profileCode,
                OrderDeliveryAddressCode: selectedAddressCode,
                BranchCode: 'NULL',
                CountryCode: 'NULL',
                CartMasterCode: cartItems[0].CartMasterCode,
                OrderDetails: transformedArray,
            };

            const response = await postPlacedMultipleOrder(payload);
            navigation.navigate('OrderSuccess', { orderNumber: response.result.OrderNumber });
        } catch (err) {
            console.error('Error placing order:', err);
            Alert.alert('Order failed', 'Could not place your order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScreenHeader title="Choose Address" back onBack={() => navigation.goBack()} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <FlatList
                    data={addresses}
                    keyExtractor={item => String(item.OrderDeliveryAddressCode)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <Text style={styles.sectionTitle}>Saved Addresses</Text>
                    }
                    renderItem={({ item }) => {
                        const isSelected = selectedAddressCode === item.OrderDeliveryAddressCode;
                        return (
                            <TouchableOpacity
                                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                                onPress={() => setSelectedAddressCode(item.OrderDeliveryAddressCode)}
                                activeOpacity={0.82}
                            >
                                <View style={styles.addressCardInner}>
                                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                    <View style={styles.addressText}>
                                        <Text style={styles.addressName}>{item.CustomerName}</Text>
                                        <Text style={styles.addressLine}>{item.FullAddress}</Text>
                                        <Text style={styles.addressMobile}>{item.MobileNumber}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <EmptyState
                            icon={null}
                            title="No saved addresses"
                            body="Add a new address below"
                        />
                    }
                    ListFooterComponent={
                        <View>
                            <Text style={[styles.sectionTitle, { marginTop: Space[6] }]}>Add New Address</Text>
                            <View style={styles.formCard}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full name"
                                    placeholderTextColor={Colors.ink4}
                                    value={form.CustomerName}
                                    onChangeText={text => handleChange('CustomerName', text)}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mobile number"
                                    placeholderTextColor={Colors.ink4}
                                    value={form.MobileNumber}
                                    onChangeText={text => handleChange('MobileNumber', text)}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={[styles.input, styles.inputMultiline]}
                                    placeholder="Full address"
                                    placeholderTextColor={Colors.ink4}
                                    value={form.FullAddress}
                                    onChangeText={text => handleChange('FullAddress', text)}
                                    multiline
                                    numberOfLines={3}
                                />
                                <TouchableOpacity
                                    style={[styles.addBtn, submitting && styles.addBtnDisabled]}
                                    onPress={handleAddAddress}
                                    disabled={submitting}
                                    activeOpacity={0.82}
                                >
                                    <Text style={styles.addBtnText}>
                                        {submitting ? 'Saving…' : 'Save Address'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                />

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.checkoutBtn,
                            (!selectedAddressCode || submitting) && styles.checkoutBtnDisabled,
                        ]}
                        onPress={buyProducts}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.checkoutBtnText}>
                            {submitting ? 'Placing order…' : 'Place Order'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surfaceAlt,
    },
    flex: {
        flex: 1,
    },
    listContent: {
        padding: Space.screenH,
        paddingBottom: Space[4],
    },
    sectionTitle: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.ink1,
        letterSpacing: -0.2,
        marginBottom: Space[3],
    },

    // ── Address cards ──
    addressCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        marginBottom: Space[3],
        ...Shadow.sm,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    addressCardSelected: {
        borderColor: Colors.ink1,
    },
    addressCardInner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Space[4],
        gap: Space[3],
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.ink5,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
        flexShrink: 0,
    },
    radioOuterSelected: {
        borderColor: Colors.ink1,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.ink1,
    },
    addressText: {
        flex: 1,
        gap: 3,
    },
    addressName: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.semibold,
        color: Colors.ink1,
    },
    addressLine: {
        fontSize: FontSize.sm,
        color: Colors.ink3,
        lineHeight: FontSize.sm * 1.45,
    },
    addressMobile: {
        fontSize: FontSize.sm,
        color: Colors.ink4,
    },

    // ── Form ──
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Space[4],
        gap: Space[3],
        ...Shadow.sm,
    },
    input: {
        fontSize: FontSize.base,
        color: Colors.ink1,
        borderWidth: 1,
        borderColor: Colors.line,
        borderRadius: Radius.md,
        paddingHorizontal: Space[3],
        paddingVertical: Space[3],
        backgroundColor: Colors.surfaceAlt,
    },
    inputMultiline: {
        minHeight: 72,
        textAlignVertical: 'top',
    },
    addBtn: {
        backgroundColor: Colors.ink1,
        borderRadius: Radius.md,
        paddingVertical: Space[3] + 2,
        alignItems: 'center',
    },
    addBtnDisabled: {
        opacity: 0.4,
    },
    addBtnText: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.semibold,
        color: '#FFFFFF',
        letterSpacing: -0.1,
    },

    // ── Footer CTA ──
    footer: {
        paddingHorizontal: Space.screenH,
        paddingVertical: Space[4],
        backgroundColor: Colors.surfaceAlt,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.line,
    },
    checkoutBtn: {
        backgroundColor: Colors.ink1,
        borderRadius: Radius.pill,
        paddingVertical: Space[4],
        alignItems: 'center',
    },
    checkoutBtnDisabled: {
        opacity: 0.35,
    },
    checkoutBtnText: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: '#FFFFFF',
        letterSpacing: -0.1,
    },
});

export default AddressScreen;
