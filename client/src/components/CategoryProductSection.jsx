import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { useWishlist } from "../context/WishlistProvider";
import { SectionHeading } from "./NariHeadingDecoration";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

/**
 * Renders a single "shop by category" product row on the home page.
 * Fully dynamic — pass in a category document (from /categories/) and it
 * fetches that category's products, renders them, and hides itself
 * automatically if the category has no products yet.
 */
const CategoryProductSection = ({ category, alternate = false }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toggleWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        setLoading(true);
        fetch(
            `${API_BASE_URL}/products/?category=${encodeURIComponent(category.name)}&limit=8`,
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
            .catch((e) =>
                console.error(
                    `CategoryProductSection (${category.name}) fetch error:`,
                    e,
                ),
            )
            .finally(() => setLoading(false));
    }, [category.name]);

    const accent = category.border_color || "#8B0000";
    const bg = alternate ? "#ffffff" : "#fdf8f5";

    if (loading) {
        return (
            <section className="py-8" style={{ background: bg }}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <SectionHeading style={{ color: accent }}>
                            {category.name.toUpperCase()}
                        </SectionHeading>
                    </div>
                    <div className="flex justify-center py-12">
                        <div
                            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                            style={{
                                borderColor: accent,
                                borderTopColor: "transparent",
                            }}
                        />
                    </div>
                </div>
            </section>
        );
    }

    // Hide the whole section if this category has no products yet.
    if (products.length === 0) return null;

    return (
        <section className="py-8" style={{ background: bg }}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <SectionHeading style={{ color: accent }}>
                        {category.name.toUpperCase()}
                    </SectionHeading>
                    {category.tagline && (
                        <p className="text-gray-600 text-base">
                            {category.tagline}
                        </p>
                    )}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-12">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onWishlistToggle={toggleWishlist}
                            isWishlisted={isInWishlist(product.id)}
                        />
                    ))}
                </div>

                {/* View More Button */}
                <div className="text-center">
                    <a href={category.link || "/"}>
                        <button
                            style={{ background: accent }}
                            className="text-white px-12 py-3 rounded-xl font-bold text-base hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            View More
                        </button>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CategoryProductSection;
