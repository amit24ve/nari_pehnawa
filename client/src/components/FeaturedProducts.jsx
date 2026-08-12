import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { useWishlist } from "../context/WishlistProvider";
import { SectionHeading } from "./NariHeadingDecoration";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const FeaturedProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toggleWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        fetch(
            `${API_BASE_URL}/products/?limit=32&sort_by=created_at&sort_order=-1`,
        )
            .then((r) => r.json())
            .then((data) => {
                const normalized = (Array.isArray(data) ? data : []).map(
                    (p) => ({
                        id: p._id || p.id,
                        name: p.name,
                        brand: p.brand || "Nari Pehnawa",
                        price: p.price,
                        originalPrice: p.original_price,
                        discount: p.discount,
                        image: p.image,
                        onSale: p.on_sale,
                        isNew: p.is_new,
                        category: p.category,
                        sizes: p.sizes || [],
                        colors: p.colors || [],
                        rating: p.rating || 0,
                        review_count: p.review_count || 0,
                        description: p.description || "",
                    }),
                );
                setProducts(normalized);
            })
            .catch((e) => console.error("FeaturedProducts fetch error:", e))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section style={{ background: "#fdf8f5", padding: "2rem 0" }}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <SectionHeading>
                        Featured Collection
                    </SectionHeading>
                    <p className="text-gray-600 text-base">
                        Discover our handpicked selection of stunning ethnic
                        wear
                    </p>
                    <div
                        className="w-24 h-1 mx-auto mt-3"
                        style={{
                            background:
                                "linear-gradient(to right, #8B0000, #a52a2a)",
                        }}
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-10 h-10 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Products Grid */}
                {!loading && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onWishlistToggle={toggleWishlist}
                                isWishlisted={isInWishlist(product.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg">
                            No products found. Add products from the admin
                            panel.
                        </p>
                    </div>
                )}

                {/* View All Button */}
                {!loading && products.length > 0 && (
                    <div className="text-center mt-12">
                        <a href="/new-arrivals">
                            <button
                                style={{
                                    background: "#8B0000",
                                    color: "#ffffff",
                                    padding: "1rem 3rem",
                                    borderRadius: "0.5rem",
                                    fontWeight: "bold",
                                    fontSize: "1.125rem",
                                }}
                                className="hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                View All Products
                            </button>
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedProducts;
