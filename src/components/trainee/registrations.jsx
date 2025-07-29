import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, CreditCard, Info, Cake } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';



const BookingForm = ({ onBack, onBookingComplete }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // قوائم البيانات
  const [trainers, setTrainers] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [levels, setLevels] = useState(['Level1', 'Level2', 'Level3', 'Level4','Adult','Dream Team']);
  const [paymentMethods, setPaymentMethods] = useState(['Cash', 'Bank Transfer', 'Credit Card']);  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    student_name: user?.user_metadata?.full_name || '',
    birth_date: '',
    gender: '',
    level: '',
    trainer_id: '',
    trainer_name:'',
    evaluator_id: '',
    evaluator_name:'',
    registration_date: new Date().toISOString().split('T')[0],
    days: {
      friday: false,
      saturday: false,
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false

    },
    duration: '',
    payment_amount: '',
    payment_method: '',
    phone: '',
    email: user?.email || '',
    notes: ''
  });

  // حساب العمر تلقائياً عند تغيير تاريخ الميلاد
  useEffect(() => {
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.birth_date]);

  // جلب البيانات من قاعدة البيانات
  useEffect(() => {
    fetchTrainersAndEvaluators();
  }, []);

  const fetchTrainersAndEvaluators = async () => {
    // جلب المدربين
    const { data: trainerData, error: trainerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'trainer');
    
    if (trainerError) {
      toast({ title: 'خطأ في جلب المدربين', description: trainerError.message, variant: 'destructive' });
    } else {
      setTrainers(trainerData);
    }

    // جلب مدربي التقييم
    const { data: evaluatorData, error: evaluatorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'trainer');
    
    if (evaluatorError) {
      toast({ title: 'خطأ في جلب مدربي التقييم', description: evaluatorError.message, variant: 'destructive' });
    } else {
      setEvaluators(evaluatorData);
    }
  };

  // معالجة تغيير أيام الأسبوع
  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: !prev.days[day]
      }
    }));
  };

  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{
          ...formData,
          student_id: user?.id,
          status: 'pending'
        }]);

      if (error) {
        throw error;
      }

      toast({ 
        title: 'تم الحجز بنجاح', 
        description: 'تم تسجيل بيانات الحجز بنجاح' 
      });
      
      onBookingComplete();
      onBack();
    } catch (error) {
      toast({ 
        title: 'خطأ في الحجز', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <h1 className="text-3xl font-bold gradient-text">New Booking  </h1>
      </div>

      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
  {/* Personal Information Section */}
  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
      <User className="h-4 w-4" /> Personal Information
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-white/90 flex items-center gap-2">
          <User className="h-4 w-4" /> Full Name
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date" className="text-white/90 flex items-center gap-2">
          <Cake className="h-4 w-4" /> Date of Birth
        </Label>
        <Input
          id="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age" className="text-white/90 flex items-center gap-2">
          <Info className="h-4 w-4" /> Age
        </Label>
        <Input
          id="age"
          value={formData.age || ''}
          readOnly
          className="bg-white/10 border-white/20 text-white"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="gender" className="text-white/90 flex items-center gap-2">
          <User className="h-4 w-4" /> Gender
        </Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => setFormData({ ...formData, gender: value })}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/20">
            <SelectItem value="male" className="text-white">Male</SelectItem>
            <SelectItem value="female" className="text-white">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="level" className="text-white/90 flex items-center gap-2">
          <Info className="h-4 w-4" /> Level
        </Label>
        <Select
          value={formData.level}
          onValueChange={(value) => setFormData({ ...formData, level: value })}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Choose Level" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/20">
            {levels.map((level) => (
              <SelectItem key={level} value={level} className="text-white">
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>

  {/* Contact Information Section */}
  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
      <Phone className="h-4 w-4" /> Contact Information
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-white/90 flex items-center gap-2">
          <Phone className="h-4 w-4" /> Mobile Number
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/90 flex items-center gap-2">
          <Mail className="h-4 w-4" /> Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>
    </div>
  </div>

  {/* Training Information Section */}
  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
      <Calendar className="h-4 w-4" /> Training Details
    </h3>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="registration_date" className="text-white/90 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Registration Date
        </Label>
        <Input
          id="registration_date"
          type="date"
          value={formData.registration_date}
          onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/90 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Schedule
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
          {Object.entries(formData.days).map(([day, checked]) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={checked}
                onCheckedChange={() => handleDayChange(day)}
                className="border-white/30"
              />
              <Label htmlFor={day} className="text-white/90">
                {day === 'friday' && 'Fri'} 
                {day === 'saturday' && 'Sat'} 
                {day === 'sunday' && 'Sun'}
                {day === 'monday' && 'Mon'}
                {day === 'tuesday' && 'Tue'} 
                {day === 'wednesday' && 'Wed'}
                {day === 'thursday' && 'Thu'} 
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* Instructors Section */}
  {/* Instructors Section */}
<div className="bg-white/5 p-4 rounded-lg border border-white/10">
  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
    <User className="h-4 w-4" /> Instructors
  </h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="trainer_id" className="text-white/90 flex items-center gap-2">
        <User className="h-4 w-4" /> Instructor
      </Label>
      <Select
        value={formData.trainer_id}
        onValueChange={(value) => setFormData({ ...formData, trainer_id: value })}
      >
        <SelectTrigger className="bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Choose Instructor" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-white/20">
          {trainers.map((trainer) => (
            <SelectItem key={trainer.id} value={trainer.id} className="text-white">
              {trainer.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="evaluator_id" className="text-white/90 flex items-center gap-2">
        <User className="h-4 w-4" /> Assessment Instructor
      </Label>
      <Select
        value={formData.evaluator_id}
        onValueChange={(value) => setFormData({ ...formData, trainer_id: value })}
      >
        <SelectTrigger className="bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Choose Assessment Instructor" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-white/20">
          {evaluators.map((evaluator) => (
            <SelectItem key={evaluator.id} value={evaluator.id} className="text-white">
              {evaluator.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
</div>

  {/* Payment Information Section */}
  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
      <CreditCard className="h-4 w-4" /> Payment Information
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="duration" className="text-white/90 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Duration (months)
        </Label>
        <Input
          id="duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          min="1"
          placeholder="Enter duration"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_amount" className="text-white/90 flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Payment Amount
        </Label>
        <Input
          id="payment_amount"
          type="number"
          value={formData.payment_amount}
          onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          min="0"
          placeholder="Enter amount"
        />
      </div>
    </div>

    <div className="space-y-2 mt-4">
      <Label htmlFor="payment_method" className="text-white/90 flex items-center gap-2">
        <CreditCard className="h-4 w-4" /> Payment Method
      </Label>
      <Select
        value={formData.payment_method}
        onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
      >
        <SelectTrigger className="bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Choose Payment Method" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-white/20">
          {paymentMethods.map((method) => (
            <SelectItem key={method} value={method} className="text-white">
              {method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Notes Section */}
  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
      <Info className="h-4 w-4" /> Additional Information
    </h3>
    
    <div className="space-y-2">
      <Label htmlFor="notes" className="text-white/90 flex items-center gap-2">
        <Info className="h-4 w-4" /> Notes
      </Label>
      <textarea
        id="notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="bg-white/10 border-white/20 text-white min-h-[100px] w-full p-2 rounded-md"
      />
    </div>
  </div>

  {/* Submit Button */}
  <Button 
    type="submit" 
    className="w-full swimming-wave hover:scale-105 transition-transform pulse-glow"
  >
    <Calendar className="h-4 w-4 mr-2" /> Confirm Registration
  </Button>
</form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BookingForm;