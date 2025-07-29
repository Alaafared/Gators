import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const SchedulesTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    trainer_id: '',
    date: '',
    time_slot: '',
    capacity: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
    fetchTrainers();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('schedules').select('*, profiles(full_name)');
    if (error) {
      toast({ title: 'Error fetching schedules', description: error.message, variant: 'destructive' });
    } else {
      setSchedules(data);
    }
    setLoading(false);
  };

  const fetchTrainers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'trainer');
    if (error) {
      toast({ title: 'Error fetching trainers', description: error.message, variant: 'destructive' });
    } else {
      setTrainers(data);
    }
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.time_slot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.date?.includes(searchTerm)
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-500', text: t('active') },
      inactive: { color: 'bg-gray-500', text: t('inactive') }
    };
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSchedule) {
      const { error } = await supabase.from('schedules').update(formData).eq('id', editingSchedule.id);
      if(error) {
        toast({ title: 'Error updating schedule', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('updateSuccess') });
        fetchSchedules();
        resetForm();
      }
    } else {
      const { error } = await supabase.from('schedules').insert([formData]);
      if (error) {
        toast({ title: 'Error creating schedule', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('saveSuccess') });
        fetchSchedules();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({ trainer_id: '', date: '', time_slot: '', capacity: '', status: 'active' });
    setEditingSchedule(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (schedule) => {
    setFormData({
        trainer_id: schedule.trainer_id,
        date: schedule.date,
        time_slot: schedule.time_slot,
        capacity: schedule.capacity,
        status: schedule.status
    });
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  };

  const handleDelete = async (scheduleId) => {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    if(error) {
        toast({ title: 'Error deleting schedule', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: t('deleteSuccess') });
        fetchSchedules();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white"><Clock className="h-5 w-5" />{t('schedules')}</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button className="swimming-wave hover:scale-105 transition-transform"><Plus className="h-4 w-4 mr-2" />{t('addSchedule')}</Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-white/20">
                <DialogHeader><DialogTitle className="text-white">{editingSchedule ? t('edit') : t('addSchedule')}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trainerId" className="text-white/90">{t('trainer')}</Label>
                    <Select value={formData.trainer_id} onValueChange={(value) => setFormData({ ...formData, trainer_id: value })}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder={t('selectTrainer')} /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        {trainers.map((trainer) => (<SelectItem key={trainer.id} value={trainer.id} className="text-white">{trainer.full_name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-white/90">{t('date')}</Label>
                    <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-white/10 border-white/20 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSlot" className="text-white/90">{t('timeSlot')}</Label>
                    <Input id="timeSlot" value={formData.time_slot} onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="09:00 - 10:00" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-white/90">{t('capacity')}</Label>
                    <Input id="capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="bg-white/10 border-white/20 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white/90">{t('status')}</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        <SelectItem value="active" className="text-white">{t('active')}</SelectItem>
                        <SelectItem value="inactive" className="text-white">{t('inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="swimming-wave flex-1">{t('save')}</Button>
                    <Button type="button" variant="ghost" onClick={resetForm} className="text-white hover:bg-white/10">{t('cancel')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50" />
            </div>
          </div>
          <div className="rounded-lg border border-white/20 overflow-hidden">
            <Table>
              <TableHeader><TableRow className="border-white/20 hover:bg-white/5"><TableHead className="text-white/90">{t('trainer')}</TableHead><TableHead className="text-white/90">{t('date')}</TableHead><TableHead className="text-white/90">{t('timeSlot')}</TableHead><TableHead className="text-white/90">{t('capacity')}</TableHead><TableHead className="text-white/90">{t('status')}</TableHead><TableHead className="text-white/90">{t('actions')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-white/70 py-8">{t('loading')}</TableCell></TableRow>
                ) : filteredSchedules.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-white/70 py-8">{t('noData')}</TableCell></TableRow>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white/90 font-medium">{schedule.profiles.full_name}</TableCell>
                      <TableCell className="text-white/90">{schedule.date}</TableCell>
                      <TableCell className="text-white/90">{schedule.time_slot}</TableCell>
                      <TableCell className="text-white/90">{schedule.capacity}</TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SchedulesTab;