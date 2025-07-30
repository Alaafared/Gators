import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Clock, User, Check, Search, Printer } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const SchedulesTab = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState('All');
  const [printMode, setPrintMode] = useState(null);

  // Time slots
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

  // Form state
  const [formData, setFormData] = useState({
    day: '',
    time_slot: '',
    trainer_id: '',
    capacity: 10,
    status: 'active',
    level: ''
  });

  useEffect(() => {
    fetchSchedules();
    fetchTrainers();
    fetchStudents();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_students (
            student_id,
            students:profiles (id, full_name, level)
          ),
          trainer:profiles (id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, level')
        .eq('role', 'trainer')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trainers',
        variant: 'destructive'
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, level')
        .eq('role', 'trainee')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive'
      });
    }
  };

  const fetchAssignedStudents = async (scheduleId) => {
    try {
      const { data, error } = await supabase
        .from('schedule_students')
        .select('student_id, students:profiles (id, full_name, level)')
        .eq('schedule_id', scheduleId);

      if (error) throw error;
      const assigned = data.map(item => item.students);
      setAssignedStudents(assigned);
    } catch (error) {
      console.error('Error fetching assigned students:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTrainerChange = async (trainerId) => {
    const selectedTrainer = trainers.find(t => t.id === trainerId);
    const trainerLevel = selectedTrainer?.level || '';
    
    setFormData(prev => ({
      ...prev,
      trainer_id: trainerId,
      level: trainerLevel
    }));

    const studentsByLevel = students.filter(student => student.level === trainerLevel);
    setSelectedStudents(studentsByLevel.map(student => student.id));
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        if (prev.length >= formData.capacity) {
          toast({
            title: 'Capacity Exceeded',
            description: `You can't select more than ${formData.capacity} students`,
            variant: 'destructive'
          });
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleEditSchedule = (schedule) => {
    setFormData({
      day: schedule.day,
      time_slot: schedule.time_slot,
      trainer_id: schedule.trainer_id,
      capacity: schedule.capacity,
      status: schedule.status,
      level: schedule.level
    });
    setCurrentScheduleId(schedule.id);
    setIsEditing(true);
    setOpenDialog(true);
    
    if (schedule.schedule_students) {
      setSelectedStudents(schedule.schedule_students.map(ss => ss.student_id));
    }
  };

  const handleViewDetails = async (schedule) => {
    const trainer = trainers.find(t => t.id === schedule.trainer_id);
    setSelectedScheduleDetails({
      ...schedule,
      trainer_name: trainer?.full_name || 'Unknown Trainer'
    });
    await fetchAssignedStudents(schedule.id);
    setOpenDetailsDialog(true);
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await supabase
        .from('schedule_students')
        .delete()
        .eq('schedule_id', id);

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.day || !formData.time_slot || !formData.trainer_id || !formData.level) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedStudents.length > formData.capacity) {
      toast({
        title: 'Capacity Exceeded',
        description: `Number of selected students (${selectedStudents.length}) exceeds capacity (${formData.capacity})`,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      let scheduleData;
      
      if (isEditing) {
        const { data, error } = await supabase
          .from('schedules')
          .update(formData)
          .eq('id', currentScheduleId)
          .select();

        if (error) throw error;
        scheduleData = data[0];
        await updateScheduleStudents(currentScheduleId);
        
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
      } else {
        const { data, error } = await supabase
          .from('schedules')
          .insert([formData])
          .select();

        if (error) throw error;
        scheduleData = data[0];
        await updateScheduleStudents(scheduleData.id);
        
        toast({
          title: 'Success',
          description: 'Schedule created successfully',
        });
      }
      
      const trainer = trainers.find(t => t.id === scheduleData.trainer_id);
      setSelectedScheduleDetails({
        ...scheduleData,
        trainer_name: trainer?.full_name || 'Unknown Trainer'
      });
      await fetchAssignedStudents(scheduleData.id);
      setOpenDetailsDialog(true);
      
      resetForm();
      setOpenDialog(false);
      fetchSchedules();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateScheduleStudents = async (scheduleId) => {
    await supabase
      .from('schedule_students')
      .delete()
      .eq('schedule_id', scheduleId);

    if (selectedStudents.length > 0) {
      const { error } = await supabase
        .from('schedule_students')
        .insert(selectedStudents.map(studentId => ({
          schedule_id: scheduleId,
          student_id: studentId
        })));

      if (error) throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      day: '',
      time_slot: '',
      trainer_id: '',
      capacity: 10,
      status: 'active',
      level: ''
    });
    setSelectedStudents([]);
    setCurrentScheduleId(null);
    setIsEditing(false);
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.time_slot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (schedule.trainer?.full_name && schedule.trainer.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      schedule.level.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = selectedDay === 'All' || schedule.day === selectedDay;
    
    return matchesSearch && matchesDay;
  });

  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) {
      acc[schedule.day] = [];
    }
    acc[schedule.day].push(schedule);
    return acc;
  }, {});

  const daysOrder = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const sortedDays = Object.keys(groupedSchedules).sort((a, b) => daysOrder[a] - daysOrder[b]);

  const handlePrint = (mode, day = null, schedule = null) => {
    setPrintMode(mode);
    if (mode === 'day') {
      setSelectedDay(day);
    } else if (mode === 'card') {
      setSelectedScheduleDetails(schedule);
    }
    
    setTimeout(() => {
      const printStyles = `
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            direction: ltr;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
          }
          .print-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .print-subtitle {
            font-size: 16px;
            color: #666;
          }
          .print-date {
            font-size: 14px;
            color: #888;
            margin-top: 10px;
          }
          .schedule-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .schedule-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .schedule-time {
            font-weight: bold;
            font-size: 18px;
          }
          .schedule-status {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
          .schedule-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 10px;
          }
          .detail-item {
            margin-bottom: 5px;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
            font-size: 14px;
          }
          .detail-value {
            font-size: 15px;
          }
          .students-list {
            margin-top: 10px;
          }
          .student-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #eee;
          }
          .print-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #eee;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              background: white;
              color: black;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      `;
    
      let printContent = '';
      
      if (mode === 'table') {
        printContent = `
          <div class="print-header">
            <img src="/gators.png" alt="Gators Logo" class="logo" style="width: 90px; height: auto; margin: 0 auto 10px; display: block;" onerror="this.style.display='none'">
            <div class="print-title">Complete Schedule Table</div>
            <div class="print-subtitle">Gators Swimming Academy</div>
            <div class="print-date">Printed on ${new Date().toLocaleDateString()}</div>
          </div>
        `;
    
        sortedDays.forEach(day => {
          printContent += `
            <div class="day-section">
              <h3 style="margin: 15px 0 10px; font-size: 18px;">${day}</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
          `;
    
          groupedSchedules[day].forEach(schedule => {
            const trainer = trainers.find(t => t.id === schedule.trainer_id) || schedule.trainer;
            const trainerName = trainer?.full_name || 'Unknown Trainer';
            const scheduleStudents = schedule.schedule_students?.map(ss => ss.students) || [];
    
            printContent += `
              <div class="schedule-card">
                <div class="schedule-header">
                  <span class="schedule-time">${schedule.time_slot}</span>
                  <span class="schedule-status" style="background-color: ${
                    schedule.status === 'active' ? '#d1fae5' : 
                    schedule.status === 'full' ? '#e0f2fe' : '#fee2e2'
                  }; color: ${
                    schedule.status === 'active' ? '#065f46' : 
                    schedule.status === 'full' ? '#0369a1' : '#b91c1c'
                  };">
                    ${schedule.status === 'active' ? 'Active' : schedule.status === 'full' ? 'Full' : 'Inactive'}
                  </span>
                </div>
                <div class="schedule-details">
                  <div>
                    <div class="detail-item">
                      <div class="detail-label">Trainer:</div>
                      <div class="detail-value">${trainerName}</div>
                    </div>
                    <div class="detail-item">
                      <div class="detail-label">Level:</div>
                      <div class="detail-value">${schedule.level}</div>
                    </div>
                  </div>
                  <div>
                    <div class="detail-item">
                      <div class="detail-label">Capacity:</div>
                      <div class="detail-value">${scheduleStudents.length}/${schedule.capacity}</div>
                    </div>

                  </div>
                </div>
                ${scheduleStudents.length > 0 ? `
                  <div class="students-list">
                    <div class="detail-label">Registered Students:</div>
                    ${scheduleStudents.map(student => `
                      <div class="student-item">
                        <span>${student.full_name}</span>
                        <span>${student.level}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          });
    
          printContent += `</div></div>`;
        });
      } 
      else if (mode === 'day') {
        printContent = `
        <div class="print-header">
          <img src="/gators.png" alt="Gators Logo" class="logo" style="width: 90px; height: auto; margin: 0 auto 10px; display: block;" onerror="this.style.display='none'">
          <div class="print-title">${day} Schedule</div>
          <div class="print-subtitle">Gators Swimming Academy</div>
          <div class="print-date">Printed on ${new Date().toLocaleDateString()}</div>
        </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
        `;
    
        groupedSchedules[day].forEach(schedule => {
          const trainer = trainers.find(t => t.id === schedule.trainer_id) || schedule.trainer;
          const trainerName = trainer?.full_name || 'Unknown Trainer';
          const scheduleStudents = schedule.schedule_students?.map(ss => ss.students) || [];
    
          printContent += `
            <div class="schedule-card">
              <div class="schedule-header">
                <span class="schedule-time">${schedule.time_slot}</span>
                <span class="schedule-status" style="background-color: ${
                  schedule.status === 'active' ? '#d1fae5' : 
                  schedule.status === 'full' ? '#e0f2fe' : '#fee2e2'
                }; color: ${
                  schedule.status === 'active' ? '#065f46' : 
                  schedule.status === 'full' ? '#0369a1' : '#b91c1c'
                };">
                  ${schedule.status === 'active' ? 'Active' : schedule.status === 'full' ? 'Full' : 'Inactive'}
                </span>
              </div>
              <div class="schedule-details">
                <div>
                  <div class="detail-item">
                    <div class="detail-label">Trainer:</div>
                    <div class="detail-value">${trainerName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Level:</div>
                    <div class="detail-value">${schedule.level}</div>
                  </div>
                </div>
                <div>
                  <div class="detail-item">
                    <div class="detail-label">Capacity:</div>
                    <div class="detail-value">${scheduleStudents.length}/${schedule.capacity}</div>
                  </div>

                </div>
              </div>
              ${scheduleStudents.length > 0 ? `
                <div class="students-list">
                  <div class="detail-label">Registered Students:</div>
                  ${scheduleStudents.map(student => `
                    <div class="student-item">
                      <span>${student.full_name}</span>
                      <span>${student.level}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        });
    
        printContent += `</div>`;
      }
      else if (mode === 'card' && schedule) {
        const trainer = trainers.find(t => t.id === schedule.trainer_id) || schedule.trainer;
        const trainerName = trainer?.full_name || 'Unknown Trainer';
        const scheduleStudents = schedule.schedule_students?.map(ss => ss.students) || [];
    
        printContent = `
          <div class="print-header">
            <img src="/gators.png" alt="Gators Logo" class="logo" style="width: 90px; height: auto; margin: 0 auto 10px; display: block;" onerror="this.style.display='none'">
            <div class="print-title">Schedule Details</div>
            <div class="print-subtitle">Gators Swimming Academy</div>
            <div class="print-date">Printed on ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="schedule-card" style="max-width: 500px; margin: 0 auto;">
            <div class="schedule-header">
              <span class="schedule-time">${schedule.day} - ${schedule.time_slot}</span>
              <span class="schedule-status" style="background-color: ${
                schedule.status === 'active' ? '#d1fae5' : 
                schedule.status === 'full' ? '#e0f2fe' : '#fee2e2'
              }; color: ${
                schedule.status === 'active' ? '#065f46' : 
                schedule.status === 'full' ? '#0369a1' : '#b91c1c'
              };">
                ${schedule.status === 'active' ? 'Active' : schedule.status === 'full' ? 'Full' : 'Inactive'}
              </span>
            </div>
            <div class="schedule-details">
              <div>
                <div class="detail-item">
                  <div class="detail-label">Trainer:</div>
                  <div class="detail-value">${trainerName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Level:</div>
                  <div class="detail-value">${schedule.level}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Capacity:</div>
                  <div class="detail-value">${scheduleStudents.length}/${schedule.capacity}</div>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <div class="detail-label">Created Date:</div>
                  <div class="detail-value">${new Date(schedule.created_at).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Status:</div>
                  <div class="detail-value">${schedule.status === 'active' ? 'Active' : schedule.status === 'full' ? 'Full' : 'Inactive'}</div>
                </div>
              </div>
            </div>
            ${scheduleStudents.length > 0 ? `
              <div class="students-list">
                <div class="detail-label">Registered Students (${scheduleStudents.length}):</div>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; padding: 5px;">
                  ${scheduleStudents.map(student => `
                    <div class="student-item">
                      <span>${student.full_name}</span>
                      <span>${student.level}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div class="print-footer">
              Gators Swimming Academy &copy; ${new Date().getFullYear()}
            </div>
          </div>
        `;
      }
    
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Schedule Table</title>
            ${printStyles}
          </head>
          <body>
            <div class="print-content">
              ${printContent}
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    
      setPrintMode(null);
      if (mode === 'day') {
        setSelectedDay('All');
      }
    }, 100);
  };

  const allDays = ['All', ...Object.keys(daysOrder)];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5" />{t('schedules')}
            </CardTitle>
            <Dialog open={openDialog} onOpenChange={(open) => {
              if (!open) resetForm();
              setOpenDialog(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="default" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Update the schedule details' : 'Fill in the details to create a new schedule'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="day">Day *</Label>
                      <Select 
                        name="day" 
                        value={formData.day} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, day: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time_slot">Time Slot *</Label>
                      <Select
                        name="time_slot"
                        value={formData.time_slot}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, time_slot: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainer_id">Trainer *</Label>
                      <Select
                        name="trainer_id"
                        value={formData.trainer_id}
                        onValueChange={handleTrainerChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trainer" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id}>
                              {trainer.full_name} 
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Level *</Label>
                      <Input
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        placeholder="Level will auto-fill from trainer"
                        required
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, capacity: value }));
                          
                          if (selectedStudents.length > value) {
                            toast({
                              title: 'Capacity Warning',
                              description: `You have ${selectedStudents.length} students selected but capacity is now ${value}`,
                              variant: 'destructive'
                            });
                          }
                        }}
                        min="1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        name="status"
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Select Students ({selectedStudents.length}/{formData.capacity})</Label>
                      {selectedStudents.length > formData.capacity && (
                        <span className="text-sm text-red-500">
                          Exceeds capacity by {selectedStudents.length - formData.capacity}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border rounded-lg bg-white/10">
                      {students.length > 0 ? (
                        students.map(student => (
                          <div 
                            key={student.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedStudents.includes(student.id) 
                                ? 'bg-blue-500/20 border border-blue-500' 
                                : 'bg-white/5 hover:bg-white/10 border border-white/10'
                            }`}
                            onClick={() => handleStudentSelection(student.id)}
                          >
                            <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border ${
                              selectedStudents.includes(student.id) 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : 'border-gray-400'
                            }`}>
                              {selectedStudents.includes(student.id) && <Check className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {student.full_name}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4 text-white/70">
                          No students available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        resetForm();
                        setOpenDialog(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={selectedStudents.length > formData.capacity}
                    >
                      {isEditing ? 'Update' : 'Save'} Schedule
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Schedule Details</DialogTitle>
                </DialogHeader>
                {selectedScheduleDetails && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Day</Label>
                        <p className="text-sm">{selectedScheduleDetails.day}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Time Slot</Label>
                        <p className="text-sm">{selectedScheduleDetails.time_slot}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Trainer</Label>
                        <p className="text-sm">{selectedScheduleDetails.trainer?.full_name || selectedScheduleDetails.trainer_name || 'Unknown Trainer'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Level</Label>
                        <p className="text-sm">
                          <Badge variant="outline">{selectedScheduleDetails.level}</Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Capacity</Label>
                        <p className="text-sm">{selectedScheduleDetails.capacity}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <p className="text-sm">
                          <Badge variant={
                            selectedScheduleDetails.status === 'active' ? 'default' : 
                            selectedScheduleDetails.status === 'full' ? 'secondary' : 'destructive'
                          }>
                            {selectedScheduleDetails.status}
                          </Badge>
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Label className="text-sm font-medium text-gray-500">
                        Assigned Students ({assignedStudents.length}/{selectedScheduleDetails.capacity})
                      </Label>
                      {assignedStudents.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {assignedStudents.map(student => (
                            <div key={student.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                              <User className="h-4 w-4 text-gray-600" />
                              <span className="text-sm">{student.full_name}</span>
                              <Badge variant="outline" className="ml-auto">{student.level}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">No students assigned yet</p>
                      )}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search schedules..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by day" />
                </SelectTrigger>
                <SelectContent>
                  {allDays.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handlePrint('table')}>
                <Printer className="h-4 w-4 mr-2" />
                Print Full Table
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white/70 py-8">{t('loading')}</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center text-white/70 py-8">{t('noData')}</div>
          ) : (
            <div className="space-y-8">
              {sortedDays.map(day => (
                <div key={day} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">{day}</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="no-print" 
                      onClick={() => handlePrint('day', day)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print This Day
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedSchedules[day].map((schedule) => {
                      const trainer = trainers.find(t => t.id === schedule.trainer_id) || schedule.trainer;
                      const trainerName = trainer?.full_name || 'Unknown Trainer';
                      const scheduleStudents = schedule.schedule_students?.map(ss => ss.students) || [];

                      return (
                        <div key={schedule.id} className="bg-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-4">
                              <span className="text-white/80">{schedule.time_slot}</span>
                              <Badge variant={schedule.status === 'active' ? 'default' : 'destructive'}>
                                {schedule.status}
                              </Badge>
                            </div>
                            <div className="flex gap-2 no-print">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewDetails(schedule)}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                View
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditSchedule(schedule)}
                                className="text-yellow-500 hover:text-yellow-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handlePrint('card', null, schedule)}
                                className="text-green-500 hover:text-green-600"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/90">Trainer:</span>
                                <span className="font-medium text-white">{trainerName}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-white/90">Level:</span>
                                <Badge className="bg-blue-500 text-white">{schedule.level}</Badge>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/90">Students:</span>
                                <span className="font-medium text-white">
                                  {scheduleStudents.length}/{schedule.capacity}
                                </span>
                              </div>
                              {/* <div className="flex items-center gap-2 mt-1">
                                <span className="text-white/90">Created:</span>
                                <span className="text-white/90 text-sm">
                                  {new Date(schedule.created_at).toLocaleString()}
                                </span>
                              </div> */}
                            </div>
                          </div>

                          {scheduleStudents.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm text-white/80 mb-1">Students:</div>
                              <div className="flex flex-wrap gap-1">
                                {scheduleStudents.slice(0, 3).map(student => (
                                  <Badge key={student.id} variant="secondary" className="text-xs">
                                    {student.full_name}
                                  </Badge>
                                ))}
                                {scheduleStudents.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{scheduleStudents.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SchedulesTab;
