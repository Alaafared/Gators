import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Users, Clock, Edit, User, Printer, Search, ChevronDown, ChevronUp, Plus, Eye, Trash2, ArrowUpDown } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const TrainerDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [stats, setStats] = useState({ mySchedules: 0, myTrainees: 0, todaysSessions: 0 });
  const [editMode, setEditMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    level: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'day', direction: 'asc' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const trainerName = "اسم المدرب هنا"; // أو جلب القيمة من الـ state أو الـ props


  const [newBooking, setNewBooking] = useState({
    student_id: '',
    day: '',
    time: '',
    status: 'confirmed',
    level: 'Level1' // إضافة قيمة افتراضية
    
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchData();
      fetchTrainees();
    }
  }, [user]);

  const fetchProfileData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, level')
      .eq('id', user.id)
      .single();

    if (error) {
      toast({ title: 'Error fetching profile', description: error.message, variant: 'destructive' });
    } else {
      setProfileData(data);
    }
  };

  const fetchTrainees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'trainee');

      if (error) throw error;

      setTrainees(data || []);
    } catch (error) {
      toast({ 
        title: 'Error fetching trainees', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: scheduleData } = await supabase.from('schedules').select('*').eq('trainer_id', user.id);
    setSchedules(scheduleData || []);

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`*, student:profiles!student_id(full_name)`)
      .eq('trainer_id', user.id);
      
    if (bookingError) {
      toast({ title: 'Error fetching bookings', description: bookingError.message, variant: 'destructive' });
    } else {
      setBookings(bookingData || []);
    }
    
    const todaysSessions = (bookingData || []).filter(b => b.day === today && b.status === 'confirmed').length;
    const myTrainees = new Set((bookingData || []).map(b => b.student_id)).size;

    setStats({
      mySchedules: (scheduleData || []).length,
      myTrainees: myTrainees,
      todaysSessions: todaysSessions
    });
  };

  const handleProfileUpdate = async () => {
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('profileUpdateSuccess') });
      setEditMode(false);
    }
  };

  const handleAttendanceChange = async (bookingId, attendance) => {
    const { error } = await supabase
      .from('bookings')
      .update({ attendance })
      .eq('id', bookingId);

    if (error) {
      toast({ title: 'Error updating attendance', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('updateSuccess') });
      fetchData();
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.student_id || !newBooking.day || !newBooking.time) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const selectedTrainee = trainees.find(t => t.id === newBooking.student_id);
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        day: newBooking.day,
        time: newBooking.time,
        trainer_id: user.id,
        student_id: newBooking.student_id,
        student_name: selectedTrainee?.full_name,
        // email: selectedTrainee?.email,
        status: newBooking.status
      }])
      .select();

    if (error) {
      toast({ title: 'Error creating booking', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('bookingCreatedSuccess') });
      fetchData();
      setIsDialogOpen(false);
      setNewBooking({
        student_id: '',
        day: '',
        time: '',
        status: 'confirmed'
      });
    }
  };

  const handleView = (booking) => {
    setViewingBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setNewBooking({
      student_id: booking.student_id,
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
    if(error) {
       toast({ title: 'Error deleting booking', description: error.message, variant: 'destructive' });
    } else {
       toast({ title: t('deleteSuccess') });
       fetchData();
    }
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        student_id: newBooking.student_id,
        day: newBooking.day,
        time: newBooking.time,
        status: newBooking.status
      })
      .eq('id', editingBooking.id);

    if (error) {
      toast({ title: 'Error updating booking', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('updateSuccess') });
      fetchData();
      setIsEditDialogOpen(false);
      setEditingBooking(null);
      setNewBooking({
        student_id: '',
        day: '',
        time: '',
        status: 'confirmed'
      });
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
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBookings;
  }, [bookings, sortConfig]);

  const filteredBookings = sortedBookings.filter(booking => 
    booking.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.time.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getAttendanceBadge = (attendance) => {
    const config = {
      present: { color: 'bg-green-500', text: t('present') },
      absent: { color: 'bg-red-500', text: t('absent') },
    }[attendance] || { color: 'bg-gray-500', text: t('not_recorded') };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };
  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('myBookings')}</title>
          <style>
            body { font-family: Arial; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .logo { max-height: 60px; }
            .trainer-name { font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <!-- اضف رابط الشعار الخاص بك هنا -->
            <img src="gators.png" alt="Logo" class="logo" />
            <div class="trainer-name">${('Name trainer ')}: ${user?.user_metadata?.full_name}</div>
          </div>
          
          <h1>${t('myBookings')}</h1>
          <table>
            <thead>
              <tr>
                <th>${t('trainee')}</th>
                <th>${t('date')}</th>
                <th>${t('time')}</th>
                <th>${t('status')}</th>
                <th>${t('attendance')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBookings.map(booking => `
                <tr>
                  <td>${booking.student?.full_name || booking.student_name}</td>
                  <td>${booking.day}</td>
                  <td>${booking.time}</td>
                  <td>${booking.status}</td>
                  <td>${booking.attendance || t('not_recorded')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
};

  const statCards = [
    { title: t('mySchedules'), value: stats.mySchedules, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { title: t('myTrainees'), value: stats.myTrainees, icon: Users, color: 'from-green-500 to-emerald-500' },
    { title: t('todaysSessions'), value: stats.todaysSessions, icon: Clock, color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <>
      <Helmet>
        <title>{language === 'ar' ? 'لوحة تحكم المدرب -  Gators Swimming Academy' : 'Trainer Dashboard - Gators Swimming Academy'}</title>
        <meta name="description" content={language === 'ar' ? 'لوحة تحكم المدرب لإدارة الجداول والمتدربين' : 'Trainer dashboard for managing schedules and trainees'} />
      </Helmet>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('trainerDashboard')}</h1>
          <p className="text-white/70">{t('welcome')}, {user?.user_metadata?.full_name}</p>
        </motion.div>

        {/* Profile Section - Collapsible */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  {t('myProfile')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {showProfile ? (
                    <ChevronUp className="h-5 w-5 text-white/70" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/70" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {showProfile && (
              <CardContent>
                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/70">{t('fullName')}</label>
                      <Input
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">{t('phone')}</label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="bg-white/10 border-white/20 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">{t('level')}</label>
                      <Select
                        value={profileData.level}
                        onValueChange={(value) => setProfileData({...profileData, level: value})}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                          <SelectValue placeholder={t('selectLevel')} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="Level1" className="text-white">{('Level1')}</SelectItem>
                          <SelectItem value="Level2" className="text-white">{('Level2')}</SelectItem>
                          <SelectItem value="Level3" className="text-white">{('Level3')}</SelectItem>
                          <SelectItem value="Level4" className="text-white">{('Level4')}</SelectItem>
                          <SelectItem value="Adult" className="text-white">{('Adult')}</SelectItem>
                          <SelectItem value="Dream Team" className="text-white">{('Dream Team')}</SelectItem>
                          <SelectItem value="Promise Team" className="text-white">{('Promise Team')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleProfileUpdate} className="mt-2">{t('save')}</Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditMode(false)} 
                        className="mt-2"
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-white/70">{t('fullName')}</p>
                      <p className="text-white">{profileData.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">{t('phone')}</p>
                      <p className="text-white">{profileData.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">{t('level')}</p>
                      <p className="text-white">{profileData.level ? t(profileData.level) : '-'}</p>
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <Button 
                        onClick={() => setEditMode(true)} 
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-effect border-white/20 hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">{stat.title}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}><stat.icon className="h-6 w-6 text-white" /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* My Bookings with Search, Sort and Print */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  {t('myBookings')}
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input
                      placeholder={t('search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                              {trainees.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                                    {/* إضافة حقل المستوى */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="level" className="text-right text-white/90">
        {t('level')}
      </Label>
      <Select 
        value={newBooking.level} 
        onValueChange={(value) => setNewBooking({...newBooking, level: value})}
        className="col-span-3"
      >
        <SelectTrigger className="bg-white/10 border-white/20 text-white">
          <SelectValue placeholder={('Level')} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-white/20 text-white">
          <SelectItem value="Level1">{t('Level1')}</SelectItem>
          <SelectItem value="Level2">{t('Level2')}</SelectItem>
          <SelectItem value="Level3">{t('Level3')}</SelectItem>
          <SelectItem value="Level4">{t('Level4')}</SelectItem>
          <SelectItem value="Adult">{t('Adult')}</SelectItem>
          <SelectItem value="Dream Team">{t('Dream Team')}</SelectItem>
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
                  <Button variant="outline" onClick={printTable} className="flex items-center gap-1">
                    <Printer className="h-4 w-4" />
                    {t('print')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead 
                        className="text-white/90 cursor-pointer hover:text-white"
                        onClick={() => handleSort('student.full_name')}
                      >
                        <div className="flex items-center">
                          {t('trainee')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-white/90 cursor-pointer hover:text-white"
                        onClick={() => handleSort('day')}
                      >
                        <div className="flex items-center">
                          {t('date')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-white/90 cursor-pointer hover:text-white"
                        onClick={() => handleSort('time')}
                      >
                        <div className="flex items-center">
                          {t('time')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-white/90 cursor-pointer hover:text-white"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          {t('status')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-white/90">{t('attendance')}</TableHead>
                      <TableHead className="text-white/90">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-white/70 py-8">
                          {t('noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-white/90">
                            {booking.student?.full_name || booking.student_name}
                          </TableCell>
                          <TableCell className="text-white/90">{booking.day}</TableCell>
                          <TableCell className="text-white/90">{booking.time}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            <Select
                              defaultValue={booking.attendance || 'not_recorded'}
                              onValueChange={(value) => handleAttendanceChange(booking.id, value)}
                            >
                              <SelectTrigger className="bg-white/10 border-white/20 text-white w-[120px]">
                                <SelectValue>{getAttendanceBadge(booking.attendance)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/20">
                                <SelectItem value="present" className="text-white">{t('present')}</SelectItem>
                                <SelectItem value="absent" className="text-white">{t('absent')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(booking)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(booking)}
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(booking.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                  <div className="col-span-3 text-white/90">
                    #{viewingBooking.id.toString().slice(-6)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-white/90">
                    {t('trainee')}
                  </Label>
                  <div className="col-span-3 text-white/90">
                    {viewingBooking.student?.full_name || viewingBooking.student_name}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-white/90">
                    {t('date')}
                  </Label>
                  <div className="col-span-3 text-white/90">
                    {viewingBooking.day}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-white/90">
                    {t('time')}
                  </Label>
                  <div className="col-span-3 text-white/90">
                    {viewingBooking.time}
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-white/90">
                    {t('attendance')}
                  </Label>
                  <div className="col-span-3">
                    {getAttendanceBadge(viewingBooking.attendance)}
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
                    {trainees.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
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
      </div>
    </>
  );
};

export default TrainerDashboard;
