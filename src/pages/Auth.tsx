import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/dialroad-logo-transparent.png';

const emailSchema = z.string().email('Email non valida');
const passwordSchema = z.string().min(6, 'La password deve avere almeno 6 caratteri');

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{email?: string; password?: string; confirmPassword?: string}>({});

  useEffect(() => {
    // Check for reset mode from URL
    if (isResetMode) {
      setMode('reset');
    }
  }, [isResetMode]);

  useEffect(() => {
    // Check if already logged in (but not in reset mode)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isResetMode) {
        navigate('/');
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      } else if (session && !isResetMode && mode !== 'reset') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isResetMode, mode]);

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot') {
      // Only validate email for forgot password
      try {
        emailSchema.parse(formData.email);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setErrors({ email: err.errors[0].message });
          return;
        }
      }
    } else if (mode === 'reset') {
      // Validate new password and confirmation
      const newErrors: {password?: string; confirmPassword?: string} = {};
      
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
    } else if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (error) {
          toast.error('Errore', { description: error.message });
          return;
        }

        toast.success('Password aggiornata!', {
          description: 'La tua password è stata reimpostata con successo.'
        });
        
        // Clear the reset parameter and navigate to home
        navigate('/');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth?reset=true`
        });

        if (error) {
          toast.error('Errore', { description: error.message });
          return;
        }

        toast.success('Email inviata!', {
          description: 'Controlla la tua casella email per reimpostare la password.'
        });
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Credenziali non valide', {
              description: 'Email o password errati. Riprova.'
            });
          } else {
            toast.error('Errore di accesso', {
              description: error.message
            });
          }
          return;
        }

        toast.success('Accesso effettuato!');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: formData.displayName || formData.email.split('@')[0]
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Utente già registrato', {
              description: 'Questa email è già in uso. Prova ad accedere.'
            });
            setMode('login');
          } else {
            toast.error('Errore di registrazione', {
              description: error.message
            });
          }
          return;
        }

        toast.success('Registrazione completata!', {
          description: 'Benvenuto in DialRoad!'
        });
      }
    } catch (error) {
      toast.error('Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'forgot': return 'Recupera Password';
      case 'signup': return 'Crea Account';
      case 'reset': return 'Nuova Password';
      default: return 'Bentornato!';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'forgot': return 'Inserisci la tua email per reimpostare la password';
      case 'signup': return 'Registrati per salvare i tuoi preferiti';
      case 'reset': return 'Inserisci la tua nuova password';
      default: return 'Accedi al tuo account DialRoad';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Torna alla mappa
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
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
              {getTitle()}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {getSubtitle()}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nome visualizzato"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="pl-10 h-12 rounded-xl border-border/50 bg-white/80 backdrop-blur-sm focus:bg-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field - not shown in reset mode */}
            {mode !== 'reset' && (
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={`pl-10 h-12 rounded-xl border-border/50 bg-white/80 backdrop-blur-sm focus:bg-white ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1 ml-1">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password field - shown for login, signup, and reset */}
            {mode !== 'forgot' && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'reset' ? 'Nuova password' : 'Password'}
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
            )}

            {/* Confirm password field - only in reset mode */}
            {mode === 'reset' && (
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
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
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
              disabled={isLoading}
              className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'forgot' ? (
                'Invia email di recupero'
              ) : mode === 'reset' ? (
                'Salva nuova password'
              ) : mode === 'login' ? (
                'Accedi'
              ) : (
                'Registrati'
              )}
            </Button>
          </form>

          {/* Toggle - not shown in reset mode */}
          {mode !== 'reset' && (
            <div className="mt-6 text-center">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  ← Torna al login
                </button>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setErrors({});
                    }}
                    className="ml-1 text-primary font-medium hover:underline"
                  >
                    {mode === 'login' ? 'Registrati' : 'Accedi'}
                  </button>
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
