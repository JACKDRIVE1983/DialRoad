import { motion } from 'framer-motion';
import { User, Heart, MessageCircle, Settings, ChevronRight, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/dialmap-logo.png';

export function ProfileView() {
  const { user, centers, isDarkMode } = useApp();

  const totalLikes = centers.reduce((acc, center) => acc + center.likes, 0);
  const totalComments = centers.reduce((acc, center) => acc + center.comments.length, 0);

  const menuItems = [
    { icon: Heart, label: 'Centri Preferiti', value: '0', color: 'text-red-500' },
    { icon: MessageCircle, label: 'I Miei Commenti', value: '0', color: 'text-accent' },
    { icon: Bell, label: 'Notifiche', value: '', color: 'text-yellow-500' },
    { icon: Shield, label: 'Privacy', value: '', color: 'text-green-500' },
    { icon: HelpCircle, label: 'Aiuto & Supporto', value: '', color: 'text-primary' },
    { icon: Settings, label: 'Impostazioni', value: '', color: 'text-muted-foreground' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      {/* Header */}
      <motion.div
        className="glass-card rounded-3xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center glow-effect">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
          </div>

          {/* User info */}
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-foreground mb-1">
              {user?.name || 'Utente'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user?.email || 'email@example.com'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{centers.length}</p>
            <p className="text-xs text-muted-foreground">Centri</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{totalLikes}</p>
            <p className="text-xs text-muted-foreground">Like Totali</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{totalComments}</p>
            <p className="text-xs text-muted-foreground">Commenti</p>
          </div>
        </div>
      </motion.div>

      {/* Menu */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              className="w-full glass-card rounded-xl p-4 flex items-center justify-between group hover:scale-[1.02] transition-transform"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value && (
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Logout button */}
      <motion.button
        className="w-full mt-6 glass-card rounded-xl p-4 flex items-center gap-4 text-destructive hover:bg-destructive/10 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <LogOut className="w-5 h-5" />
        </div>
        <span className="font-medium">Esci</span>
      </motion.button>

      {/* App info */}
      <motion.div
        className="mt-8 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <img src={logo} alt="DialMap" className="w-12 h-12 rounded-xl mb-3" />
        <p className="text-sm font-display font-semibold gradient-text">DialMap</p>
        <p className="text-xs text-muted-foreground mt-1">Versione 1.0.0</p>
      </motion.div>
    </div>
  );
}
