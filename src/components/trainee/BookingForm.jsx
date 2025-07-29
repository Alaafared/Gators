import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const BookingForm = ({ onBack, onBookingComplete }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({ trainer_id: '', date: '', time: '' });
  const [availableTimes, setAvailableTimes] = useState([]);
  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00"
  ];

  useEffect(() => {
    fetchTrainersAndSchedules();
  }, []);

  useEffect(() => {
    if (formData.trainer_id && formData.date) {
      loadAvailableTimes();
    }
  }, [formData.trainer_id, formData.date]);

  const fetchTrainersAndSchedules = async () => {
    const { data: trainerData, error: trainerError } = await supabase.from('profiles').select('*').eq('role', 'trainer');
    if (trainerError) toast({ title: 'Error fetching trainers', description: trainerError.message, variant: 'destructive' });
    else setTrainers(trainerData);

    const { data: scheduleData, error: scheduleError } = await supabase.from('schedules').select('*').eq('status', 'active');
    if (scheduleError) toast({ title: 'Error fetching schedules', description: scheduleError.message, variant: 'destructive' });
    else setSchedules(scheduleData);
  };

  const loadAvailableTimes = () => {
    const trainerSchedules = schedules.filter(
      s => s.trainer_id === formData.trainer_id && s.date === formData.date
    );
    
    // استخراج جميع الأوقات المتاحة من الجداول
    const times = trainerSchedules.flatMap(schedule => 
      Array.isArray(schedule.time_slot) ? schedule.time_slot : [schedule.time_slot]
    );
    
    setAvailableTimes(times);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedTrainer = trainers.find(t => t.id === formData.trainer_id);
    const newBooking = {
      student_id: user.id,
      student_name: user.user_metadata.full_name,
      trainer_id: formData.trainer_id,
      trainer_name: selectedTrainer.full_name,
      day: formData.date,
      time: formData.time,
      status: 'confirmed',
      level: user.user_metadata.level || 'beginner'
    };

    
    const { error } = await supabase.from('bookings').insert([newBooking]);

    if (error) {
      toast({ title: 'Booking Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('bookingSuccess'), description: `${t('trainer')}: ${selectedTrainer.full_name}, ${t('date')}: ${formData.date}` });
      onBookingComplete();
      onBack();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4 mr-2" />{t('back')}</Button>
        <h1 className="text-3xl font-bold gradient-text">{t('bookSession')}</h1>
      </div>
      <Card className="glass-effect border-white/20">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Calendar className="h-5 w-5" />{t('bookSession')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trainer" className="text-white/90 flex items-center gap-2"><User className="h-4 w-4" />{t('selectTrainer')}</Label>
              <Select value={formData.trainer_id} onValueChange={(value) => setFormData({ ...formData, trainer_id: value, time: '' })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('selectTrainer')} /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id} className="text-white">{trainer.full_name} - {trainer.level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-white/90 flex items-center gap-2"><Calendar className="h-4 w-4" />{t('selectDate')}</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })} className="bg-white/10 border-white/20 text-white" min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-2">
  <Label htmlFor="time" className="text-white/90 flex items-center gap-2">
    <Clock className="h-4 w-4" />{t('selectTime')}
  </Label>
  <Select 
    value={formData.time} 
    onValueChange={(value) => setFormData({ ...formData, time: value })}
    disabled={!formData.trainer_id || !formData.date}
  >
    <SelectTrigger className="bg-white/10 border-white/20 text-white">
      <SelectValue placeholder={t('selectTime')} />
    </SelectTrigger>
    <SelectContent className="bg-slate-800 border-white/20">
      {timeSlots.map((time) => (
        <SelectItem 
          key={time} 
          value={time}
          className="text-white hover:bg-white/10"
        >
          {time}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
            <Button type="submit" className="w-full swimming-wave hover:scale-105 transition-transform pulse-glow" disabled={!formData.trainer_id || !formData.date || !formData.time}><Calendar className="h-4 w-4 mr-2" />{t('bookNow')}</Button>
          </form>
        </CardContent>
      </Card>
      {formData.trainer_id && formData.date && formData.time && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-effect border-white/20 border-green-500/30">
            <CardHeader><CardTitle className="text-green-400 text-lg">{t('bookingPreview')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-white/70">{t('trainer')}:</span><span className="text-white font-medium">{trainers.find(t => t.id === formData.trainer_id)?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-white/70">{t('date')}:</span><span className="text-white font-medium">{formData.date}</span></div>
              <div className="flex justify-between"><span className="text-white/70">{t('time')}:</span><span className="text-white font-medium">{formData.time}</span></div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookingForm;