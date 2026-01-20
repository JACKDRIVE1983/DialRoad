import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/dialroad-logo-login.png';

const passwordSchema = z.string().min(6, 'La password deve avere almeno 6 caratteri');

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const verifyToken = async () => {
      // If no token, check if we already have a recovery session
      if (!token || !type) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsVerified(true);
          setIsVerifying(false);
          return;
        }
        setVerifyError('Link non valido. Richiedi un nuovo link di reset password.');
        setIsVerifying(false);
        return;
      }

      // Verify the OTP token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });

      if (error) {
        setVerifyError('Link scaduto o non valido. Richiedi un nuovo link di reset password.');
        setIsVerifying(false);
        return;
      }

      setIsVerified(true);
      setIsVerifying(false);
    };

    verifyToken();
  }, [token, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { password?: string; confirmPassword?: string } = {};

    try {
      passwordSchema.parse(formData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.password = err.errors[0].message;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non corrispondono';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('different from the old password') || msg.includes('same_password')) {
          toast.error('La nuova password deve essere diversa da quella precedente');
        } else if (msg.includes('session')) {
          toast.error('Sessione scaduta', { description: 'Richiedi un nuovo link di reset password.' });
        } else {
          toast.error('Errore', { description: msg });
        }
        return;
      }

      toast.success('Password aggiornata!', {
        description: 'Ora puoi accedere con la tua nuova password.'
      });

      // Navigate to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      toast.error('Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifica del link in corso...</p>
        </motion.div>
      </div>
    );
  }

  // Error state if token is invalid
  if (verifyError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center px-6">
        <motion.div
          className="text-center max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Link non valido</h1>
          <p className="text-muted-foreground mb-6">{verifyError}</p>
          <Button
            onClick={() => navigate('/auth')}
            className="gradient-bg text-primary-foreground"
          >
            Torna al login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="w-24 h-24 mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <img src={logo} alt="DialRoad" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold gradient-text">
            Nuova Password
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Inserisci la tua nuova password per reimpostare l'accesso
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nuova password"
                value={formData.password}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, password: e.target.value }));
                  setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`pl-10 pr-10 h-12 rounded-xl border-border/50 bg-white/80 backdrop-blur-sm focus:bg-white ${errors.password ? 'border-destructive' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1 ml-1">{errors.password}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Conferma password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                className={`pl-10 h-12 rounded-xl border-border/50 bg-white/80 backdrop-blur-sm focus:bg-white ${errors.confirmPassword ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-xs mt-1 ml-1">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Salva nuova password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="text-sm text-primary font-medium hover:underline"
          >
            ← Torna al login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
