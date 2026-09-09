import React from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { User, ShoppingBag, Heart, MapPin, Settings } from 'lucide-react';

const tabs = [
    { path: '/user/profile', icon: User, label: 'My Profile' },
    { path: '/user/orders', icon: ShoppingBag, label: 'My Orders' },
    { path: '/user/wishlist', icon: Heart, label: 'Wishlist' },
    { path: '/user/addresses', icon: MapPin, label: 'Addresses' },
    { path: '/user/settings', icon: Settings, label: 'Settings' },
];

const AccountLayout = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Page Content */}
            <Outlet />
        </div>
    );
};

export default AccountLayout;
