import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PaymentTermsModal = ({ isOpen, onClose, tier, onSave }) => {
    const [terms, setTerms] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (tier) {
            const initialTerms = tier.payment_terms || [{ id: uuidv4(), percentage: 100, days: 0 }];
            setTerms(initialTerms.map(t => ({ ...t, id: t.id || uuidv4() })));
        } else {
            setTerms([]);
        }
        setError('');
    }, [tier]);

    const handleTermChange = (id, field, value) => {
        const newTerms = terms.map(term => {
            if (term.id === id) {
                return { ...term, [field]: value };
            }
            return term;
        });
        setTerms(newTerms);
    };

    const addTerm = () => {
        setTerms([...terms, { id: uuidv4(), percentage: '', days: '' }]);
    };

    const deleteTerm = (id) => {
        setTerms(terms.filter(term => term.id !== id));
    };

    const validateAndSave = () => {
        const totalPercentage = terms.reduce((sum, term) => sum + (Number(term.percentage) || 0), 0);
        if (totalPercentage !== 100) {
            setError('La somme des pourcentages doit être exactement 100%.');
            return;
        }
        if (terms.some(term => term.percentage === '' || term.days === '' || Number(term.percentage) < 0 || Number(term.days) < 0)) {
            setError('Veuillez remplir tous les champs avec des valeurs positives.');
            return;
        }
        setError('');
        onSave(tier.id, terms.map(({ id, percentage, days }) => ({ percentage: Number(percentage), days: Number(days) })));
    };

    if (!isOpen || !tier) return null;

    const totalPercentage = terms.reduce((sum, term) => sum + (Number(term.percentage) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Conditions de paiement pour "{tier.name}"
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-gray-600">Définissez l'échéancier de paiement. La somme des pourcentages doit être égale à 100%.</p>
                    {terms.map((term, index) => (
                        <div key={term.id} className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="%"
                                value={term.percentage}
                                onChange={(e) => handleTermChange(term.id, 'percentage', e.target.value)}
                                className="w-24 px-3 py-2 border rounded-lg"
                                min="0" max="100"
                            />
                            <span className="font-semibold">% du montant</span>
                            <span className="text-gray-500">à</span>
                            <input
                                type="number"
                                placeholder="Jours"
                                value={term.days}
                                onChange={(e) => handleTermChange(term.id, 'days', e.target.value)}
                                className="w-24 px-3 py-2 border rounded-lg"
                                min="0"
                            />
                            <span className="font-semibold">jours</span>
                            <button onClick={() => deleteTerm(term.id)} className="p-2 text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button onClick={addTerm} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                        <Plus className="w-4 h-4" /> Ajouter une échéance
                    </button>
                    <div className={`p-3 rounded-lg flex justify-between items-center ${totalPercentage === 100 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <span className="font-bold">Total</span>
                        <span className="font-bold">{totalPercentage}%</span>
                    </div>
                    {error && (
                        <div className="p-3 bg-red-50 text-red-800 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Annuler</button>
                    <button
                        type="button"
                        onClick={validateAndSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-400"
                        disabled={totalPercentage !== 100}
                    >
                        <Save className="w-4 h-4" /> Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentTermsModal;
