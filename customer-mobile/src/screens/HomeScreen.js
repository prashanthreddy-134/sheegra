import { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const { count, addToCart, items, updateQuantity } = useCart();

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.q = search;
    api.get("/products", { params }).then((res) => setProducts(res.data.products));
  }, [activeCategory, search]);

  function renderProduct({ item }) {
    const cartItem = items.find((i) => i.productId === item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ProductDetail", { idOrSlug: item.slug })}>
        <View style={styles.imageBox}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <Text style={{ fontSize: 28 }}>🥬</Text>}
        </View>
        <Text style={styles.unit}>{item.unit}</Text>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.price}>₹{Number(item.sellingPrice)}</Text>
          {cartItem ? (
            <View style={styles.qtyBox}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, cartItem.quantity - 1)}><Text style={styles.qtyBtn}>−</Text></TouchableOpacity>
              <Text style={styles.qtyText}>{cartItem.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, cartItem.quantity + 1)}><Text style={styles.qtyBtn}>+</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item.id, 1)}>
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Sheegra</Text>
          <Text style={styles.eta}>delivery in ~18 min</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("Cart")}>
          <Text style={styles.cartBtnText}>Cart {count > 0 ? `(${count})` : ""}</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.search} placeholder="Search for atta, rice, dal, milk..." value={search} onChangeText={setSearch} />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: "all", name: "All", slug: null }, ...categories]}
        keyExtractor={(c) => c.id}
        style={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveCategory(item.slug)}
            style={[styles.catChip, activeCategory === item.slug && styles.catChipActive]}
          >
            <Text style={[styles.catChipText, activeCategory === item.slug && styles.catChipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={renderProduct}
        ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F3" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 },
  brand: { fontWeight: "800", fontSize: 18, color: "#182419" },
  eta: { fontSize: 11, color: "#1B7A43", fontFamily: "monospace" },
  cartBtn: { backgroundColor: "#1B7A43", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  cartBtnText: { color: "#F7F8F3", fontWeight: "700", fontSize: 12 },
  search: { backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#18241926", marginHorizontal: 16, marginTop: 10, paddingHorizontal: 16, paddingVertical: 10 },
  catList: { marginTop: 12, paddingLeft: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#18241926", backgroundColor: "white", marginRight: 8 },
  catChipActive: { backgroundColor: "#1B7A43", borderColor: "#1B7A43" },
  catChipText: { fontSize: 13, color: "#18241999", fontWeight: "500" },
  catChipTextActive: { color: "#F7F8F3" },
  card: { flex: 1, backgroundColor: "white", borderRadius: 18, borderWidth: 1, borderColor: "#18241915", padding: 10, marginBottom: 10 },
  imageBox: { aspectRatio: 1, borderRadius: 14, backgroundColor: "#E3F3E8", alignItems: "center", justifyContent: "center", marginBottom: 6, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  unit: { fontSize: 11, color: "#18241980" },
  name: { fontSize: 13, fontWeight: "500", color: "#182419", marginVertical: 2, minHeight: 34 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { fontWeight: "800", fontSize: 14, color: "#182419" },
  addBtn: { borderWidth: 1, borderColor: "#1B7A43", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  addBtnText: { color: "#1B7A43", fontWeight: "700", fontSize: 11 },
  qtyBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1B7A43", borderRadius: 20, paddingHorizontal: 8, gap: 8 },
  qtyBtn: { color: "#F7F8F3", fontSize: 16, paddingVertical: 2 },
  qtyText: { color: "#F7F8F3", fontWeight: "700", fontSize: 12 },
  empty: { textAlign: "center", color: "#18241966", marginTop: 60 },
});
