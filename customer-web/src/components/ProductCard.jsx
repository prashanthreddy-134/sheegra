import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function ProductCard({ product }) {
  const { addToCart, items, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const cartItem = items.find(
    (item) => item.productId === product.id
  );

  const stock = Number(product.stockQty ?? 0);
  const lowStockLimit = Number(product.lowStockAlert ?? 10);

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= lowStockLimit;

  /*
   * Check whether this product is already in the
   * customer's wishlist.
   */
  useEffect(() => {
    if (!user) {
      setIsWishlisted(false);
      return;
    }

    let active = true;

    api
      .get("/wishlist")
      .then((res) => {
        if (!active) return;

        const wishlistItems = Array.isArray(res.data)
          ? res.data
          : [];

        const exists = wishlistItems.some(
          (item) =>
            Number(item.productId) === Number(product.id) ||
            Number(item.product?.id) === Number(product.id)
        );

        setIsWishlisted(exists);
      })
      .catch(() => {
        if (active) {
          setIsWishlisted(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user, product.id]);

  /*
   * Add / remove product from wishlist.
   */
  async function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (wishlistLoading) return;

    setWishlistLoading(true);

    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product.id}`);
        setIsWishlisted(false);
      } else {
        await api.post("/wishlist", {
          productId: product.id,
        });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error("Wishlist update failed:", error);

      /*
       * If the request fails, keep the existing state.
       */
    } finally {
      setWishlistLoading(false);
    }
  }

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (!user) {
      navigate("/login");
      return;
    }

    addToCart(product.id, 1);
  }

  function handleDecrease(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!cartItem) return;

    updateQuantity(
      product.id,
      cartItem.quantity - 1
    );
  }

  function handleIncrease(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!cartItem) return;

    // Never allow cart quantity above available stock.
    if (cartItem.quantity >= stock) return;

    updateQuantity(
      product.id,
      cartItem.quantity + 1
    );
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className={`
        group bg-white rounded-xl2 border border-ink/10 p-3
        flex flex-col transition-all duration-200
        ${
          isOutOfStock
            ? "opacity-65 cursor-default"
            : "hover:shadow-md"
        }
      `}
    >
      {/* Product Image */}
      <div className="aspect-square rounded-xl bg-leaf-light overflow-hidden mb-2 relative grid place-items-center">

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`
              w-full h-full object-cover
              ${isOutOfStock ? "grayscale" : ""}
            `}
          />
        ) : (
          <span className="text-3xl">
            🥬
          </span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          title={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          className={`
            absolute top-2 right-2 z-10
            w-9 h-9
            rounded-full
            flex items-center justify-center
            bg-white/95
            border border-ink/10
            shadow-sm
            transition-all duration-200
            ${
              wishlistLoading
                ? "opacity-50 cursor-wait"
                : "hover:scale-110 active:scale-95"
            }
          `}
        >
          <span
            className={`
              text-lg leading-none
              transition-transform duration-200
              ${
                isWishlisted
                  ? "text-red-500 scale-110"
                  : "text-ink/45"
              }
            `}
          >
            {isWishlisted ? "♥" : "♡"}
          </span>
        </button>

        {/* Discount */}
        {!isOutOfStock &&
          Number(product.discountPct) > 0 && (
            <span className="absolute top-2 left-2 bg-mango text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {Math.round(
                Number(product.discountPct)
              )}
              % OFF
            </span>
          )}

        {/* OUT OF STOCK OVERLAY */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Unit */}
      <div className="text-xs text-ink/50 mb-0.5">
        {product.unit}
      </div>

      {/* Product Name */}
      <div className="text-sm font-medium text-ink line-clamp-2 mb-1">
        {product.name}
      </div>

      {/* Stock Information */}
      {isOutOfStock ? (
        <div className="text-[11px] text-red-600 font-semibold mb-1">
          Currently unavailable
        </div>
      ) : isLowStock ? (
        <div className="text-[11px] text-orange-600 font-semibold mb-1">
          Only {stock} left
        </div>
      ) : (
        <div className="text-[11px] text-transparent mb-1">
          Available
        </div>
      )}

      {/* Bottom Section */}
      <div className="mt-auto flex items-center justify-between gap-2">

        {/* Price */}
        <div className="min-w-0">
          <span className="font-display font-800 text-ink">
            ₹{Number(product.sellingPrice)}
          </span>

          {Number(product.mrp) >
            Number(product.sellingPrice) && (
            <span className="text-xs text-ink/40 line-through ml-1">
              ₹{Number(product.mrp)}
            </span>
          )}
        </div>

        {/* OUT OF STOCK BUTTON */}
        {isOutOfStock ? (
          <button
            type="button"
            disabled
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="shrink-0 text-[10px] sm:text-xs font-semibold text-red-500 border border-red-300 bg-red-50 rounded-full px-2.5 py-1 cursor-not-allowed"
          >
            OUT OF STOCK
          </button>
        ) : cartItem ? (

          /* Quantity Controls */
          <div
            className="shrink-0 flex items-center gap-1 bg-leaf text-cream rounded-full px-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={handleDecrease}
              className="w-6 h-6"
            >
              −
            </button>

            <span className="text-xs font-mono w-4 text-center">
              {cartItem.quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={cartItem.quantity >= stock}
              className={`
                w-6 h-6
                ${
                  cartItem.quantity >= stock
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }
              `}
            >
              +
            </button>
          </div>

        ) : (

          /* ADD BUTTON */
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 text-xs font-semibold text-leaf border border-leaf rounded-full px-3 py-1 hover:bg-leaf hover:text-white transition-colors"
          >
            ADD
          </button>
        )}
      </div>
    </Link>
  );
}