import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Waves, Mail, Lock, UserPlus } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const resolveRoleFromEmail = (email) => {
    if (!email) return 'trainee';
    const lower = email.toLowerCase();
    if (lower.endsWith('@gators.com')) return 'admin';
    if (lower.endsWith('@trainer.com')) return 'trainer';
    return 'trainee';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          data: { 
            full_name: fullName,
            role: resolveRoleFromEmail(email)
          }
        });

        if (error) throw error;

        toast({ title: t('success'), description: t('signupSuccess') });
        
        // تسجيل الدخول بعد التسجيل
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;

        // الانتظار لضمان تحديث الجلسة
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/trainee', { replace: true });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        navigate('/trainee', { replace: true });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: error.message.includes('already registered') 
          ? t('emailAlreadyRegistered')
          : error.message.includes('invalid_credentials')
          ? t('invalidCredentials')
          : error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{language === 'en' 
          ? `${isSignUp ? 'Sign Up' : 'Login'} - Swimming Academy` 
          : `${isSignUp ? 'تسجيل حساب جديد' : 'تسجيل الدخول'} - أكاديمية السباحة`}
        </title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="glass-effect border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <motion.div
                className="mx-auto mb-4 swimming-wave p-4 rounded-full w-fit"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img 
                  src="gators.png" 
                  alt={language === 'ar' ? 'شعار أكاديمية السباحة' : 'Swimming Academy Logo'}
                  className="w-16 h-16 object-contain"
                />
              </motion.div>
              <CardTitle className="text-2xl gradient-text">
                {isSignUp ? t('signupTitle') : t('Login/SignUp')}
              </CardTitle>
              <CardDescription className="text-white/70">
                {isSignUp ? t('signupSubtitle') : t('Enter your credentials to access your account')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="fullName" className="text-white/90 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t('fullName')}
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('fullName')}
                      required
                    />
                  </motion.div>
                )}

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-white/90 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder={t('email')}
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-white/90 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder={t('password')}
                    required
                    minLength={6}
                  />
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full swimming-wave hover:scale-105 transition-transform pulse-glow"
                    disabled={loading}
                  >
                    {loading ? t('loading') : isSignUp ? t('signup Button') : t('login')}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-center"
              >
                <Button
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-white/70 hover:text-white text-sm"
                >
                  {isSignUp ? t('already Have Account') : t('dont Have Account')}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Login;