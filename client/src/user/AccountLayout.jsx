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
            {/* Tab Bar */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide -mb-px">
                    {tabs.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors flex-shrink-0 ${
                                    isActive
                                        ? 'border-[#8B0000] text-[#8B0000]'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Page Content */}
            <Outlet />
        </div>
    );
};

export default AccountLayout;
