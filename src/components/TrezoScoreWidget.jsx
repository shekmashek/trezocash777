import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, TrendingUp, Shield, BarChart, PiggyBank, Banknote } from 'lucide-react';

const TrezoScoreWidget = ({ scoreData }) => {
    if (!scoreData) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center text-gray-500">
                Calcul du Score Trézo en cours...
            </div>
        );
    }
    const { score, evaluation, color, strengths, weaknesses, recommendations } = scoreData;

    const colorClasses = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'text-blue-500' },
        green: { bg: 'bg-green-100', text: 'text-green-800', ring: 'text-green-500' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'text-yellow-500' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'text-orange-500' },
        red: { bg: 'bg-red-100', text: 'text-red-800', ring: 'text-red-500' },
    };

    const selectedColor = colorClasses[color] || colorClasses.yellow;

    const pillarIcons = {
        'Couverture des Dépenses Critiques': TrendingUp,
        'Stabilité des Ressources': Shield,
        'Maîtrise des Dépenses': BarChart,
        'Épargne de Précaution': PiggyBank,
        'Endettement & Engagements': Banknote,
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative flex-shrink-0">
                    <motion.svg className="w-32 h-32" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="stroke-current text-gray-200" strokeWidth="10" fill="transparent" />
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            className={`stroke-current ${selectedColor.ring}`}
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 45}
                            strokeDashoffset={2 * Math.PI * 45 * (1 - score / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - score / 100) }}
                            transition={{ duration: 1, ease: "circOut" }}
                        />
                    </motion.svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">{score}</span>
                        <span className="text-xs text-gray-500">/ 100</span>
                    </div>
                </div>

                {/* Score Details */}
                <div className="flex-grow text-center md:text-left">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${selectedColor.bg} ${selectedColor.text}`}>
                        {evaluation}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800 mt-2">Votre Score Trézo</h2>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {strengths.map((item, index) => {
                            const Icon = pillarIcons[item.pillar] || CheckCircle;
                            return (
                                <div key={`strength-${index}`} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-600">{item.text}</span>
                                </div>
                            );
                        })}
                        {weaknesses.map((item, index) => {
                            const Icon = pillarIcons[item.pillar] || AlertTriangle;
                            return (
                                <div key={`weakness-${index}`} className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                    <span className="text-gray-600">{item.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">🎯 Recommandations</h3>
                    <ul className="space-y-2">
                        {recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold text-xs">
                                    {index + 1}
                                </div>
                                <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TrezoScoreWidget;
