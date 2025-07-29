import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Edit, Trash2, UserCheck, Loader2, Printer, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LEVELS = ['Level1', 'Level2', 'Level3', 'Level4', 'Adult', 'Dream Team','Promise Team'];

const TrainersTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    level: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const { data: trainersData, error: trainersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer');

      if (trainersError) throw trainersError;

      const trainersWithBookings = await Promise.all(
        trainersData.map(async (trainer) => {
          const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .eq('trainer_id', trainer.id);

          const today = new Date().toISOString().split('T')[0];
          const { count: todayBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .eq('trainer_id', trainer.id)
            .eq('day', today);

          return {
            ...trainer,
            total_bookings: totalBookings || 0,
            today_bookings: todayBookings || 0
          };
        })
      );

      setTrainers(trainersWithBookings);
    } catch (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const printDoc = `
      <html>
        <head>
          <title>${t('trainers')}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo {
              height: 80px;
              margin-bottom: 10px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
            }
            h2 {
              margin: 5px 0 0;
              font-size: 18px;
              font-weight: normal;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/gators.png" alt="Gators Logo" class="logo">
            <h1>GATORS SWIMMING ACADEMY</h1>
            <h2>${t('trainers')} - ${new Date().toLocaleDateString()}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t('trainerName')}</th>
                <th>${t('phone')}</th>
                <th>${t('level')}</th>
                <th>${t('totalBookings')}</th>
                <th>${t('todayBookings')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTrainers.map(trainer => `
                <tr>
                  <td>${trainer.full_name || 'N/A'}</td>
                  <td>${trainer.phone || 'N/A'}</td>
                  <td>${trainer.level || 'N/A'}</td>
                  <td>${trainer.total_bookings}</td>
                  <td>${trainer.today_bookings}</td>
                </tr>
              `).join('')}
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
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedTrainers = React.useMemo(() => {
    let sortableTrainers = [...trainers];
    if (sortConfig.key) {
      sortableTrainers.sort((a, b) => {
        // معالجة خاصة لمستويات المدربين
        if (sortConfig.key === 'level') {
          const indexA = LEVELS.indexOf(a.level);
          const indexB = LEVELS.indexOf(b.level);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return sortConfig.direction === 'ascending' ? indexA - indexB : indexB - indexA;
        }
        
        // معالجة خاصة للحجوزات (أرقام)
        if (sortConfig.key === 'today_bookings' || sortConfig.key === 'total_bookings') {
          return sortConfig.direction === 'ascending' 
            ? a[sortConfig.key] - b[sortConfig.key] 
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        // معالجة عامة للنصوص
        const valueA = a[sortConfig.key]?.toString().toLowerCase() || '';
        const valueB = b[sortConfig.key]?.toString().toLowerCase() || '';
        
        if (valueA < valueB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTrainers;
  }, [trainers, sortConfig]);

  const filteredTrainers = sortedTrainers.filter(trainer =>
    trainer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      if (editingTrainer) {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            level: formData.level
          })
          .eq('id', editingTrainer.id)
          .select();

        if (error) throw error;

        toast({ title: t('success'), description: t('updateSuccess') });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              phone: formData.phone,
              level: formData.level,
              role: 'trainer'
            }
          }
        });

        if (authError) throw authError;

        toast({ title: t('success'), description: t('saveSuccess') });
      }

      fetchTrainers();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      level: '',
      password: ''
    });
    setEditingTrainer(null);
  };

  const handleEdit = (trainer) => {
    setFormData({
      full_name: trainer.full_name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      level: trainer.level || '',
      password: ''
    });
    setEditingTrainer(trainer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (trainerId) => {
    const confirmDelete = window.confirm(t('confirmDeleteTrainer'));
    if (!confirmDelete) return;
    setProcessing(true);
  
    try {
      await supabase.from('bookings').delete().eq('trainer_id', trainerId);
      const { error } = await supabase.from('profiles').delete().eq('id', trainerId);
      if (error) throw error;
  
      toast({ title: t('success'), description: t('deleteSuccess') });
      fetchTrainers();
    } catch (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <UserCheck className="h-5 w-5" />
              {t('trainers')}
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="text-white bg-green-600 hover:bg-green-500">
                <Printer className="h-4 w-4 mr-2" />
                {t('print')}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="text-white bg-blue-600 hover:bg-blue-500"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addTrainer')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-gray-800 border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTrainer ? t('editTrainer') : t('addTrainer')}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTrainer ? t('editTrainerDesc') : t('addTrainerDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">{t('fullName')}</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                        className="bg-gray-700 border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">{t('level')}</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => setFormData({...formData, level: value})}
                      >
                        <SelectTrigger className="bg-gray-700 border-white/20">
                          <SelectValue placeholder={t('selectLevel')} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/20">
                          {LEVELS.map(level => (
                            <SelectItem key={level} value={level}>
                              {t(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!editingTrainer && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('email')}</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="bg-gray-700 border-white/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">{t('password')}</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="bg-gray-700 border-white/20"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(false);
                        }}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        {t('cancel')}
                      </Button>
                      <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-500">
                        {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingTrainer ? t('update') : t('save')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
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
              />
            </div>
          </div>
          <div id="printable-area" className="rounded-lg border border-white/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-white cursor-pointer" onClick={() => requestSort('full_name')}>
                    <div className="flex items-center">
                      {t('name')}
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white cursor-pointer" onClick={() => requestSort('email')}>
                    <div className="flex items-center">
                      {t('email')}
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white cursor-pointer" onClick={() => requestSort('phone')}>
                    <div className="flex items-center">
                      {t('phone')}
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white cursor-pointer" onClick={() => requestSort('level')}>
                    <div className="flex items-center">
                      {t('level')}
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white cursor-pointer" onClick={() => requestSort('today_bookings')}>
                    <div className="flex items-center">
                      {t('todayBookings')}
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white cursor-pointer" onClick={() => requestSort('total_bookings')}>
                    <div className="flex items-center">
                      {t('totalBookings')}
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredTrainers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {t('noTrainersFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainers.map((trainer) => (
                    <TableRow key={trainer.id} className="hover:bg-white/5">
                      <TableCell className="font-medium text-white">{trainer.full_name}</TableCell>
                      <TableCell className="text-white/80">{trainer.email}</TableCell>
                      <TableCell className="text-white/80">{trainer.phone}</TableCell>
                      <TableCell className="text-white/80">{t(trainer.level)}</TableCell>
                      <TableCell className="text-white/80">{trainer.today_bookings}</TableCell>
                      <TableCell className="text-white/80">{trainer.total_bookings}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
                            onClick={() => handleEdit(trainer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500 hover:bg-red-500/10"
                            onClick={() => handleDelete(trainer.id)}
                            disabled={processing}
                          >
                            {processing && trainer.id === editingTrainer?.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
  );
};

export default TrainersTab;
