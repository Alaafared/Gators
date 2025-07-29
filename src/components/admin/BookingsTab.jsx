import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, Eye, Edit, Trash2, Calendar, Plus, Printer, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BookingsTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newBooking, setNewBooking] = useState({
    student_id: '',
    trainer_id: '',
    day: '',
    time: '',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchBookings();
    fetchUsers();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        student:profiles!student_id(full_name),
        trainer:profiles!trainer_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching bookings', description: error.message, variant: 'destructive' });
    } else {
      setBookings(data);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: studentsData, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'trainee')
      .order('full_name', { ascending: true });
    
    const { data: trainersData, error: trainersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'trainer')
      .order('full_name', { ascending: true });
    
    if (studentsError || trainersError) {
      toast({ 
        title: 'Error fetching users', 
        description: studentsError?.message || trainersError?.message, 
        variant: 'destructive' 
      });
    } else {
      setStudents(studentsData);
      setTrainers(trainersData);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBookings = React.useMemo(() => {
    let sortableBookings = [...bookings];
    if (sortConfig.key) {
      sortableBookings.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key.includes('.')) {
          const [parent, child] = sortConfig.key.split('.');
          aValue = a[parent]?.[child] || '';
          bValue = b[parent]?.[child] || '';
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBookings;
  }, [bookings, sortConfig]);

  const filteredBookings = sortedBookings.filter(booking =>
    booking.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.trainer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.day?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.time?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { variant: 'default', color: 'bg-green-500' },
      pending: { variant: 'secondary', color: 'bg-yellow-500' },
      cancelled: { variant: 'destructive', color: 'bg-red-500' },
      attended: { variant: 'default', color: 'bg-blue-500' },
      absent: { variant: 'destructive', color: 'bg-red-500' },
      apologized: { variant: 'secondary', color: 'bg-purple-500' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {t(status)}
      </Badge>
    );
  };

  const handleView = (booking) => {
    setViewingBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setNewBooking({
      student_id: booking.student_id,
      trainer_id: booking.trainer_id,
      day: booking.day,
      time: booking.time,
      status: booking.status
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (bookingId) => {
    const confirmDelete = window.confirm(t('confirmDelete'));
    if (!confirmDelete) return;

    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      toast({ title: 'Error deleting booking', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('deleteSuccess') });
      fetchBookings();
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.student_id || !newBooking.trainer_id || !newBooking.day || !newBooking.time) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .insert([{
        student_id: newBooking.student_id,
        trainer_id: newBooking.trainer_id,
        day: newBooking.day,
        time: newBooking.time,
        status: newBooking.status
      }]);

    if (error) {
      toast({ title: 'Error creating booking', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('bookingCreatedSuccess') });
      fetchBookings();
      setIsDialogOpen(false);
      setNewBooking({
        student_id: '',
        trainer_id: '',
        day: '',
        time: '',
        status: 'confirmed'
      });
    }
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    // استخدم القيم من newBooking التي تم تحديثها في النموذج
    const { error } = await supabase
      .from('bookings')
      .update({
        student_id: newBooking.student_id,
        trainer_id: newBooking.trainer_id,
        day: newBooking.day,
        time: newBooking.time,
        status: newBooking.status
      })
      .eq('id', editingBooking.id);

    if (error) {
      toast({ title: 'Error updating booking', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('updateSuccess') });
      fetchBookings();
      setIsEditDialogOpen(false);
      setEditingBooking(null);
      setNewBooking({
        student_id: '',
        trainer_id: '',
        day: '',
        time: '',
        status: 'confirmed'
      });
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('bookings-table').outerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* باقي الكود يبقى كما هو بدون تغيير */}
      {/* ... */}

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{t('editBooking')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right text-white/90">
                {t('trainee')}
              </Label>
              <Select 
                value={newBooking.student_id} 
                onValueChange={(value) => setNewBooking({...newBooking, student_id: value})}
                className="col-span-3"
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('selectTrainee')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20 text-white">
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trainer" className="text-right text-white/90">
                {t('trainer')}
              </Label>
              <Select 
                value={newBooking.trainer_id} 
                onValueChange={(value) => setNewBooking({...newBooking, trainer_id: value})}
                className="col-span-3"
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('selectTrainer')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20 text-white">
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right text-white/90">
                {t('date')}
              </Label>
              <Input
                id="date"
                type="date"
                value={newBooking.day}
                onChange={(e) => setNewBooking({...newBooking, day: e.target.value})}
                className="col-span-3 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right text-white/90">
                {t('time')}
              </Label>
              <Input
                id="time"
                type="time"
                value={newBooking.time}
                onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                className="col-span-3 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right text-white/90">
                {t('status')}
              </Label>
              <Select 
                value={newBooking.status} 
                onValueChange={(value) => setNewBooking({...newBooking, status: value})}
                className="col-span-3"
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('selectStatus')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20 text-white">
                  <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  <SelectItem value="attended">{t('attended')}</SelectItem>
                  <SelectItem value="absent">{t('absent')}</SelectItem>
                  <SelectItem value="apologized">{t('apologized')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleUpdateBooking}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('update')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BookingsTab;