import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Improved ButtonIcon component with proper Tailwind class handling
const ButtonIcon = ({ icon: Icon, color, onClick, className = '', ariaLabel }) => {
  const colorClasses = {
    blue: 'text-blue-400 hover:text-blue-300 hover:bg-blue-400/10',
    yellow: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10',
    red: 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`${colorClasses[color]} ${className}`}
      aria-label={ariaLabel}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
};

// Memoized Table Row Component
const BookingRow = React.memo(({ booking, onView, onEdit, onDelete, getStatusBadge, t }) => (
  <TableRow className="border-white/20 hover:bg-white/5">
    <TableCell className="text-white/90 font-mono">
      #{booking.id.toString().padStart(6, '0').slice(-6)}
    </TableCell>
    <TableCell className="text-white/90">{booking.student?.full_name || 'N/A'}</TableCell>
    <TableCell className="text-white/90">{booking.trainer?.full_name || 'N/A'}</TableCell>
    <TableCell className="text-white/90">{booking.day || 'N/A'}</TableCell>
    <TableCell className="text-white/90">{booking.time || 'N/A'}</TableCell>
    <TableCell>{getStatusBadge(booking.status)}</TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <ButtonIcon 
          icon={Eye} 
          color="blue" 
          onClick={() => onView(booking)}
          ariaLabel={t('viewBooking')}
        />
        <ButtonIcon 
          icon={Edit} 
          color="yellow" 
          onClick={() => onEdit(booking)}
          ariaLabel={t('editBooking')}
        />
        <ButtonIcon 
          icon={Trash2} 
          color="red" 
          onClick={() => onDelete(booking.id)}
          ariaLabel={t('deleteBooking')}
        />
      </div>
    </TableCell>
  </TableRow>
));

const BookingsTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*,
          student:profiles!student_id(full_name),
          trainer:profiles!trainer_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data);
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const fetchUsers = useCallback(async () => {
    try {
      const [
        { data: studentsData, error: studentsError },
        { data: trainersData, error: trainersError }
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'trainee'),
        supabase.from('profiles').select('id, full_name').eq('role', 'trainer')
      ]);

      if (studentsError || trainersError) {
        throw studentsError || trainersError;
      }

      setStudents(studentsData);
      setTrainers(trainersData);
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  }, [toast, t]);

  useEffect(() => {
    fetchBookings();
    fetchUsers();
  }, [fetchBookings, fetchUsers]);

  const handleSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const sortedBookings = useMemo(() => {
    if (!sortConfig.key) return bookings;
    
    return [...bookings].sort((a, b) => {
      const aValue = String(sortConfig.key.split('.').reduce((o, i) => o?.[i], a)) || '';
      const bValue = String(sortConfig.key.split('.').reduce((o, i) => o?.[i], b)) || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [bookings, sortConfig]);

  const filteredBookings = useMemo(() => {
    return sortedBookings.filter(booking =>
      booking.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trainer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.day?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.time?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedBookings, searchTerm]);

  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      confirmed: { color: 'bg-green-500' },
      pending: { color: 'bg-yellow-500' },
      cancelled: { color: 'bg-red-500' },
      attended: { color: 'bg-blue-500' },
      absent: { color: 'bg-red-500' },
      apologized: { color: 'bg-purple-500' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {t(status)}
      </Badge>
    );
  }, [t]);

  const handleView = useCallback((booking) => {
    setViewingBooking(booking);
    setIsViewDialogOpen(true);
  }, []);

  const handleEdit = useCallback((booking) => {
    setEditingBooking(booking);
    setNewBooking({
      student_id: booking.student_id,
      trainer_id: booking.trainer_id,
      day: booking.day,
      time: booking.time,
      status: booking.status
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (bookingId) => {
    const confirmDelete = window.confirm(t('confirmDelete'));
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      toast({ title: t('deleteSuccess') });
      fetchBookings();
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  }, [t, toast, fetchBookings]);

  const handleCreateBooking = useCallback(async () => {
    if (!newBooking.student_id || !newBooking.trainer_id || !newBooking.day || !newBooking.time) {
      toast({ 
        title: t('error'), 
        description: t('fillAllFields'), 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{
          student_id: newBooking.student_id,
          trainer_id: newBooking.trainer_id,
          day: newBooking.day,
          time: newBooking.time,
          status: newBooking.status
        }]);

      if (error) throw error;
      
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
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  }, [newBooking, t, toast, fetchBookings]);

  const handleUpdateBooking = useCallback(async () => {
    if (!editingBooking) return;

    try {
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

      if (error) throw error;
      
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
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  }, [editingBooking, newBooking, t, toast, fetchBookings]);

  const handlePrint = useCallback(() => {
    const printDoc = `
      <html>
        <head>
          <title>${t('bookingsReport')}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial; font-size: 12px; margin: 0; padding: 10px; }
            .header { text-align: center; margin-bottom: 15px; }
            .logo { height: 80px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; 
                          font-size: 11px; font-weight: 500; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/gators.png" alt="Gators Logo" class="logo">
            <h1>GATORS SWIMMING ACADEMY</h1>
            <h2>${t('bookingsReport')} - ${new Date().toLocaleDateString()}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t('bookingId')}</th>
                <th>${t('trainee')}</th>
                <th>${t('trainer')}</th>
                <th>${t('date')}</th>
                <th>${t('time')}</th>
                <th>${t('status')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBookings.map(booking => {
                const getStatusStyle = (status) => ({
                  confirmed: 'background-color: #22c55e;',
                  pending: 'background-color: #eab308;',
                  cancelled: 'background-color: #ef4444;',
                  attended: 'background-color: #3b82f6;',
                  absent: 'background-color: #ef4444;',
                  apologized: 'background-color: #a855f7;'
                }[status] || 'background-color: #eab308;');
  
                return `
                  <tr>
                    <td>#${booking.id.toString().padStart(6, '0').slice(-6)}</td>
                    <td>${booking.student?.full_name || 'N/A'}</td>
                    <td>${booking.trainer?.full_name || 'N/A'}</td>
                    <td>${booking.day || 'N/A'}</td>
                    <td>${booking.time || 'N/A'}</td>
                    <td>
                      <span class="status-badge" style="${getStatusStyle(booking.status)}">
                        ${t(booking.status)}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printDoc);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  }, [filteredBookings, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="glass-effect border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-white">
              {t('bookings')}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white"
              aria-label={t('print')}
            >
              <Printer className="h-4 w-4 mr-2" />
              {t('print')}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" aria-label={t('newBooking')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newBooking')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-gray-900 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">{t('newBooking')}</DialogTitle>
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
                    onClick={() => setIsDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {t('cancel')}
                  </Button>
                  <Button 
                    onClick={handleCreateBooking}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                aria-label={t('searchBookings')}
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/20 overflow-hidden">
            <Table id="bookings-table">
              <TableHeader>
                <TableRow className="border-white/20 hover:bg-white/5">
                  <TableHead className="text-white/90 cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      {t('bookingId')}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white/90 cursor-pointer" onClick={() => handleSort('student.full_name')}>
                    <div className="flex items-center">
                      {t('trainee')}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white/90 cursor-pointer" onClick={() => handleSort('trainer.full_name')}>
                    <div className="flex items-center">
                      {t('trainer')}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white/90 cursor-pointer" onClick={() => handleSort('day')}>
                    <div className="flex items-center">
                      {t('date')}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white/90 cursor-pointer" onClick={() => handleSort('time')}>
                    <div className="flex items-center">
                      {t('time')}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white/90 cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      {t('status')}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white/90">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-white/70 py-8">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-white/70 py-8">
                      {t('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <BookingRow 
                      key={`${booking.id}-${booking.status}`}
                      booking={booking}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getStatusBadge={getStatusBadge}
                      t={t}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{t('bookingDetails')}</DialogTitle>
          </DialogHeader>
          {viewingBooking && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-white/90">
                  {t('bookingId')}
                </Label>
                <div className="col-span-3 text-white/90 font-mono">
                  #{viewingBooking.id.toString().padStart(6, '0').slice(-6)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-white/90">
                  {t('trainee')}
                </Label>
                <div className="col-span-3 text-white/90">
                  {viewingBooking.student?.full_name || 'N/A'}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-white/90">
                  {t('trainer')}
                </Label>
                <div className="col-span-3 text-white/90">
                  {viewingBooking.trainer?.full_name || 'N/A'}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-white/90">
                  {t('date')}
                </Label>
                <div className="col-span-3 text-white/90">
                  {viewingBooking.day || 'N/A'}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-white/90">
                  {t('time')}
                </Label>
                <div className="col-span-3 text-white/90">
                  {viewingBooking.time || 'N/A'}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-white/90">
                  {t('status')}
                </Label>
                <div className="col-span-3">
                  {getStatusBadge(viewingBooking.status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
