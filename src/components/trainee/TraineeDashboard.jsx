import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, AlertCircle, Target, X, BookOpen, ChevronLeft, ChevronRight, UserPlus, User, Cake, Info, Phone, Mail, CreditCard } from 'lucide-react';
import BookingForm from './BookingForm';
import { Helmet } from 'react-helmet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { Textarea } from '@/components/ui/textarea';

const TraineeDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermSection, setActiveTermSection] = useState(0);
  
  // حالة نموذج التسجيل
  const [registrationData, setRegistrationData] = useState({
    full_name: '',
    birth_date: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    level: '',
    registration_date: new Date().toISOString().split('T')[0],
    days: {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false
    },
    trainer_id: '',
    evaluator_id: '',
    duration: '1',
    payment_amount: '',
    payment_method: '',
    notes: ''
  });

  // قوائم الاختيارات
  const levels = ['Level1', 'Level2', 'Level3','Level4','Adult','Dream Team'];
  const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer'];
  const [trainers, setTrainers] = useState([]);
  const [evaluators, setEvaluators] = useState([]);

  useEffect(() => {
    if (user) {
      loadMyBookings();
      fetchTrainersAndEvaluators();
    }
  }, [user]);

  // دالة لتحويل الأرقام إلى الإنجليزية
  const toEnglishNumbers = (num) => {
    if (!num) return '';
    return num.toString().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  const loadMyBookings = async () => {
    const { data, error } = await supabase.from('bookings').select('*').eq('student_id', user.id);
    if(error) {
        toast({ title: "Error", description: error.message, variant: 'destructive'});
    } else {
        setMyBookings(data);
        calculateProgress(data);
    }
  };

  const fetchTrainersAndEvaluators = async () => {
    try {
      const { data: trainersData, error: trainersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'trainer');
      
      const { data: evaluatorsData, error: evaluatorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer');
    
      if (trainersError || evaluatorsError) {
        throw trainersError || evaluatorsError;
      }
  
      setTrainers(trainersData || []);
      setEvaluators(evaluatorsData || []);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const calculateProgress = (bookings) => {
    const totalBookings = bookings.length;
    if (totalBookings === 0) {
      setProgress(0);
      return;
    }
    const attendedBookings = bookings.filter(b => b.attendance === 'present').length;
    const progressPercentage = (attendedBookings / totalBookings) * 100;
    setProgress(progressPercentage);
  };

  const handleProceedToBooking = () => {
    if (!acceptedTerms) {
      toast({ title: t('acceptTerms'), variant: 'destructive' });
      return;
    }
    setShowBookingForm(true);
  };

  const handleDayChange = (day) => {
    setRegistrationData(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: !prev.days[day]
      }
    }));
  };

  // حساب العمر مع ضبط الأرقام للإنجليزية
  useEffect(() => {
    if (registrationData.birth_date) {
      const birthDate = new Date(registrationData.birth_date);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      setRegistrationData(prev => ({ 
        ...prev, 
        age: toEnglishNumbers(calculatedAge.toString()) 
      }));
    }
  }, [registrationData.birth_date]);

  // إرسال نموذج التسجيل
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const selectedDays = Object.entries(registrationData.days)
        .filter(([_, checked]) => checked)
        .map(([day]) => day);
      
      const { error } = await supabase.from('registrations').insert({
        ...registrationData,
        days: selectedDays,
        subscription_date: registrationData.registration_date,
        student_name: registrationData.full_name,
        trainer_name: trainers.find(t => t.id === registrationData.trainer_id)?.full_name || '',
        date_of_birth: registrationData.birth_date,
        mobile_number: registrationData.phone,
        registered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: ('registration Success'),
        description: ('registration Success Message'),
      });

      setShowRegistrationForm(false);
      
    } catch (error) {
      toast({
        title: t('registrationError'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      confirmed: { color: 'bg-green-500', text: t('confirmed') },
      pending: { color: 'bg-yellow-500', text: t('pending') },
      cancelled: { color: 'bg-red-500', text: t('cancelled') }
    }[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const termSections = [
    {
      title: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions',
      content: language === 'ar' 
        ? 'أوافق على الشروط والأحكام وأعطي الموافقة لجميع الأشخاص المضافين إلى حسابي ليصبحوا أعضاء في أكاديمية السباحة. خلال فترة العضوية، أوافق على مشاركة المسجلين في حسابي في الأنشطة والفعاليات التي تنظمها الأكاديمية.'
        : 'I HEREBY AGREE to the terms and conditions and give consent to all people added to my account in becoming a member of the Swimming Academy. During the membership period, I consent to those registered on my account to participate in activities organized by the Academy.'
    },
    {
      title: language === 'ar' ? 'فترة التشغيل' : 'Term of Operation',
      content: language === 'ar' 
        ? 'الأكاديمية تعمل خلال جميع العطلات الرسمية. سيتم إبلاغ أي استثناءات مقدماً. سياسة الأكاديمية أن دروس التعويض ستقدم فقط عند إلغاء الدروس من قبل الأكاديمية، وليس للعطلات أو الأمراض قصيرة الأجل.'
        : 'The Academy runs through all public holidays. Any exceptions will be communicated in advance. Catch-up lessons are only offered when cancelled by the Academy, not for holidays or short-term sickness.'
    },
    {
      title: language === 'ar' ? 'الأشياء المفقودة' : 'Lost Items',
      content: language === 'ar' 
        ? 'لا تتحمل الأكاديمية أي مسؤولية عن فقدان أو تلف الممتلكات أو الأشياء الثمينة، حتى لو تركت في الخزائن المقدمة.'
        : 'No responsibility is accepted for loss or damage to property or valuables, even if left in provided lockers.'
    },
    {
      title: language === 'ar' ? 'الرسوم والتعويضات' : 'Fees & Credits',
      content: language === 'ar' 
        ? 'يتم تقديم دروس تعويض فقط عند إلغاء الدروس من قبل الأكاديمية. يجب استخدام دروس التعويض خلال الفصل الحالي.'
        : 'Catch-up lessons are only offered when cancelled by the Academy. Must be used within the current term.'
    }
  ];

  const handleNextTerm = () => {
    setActiveTermSection((prev) => (prev + 1) % termSections.length);
  };

  const handlePrevTerm = () => {
    setActiveTermSection((prev) => (prev - 1 + termSections.length) % termSections.length);
  };

  if (showBookingForm) {
    return <BookingForm onBack={() => setShowBookingForm(false)} onBookingComplete={loadMyBookings} />;
  }

  if (showRegistrationForm) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Button 
          onClick={() => setShowRegistrationForm(false)} 
          variant="outline" 
          className="mb-6 text-white border-white/30 hover:bg-white/10"
        >
          {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
        </Button>

        <form onSubmit={handleRegistrationSubmit} className="space-y-6">
          {/* معلومات شخصية */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" /> {('personal Information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white/90">
                    {('full Name')} *
                  </Label>
                  <Input
                    id="full_name"
                    value={registrationData.full_name}
                    onChange={(e) => setRegistrationData({ ...registrationData, full_name: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="text-white/90">
                    {('date Of Birth')}
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={registrationData.birth_date}
                    onChange={(e) => setRegistrationData({ ...registrationData, birth_date: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    max={new Date().toISOString().split('T')[0]}
                    lang="en"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-white/90">
                    {t('age')}
                  </Label>
                  <Input
                    id="age"
                    value={registrationData.age}
                    readOnly
                    className="bg-white/10 border-white/20 text-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-white/90">
                    {t('gender')}
                  </Label>
                  <Select
                    value={registrationData.gender}
                    onValueChange={(value) => setRegistrationData({ ...registrationData, gender: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder={t('selectGender')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="male" className="text-white">{t('male')}</SelectItem>
                      <SelectItem value="female" className="text-white">{t('female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-white/90">
                    {t('level')}
                  </Label>
                  <Select
                    value={registrationData.level}
                    onValueChange={(value) => setRegistrationData({ ...registrationData, level: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder={t('selectLevel')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {levels.map((level) => (
                        <SelectItem key={level} value={level} className="text-white">
                          {t(level.toLowerCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الاتصال */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Phone className="h-5 w-5" /> {('contact Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/90">
                    {('mobile Number')} *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={toEnglishNumbers(registrationData.phone)}
                    onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    required
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90">
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل التدريب */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" /> {('training Details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration_date" className="text-white/90">
                  {('registration Date')} *
                </Label>
                <Input
                  id="registration_date"
                  type="date"
                  value={registrationData.registration_date}
                  onChange={(e) => setRegistrationData({ ...registrationData, registration_date: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                  lang="en"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/90">
                  {t('schedule')}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                  {Object.entries(registrationData.days).map(([day, checked]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={checked}
                        onCheckedChange={() => handleDayChange(day)}
                        className="border-white/30"
                      />
                      <Label htmlFor={day} className="text-white/90">
                        {t(day.substring(0, 3))}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المدربون */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" /> {('instructors')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainer_id" className="text-white/90">
                    {t('instructor')}
                  </Label>
                  <Select
                    value={registrationData.trainer_id}
                    onValueChange={(value) => setRegistrationData({ ...registrationData, trainer_id: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder={('select Instructor')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {trainers.length > 0 ? (
                        trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id} className="text-white">
                            {trainer.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-white/70 p-2 text-sm">
                          {('no Trainers Available')}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evaluator_id" className="text-white/90">
                    {('assessment Instructor')}
                  </Label>
                  <Select
                    value={registrationData.evaluator_id}
                    onValueChange={(value) => setRegistrationData({ ...registrationData, evaluator_id: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder={('select Evaluator')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {trainers.length > 0 ? (
                        trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id} className="text-white">
                            {trainer.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-white/70 p-2 text-sm">
                          {('no Trainers Available')}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الدفع */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" /> {('payment Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-white/90">
                    {('duration Months')} *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={toEnglishNumbers(registrationData.duration)}
                    onChange={(e) => setRegistrationData({ ...registrationData, duration: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    min="1"
                    required
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_amount" className="text-white/90">
                    {('payment Amount')} *
                  </Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    value={toEnglishNumbers(registrationData.payment_amount)}
                    onChange={(e) => setRegistrationData({ ...registrationData, payment_amount: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    min="0"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="payment_method" className="text-white/90">
                  {('payment Method')}
                </Label>
                <Select
                  value={registrationData.payment_method}
                  onValueChange={(value) => setRegistrationData({ ...registrationData, payment_method: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder={('select Payment Method')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method} className="text-white">
                        {t(method.toLowerCase().replace(' ', '_'))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ملاحظات إضافية */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Info className="h-5 w-5" /> {('additional Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-white/90">
                  {t('notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={registrationData.notes}
                  onChange={(e) => setRegistrationData({ ...registrationData, notes: e.target.value })}
                  className="bg-white/10 border-white/20 text-white min-h-[100px]"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </CardContent>
          </Card>

          {/* أزرار الإجراءات */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRegistrationForm(false)}
              className="flex-1 bg-transparent text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-300"
            >
              {t('cancel')}
            </Button>
            
            <Button 
              type="submit" 
              className="flex-1 swimming-wave hover:scale-105 transition-transform pulse-glow"
            >
              {('confirm Registration')}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{language === 'ar' ? 'لوحة تحكم المتدرب -  Gators Swimming Academy' : 'Trainee Dashboard - Swimming Academy'}</title>
        <meta name="description" content={language === 'ar' ? 'لوحة تحكم المتدرب لحجز الجلسات ومتابعة التدريب' : 'Trainee dashboard for booking sessions and tracking training'} />
      </Helmet>

      <AnimatePresence>
        {showTermsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-blue-900 to-blue-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </h2>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-blue-800/30 p-4 border-r border-white/20">
                  <nav className="space-y-1">
                    {termSections.map((section, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTermSection(index)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTermSection === index ? 'bg-blue-600 text-white' : 'text-white/80 hover:bg-white/10'}`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <motion.div
                    key={activeTermSection}
                    initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="prose prose-invert max-w-none"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {termSections[activeTermSection].title}
                    </h3>
                    <p className="text-white/90 whitespace-pre-line">
                      {termSections[activeTermSection].content}
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="p-6 border-t border-white/20 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={handlePrevTerm}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  {language === 'ar' ? (
                    <>
                      <ChevronRight className="h-4 w-4 ml-2" />
                      السابق
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </>
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  {termSections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTermSection(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${activeTermSection === index ? 'bg-white' : 'bg-white/30'}`}
                    />
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleNextTerm}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  {language === 'ar' ? (
                    <>
                      التالي
                      <ChevronLeft className="h-4 w-4 mr-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <div className="p-6 border-t border-white/20">
                <Button 
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {language === 'ar' ? 'أوافق على الشروط' : 'I Accept the Terms'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('traineeDashboard')}</h1>
          <p className="text-white/70">{t('welcome')}, {user?.user_metadata?.full_name}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertCircle className="h-5 w-5" />
                {t('bookingTerms')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <img 
                    alt="Swimming pool safety rules" 
                    className="w-full h-48 object-cover rounded-lg" 
                    src="1.jpg" 
                  />
                </div>
                <div className="space-y-2">
                  <video 
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                    muted
                    autoPlay
                    loop
                    playsInline
                  >
                    <source src="/1.mp4" type="video/mp4" />
                    {t('videoNotSupported')}
                  </video>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عرض الشروط والأحكام' : 'View Terms & Conditions'}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(checked)}
                  className="border-white/30"
                />
                <Label htmlFor="terms" className="text-white/90 cursor-pointer">
                  {language === 'ar' ? 'أوافق على الشروط والأحكام' : 'I agree to the Terms & Conditions'}
                </Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  variant="outline"
                  className="bg-transparent text-green-400 border-cyan-400/50 hover:bg-cyan-400/10 hover:text-green-300"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تسجيل' : 'Register'}
                </Button>
                
                <Button 
                  onClick={handleProceedToBooking} 
                  disabled={!acceptedTerms} 
                  className="swimming-wave hover:scale-105 transition-transform pulse-glow"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {('proceed To Booking')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                {t('myBookings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-white/90">{t('trainer')}</TableHead>
                      <TableHead className="text-white/90">{t('date')}</TableHead>
                      <TableHead className="text-white/90">{t('time')}</TableHead>
                      <TableHead className="text-white/90">{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-white/70 py-8">
                          {t('noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      myBookings.map((booking) => (
                        <TableRow key={booking.id} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-white/90">{booking.trainer_name}</TableCell>
                          <TableCell className="text-white/90">{booking.day}</TableCell>
                          <TableCell className="text-white/90">{booking.time}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default TraineeDashboard;