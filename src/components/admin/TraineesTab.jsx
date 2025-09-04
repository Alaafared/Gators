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
import { Search, Plus, Edit, Trash2, Users, Printer, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const TraineesTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [trainees, setTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    level: 'Level0', // تغيير القيمة الافتراضية إلى Level0
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });

  useEffect(() => {
    fetchTrainees();
  }, []);

  const fetchTrainees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'trainee');
    if (error) {
      toast({ title: t('fetchError'), description: error.message, variant: 'destructive' });
    } else {
      setTrainees(data);
    }
    setLoading(false);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTrainees = React.useMemo(() => {
    let sortableItems = [...trainees];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Handle null or undefined values
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [trainees, sortConfig]);

  const filteredTrainees = sortedTrainees.filter(trainee =>
    trainee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadge = (level) => {
    const levelConfig = {
      Level0: { color: 'bg-gray-400', text: t('Level0') },
      Level1: { color: 'bg-green-500', text: t('Level1') },
      Level2: { color: 'bg-yellow-500', text: t('Level2') },
      Level3: { color: 'bg-orange-500', text: t('Level3') },
      Level4: { color: 'bg-red-500', text: t('Level4') },
      Adult: { color: 'bg-blue-500', text: t('Adult') },
      PromiseTeam: { color: 'bg-purple-500', text: t('Promise Team') },
      DreamTeam: { color: 'bg-indigo-500', text: t('Dream Team') },
      FutureTeam: { color: 'bg-pink-500', text: t('Future Team') },
      GatorsTeam: { color: 'bg-teal-500', text: t('Gators Team') },
      MightyTeam: { color: 'bg-cyan-500', text: t('Mighty Team') },
      OlympicTeam: { color: 'bg-amber-500', text: t('Olympic Team') }
    };
    const config = levelConfig[level] || { color: 'bg-gray-500', text: level };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrainee) {
        const { error } = await supabase.from('profiles').update({
          full_name: formData.full_name,
          phone: formData.phone,
          level: formData.level
        }).eq('id', editingTrainee.id);
        
        if(error) {
          toast({ title: t('updateError'), description: error.message, variant: 'destructive' });
        } else {
          toast({ title: t('updateSuccess') });
          fetchTrainees();
          resetForm();
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              phone: formData.phone,
              level: formData.level,
              role: 'trainee'
            }
          }
        });
        
        if (authError) {
          toast({ title: t('createError'), description: authError.message, variant: 'destructive' });
        } else {
          toast({ title: t('saveSuccess') });
          fetchTrainees();
          resetForm();
        }
      }
    } catch (err) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', phone: '', level: 'Level0', password: '' }); // تحديث القيمة الافتراضية
    setEditingTrainee(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (trainee) => {
    setFormData({
      full_name: trainee.full_name || '',
      email: trainee.email || '',
      phone: trainee.phone || '',
      level: trainee.level || 'Level0', // تحديث القيمة الافتراضية
      password: ''
    });
    setEditingTrainee(trainee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (traineeId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', traineeId);
        
        if (profileError) throw profileError;

        const { error: authError } = await supabase.auth.admin.deleteUser(traineeId);
        
        if (authError) throw authError;

        toast({ title: t('deleteSuccess') });
        fetchTrainees();
      } catch (error) {
        toast({ 
          title: t('deleteError'), 
          description: error.message, 
          variant: 'destructive' 
        });
      }
    }
  };

  const handlePrint = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printContent = `
      <html>
        <head>
          <title>${t('traineesList')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { height: 80px; margin-bottom: 10px; }
            h1 { color: #333; margin: 0; }
            .subtitle { color: #555; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; color: white; display: inline-block; }
            .footer { text-align: left; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/gators.png" alt="Gators Logo" class="logo" onerror="this.style.display='none'">
            <h1>GATORS SWIMMING ACADEMY</h1>
            <h2>${t('trainees')} - ${new Date().toLocaleDateString()}</h2>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>${t('traineeName')}</th>
                <th>${t('phone')}</th>
                <th>${t('level')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTrainees.map(trainee => `
                <tr>
                  <td>${trainee.full_name || ''}</td>
                  <td>${trainee.phone || ''}</td>
                  <td><span class="badge" style="background-color: ${getLevelColor(trainee.level)}">${getLevelText(trainee.level)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <div>${t('printDate')}: ${formattedDate}</div>
            <div>${t('totalTrainees')}: ${filteredTrainees.length}</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const getLevelColor = (level) => {
    const levelConfig = {
      Level0: '#9ca3af',
      Level1: '#22c55e',
      Level2: '#eab308',
      Level3: '#f97316',
      Level4: '#ef4444',
      Adult: '#3b82f6',
      PromiseTeam: '#a855f7',
      DreamTeam: '#6366f1',
      FutureTeam: '#ec4899',
      GatorsTeam: '#14b8a6',
      MightyTeam: '#06b6d4',
      OlympicTeam: '#f59e0b'
    };
    return levelConfig[level] || '#6b7280';
  };

  const getLevelText = (level) => {
    const levelConfig = {
      Level0: t('Level0'),
      Level1: t('Level1'),
      Level2: t('Level2'),
      Level3: t('Level3'),
      Level4: t('Level4'),
      Adult: t('Adult'),
      PromiseTeam: t('Promise Team'),
      DreamTeam: t('Dream Team'),
      FutureTeam: t('Future Team'),
      GatorsTeam: t('Gators Team'),
      MightyTeam: t('Mighty Team'),
      OlympicTeam: t('Olympic Team')
    };
    return levelConfig[level] || level;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />{t('trainees')}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={handlePrint} 
                variant="outline" 
                className="text-white border-white/20 hover:bg-white/10 hover:text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                {t('print')}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button className="swimming-wave hover:scale-105 transition-transform">
                    <Plus className="h-4 w-4 mr-2" />{t('addTrainee')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingTrainee ? t('edit') : t('addTrainee')}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/90">{t('traineeName')}</Label>
                      <Input 
                        id="name" 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                        className="bg-white/10 border-white/20 text-white" 
                        required 
                      />
                    </div>
                    {!editingTrainee && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/90">{t('email')}</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            className="bg-white/10 border-white/20 text-white" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white/90">{t('password')}</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            className="bg-white/10 border-white/20 text-white" 
                            required 
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/90">{t('phone')}</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        className="bg-white/10 border-white/20 text-white" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level" className="text-white/90">{t('level')}</Label>
                      <Select 
                        value={formData.level} 
                        onValueChange={(value) => setFormData({ ...formData, level: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="Level0" className="text-white">{t('Level0')}</SelectItem>
                          <SelectItem value="Level1" className="text-white">{t('Level1')}</SelectItem>
                          <SelectItem value="Level2" className="text-white">{t('Level2')}</SelectItem>
                          <SelectItem value="Level3" className="text-white">{t('Level3')}</SelectItem>
                          <SelectItem value="Level4" className="text-white">{t('Level4')}</SelectItem>
                          <SelectItem value="Adult" className="text-white">{t('Adult')}</SelectItem>
                          <SelectItem value="PromiseTeam" className="text-white">{t('Promise Team')}</SelectItem>
                          <SelectItem value="DreamTeam" className="text-white">{t('Dream Team')}</SelectItem>
                          <SelectItem value="FutureTeam" className="text-white">{t('Future Team')}</SelectItem>
                          <SelectItem value="GatorsTeam" className="text-white">{t('Gators Team')}</SelectItem>
                          <SelectItem value="MightyTeam" className="text-white">{t('Mighty Team')}</SelectItem>
                          <SelectItem value="OlympicTeam" className="text-white">{t('Olympic Team')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="swimming-wave flex-1">{t('save')}</Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={resetForm} 
                        className="text-white hover:bg-white/10"
                      >
                        {t('cancel')}
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
          <div className="rounded-lg border border-white/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 hover:bg-white/5">
                  <TableHead className="text-white/90">
                    <button 
                      onClick={() => requestSort('full_name')} 
                      className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none"
                    >
                      {t('traineeName')}
                      <ArrowUpDown className="h-3 w-3" />
                      {sortConfig.key === 'full_name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-white/90">
                    <button 
                      onClick={() => requestSort('phone')} 
                      className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none"
                    >
                      {t('phone')}
                      <ArrowUpDown className="h-3 w-3" />
                      {sortConfig.key === 'phone' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-white/90">
                    <button 
                      onClick={() => requestSort('level')} 
                      className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none"
                    >
                      {t('level')}
                      <ArrowUpDown className="h-3 w-3" />
                      {sortConfig.key === 'level' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-white/90">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/70 py-8">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/70 py-8">
                      {t('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainees.map((trainee) => (
                    <TableRow key={trainee.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white/90 font-medium">{trainee.full_name}</TableCell>
                      <TableCell className="text-white/90">{trainee.phone}</TableCell>
                      <TableCell>{getLevelBadge(trainee.level)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(trainee)} 
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(trainee.id)} 
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
  );
};

export default TraineesTab;
