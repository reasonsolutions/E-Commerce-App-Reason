import React from "react";
import { View, Text, Image, ScrollView, StyleSheet, StatusBar } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { postCnfOrderDetail } from "../api/integrations";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const OrderDetailScreen: React.FC = () => {
    const route = useRoute<RouteProp<{ params: OrderDetailScreenRouteParams }, 'params'>>();
    const [orderDetails, setOrderDetails] = React.useState<OrderDetailProps | null>(null);

    React.useEffect(() => {
        // Simulate fetching order details from an API
        const fetchOrderDetails = async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                console.log(user)
                postCnfOrderDetail(route.params?.orderItem.OrderNumber ? String(route.params?.orderItem.OrderNumber) : "ORDNO_2309164922152", user.CustomerProfileCode).then(response => {
                console.log("Order detail response: ", response);
                setOrderDetails(response.result);
            }).catch(err => {
                console.error("Error fetching order details: ", err);
            });
            }
            
        };

        fetchOrderDetails();
    }, []);

    const order = route.params?.orderItem ?? orderDetails?.OrderDetails[0];
    const delivery = orderDetails?.DeliveryDetail[0];
    const imageList = order?.Images?.split(";").filter(Boolean) ?? [];

    if (!order || !delivery) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
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
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: "#fff",
        paddingTop:StatusBar.currentHeight || 0,
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