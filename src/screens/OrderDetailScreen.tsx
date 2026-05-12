import React, { useCallback } from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { postCnfOrderDetail } from "../api/services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from '../config/storageKeys';
import { Skeleton, SkeletonRow, ScreenHeader } from "../components/ui";
import { ErrorState } from "../components/system";
import { Space, Colors } from "../theme";
import { useAsyncState } from "../hooks/useAsyncState";
type OrderItem = {
    Inventory_Id: number;
    Item_Id: number;
    Variant: string;
    Name: string;
    Images: string;
    Quantity: number;
    Amount: number;
    OrderStatus: number;
    Brand_Id: number;
    Brand_Name: string;
    OrderNumber?: string;
    OrderDate?: string;
    CreatedDate?: string;
};

type DeliveryDetail = {
    OrderDeliveryAddressCode: number;
    CustomerName: string;
    MobileNumber: number;
    FullAddress: string;
    CustomerProfileCode: number;
};

type OrderDetailProps = {
    OrderDetails: OrderItem[];
    DeliveryDetail: DeliveryDetail[];
};

type OrderDetailScreenRouteParams = {
    orderItem: OrderItem;
};

type OrderDetailScreenProps = {
    navigation: StackNavigationProp<any>;
};

const getOrderStatusText = (status: number) => {
    switch (status) {
        case 1:
            return "Placed";
        case 2:
            return "Shipped";
        case 3:
            return "Delivered";
        case 4:
            return "Cancelled";
        default:
            return "Unknown";
    }
};

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation }) => {
    const route = useRoute<RouteProp<{ params: OrderDetailScreenRouteParams }, 'params'>>();
    const orderItem = route.params?.orderItem;
    const orderNumber = orderItem?.OrderNumber;

    const { data: orderDetails, loading, isError, error, run } = useAsyncState<OrderDetailProps>(null);

    const fetchOrderDetails = useCallback(
        (cancelled?: { current: boolean }) =>
            run(async () => {
                const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
                if (!userData) throw new Error('Session expired. Please log in again.');
                const user = JSON.parse(userData);
                const response = await postCnfOrderDetail(String(orderNumber), user.CustomerProfileCode);
                return response.result;
            }, cancelled),
        [run, orderNumber],
    );

    React.useEffect(() => {
        if (!orderNumber) return;
        const cancelled = { current: false };
        fetchOrderDetails(cancelled);
        return () => { cancelled.current = true; };
    }, [fetchOrderDetails, orderNumber]);

    // No order number — cannot fetch. Show static error (no retry possible).
    if (!orderNumber) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
                <ScreenHeader title="Order Details" back onBack={() => navigation.goBack()} />
                <View style={styles.errorWrap}>
                    <Text style={styles.errorTitle}>Order details unavailable</Text>
                    <Text style={styles.errorBody}>
                        The order reference is missing. Please go back and try again.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Fetch failed — show retryable error state instead of a stuck skeleton.
    if (isError) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
                <ScreenHeader title="Order Details" back onBack={() => navigation.goBack()} />
                <View style={styles.errorWrap}>
                    <ErrorState
                        title="Couldn't load order"
                        message={error ?? 'An unexpected error occurred.'}
                        onRetry={() => fetchOrderDetails()}
                        retryLoading={loading}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const order = orderItem ?? orderDetails?.OrderDetails[0];
    const delivery = orderDetails?.DeliveryDetail[0];
    const imageList = order?.Images?.split(";").filter(Boolean) ?? [];

    if (!order || !delivery) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
                <ScreenHeader title="Order Details" back onBack={() => navigation.goBack()} />
                <ScrollView contentContainerStyle={styles.container}>
                    <Skeleton height={22} width="40%" style={{ marginBottom: Space[3] }} />
                    <View style={{ marginBottom: Space[6] }}>
                        <Skeleton height={16} style={{ marginBottom: Space[2] }} />
                        <Skeleton height={100} radius={8} style={{ marginBottom: Space[2] }} />
                        <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[2] }}>
                            <Skeleton height={14} width="30%" />
                            <Skeleton height={14} width="40%" />
                        </SkeletonRow>
                        <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[2] }}>
                            <Skeleton height={14} width="25%" />
                            <Skeleton height={14} width="20%" />
                        </SkeletonRow>
                    </View>
                    <Skeleton height={22} width="45%" style={{ marginBottom: Space[3] }} />
                    <View>
                        <Skeleton height={14} style={{ marginBottom: Space[2] }} />
                        <Skeleton height={14} style={{ marginBottom: Space[2] }} />
                        <Skeleton height={14} width="70%" />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <ScreenHeader title="Order Details" back onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Order Details</Text>
            <View style={styles.card}>
                <Text style={styles.title}>{order.Name}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                    {imageList.map((img, idx) => (
                        <Image
                            key={idx}
                            source={{ uri: img }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ))}
                </ScrollView>
                <Text style={styles.label}>
                    Brand: <Text style={styles.value}>{order.Brand_Name}</Text>
                </Text>
                <Text style={styles.label}>
                    Variant: <Text style={styles.value}>{order.Variant}</Text>
                </Text>
                <Text style={styles.label}>
                    Quantity: <Text style={styles.value}>{order.Quantity}</Text>
                </Text>
                <Text style={styles.label}>
                    Amount: <Text style={styles.value}>₹{order.Amount}</Text>
                </Text>
                <Text style={styles.label}>
                    Status: <Text style={styles.value}>{getOrderStatusText(order.OrderStatus)}</Text>
                </Text>
                <Text style={styles.label}>
                    Order Date:{" "}
                    <Text style={styles.value}>
                        {order.CreatedDate ? new Date(order.CreatedDate).toLocaleString() : "N/A"}
                    </Text>
                </Text>
            </View>

            <Text style={styles.heading}>Delivery Details</Text>
            <View style={styles.card}>
                <Text style={styles.label}>
                    Name: <Text style={styles.value}>{delivery.CustomerName}</Text>
                </Text>
                <Text style={styles.label}>
                    Mobile: <Text style={styles.value}>{delivery.MobileNumber}</Text>
                </Text>
                <Text style={styles.label}>
                    Address: <Text style={styles.value}>{delivery.FullAddress}</Text>
                </Text>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    errorWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Space[8],
        gap: Space[3],
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: Colors.ink1,
        textAlign: 'center',
    },
    errorBody: {
        fontSize: 15,
        color: Colors.ink3,
        textAlign: 'center',
        lineHeight: 22,
    },
    container: {
        padding: 24,
        backgroundColor: Colors.surface,
    },
    heading: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    imageRow: {
        flexDirection: "row",
        marginBottom: 12,
    },
    image: {
        width: 100,
        height: 120,
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: "#eee",
    },
    label: {
        fontSize: 16,
        marginBottom: 4,
        color: "#333",
    },
    value: {
        fontWeight: "600",
        color: "#444",
    },
});

export default OrderDetailScreen;