import React, { useState } from 'react';
import { Lock, Bell, Eye, Mail, Smartphone, Shield } from 'lucide-react';

const Settings = () => {
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        promotions: false,
        newsletter: true,
        sms: false
    });

    const [privacy, setPrivacy] = useState({
        showProfile: true,
        showOrders: false
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleNotificationChange = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrivacyChange = (key) => {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        // Add password change API call here
        alert('Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] rounded-xl p-4 sm:p-6 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold">Settings</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">Manage your account preferences</p>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Change Password</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Update your password regularly for security</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm sm:text-base"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm sm:text-base"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-sm sm:text-base"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-[#d4af37] text-white rounded-lg hover:bg-[#c9a961] transition-colors font-semibold text-sm sm:text-base"
                    >
                        Update Password
                    </button>
                </form>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Notification Preferences</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Choose what notifications you want to receive</p>
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <label className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">Order Updates</p>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">Get notified about your order status</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.orderUpdates}
                            onChange={() => handleNotificationChange('orderUpdates')}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] rounded focus:ring-[#d4af37] flex-shrink-0 ml-2"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">Promotions & Offers</p>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">Receive exclusive deals and discounts</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.promotions}
                            onChange={() => handleNotificationChange('promotions')}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] rounded focus:ring-[#d4af37] flex-shrink-0 ml-2"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">Newsletter</p>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">Weekly updates and fashion tips</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.newsletter}
                            onChange={() => handleNotificationChange('newsletter')}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] rounded focus:ring-[#d4af37] flex-shrink-0 ml-2"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">SMS Notifications</p>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">Get SMS updates for orders</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.sms}
                            onChange={() => handleNotificationChange('sms')}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] rounded focus:ring-[#d4af37] flex-shrink-0 ml-2"
                        />
                    </label>
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Privacy Settings</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Control your privacy preferences</p>
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <label className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">Public Profile</p>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">Allow others to view your profile</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={privacy.showProfile}
                            onChange={() => handlePrivacyChange('showProfile')}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] rounded focus:ring-[#d4af37] flex-shrink-0 ml-2"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">Order History Visibility</p>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">Share order history with recommendations</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={privacy.showOrders}
                            onChange={() => handlePrivacyChange('showOrders')}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] rounded focus:ring-[#d4af37] flex-shrink-0 ml-2"
                        />
                    </label>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-3 sm:mb-4">Danger Zone</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button className="w-full sm:w-auto px-5 sm:px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold text-sm sm:text-base">
                        Deactivate Account
                    </button>
                    <button className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm sm:text-base">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
