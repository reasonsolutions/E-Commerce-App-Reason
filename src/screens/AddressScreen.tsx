import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from "react-native";
import { getDeliveryAddresses, postCreateDeliveryAddress, postPlacedMultipleOrder } from "../api/integrations";
import { postPlacedMultipleOrderInterface , SavedCartItemInterface } from "../api/interfaces";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Interface for delivery address
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

const AddressScreen: React.FC<AddressScreenProps> = ( { route  , navigation }) => {

    const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
    const [selectedAddressCode, setSelectedAddressCode] = useState<number | null>(null);
    const [form, setForm] = useState<Omit<DeliveryAddress, "OrderDeliveryAddressCode" | "CreatedDate" | "UpdatedDate">>({
        CustomerName: "",
        MobileNumber: 0,
        FullAddress: "",
        CustomerProfileCode: 0,
    });
    const [profileCode,setProfileCode] = useState<number | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                console.log(user)
                setProfileCode(user.CustomerProfileCode)
                getDeliveryAddresses(user.CustomerProfileCode).then(response => {
                    if (response.statusCode === 1) {
                        setAddresses(response.result || []);
                    } else {
                        console.error("Failed to fetch addresses: ", response.message);
                    }
                });
            }
        }
        fetchData()
        
    },[])

    const handleChange = (name: string, value: string) => {
        setForm({
            ...form,
            [name]: name === "MobileNumber" || name === "CustomerProfileCode" ? Number(value) : value,
        });
    };

    const handleAddAddress = () => {
        if (
            form.CustomerName &&
            form.MobileNumber &&
            form.FullAddress &&
            form.CustomerProfileCode
        ) {
            postCreateDeliveryAddress({
                ...form,
                MobileNumber: String(form.MobileNumber)
            }).then(response => {
                console.log("Address creation response: ", response);
                if (response.statusCode === 1) {
                    getDeliveryAddresses(profileCode!).then(response => {
                    if (response.statusCode === 1) {
                        setAddresses(response.result || []);
                    } else {
                        console.error("Failed to fetch addresses: ", response.message);
                    }
                });
                    setForm({
                        CustomerName: "",
                        MobileNumber: 0,
                        FullAddress: "",
                        CustomerProfileCode: 0,
                    });
                }
            }).catch(err => {
                console.error("Error creating address: ", err);
            });
        }
    };

    const buyProducts = () => {
        console.log("Buying products to address code: ", selectedAddressCode);
        let transformedArray = route!.params!.cartItems!.map((item: SavedCartItemInterface) => ({
            Inventory_Id: item.Inventory_Id,
            Quantity: item.Quantity,
            Amount: item.Price * item.Quantity,
            DeliveryCharges: 0,
            DeliveryChargesVAT: 0,
            ItemCharges: 0,
            ItemChargesVAT: 0,
            Discount: 0,
            VAT: 0,
            OrderStatus: 1
        }))
        let result : postPlacedMultipleOrderInterface = {
            CustomerProfileCode: profileCode!,
            OrderDeliveryAddressCode: selectedAddressCode!,
            BranchCode: "NULL",
            CountryCode: "NULL",
            CartMasterCode: route.params!.cartItems![0].CartMasterCode,
            OrderDetails: transformedArray
        }

        postPlacedMultipleOrder(result).then(response => {
            console.log("Order placed response: ", response);
            navigation.navigate("OrderSuccess" , { orderNumber : response.result.OrderNumber });
        }).catch(err => {
            console.error("Error placing order: ", err);
        });

    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <Text style={styles.title}>Choose your address</Text>
                
                <View style={styles.paper}>
                    <Text style={styles.formTitle}>Saved Addresses</Text>
                    <FlatList
                        data={addresses}
                        keyExtractor={item => item.OrderDeliveryAddressCode.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.addressItem,
                                    { paddingHorizontal: 12 }, // Added horizontal padding
                                    selectedAddressCode === item.OrderDeliveryAddressCode && {
                                        backgroundColor: "#e3f2fd",
                                        borderLeftWidth: 4,
                                        borderLeftColor: "#1976d2",
                                        shadowColor: "#1976d2",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 6,
                                        elevation: 4,
                                        transform: [{ scale: 1.02 }],
                                    },
                                ]}
                                onPress={() => setSelectedAddressCode(item.OrderDeliveryAddressCode)}
                                activeOpacity={0.85}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    {selectedAddressCode === item.OrderDeliveryAddressCode && (
                                        <View
                                            style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 11,
                                                backgroundColor: "#1976d2",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                marginRight: 10,
                                            }}
                                        >
                                            <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.addressName}>{item.CustomerName}</Text>
                                        <Text style={styles.addressDetail}>Mobile: {item.MobileNumber}</Text>
                                        <Text style={styles.addressDetail}>Address: {item.FullAddress}</Text>
                                        <Text style={styles.addressDetail}>Profile Code: {item.CustomerProfileCode}</Text>
                                        <Text style={styles.addressMeta}>
                                            Created: {new Date(item.CreatedDate).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={{ color: "#888", textAlign: "center", marginTop: 12 }}>
                                No addresses found.
                            </Text>
                        }
                    />
                </View>
                <View style={styles.paper}>
                    <Text style={styles.formTitle}>Add New Address</Text>
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Customer Name"
                            value={form.CustomerName}
                            placeholderTextColor={"#888"}
                            onChangeText={text => handleChange("CustomerName", text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Mobile Number"
                            placeholderTextColor={"#888"}
                            value={form.MobileNumber ? String(form.MobileNumber) : ""}
                            onChangeText={text => handleChange("MobileNumber", text)}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Address"
                            value={form.FullAddress}
                            placeholderTextColor={"#888"}
                            onChangeText={text => handleChange("FullAddress", text)}
                        />
                       
                        <TouchableOpacity style={styles.button} onPress={handleAddAddress}>
                            <Text style={styles.buttonText}>Add Address</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={() =>{
                     console.log("Proceeding to buy...")
                     buyProducts()
                }}>
                    <Text style={styles.checkoutButtonText}>Proceed to Buy</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        padding: 16,
        paddingTop: StatusBar.currentHeight || 0,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#222",
    },
    paper: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 18,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 10,
        color: "#1976d2",
    },
    form: {
        flexDirection: "column",
        gap: 12,
    },
    input: {
        padding: 10,
        fontSize: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 8,
        backgroundColor: "#f9f9f9",
    },
    button: {
        backgroundColor: "#1976d2",
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 18,
        alignItems: "center",
        marginTop: 8,
        alignSelf: "flex-start",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    addressItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        borderRadius: 6,
    },
    addressName: {
        fontWeight: "bold",
        fontSize: 17,
        color: "#222",
    },
    addressDetail: {
        fontSize: 15,
        color: "#333",
        marginVertical: 1,
    },
    addressMeta: {
        fontSize: 13,
        color: "#888",
        marginTop: 4,
    },
    checkoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default AddressScreen;