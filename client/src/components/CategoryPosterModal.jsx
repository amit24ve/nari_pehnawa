import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CategoryPosterModal = ({ isOpen, onClose, category }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
                        aria-label="Close Modal"
                    >
                        <X className="w-6 h-6 text-gray-800" />
                    </button>

                    {/* Content */}
                    <div className="relative w-full h-full">
                        {/* Poster Image */}
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <img
                                src="/category-poster.png"
                                alt={`${category} Collection`}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-xl"
                            />
                        </div>

                        {/* Category Label Overlay */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <Link
                                to={category.path}
                                onClick={onClose}
                                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Explore {category.name}</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-pink-300/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default CategoryPosterModal;
