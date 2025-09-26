import React from 'react';
import TiersManagementView from '../components/TiersManagementView';
import { useOutletContext } from 'react-router-dom';

const TiersManagementPage = () => {
    const context = useOutletContext();
    return <TiersManagementView onOpenPaymentTerms={context.onOpenPaymentTerms} />;
};

export default TiersManagementPage;
