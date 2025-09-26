import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { CreditCard, CheckCircle, Clock, Loader, Star, ShieldCheck } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BillingToggle = ({ billingCycle, setBillingCycle }) => (
    <div className="flex justify-center items-center gap-4 mb-10">
        <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>
            Mensuel
        </span>
        <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors bg-blue-600`}
        >
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                className="w-4 h-4 bg-white rounded-full"
                style={{ marginLeft: billingCycle === 'monthly' ? '0%' : 'calc(100% - 1rem)' }}
            />
        </button>
        <span className={`font-semibold transition-colors ${billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-500'}`}>
            Annuel
        </span>
        <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
            -33% Économie
        </span>
    </div>
);

const SubscriptionPage = () => {
    const { dataState } = useData();
    const { uiDispatch } = useUI();
    const { session, profile } = dataState;
    const [searchParams] = useSearchParams();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        if (searchParams.get('session_id')) {
            uiDispatch({
                type: 'ADD_TOAST',
                payload: { message: 'Abonnement réussi ! Merci pour votre confiance.', type: 'success', duration: 5000 }
            });
            // TODO: Optionally refetch profile to update status immediately
        }
    }, [searchParams, uiDispatch]);

    const subscriptionStatus = profile?.subscriptionStatus || 'trialing';
    
    const trialEndDate = useMemo(() => {
        if (profile?.trial_ends_at) {
            return new Date(profile.trial_ends_at);
        }
        if (session?.user?.created_at) {
            const createdDate = new Date(session.user.created_at);
            return new Date(createdDate.setDate(createdDate.getDate() + 14));
        }
        return null;
    }, [session, profile]);

    const trialDaysLeft = useMemo(() => {
        if (!trialEndDate) return 0;
        const diff = trialEndDate.getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [trialEndDate]);

    const handleSubscribe = async (plan) => {
        setLoadingPlan(plan.id);
        let priceId;

        if (plan.id === 'lifetime') {
            priceId = plan.priceId;
        } else {
            priceId = billingCycle === 'monthly' ? plan.monthly.priceId : plan.annual.priceId;
        }

        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId },
            });

            if (error) throw error;

            window.location.href = data.url;

        } catch (error) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
            setLoadingPlan(null);
        }
    };

    const featuresList = [
        "Suivi de trésorerie complet", "Prévisions et Simulations (Scénarios)", "Analyse des données avancée",
        "Gestion multi-projets", "Consolidation des projets", "Support client prioritaire", "Toutes les futures mises à jour"
    ];

    const plans = [
        {
            id: 'solo',
            name: 'Pack Solo',
            description: 'Pour les indépendants et les budgets personnels.',
            monthly: { price: 12, priceId: 'YOUR_SOLO_MONTHLY_PRICE_ID' },
            annual: { price: 96, priceId: 'YOUR_SOLO_ANNUAL_PRICE_ID' },
            buttonText: "Démarrer l'essai de 14 jours",
        },
        {
            id: 'team',
            name: 'Pack Team',
            description: 'Pour les équipes et les entreprises qui collaborent.',
            monthly: { price: 20, priceId: 'YOUR_TEAM_MONTHLY_PRICE_ID' },
            annual: { price: 160, priceId: 'YOUR_TEAM_ANNUAL_PRICE_ID' },
            highlight: true,
            buttonText: "Démarrer l'essai de 14 jours",
        },
        {
            id: 'lifetime',
            name: 'Pack Lifetime',
            description: 'Un paiement unique, un accès à vie.',
            price: 499,
            priceId: 'YOUR_LIFETIME_PRICE_ID',
            special: true,
            buttonText: "Devenir un Visionnaire",
        }
    ];

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    Mon Abonnement
                </h1>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        {subscriptionStatus === 'trialing' ? <Clock className="w-6 h-6 text-blue-600" /> : <CheckCircle className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Votre statut actuel</h2>
                        {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
                            <p className="font-semibold text-lg">Essai gratuit - {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}</p>
                        )}
                        {subscriptionStatus === 'active' && profile?.plan_id?.includes('month') && <p className="font-semibold text-lg">Abonné Mensuel</p>}
                        {subscriptionStatus === 'active' && profile?.plan_id?.includes('year') && <p className="font-semibold text-lg">Abonné Annuel</p>}
                        {subscriptionStatus === 'lifetime' && <p className="font-semibold text-lg">Accès à Vie</p>}
                        {subscriptionStatus === 'trialing' && trialDaysLeft === 0 && <p className="font-semibold text-lg">Période d'essai terminée</p>}
                    </div>
                </div>
            </div>

            <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />

            <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8">
                {plans.map(plan => {
                    const isCurrent = profile?.plan_id === (billingCycle === 'monthly' ? plan.monthly?.priceId : plan.annual?.priceId) || profile?.plan_id === plan.priceId;
                    const buttonAction = () => handleSubscribe(plan);

                    return (
                        plan.id === 'lifetime' ? (
                            <div key={plan.id} className={`w-full max-w-sm p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col relative ${isCurrent ? 'ring-4 ring-amber-400' : ''}`}>
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-amber-900 bg-amber-400 rounded-full">100 Premiers Uniquement</div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-semibold text-white text-center">{plan.name}</h3>
                                    <p className="text-sm text-gray-300 mt-2 text-center h-10">{plan.description}</p>
                                    <div className="my-8 h-28 flex flex-col justify-center text-center">
                                        <span className="text-5xl font-extrabold text-white">{plan.price}€</span>
                                        <span className="text-xl font-medium text-gray-400"> / à vie</span>
                                    </div>
                                </div>
                                <div>
                                    <button onClick={buttonAction} disabled={isCurrent || loadingPlan} className="w-full px-6 py-3 font-semibold text-gray-900 bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors shadow-lg disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                                        {loadingPlan === plan.id ? <Loader className="animate-spin w-5 h-5" /> : (isCurrent ? 'Plan Actuel' : plan.buttonText)}
                                    </button>
                                    <p className="text-center text-xs text-amber-400 font-semibold mt-4 h-10 flex items-center justify-center">⚠️ Réservé aux 100 premiers visionnaires.</p>
                                    <hr className="my-4 border-gray-700" />
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-300 font-bold">Collaboration illimitée</span></li>
                                        {featuresList.map((feature, index) => (<li key={index} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-300">{feature}</span></li>))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div key={plan.id} className={`w-full max-w-sm p-8 bg-white rounded-2xl shadow-lg border flex flex-col ${plan.highlight ? 'border-2 border-blue-600 scale-105' : ''} ${isCurrent ? 'border-2 border-blue-600' : ''}`}>
                                {plan.highlight && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">Le plus populaire</div>}
                                <div className="flex-grow">
                                    <h3 className="text-xl font-semibold text-gray-800 text-center">{plan.name}</h3>
                                    <p className="text-sm text-gray-500 mt-2 text-center h-10">{plan.description}</p>
                                    <div className="my-8 h-28 flex flex-col justify-center text-center">
                                        <AnimatePresence mode="wait">
                                            <motion.div key={billingCycle} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                                                {billingCycle === 'monthly' ? (
                                                    <div>
                                                        <span className="text-5xl font-extrabold text-gray-900">{plan.monthly.price}€</span>
                                                        <span className="text-xl font-medium text-gray-500"> / mois</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-5xl font-extrabold text-gray-900">{plan.annual.price}€</span>
                                                        <span className="text-xl font-medium text-gray-500"> / an</span>
                                                        {plan.id === 'solo' && <p className="text-sm font-semibold text-blue-600 mt-1">Soit 8€ par mois</p>}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div>
                                    <button onClick={buttonAction} disabled={isCurrent || loadingPlan} className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                                        {loadingPlan === plan.id ? <Loader className="animate-spin w-5 h-5" /> : (isCurrent ? 'Plan Actuel' : plan.buttonText)}
                                    </button>
                                    <hr className="my-8" />
                                    <ul className="space-y-3 text-sm">
                                        {plan.id === 'team' && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700 font-bold">Collaboration illimitée</span></li>}
                                        {featuresList.map((feature, index) => (<li key={index} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700">{feature}</span></li>))}
                                    </ul>
                                </div>
                            </div>
                        )
                    );
                })}
            </div>
        </div>
    );
};

export default SubscriptionPage;
