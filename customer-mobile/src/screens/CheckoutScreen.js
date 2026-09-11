import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RazorpayCheckout from "react-native-razorpay";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, refresh } = useCart();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", line1: "", city: "", state: "", pincode: "" });
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/addresses").then((res) => {
      setAddresses(res.data);
      const def = res.data.find((a) => a.isDefault) || res.data[0];
      if (def) setSelectedAddress(def.id);
    });
  }, []);

  async function saveAddress() {
    const res = await api.post("/addresses", newAddress);
    setAddresses((prev) => [res.data, ...prev]);
    setSelectedAddress(res.data.id);
    setShowForm(false);
  }

  async function placeOrder() {
    setError("");
    if (!selectedAddress) return setError("Please select a delivery address");
    setPlacing(true);
    try {
      const res = await api.post("/orders/checkout", { addressId: selectedAddress, couponCode: couponCode || undefined });
      const { order, razorpay } = res.data;

      const options = {
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.orderId,
        name: "Sheegra",
        description: `Order ${order.orderNumber}`,
        prefill: { contact: user?.phone, name: user?.name || "" },
        theme: { color: "#1B7A43" },
      };

      const paymentData = await RazorpayCheckout.open(options);
      await api.post("/payments/verify", {
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
      });
      await refresh();
      navigation.replace("OrderDetail", { id: order.id });
    } catch (err) {
      // RazorpayCheckout.open rejects with { code, description } if the user cancels/payment fails
      setError(err.response?.data?.error || err.description || "Could not complete payment");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return <SafeAreaView style={styles.container}><Text style={styles.empty}>Your cart is empty.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Checkout</Text>

        <Text style={styles.sectionLabel}>DELIVER TO</Text>
        {addresses.map((a) => (
          <TouchableOpacity key={a.id} style={[styles.addressCard, selectedAddress === a.id && styles.addressCardActive]} onPress={() => setSelectedAddress(a.id)}>
            <Text style={styles.addressLabel}>{a.label}</Text>
            <Text style={styles.addressText}>{a.line1}, {a.city}, {a.state} - {a.pincode}</Text>
          </TouchableOpacity>
        ))}

        {showForm ? (
          <View style={styles.formBox}>
            <TextInput style={styles.input} placeholder="Label (Home/Work)" value={newAddress.label} onChangeText={(t) => setNewAddress({ ...newAddress, label: t })} />
            <TextInput style={styles.input} placeholder="Address line" value={newAddress.line1} onChangeText={(t) => setNewAddress({ ...newAddress, line1: t })} />
            <TextInput style={styles.input} placeholder="City" value={newAddress.city} onChangeText={(t) => setNewAddress({ ...newAddress, city: t })} />
            <TextInput style={styles.input} placeholder="State" value={newAddress.state} onChangeText={(t) => setNewAddress({ ...newAddress, state: t })} />
            <TextInput style={styles.input} placeholder="Pincode" value={newAddress.pincode} onChangeText={(t) => setNewAddress({ ...newAddress, pincode: t })} keyboardType="number-pad" />
            <TouchableOpacity onPress={saveAddress}><Text style={styles.link}>Save address</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowForm(true)}><Text style={styles.link}>+ Add new address</Text></TouchableOpacity>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>COUPON</Text>
        <TextInput style={styles.input} placeholder="Enter coupon code" value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />

        <View style={styles.summaryBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text>₹{subtotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.summaryNote}>Final total with delivery fee & discount shown in the payment window.</Text>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.payBtn} onPress={placeOrder} disabled={placing}>
          {placing ? <ActivityIndicator color="white" /> : <Text style={styles.payBtnText}>Pay & place order</Text>}
        </TouchableOpacity>
        <Text style={styles.secureNote}>Secured by Razorpay · UPI, Cards, Netbanking & more</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F3" },
  empty: { textAlign: "center", marginTop: 100, color: "#18241966" },
  title: { fontWeight: "800", fontSize: 20, color: "#182419", marginBottom: 12 },
  sectionLabel: { fontWeight: "700", fontSize: 12, color: "#18241980", marginBottom: 6 },
  addressCard: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#18241915", padding: 12, marginBottom: 8 },
  addressCardActive: { borderColor: "#1B7A43" },
  addressLabel: { fontWeight: "600", fontSize: 13 },
  addressText: { fontSize: 12, color: "#18241999", marginTop: 2 },
  formBox: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#18241915", padding: 12, gap: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#18241926", borderRadius: 10, padding: 10, fontSize: 13, backgroundColor: "white" },
  link: { color: "#1B7A43", fontWeight: "700", fontSize: 13, marginBottom: 8 },
  summaryBox: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#18241915", padding: 14, marginTop: 16, marginBottom: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryLabel: { color: "#18241980" },
  summaryNote: { fontSize: 11, color: "#18241966" },
  error: { color: "#dc2626", marginBottom: 10 },
  payBtn: { backgroundColor: "#FF7A1A", borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  payBtnText: { color: "white", fontWeight: "700" },
  secureNote: { textAlign: "center", fontSize: 11, color: "#18241966", marginTop: 8 },
});
