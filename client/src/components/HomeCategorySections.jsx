import React, { useState, useEffect } from "react";
import CategoryProductSection from "./CategoryProductSection";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

// Categories that already have their own dedicated home page section
// (Featured Collection shows products across every category, and
// New Arrivals / SALE are "virtual" filter categories, not real ones).
const EXCLUDED = new Set(["New Arrivals", "SALE"]);

/**
 * Renders one product row per active category, fully driven by whatever
 * categories exist in the admin panel. Add/remove/rename a category in
 * admin and this list updates automatically — no hardcoded sections.
 */
const HomeCategorySections = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (Array.isArray(data) ? data : [])
          .filter((c) => !EXCLUDED.has(c.name))
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setCategories(filtered);
      })
      .catch((e) => console.error("HomeCategorySections fetch error:", e));
  }, []);

  return (
    <>
      {categories.map((cat, idx) => (
        <CategoryProductSection
          key={cat._id || cat.id}
          category={cat}
          alternate={idx % 2 === 1}
        />
      ))}
    </>
  );
};

export default HomeCategorySections;
