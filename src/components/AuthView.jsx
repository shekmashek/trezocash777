import React, { useState } from 'react';
import { LogIn, UserPlus, Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TrezocashLogo from './TrezocashLogo';

const AuthView = ({ initialMode = 'login', fromTrial = false, onBack }) => {
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setMessage('');

  // Validation côté client
  if (!isLogin) {
    if (!fullName.trim()) {
      setError('Le nom complet est requis');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }
  }

  try {
    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      // Utiliser le nom complet saisi
      const nameToSend = fullName.trim();
      result = await register(nameToSend, email, password);
    }

    if (result.success) {
      setMessage(result.message);
      setTimeout(() => {
        window.location.replace('/app/dashboard');
      }, 800);
    } else {
      setError(result.message);
    }
  } catch (err) {
    setError('Erreur serveur. Veuillez réessayer.');
    console.error('Auth error:', err);
  } finally {
    setLoading(false);
  }
};


  const signUpTitle = fromTrial ? "Démarrer votre essai de 14 jours" : "Créer un compte";
  const signUpSubtitle = fromTrial
    ? "Créez votre compte pour commencer votre essai gratuit."
    : "Rejoignez-nous pour commencer à piloter votre trésorerie.";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <TrezocashLogo className="w-24 h-24" />
          <h1 className="mt-4 text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
            Trezocash
          </h1>
          <p className="mt-2 text-gray-600">Votre trésorerie, simplifiée.</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border relative">
          {onBack && (
            <button onClick={onBack} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-semibold ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Se Connecter
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-semibold ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              S'inscrire
            </button>
          </div>

          <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
            {isLogin ? 'Bon retour !' : signUpTitle}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            {isLogin ? 'Connectez-vous pour accéder à votre espace.' : signUpSubtitle}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-700">Nom complet</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Votre nom complet"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="********"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="********"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400 transition-colors"
            >
              {loading ? <Loader className="animate-spin" size={18} /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
              <span>{loading ? 'Chargement...' : (isLogin ? 'Se Connecter' : 'S\'inscrire')}</span>
            </button>
          </form>

          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>}
          {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
