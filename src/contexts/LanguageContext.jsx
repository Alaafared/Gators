
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    // login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    dashboard: 'لوحة التحكم',
    
    // Auth
    // email: 'البريد الإلكتروني',
    // password: 'كلمة المرور',
    // loginButton: 'دخول',
    loginTitle: 'تسجيل الدخول',
    loginSubtitle: 'أدخل بياناتك للوصول إلى حسابك',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    
    // Admin Dashboard
    adminDashboard: 'لوحة تحكم الإدارة',
    bookings: 'الحجوزات',
    trainers: 'المدربين',
    trainees: 'المتدربين',
    schedules: 'الجداول',
    totalBookings: 'إجمالي الحجوزات',
    totalTrainers: 'إجمالي المدربين',
    totalTrainees: 'إجمالي المتدربين',
    activeSchedules: 'الجداول النشطة',
    
    // Bookings
    bookingId: 'رقم الحجز',
    trainee: 'المتدرب',
    trainer: 'المدرب',
    date: 'التاريخ',
    time: 'الوقت',
    status: 'الحالة',
    actions: 'الإجراءات',
    confirmed: 'مؤكد',
    pending: 'في الانتظار',
    cancelled: 'ملغي',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    
    // Trainers
    addTrainer: 'إضافة مدرب',
    trainerName: 'اسم المدرب',
    specialization: 'التخصص',
    experience: 'سنوات الخبرة',
    phone: 'الهاتف',
    save: 'حفظ',
    cancel: 'إلغاء',
    
    // Trainees
    addTrainee: 'إضافة متدرب',
    traineeName: 'اسم المتدرب',
    age: 'العمر',
    level: 'المستوى',
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم',
    
    // Schedules
    addSchedule: 'إضافة جدول',
    timeSlot: 'الفترة الزمنية',
    capacity: 'السعة',
    available: 'متاح',
    
    // Trainer Dashboard
    trainerDashboard: 'لوحة تحكم المدرب',
    mySchedules: 'جداولي',
    myTrainees: 'متدربيني',
    todaysSessions: 'جلسات اليوم',
    
    // Trainee Dashboard
    traineeDashboard: 'لوحة تحكم المتدرب',
    bookSession: 'حجز جلسة',
    myBookings: 'حجوزاتي',
    bookingTerms: 'شروط الحجز',
    
    // Terms and Conditions
    termsTitle: 'شروط وأحكام الحجز',
    term1: '• يجب الحضور قبل 15 دقيقة من موعد الجلسة',
    term2: '• إلغاء الحجز يجب أن يكون قبل 24 ساعة على الأقل',
    term3: '• يجب إحضار ملابس السباحة المناسبة',
    term4: '• الالتزام بتعليمات المدرب أثناء الجلسة',
    term5: '• عدم السباحة بدون إشراف المدرب',
    acceptTerms: 'أوافق على الشروط والأحكام',
    proceedToBooking: 'المتابعة للحجز',
    
    // Booking Form
    selectTrainer: 'اختر المدرب',
    selectDate: 'اختر التاريخ',
    selectTime: 'اختر الوقت',
    bookNow: 'احجز الآن',
    bookingSuccess: 'تم الحجز بنجاح!',
    
    // Common
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    search: 'بحث',
    filter: 'تصفية',
    all: 'الكل',
    active: 'نشط',
    inactive: 'غير نشط',
    
    // Messages
    featureNotImplemented: '🚧 هذه الميزة غير مطبقة بعد—لكن لا تقلق! يمكنك طلبها في رسالتك التالية! 🚀',
    deleteConfirm: 'هل أنت متأكد من الحذف؟',
    saveSuccess: 'تم الحفظ بنجاح',
    deleteSuccess: 'تم الحذف بنجاح',
    updateSuccess: 'تم التحديث بنجاح',
  },
  
  en: {
    // Navigation
    home: 'Home',
    login: 'Login',
    logout: 'Logout',
    dashboard: 'Dashboard',
    
    // Auth
    // email: 'Email',
    // password: 'Password',
    loginButton: 'Login',
    loginTitle: 'Login',
    loginSubtitle: 'Enter your credentials to access your account',
    invalidCredentials: 'Invalid credentials',
    loginSuccess: 'Login successful',
    
    // Admin Dashboard
    adminDashboard: 'Admin Dashboard',
    bookings: 'Bookings',
    trainers: 'Trainers',
    trainees: 'Trainees',
    schedules: 'Schedules',
    totalBookings: 'Total Bookings',
    totalTrainers: 'Total Trainers',
    totalTrainees: 'Total Trainees',
    activeSchedules: 'Active Schedules',
    
    // Bookings
    bookingId: 'Booking ID',
    trainee: 'Trainee',
    trainer: 'Trainer',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    actions: 'Actions',
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    
    // Trainers
    addTrainer: 'Add Trainer',
    trainerName: 'Trainer Name',
    specialization: 'Specialization',
    experience: 'Years of Experience',
    phone: 'Phone',
    save: 'Save',
    cancel: 'Cancel',
    
    // Trainees
    addTrainee: 'Add Trainee',
    traineeName: 'Trainee Name',
    age: 'Age',
    level: 'Level',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    
    // Schedules
    addSchedule: 'Add Schedule',
    timeSlot: 'Time Slot',
    capacity: 'Capacity',
    available: 'Available',
    
    // Trainer Dashboard
    trainerDashboard: 'Trainer Dashboard',
    mySchedules: 'My Schedules',
    myTrainees: 'My Trainees',
    todaysSessions: 'Today\'s Sessions',
    
    // Trainee Dashboard
    traineeDashboard: 'Trainee Dashboard',
    bookSession: 'Book Session',
    myBookings: 'My Bookings',
    bookingTerms: 'Booking Terms',
    
    // Terms and Conditions
    termsTitle: 'Booking Terms and Conditions',
    term1: '• Must arrive 15 minutes before session time',
    term2: '• Cancellation must be at least 24 hours in advance',
    term3: '• Must bring appropriate swimming attire',
    term4: '• Follow trainer instructions during session',
    term5: '• No swimming without trainer supervision',
    acceptTerms: 'I accept the terms and conditions',
    proceedToBooking: 'Proceed to Booking',
    
    // Booking Form
    selectTrainer: 'Select Trainer',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    bookNow: 'Book Now',
    bookingSuccess: 'Booking successful!',
    
    // Common
    loading: 'Loading...',
    noData: 'No data available',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    
    // Messages
    featureNotImplemented: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀',
    deleteConfirm: 'Are you sure you want to delete?',
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    updateSuccess: 'Updated successfully',
    termsConditions: "Terms and Conditions",
    viewTerms: "View Terms",
    termOperation: "Term of Operation",
    termItems: "Lost or Stolen Items",
    termFees: "Fees and Credit Notes",
    termLevel: "Change of Level",
    close: "Close",
    videoNotSupported: "Your browser does not support the video tag",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar');
  const [direction, setDirection] = useState('rtl');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    const newDir = newLang === 'ar' ? 'rtl' : 'ltr';
    setLanguage(newLang);
    setDirection(newDir);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      direction,
      toggleLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
