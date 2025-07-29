import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Globe, Waves } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Don't render header on login page
  if (location.pathname === '/login') {
    return (
      <>
        {children}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-xl"
            animate={{
              y: [0, 20, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-effect border-b border-white/20 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
    className="w-12 h-12"
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <img 
      src="gators.png" 
      alt={language === 'ar' ? 'شعار أكاديمية السباحة' : 'Swimming Academy Logo'}
      className="w-full h-full object-contain"
    />
  </motion.div>

<div className="flex items-center gap-4">
  {user && (
    <motion.div 
      className="text-sm text-white/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {language === 'ar' ? 'مرحباً' : 'Welcome'}, {user?.user_metadata?.full_name || user?.email || ''}
    </motion.div>
  )}
  
  <Button
    variant="ghost"
    size="sm"
    onClick={toggleLanguage}
    className="text-white hover:bg-white/10"
  >
    <Globe className="h-4 w-4 mr-2" />
    {language === 'ar' ? 'EN' : 'عربي'}
  </Button>

  {user && (
    <Button
      variant="ghost"
      size="sm"
      onClick={signOut}
      className="text-white hover:bg-white/10"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {t('logout')}
    </Button>
  )}
</div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-xl"
          animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

export default Layout;