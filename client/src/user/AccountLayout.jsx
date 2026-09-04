import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const AccountLayout = () => {
    const { user, openAccountModal } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
            return;
        }

        const path = location.pathname;
        let tab = 'profile';
        if (path.includes('orders')) tab = 'orders';
        else if (path.includes('addresses')) tab = 'addresses';
        else if (path.includes('wishlist')) tab = 'wishlist';
        else if (path.includes('settings')) tab = 'security';
        else tab = 'profile';

        openAccountModal(tab);
        navigate('/', { replace: true });
    }, [user, location.pathname, openAccountModal, navigate]);

    return null;
};

export default AccountLayout;

