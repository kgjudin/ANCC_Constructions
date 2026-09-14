import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from './Button';
import { useAuthStore } from '../../store/useAuthStore';

interface AccessDeniedStateProps {
  moduleName: string;
  requiredPermission?: string;
}

export const AccessDeniedState: React.FC<AccessDeniedStateProps> = ({
  moduleName,
  requiredPermission
}) => {
  const navigate = useNavigate();
  const { role, employee } = useAuthStore();
  const roleName = role?.name || employee?.role_name || 'Standard User';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Lock className="w-3 h-3" />
            <span>ACCESS RESTRICTED</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Unauthorized Access
          </h2>

          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Your assigned role <strong className="text-slate-900">({roleName})</strong> does not have permission to view or manage the <strong className="text-slate-900">{moduleName}</strong> module.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-left space-y-1">
          <p className="font-bold text-slate-800">Need access to this module?</p>
          <p>
            Please contact your company System Administrator or Super Admin to enable the required role permission
            {requiredPermission ? <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-700 ml-1">{requiredPermission}</code> : ''}.
          </p>
        </div>

        <div className="pt-2">
          <Button
            size="lg"
            onClick={() => navigate('/')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Executive Cockpit
          </Button>
        </div>
      </div>
    </div>
  );
};
