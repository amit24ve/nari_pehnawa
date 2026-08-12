import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Building, CheckCircle } from 'lucide-react';

const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'home',
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            setAddresses(prev => prev.map(addr =>
                addr.id === editingId ? { ...formData, id: editingId } : addr
            ));
        } else {
            setAddresses(prev => [...prev, { ...formData, id: Date.now() }]);
        }
        resetForm();
    };

    const handleEdit = (address) => {
        setFormData(address);
        setEditingId(address.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this address?')) {
            setAddresses(prev => prev.filter(addr => addr.id !== id));
        }
    };

    const handleSetDefault = (id) => {
        setAddresses(prev => prev.map(addr => ({
            ...addr,
            isDefault: addr.id === id
        })));
    };

    const resetForm = () => {
        setFormData({
            type: 'home',
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            isDefault: false
        });
        setShowForm(false);
        setEditingId(null);
    };

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a1f2e] rounded-xl p-4 sm:p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold flex items-center gap-2">
                            <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
                            My Addresses
                        </h1>
                        <p className="text-gray-300 mt-1 text-sm sm:text-base">Manage your shipping addresses</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#d4af37] text-white rounded-lg hover:bg-[#c9a961] transition-colors shadow-md text-sm sm:text-base w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Add New
                    </button>
                </div>
            </div>

            {/* Add/Edit Address Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                        {editingId ? 'Edit Address' : 'Add New Address'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {/* Address Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="home"
                                        checked={formData.type === 'home'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-[#d4af37] focus:ring-[#d4af37]"
                                    />
                                    <Home className="w-4 h-4" />
                                    <span>Home</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="work"
                                        checked={formData.type === 'work'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-[#d4af37] focus:ring-[#d4af37]"
                                    />
                                    <Building className="w-4 h-4" />
                                    <span>Work</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Address Line 1 */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1 *</label>
                            <input
                                type="text"
                                name="addressLine1"
                                value={formData.addressLine1}
                                onChange={handleChange}
                                placeholder="House No., Building Name"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                            />
                        </div>

                        {/* Address Line 2 */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                            <input
                                type="text"
                                name="addressLine2"
                                value={formData.addressLine2}
                                onChange={handleChange}
                                placeholder="Road Name, Area, Colony"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* City */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                                />
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    required
                                    pattern="[0-9]{6}"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Set as Default */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isDefault"
                                    checked={formData.isDefault}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#d4af37] rounded focus:ring-[#d4af37]"
                                />
                                <span className="text-sm font-semibold text-gray-700">Set as default address</span>
                            </label>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                            <button
                                type="submit"
                                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-[#d4af37] text-white rounded-lg hover:bg-[#c9a961] transition-colors font-semibold text-sm sm:text-base"
                            >
                                {editingId ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Addresses List */}
            {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`bg-white rounded-xl shadow-sm border-2 p-4 sm:p-6 transition-all ${address.isDefault
                                    ? 'border-[#d4af37] bg-yellow-50/30'
                                    : 'border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 sm:p-2 rounded-lg ${address.type === 'home' ? 'bg-blue-100' : 'bg-purple-100'
                                        }`}>
                                        {address.type === 'home' ? (
                                            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        ) : (
                                            <Building className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                        )}
                                    </div>
                                    <span className="font-bold text-gray-800 capitalize text-sm sm:text-base">{address.type}</span>
                                </div>
                                {address.isDefault && (
                                    <span className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-[#d4af37] text-white text-xs font-semibold rounded-full">
                                        <CheckCircle className="w-3 h-3" />
                                        Default
                                    </span>
                                )}
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">{address.fullName}</p>
                                <p className="text-gray-600 text-sm sm:text-base">{address.phone}</p>
                                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base break-words">
                                    {address.addressLine1}, {address.addressLine2}
                                </p>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    {address.city}, {address.state} - {address.pincode}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => handleEdit(address)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(address.id)}
                                    className="px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {!address.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(address.id)}
                                        className="px-3 sm:px-4 py-2 border border-[#d4af37] text-[#d4af37] rounded-lg hover:bg-yellow-50 transition-colors text-xs sm:text-sm font-semibold"
                                    >
                                        Set Default
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !showForm && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                        <MapPin className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Addresses Added</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                            Add your shipping address to make checkout faster
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#d4af37] text-white rounded-lg hover:bg-[#c9a961] transition-colors text-sm sm:text-base"
                        >
                            Add Address
                        </button>
                    </div>
                )
            )}
        </div>
    );
};

export default Addresses;
