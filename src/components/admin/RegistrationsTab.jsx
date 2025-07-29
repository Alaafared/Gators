import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useReactToPrint } from 'react-to-print';
import { Printer, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RegistrationsTab = () => {
  const { t, language } = useLanguage();
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const componentRef = React.useRef();
  const { toast } = useToast();

  

  const dayNames = {
    0: 'Friday',    // يوم الجمعة كأول يوم (0)
    1: 'Saturday',  // يوم السبت (1)
    2: 'Sunday',    // يوم الأحد (2)
    3: 'Monday',    // يوم الاثنين (3)
    4: 'Tuesday',   // يوم الثلاثاء (4)
    5: 'Wednesday', // يوم الأربعاء (5)
    6: 'Thursday'   // يوم الخميس (6)
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    
    try {
      // جلب البيانات الأساسية أولاً
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (regError) throw regError;
  
      // جلب أسماء المدربين ومدربي التقييم
      const trainerIds = registrations.map(r => r.trainer_id).filter(Boolean);
      const evaluatorIds = registrations.map(r => r.evaluator_id).filter(Boolean);
      const uniqueIds = [...new Set([...trainerIds, ...evaluatorIds])];
  
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueIds);
  
      if (profileError) throw profileError;
  
      // دمج البيانات
      const registrationsWithNames = registrations.map(reg => {
        const trainer = profiles.find(p => p.id === reg.trainer_id);
        const evaluator = profiles.find(p => p.id === reg.evaluator_id);
        
        return {
          ...reg,
          trainer_name: trainer?.full_name || 'N/A',
          evaluator_name: evaluator?.full_name || trainer?.full_name || 'N/A',
          days: Array.isArray(reg.days) ? reg.days : []
        };
      });
  
      setRegistrations(registrationsWithNames);
      
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAll = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .registration-card { break-inside: avoid; margin-bottom: 10mm; }
        .no-print { display: none; }
      }
    `,
    documentTitle: 'Gators-Swimming-Academy-Registrations'
  });

  const handlePrintSingle = (registration) => {
    const printWindow = window.open('', '_blank');
    const logoPath = '/gators.png';
    const dayNamesShort = {
        0: 'Fri', 1: 'Sat', 2: 'Sun', 3: 'Mon', 
        4: 'Tues', 5: 'Wed', 6: 'Thu'
      };
  
    printWindow.document.write(`
      <html>
        <head>
          <title>Gators Swimming Academy - ${registration.full_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
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
              color: #2b6cb0;
              margin: 5px 0;
              font-size: 24px;
            }
            h2 {
              margin: 10px 0;
              color: #333;
              font-size: 18px;
            }
            .form-title {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              width: 30%;
            }
            .schedule-table th, .schedule-table td {
              text-align: center;
              width: auto;
            }
            .notes {
              margin-top: 20px;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              font-size: 12px;
              color: #333;
              line-height: 1.5;
            }
            .footer-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .footer-left {
              text-align: left;
            }
            .footer-right {
              text-align: right;
            }
            .footer a {
              color: #333;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoPath}" alt="Gators Swimming Academy Logo" class="logo">
            <h1>GATORS SWIMMING ACADEMY</h1>
            <h2 class="form-title">Registration Form</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; font-size: 1.2em;">Name: <span style="font-weight: normal;">${registration.full_name}</span></h2>
                <h3 style="margin: 0; color: #555;">Bill No. ${registration.id}</h3>
            </div>
          </div>

          <table>
            <tr>
              <th>Full Name</th>
              <td>${registration.full_name}</td>
            </tr>
          </table>
                    <table>
            <tr>
              <th>Date of Birth</th>
              <td>${registration.date_of_birth}</td>
              <th>Age</th>
              <td>${registration.age}</td>
            </tr>
          </table>
  

  
          <table>
            <tr>
              <th>Gender</th>
              <td colspan="3">${registration.gender}</td>
            </tr>
          </table>
  
<table>
  <tr>
    <th>Instructor</th>
    <td>${registration.trainer_name}</td>
    <th>Level</th>
    <td>${registration.level}</td>
  </tr>
  <tr>
    <th>Assessment Instructor</th>
    <td colspan="3">${registration.evaluator_name}</td>
  </tr>
</table>
  
  <table class="schedule-table">
  <tr>
    <th>Schedule</th>
    <th>Fri</th>
    <th>Sat</th>
    <th>Sun</th>
    <th>Mon</th>
    <th>Tues</th>
    <th>Wed</th>
    <th>Thu</th>
  </tr>
  <tr>
    <td></td>
    <td>${registration.days?.includes('friday') ? '✓' : ''}</td>
    <td>${registration.days?.includes('saturday') ? '✓' : ''}</td>
    <td>${registration.days?.includes('sunday') ? '✓' : ''}</td>
    <td>${registration.days?.includes('monday') ? '✓' : ''}</td>
    <td>${registration.days?.includes('tuesday') ? '✓' : ''}</td>
    <td>${registration.days?.includes('wednesday') ? '✓' : ''}</td>
    <td>${registration.days?.includes('thursday') ? '✓' : ''}</td>
  </tr>
</table>
            <tr>
              <th>Subscription Date</th>
              <td>${registration.subscription_date}</td>
              <th>Duration</th>
              <td>${registration.duration} month(s)</td>
            </tr>
          </table>
  
          <table>
            <tr>
              <th>Payment Amount</th>
              <td>${registration.payment_amount} AED</td>
              <th>Payment Method</th>
              <td>${registration.payment_method}</td>
            </tr>
          </table>
  
          <table>
            <tr>
              <th>Mobile Number</th>
              <td colspan="3">${registration.mobile_number}</td>
            </tr>
          </table>
  
          <table>
            <tr>
              <th>E-Mail Address</th>
              <td colspan="3">${registration.email}</td>
            </tr>
          </table>
  
          <div class="notes">Notes:</div>
          <div>${registration.notes || ''}</div>
  
          <div class="footer">
            <div class="footer-line">
              <div class="footer-left">WEB: <a href="https://www.gatorsdxb.com/">https://www.gatorsdxb.com/</a></div>
              <div class="footer-right">Facebook: Gators uae sports club</div>
            </div>
            <div class="footer-line">
              <div class="footer-left">Email: <a href="mailto:gatorsuae@gmail.com">gatorsuae@gmail.com</a></div>
              <div class="footer-right">Instagram: Gators Swimming Academy</div>
            </div>
            <div class="footer-line">
              <div class="footer-left">Address: Jss International School - JVC - Dubai</div>
              <div class="footer-right"></div>
            </div>
          </div>
  
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredRegistrations = registrations.filter(reg =>
    reg.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.mobile_number?.includes(searchTerm) ||
    reg.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={('search Registrations')}
            className="w-full pl-10 bg-white/10 border-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* <Button onClick={handlePrintAll} variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
          <Printer className="mr-2 h-4 w-4" />
          {t('printAll')}
        </Button> */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : (
        <div ref={componentRef} className="space-y-6">
          <div className="no-print">
            <h2 className="text-2xl font-semibold">
              {('Total Registrations')}: {filteredRegistrations.length}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="registration-card border-white/20">
<CardHeader className="pb-2">
  <CardTitle className="text-xl flex justify-between items-center">
    <div className="flex items-center gap-2">
      <span className="font-semibold">Name Trainee:</span>
      <span>{registration.full_name}</span>
    </div>
    <Button 
      size="sm" 
      variant="ghost" 
      onClick={() => handlePrintSingle(registration)}
      className="text-white/70 hover:text-white"
    >
      <Printer className="h-4 w-4" />
    </Button>
  </CardTitle>
</CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-white/70">{('Date Of Birth')}</p>
                        <p>{registration.date_of_birth}</p>
                      </div>
                      <div>
                        <p className="text-white/70">{t('age')}</p>
                        <p>{registration.age}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/70">{t('gender')}</p>
                      <p>{registration.gender}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-white/70">{t('instructor')}</p>
                        <p>{registration.trainer_name}</p>
                      </div>
                      <div>
                        <p className="text-white/70">{t('level')}</p>
                        <p>{registration.level}</p>
                      </div>
                    </div>
                    <div>
  <p className="text-white/70">{t('schedule')}</p>
  <p>
    {registration.days?.join(' - ') || 'N/A'}
  </p>
</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-white/70">{t('mobileNumber')}</p>
                        <p>{registration.mobile_number}</p>
                      </div>
                      <div>
                        <p className="text-white/70">{t('email')}</p>
                        <p>{registration.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/70">{t('notes')}</p>
                      <p className="text-sm">{registration.notes || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRegistrations.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-white/70">{('no Registrations Found')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationsTab;