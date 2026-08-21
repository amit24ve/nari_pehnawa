import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { User, Mail, Calendar, Edit2, Save, X, Camera, MapPin, Plus, Trash2, Home, Building, CheckCircle, Smartphone } from 'lucide-react';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

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

    // Address States
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({
        type: 'home',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
    });

    const fetchAddresses = async () => {
        setAddressesLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/addresses/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
            }
        } catch (err) {
            console.error("Error fetching addresses", err);
        } finally {
            setAddressesLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                age: user.age || '',
                phone: user.phone || '',
                bio: user.bio || ''
            });
            fetchAddresses();
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

    // Address Handlers
    const handleAddressChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');

        try {
            const payload = {
                type: addressForm.type,
                full_name: addressForm.full_name,
                phone: addressForm.phone,
                address_line1: addressForm.address_line1,
                address_line2: addressForm.address_line2 || '',
                city: addressForm.city,
                state: addressForm.state,
                pincode: addressForm.pincode,
                is_default: addressForm.is_default
            };

            let res;
            if (editingAddressId) {
                res = await fetch(`${API_URL}/addresses/${editingAddressId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_URL}/addresses/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                fetchAddresses();
                resetAddressForm();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.detail || 'Failed to save address');
            }
        } catch (err) {
            alert(err.message || 'Something went wrong');
        }
    };

    const handleEditAddress = (address) => {
        setAddressForm({
            type: address.type || 'home',
            full_name: address.full_name || '',
            phone: address.phone || '',
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            is_default: address.is_default || false
        });
        setEditingAddressId(address.id);
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (id) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/addresses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAddresses();
            } else {
                alert('Failed to delete address');
            }
        } catch (err) {
            alert(err.message || 'Something went wrong');
        }
    };

    const handleSetDefaultAddress = async (id) => {
        const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
        const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/addresses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_default: true })
            });
            if (res.ok) {
                fetchAddresses();
            }
        } catch (err) {
            console.error('Failed to set default address:', err);
        }
    };

    const resetAddressForm = () => {
        setAddressForm({
            type: 'home',
            full_name: '',
            phone: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            pincode: '',
            is_default: false
        });
        setShowAddressForm(false);
        setEditingAddressId(null);
    };

    return (
        <div className="w-full space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] rounded-xl p-4 sm:p-6 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold">My Profile</h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">Manage your personal information and addresses</p>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Profile Header Background */}
                <div className="bg-gradient-to-r from-[#0891b2] to-[#06b6d4] h-24 sm:h-32"></div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 sm:-mt-16 mb-4 sm:mb-6">
                        <div className="flex items-end gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl font-bold text-[#0891b2]">
                                    {formData.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <button className="absolute bottom-0 right-0 bg-[#0891b2] text-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-[#06b6d4] transition-colors">
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
                                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#06b6d4] transition-colors shadow-md text-sm sm:text-base w-full md:w-auto"
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
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
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
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
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
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-transparent transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Management Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 mb-4 sm:mb-6 gap-3">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#0891b2]" />
                            Saved Addresses
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600">Manage your shipping destinations</p>
                    </div>
                    {!showAddressForm && (
                        <button
                            onClick={() => setShowAddressForm(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#06b6d4] transition-colors shadow-sm text-xs sm:text-sm font-semibold w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Address
                        </button>
                    )}
                </div>

                {/* Add/Edit Address Form Overlay/Block */}
                {showAddressForm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 relative">
                        <button
                            onClick={resetAddressForm}
                            className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-4">
                            {editingAddressId ? 'Edit Saved Address' : 'Add New Address'}
                        </h3>
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                            {/* Type */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Address Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="home"
                                            checked={addressForm.type === 'home'}
                                            onChange={handleAddressChange}
                                            className="text-[#0891b2] focus:ring-[#0891b2]"
                                        />
                                        <Home className="w-4 h-4 text-gray-500" /> Home
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="work"
                                            checked={addressForm.type === 'work'}
                                            onChange={handleAddressChange}
                                            className="text-[#0891b2] focus:ring-[#0891b2]"
                                        />
                                        <Building className="w-4 h-4 text-gray-500" /> Work
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Receiver Name *</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={addressForm.full_name}
                                        onChange={handleAddressChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                    />
                                </div>
                                {/* Contact Number */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={addressForm.phone}
                                        onChange={handleAddressChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                    />
                                </div>
                            </div>

                            {/* Address Line 1 */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 1 (Flat, House no., Building) *</label>
                                <input
                                    type="text"
                                    name="address_line1"
                                    value={addressForm.address_line1}
                                    onChange={handleAddressChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                />
                            </div>

                            {/* Address Line 2 */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 2 (Colony, Area, Landmark)</label>
                                <input
                                    type="text"
                                    name="address_line2"
                                    value={addressForm.address_line2}
                                    onChange={handleAddressChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* City */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                    />
                                </div>
                                {/* State */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                                    <select
                                        name="state"
                                        value={addressForm.state}
                                        onChange={handleAddressChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Pincode */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={addressForm.pincode}
                                        onChange={handleAddressChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0891b2]"
                                    />
                                </div>
                            </div>

                            {/* Default Address */}
                            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_default"
                                    checked={addressForm.is_default}
                                    onChange={handleAddressChange}
                                    className="rounded text-[#0891b2] focus:ring-[#0891b2]"
                                />
                                Set as Default Address
                            </label>

                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={resetAddressForm}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#06b6d4] transition-colors text-xs sm:text-sm font-semibold"
                                >
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Address List */}
                {addressesLoading ? (
                    <div className="text-center py-6 text-xs sm:text-sm text-gray-600">Loading addresses...</div>
                ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map(addr => (
                            <div
                                key={addr.id}
                                className={`border rounded-xl p-4 flex flex-col justify-between relative transition-all ${
                                    addr.is_default ? 'border-[#0891b2] bg-cyan-50/20 shadow-sm' : 'border-gray-200'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                                            {addr.type === 'work' ? <Building className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                                            {addr.type}
                                        </span>
                                        {addr.is_default && (
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#0891b2] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                                                <CheckCircle className="w-3.5 h-3.5" /> Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-800 text-sm sm:text-base mb-1">{addr.full_name}</p>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center gap-1">
                                        <Smartphone className="w-3.5 h-3.5" /> {addr.phone}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                                        {addr.address_line1}
                                        {addr.address_line2 && `, ${addr.address_line2}`}
                                        {`, ${addr.city}, ${addr.state} - ${addr.pincode}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 justify-end">
                                    {!addr.is_default && (
                                        <button
                                            onClick={() => handleSetDefaultAddress(addr.id)}
                                            className="text-xs text-[#0891b2] font-semibold hover:underline mr-auto"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditAddress(addr)}
                                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                                        title="Edit Address"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAddress(addr.id)}
                                        className="p-1.5 hover:bg-red-50 rounded-full text-red-600 transition-colors"
                                        title="Delete Address"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                        <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-500">No saved addresses found. Add one to speed up checkout!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
