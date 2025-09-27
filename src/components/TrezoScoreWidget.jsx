import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const TrezoScoreWidget = ({ scoreData }) => {
    if (!scoreData) {
        return (
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg border border-gray-700 text-center">
                Calcul du Score Trézo en cours...
            </div>
        );
    }
    const { score, evaluation, color, strengths, weaknesses, recommendations } = scoreData;

    const colorClasses = {
        blue: { text: 'text-blue-400', ring: 'text-blue-500' },
        green: { text: 'text-green-400', ring: 'text-green-500' },
        yellow: { text: 'text-yellow-400', ring: 'text-yellow-500' },
        orange: { text: 'text-orange-400', ring: 'text-orange-500' },
        red: { text: 'text-red-400', ring: 'text-red-500' },
    };

    const selectedColor = colorClasses[color] || colorClasses.yellow;

    return (
        <div className="bg-gray-800 relative rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
            <div className="relative z-10 p-6 flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative flex-shrink-0">
                    <motion.svg className="w-32 h-32" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="stroke-current text-gray-700" strokeWidth="6" fill="transparent" />
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            className={`stroke-current ${selectedColor.ring}`}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 45}
                            strokeDashoffset={2 * Math.PI * 45 * (1 - score / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - score / 100) }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                        />
                    </motion.svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white drop-shadow-lg">{score}</span>
                        <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                </div>

                {/* Score Details */}
                <div className="flex-grow text-center md:text-left">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full bg-white/10 ${selectedColor.text}`}>
                        {evaluation}
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-2">Votre Score Trézo</h2>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {strengths.slice(0, 2).map((item, index) => (
                            <div key={`strength-${index}`} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300">{item.text}</span>
                            </div>
                        ))}
                        {weaknesses.slice(0, 2).map((item, index) => (
                            <div key={`weakness-${index}`} className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-gray-300">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="relative z-10 mt-2 px-6 pb-6">
                    <h3 className="text-base font-semibold text-white mb-3">🎯 Recommandations</h3>
                    <ul className="space-y-2">
                        {recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-500/20 text-blue-300 rounded-full font-bold text-xs">
                                    {index + 1}
                                </div>
                                <span className="text-sm text-gray-300">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TrezoScoreWidget;
