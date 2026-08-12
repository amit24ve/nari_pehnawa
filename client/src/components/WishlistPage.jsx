import React from 'react';
import Wishlist from '../user/Wishlist';

/**
 * Standalone Wishlist page — accessible from main nav without login.
 * Works for both guests (localStorage) and logged-in users (API).
 */
const WishlistPage = () => {
  return (
    <div className="min-h-screen bg-[#fdf8f5] py-8 px-4">
      <div className="max-w-[1200px] mx-auto">
        <Wishlist />
      </div>
    </div>
  );
};

export default WishlistPage;
