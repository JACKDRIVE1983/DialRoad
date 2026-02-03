import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoIcon from '@/assets/dialroad-logo-new-icon.png';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().email('Email non valida').max(255, 'Email troppo lunga');
const passwordSchema = z.string()
  .min(6, 'La password deve essere di almeno 6 caratteri')
  .max(72, 'Password troppo lunga');
const displayNameSchema = z.string()
  .min(2, 'Il nome deve essere di almeno 2 caratteri')
  .max(50, 'Nome troppo lungo')
  .optional();

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string; confirmPassword?: string }>({});

  // Check for reset mode from URL
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  // Redirect if already logged in (but not in reset mode)
  useEffect(() => {
    if (user && !authLoading && mode !== 'reset') {
      navigate('/');
    }
  }, [user, authLoading, navigate, mode]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; displayName?: string; confirmPassword?: string } = {};
    
    if (mode !== 'reset') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    }
    
    if (mode !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    if (mode === 'reset') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono';
      }
    }
    
    if (mode === 'signup' && displayName) {
      const displayNameResult = displayNameSchema.safeParse(displayName);
      if (!displayNameResult.success) {
        newErrors.displayName = displayNameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: 'Errore',
          description: 'Impossibile aggiornare la password. Il link potrebbe essere scaduto.',
          variant: 'destructive'
        });
        return;
      }

      setResetSuccess(true);
      toast({
        title: 'Password aggiornata!',
        description: 'La tua password è stata cambiata con successo'
      });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        toast({
          title: 'Errore',
          description: 'Impossibile inviare l\'email di recupero',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Email inviata!',
        description: 'Controlla la tua casella email per reimpostare la password'
      });
      setMode('login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot-password') {
      await handleForgotPassword();
      return;
    }

    if (mode === 'reset') {
      await handleResetPassword();
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        
        if (error) {
          let message = 'Errore durante il login';
          if (error.message.includes('Invalid login credentials')) {
            message = 'Email o password non corretti';
          } else if (error.message.includes('Email not confirmed')) {
            message = 'Conferma la tua email prima di accedere';
          }
          toast({
            title: 'Errore',
            description: message,
            variant: 'destructive'
          });
          return;
        }
        
        toast({
          title: 'Benvenuto!',
          description: 'Accesso effettuato con successo'
        });
        navigate('/');
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        
        if (error) {
          let message = 'Errore durante la registrazione';
          if (error.message.includes('User already registered')) {
            message = 'Questa email è già registrata';
          } else if (error.message.includes('Password')) {
            message = 'La password non soddisfa i requisiti di sicurezza';
          }
          toast({
            title: 'Errore',
            description: message,
            variant: 'destructive'
          });
          return;
        }
        
        toast({
          title: 'Benvenuto!',
          description: 'Account creato con successo'
        });
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    if (mode === 'forgot-password' || mode === 'reset') {
      setMode('login');
    } else {
      setMode(mode === 'login' ? 'signup' : 'login');
    }
    setErrors({});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Bentornato!';
      case 'signup': return 'Crea un account';
      case 'forgot-password': return 'Recupera password';
      case 'reset': return resetSuccess ? 'Password aggiornata!' : 'Nuova password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Accedi per gestire il tuo profilo Premium';
      case 'signup': return 'Registrati per sbloccare tutte le funzionalità';
      case 'forgot-password': return 'Inserisci la tua email per ricevere il link di recupero';
      case 'reset': return resetSuccess ? 'Verrai reindirizzato automaticamente' : 'Inserisci la tua nuova password';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="safe-area-top px-4 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Torna all'app</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <img src={logoIcon} alt="DialRoad" className="w-20 h-20 rounded-2xl shadow-lg" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground text-sm">
            {getSubtitle()}
          </p>
        </motion.div>

        {/* Reset Success State */}
        {resetSuccess && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">Reindirizzamento in corso...</p>
          </motion.div>
        )}

        {/* Form */}
        {!resetSuccess && (
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-4"
          >
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nome (opzionale)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-11 h-12 rounded-xl bg-muted/50 border-border"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-destructive text-xs mt-1">{errors.displayName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== 'reset' && (
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">{errors.email}</p>
                )}
              </div>
            )}

            {(mode !== 'forgot-password') && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'reset' ? 'Nuova password' : 'Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">{errors.password}</p>
                )}
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Conferma password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-muted/50 border-border"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setErrors({});
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Accedi'
              ) : mode === 'signup' ? (
                'Registrati'
              ) : mode === 'reset' ? (
                'Aggiorna password'
              ) : (
                'Invia email di recupero'
              )}
            </Button>
          </motion.form>
        )}

        {/* Switch mode */}
        {!resetSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <button
              onClick={switchMode}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login' ? (
                <>Non hai un account? <span className="text-primary font-medium">Registrati</span></>
              ) : mode === 'signup' ? (
                <>Hai già un account? <span className="text-primary font-medium">Accedi</span></>
              ) : (
                <>Torna al <span className="text-primary font-medium">Login</span></>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          Accedendo accetti i nostri Termini di Servizio e la Privacy Policy
        </p>
      </div>
    </div>
  );
}
