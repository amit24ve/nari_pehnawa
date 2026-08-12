import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { User, Mail, Calendar, Edit2, Save, X, Camera } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        phone: '',
        bio: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                age: user.age || '',
                phone: user.phone || '',
                bio: user.bio || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            const payload = { name: formData.name };
            if (formData.age) payload.age = parseInt(formData.age, 10);
            if (formData.phone) payload.phone = formData.phone;
            if (formData.bio) payload.bio = formData.bio;

            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
                // Optionally refresh user data
            } else {
                const data = await res.json().catch(() => ({}));
                setMessage({ type: 'error', text: data.detail || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] rounded-xl p-4 sm:p-6 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold">My Profile</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">Manage your personal information</p>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[#d4af37] to-[#c9a961] h-24 sm:h-32"></div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 sm:-mt-16 mb-4 sm:mb-6">
                        <div className="flex items-end gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl font-bold text-[#d4af37]">
                                    {formData.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <button className="absolute bottom-0 right-0 bg-[#d4af37] text-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-[#c9a961] transition-colors">
                                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                            <div className="pb-1 sm:pb-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{formData.name || 'User'}</h2>
                                <p className="text-sm sm:text-base text-gray-600">{formData.email}</p>
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 md:mt-0">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-[#d4af37] text-white rounded-lg hover:bg-[#c9a961] transition-colors shadow-md text-sm sm:text-base w-full md:w-auto"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setMessage({ type: '', text: '' });
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md text-sm sm:text-base"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                                />
                            </div>

                            {/* Age */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Age
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="+91 1234567890"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bio
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                disabled={!isEditing}
                                rows="4"
                                placeholder="Tell us about yourself..."
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-[#d4af37]">0</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Orders</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-[#d4af37]">0</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Wishlist Items</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-[#d4af37]">₹0</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Spent</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
