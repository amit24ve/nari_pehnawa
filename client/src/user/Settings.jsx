import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const Settings = () => {
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/users/me/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_password: passwordForm.newPassword
                })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswordForm({ newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.detail || 'Failed to update password' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] rounded-xl p-4 sm:p-6 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold">Settings</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">Manage your account preferences</p>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-xl text-sm ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Change Password Block */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg">
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#0891b2]" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Change Password</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Update your account password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent text-sm sm:text-base focus:outline-none"
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent text-sm sm:text-base focus:outline-none"
                            placeholder="Re-enter new password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-5 sm:px-6 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#06b6d4] transition-colors font-semibold text-sm sm:text-base shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
