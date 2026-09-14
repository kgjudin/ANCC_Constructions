import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Building2, ShieldCheck, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@construction.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res: any = await api.post('/auth/login', { email, password });
      if (res.success && res.data?.token) {
        login(res.data.token, res.data.user);
        navigate('/', { replace: true });
      } else {
        setError(res.message || 'Login failed. Check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-brand-600 p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm mb-3">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">ANCC Construction</h1>
            <p className="text-brand-100 text-xs font-medium mt-1">Enterprise Operations & ERP Platform</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Sign in to your Portal</h2>
            <p className="text-xs text-slate-500">Traceable employee attribution & RBAC system active</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="employee@construction.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Sign In to Console
            </Button>
          </form>

          {/* Seed Login Quick Switch Helper */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demo Accounts Quick Switch</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => { setEmail('admin@construction.com'); setPassword('password123'); }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition-colors"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => { setEmail('hr@construction.com'); setPassword('password123'); }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition-colors"
              >
                HR Manager
              </button>
              <button
                type="button"
                onClick={() => { setEmail('purchase@construction.com'); setPassword('password123'); }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition-colors"
              >
                Purchase Exec
              </button>
              <button
                type="button"
                onClick={() => { setEmail('employee@construction.com'); setPassword('password123'); }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition-colors"
              >
                Site Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
