import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, UserCheck, Clock, ClipboardList } from 'lucide-react';
import BookingsTab from './BookingsTab';
import TrainersTab from './TrainersTab';
import TraineesTab from './TraineesTab';
import SchedulesTab from './SchedulesTab';
import RegistrationsTab from './RegistrationsTab';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';

const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalTrainers: 0,
    totalTrainees: 0,
    activeSchedules: 0,
    totalRegistrations: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: bookings, error: bookingsError } = await supabase.from('bookings').select('id', { count: 'exact' });
    const { data: trainers, error: trainersError } = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'trainer');
    const { data: trainees, error: traineesError } = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'trainee');
    const { data: schedules, error: schedulesError } = await supabase.from('schedules').select('id', { count: 'exact' }).eq('status', 'active');
    const { data: registrations, error: registrationsError } = await supabase.from('registrations').select('id', { count: 'exact' });
    
    setStats({
      totalBookings: bookings?.length || 0,
      totalTrainers: trainers?.length || 0,
      totalTrainees: trainees?.length || 0,
      activeSchedules: schedules?.length || 0,
      totalRegistrations: registrations?.length || 0
    });
  };

  const statCards = [
    {
      title: t('totalBookings'),
      value: stats.totalBookings,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: t('totalTrainers'),
      value: stats.totalTrainers,
      icon: UserCheck,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: t('totalTrainees'),
      value: stats.totalTrainees,
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: t('activeSchedules'),
      value: stats.activeSchedules,
      icon: Clock,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: ('total Registrations'),
      value: stats.totalRegistrations,
      icon: ClipboardList,
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  return (
    <>
      <Helmet>
        <title>{language === 'ar' ? 'لوحة تحكم الإدارة - Gators Swimming Academy' : 'Admin Dashboard -Gators  Swimming Academy'}</title>
        <meta name="description" content={language === 'ar' ? 'لوحة تحكم إدارية شاملة لإدارة حجوزات دورات السباحة' : 'Comprehensive admin dashboard for managing swimming course bookings'} />
      </Helmet>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">{t('adminDashboard')}</h1>
          <p className="text-white/70">
            {language === 'ar' ? 'إدارة شاملة لنظام حجوزات السباحة' : 'Comprehensive swimming booking system management'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-white/20 hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">{stat.title}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white/10 border-white/20">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-white/20">
                {t('bookings')}
              </TabsTrigger>
              <TabsTrigger value="trainers" className="data-[state=active]:bg-white/20">
                {t('trainers')}
              </TabsTrigger>
              <TabsTrigger value="trainees" className="data-[state=active]:bg-white/20">
                {t('trainees')}
              </TabsTrigger>
              <TabsTrigger value="schedules" className="data-[state=active]:bg-white/20">
                {t('schedules')}
              </TabsTrigger>
              <TabsTrigger value="registrations" className="data-[state=active]:bg-white/20">
                {t('registrations')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <BookingsTab />
            </TabsContent>

            <TabsContent value="trainers">
              <TrainersTab />
            </TabsContent>

            <TabsContent value="trainees">
              <TraineesTab />
            </TabsContent>

            <TabsContent value="schedules">
              <SchedulesTab />
            </TabsContent>

            <TabsContent value="registrations">
              <RegistrationsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </>
  );
};

export default AdminDashboard;