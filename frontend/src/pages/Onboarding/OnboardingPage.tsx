// MuradERP Onboarding Wizard
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { companyApi } from '../../services/api';
import {
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  FlagIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const steps = [
  { id: 1, label: 'إطلاق', icon: RocketLaunchIcon },
  { id: 2, label: 'الخطة', icon: BriefcaseIcon },
  { id: 3, label: 'الشركة', icon: BuildingOfficeIcon },
  { id: 4, label: 'القطاع', icon: BriefcaseIcon },
  { id: 5, label: 'الدولة', icon: FlagIcon },
];

const plans = [
  { id: 'free', name: 'تجريبي مجاني', description: '14 يوم مجاناً', price: 0 },
  { id: 'basic', name: 'أساسي', description: 'للشركات الصغيرة', price: 99 },
  { id: 'pro', name: 'احترافي', description: 'للشركات المتوسطة', price: 199 },
  { id: 'enterprise', name: 'مؤسسي', description: 'للشركات الكبيرة', price: 499 },
];

const sectors = [
  'تصنيع', 'تجارة', 'خدمات', 'تقنية', 'صحة', 'تعليم',
  'مقاولات', 'عقارات', 'نقل', 'زراعة', 'سياحة', 'مالية',
];

const countries = [
  { code: 'SA', name: 'المملكة العربية السعودية', flag: '🇸🇦', currency: 'SAR' },
  { code: 'AE', name: 'الإمارات العربية المتحدة', flag: '🇦🇪', currency: 'AED' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼', currency: 'KWD' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦', currency: 'QAR' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭', currency: 'BHD' },
  { code: 'OM', name: 'عمان', flag: '🇴🇲', currency: 'OMR' },
  { code: 'EG', name: 'مصر', flag: '🇪🇬', currency: 'EGP' },
  { code: 'JO', name: 'الأردن', flag: '🇯🇴', currency: 'JOD' },
  { code: 'IQ', name: 'العراق', flag: '🇮🇶', currency: 'IQD' },
  { code: 'LB', name: 'لبنان', flag: '🇱🇧', currency: 'LBP' },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { token } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    plan: 'free',
    companyName: '',
    companyNameAr: '',
    legalName: '',
    commercialReg: '',
    sector: '',
    country: 'SA',
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    zipCode: '',
  });

  // Check if user already has companies
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (companiesData?.data && companiesData.data.length > 0) {
      navigate('/dashboard');
    }
  }, [companiesData, navigate]);

  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => companyApi.create(data),
    onSuccess: (response: any) => {
      if (response.success) {
        toast.success('تم إطلاق الشركة بنجاح! 🚀');
        // Update token with new company context if provided
        if (response.data?.token) {
          localStorage.setItem('murad_erp_token', response.data.token);
          localStorage.setItem('murad_erp_refresh_token', response.data.refreshToken);
        }
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'حدث خطأ أثناء إطلاق الشركة';
      setError(msg);
      toast.error(msg);
    },
  });

  const handleNext = () => {
    setError(null);
    if (currentStep === 3 && !formData.companyName.trim()) {
      setError('اسم الشركة مطلوب');
      return;
    }
    if (currentStep === 4 && !formData.sector) {
      setError('القطاع مطلوب');
      return;
    }
    if (currentStep === 5 && !formData.country) {
      setError('الدولة مطلوبة');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleLaunch = () => {
    setError(null);

    if (!formData.companyName.trim()) {
      setError('اسم الشركة مطلوب');
      return;
    }
    if (!formData.country) {
      setError('الدولة مطلوبة');
      return;
    }

    const selectedCountry = countries.find((c) => c.code === formData.country);

    const payload = {
      name: formData.companyName,
      nameAr: formData.companyNameAr || undefined,
      legalName: formData.legalName || undefined,
      taxId: formData.taxId || undefined,
      commercialReg: formData.commercialReg || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      country: formData.country,
      zipCode: formData.zipCode || undefined,
      currency: selectedCountry?.currency || 'SAR',
      fiscalYearStart: 1,
      fiscalYearEnd: 12,
    };

    createCompanyMutation.mutate(payload);
  };

  const selectedCountry = countries.find((c) => c.code === formData.country);
  const selectedPlan = plans.find((p) => p.id === formData.plan);
  const selectedSector = formData.sector;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <p className="text-secondary-600">يجب تسجيل الدخول أولاً</p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-4">
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-secondary-500">تسجيل الدخول بـ Google</p>
              <p className="font-bold text-secondary-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold">
                {(user?.firstName?.[0] || user?.email?.[0] || 'م').toUpperCase()}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-secondary-900">إعداد شركتك</h1>
          <p className="text-center text-secondary-500 mt-1">
            الخطوة {currentStep} من {steps.length}
          </p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : isCompleted
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-secondary-100 text-secondary-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isActive ? 'text-primary-600' : isCompleted ? 'text-primary-600' : 'text-secondary-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        step.id < currentStep ? 'bg-primary-600' : 'bg-secondary-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-danger-600 flex-shrink-0" />
            <p className="text-danger-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Step 1: Launch */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <RocketLaunchIcon className="h-16 w-16 text-primary-600 mx-auto" />
              <h2 className="text-xl font-bold">مرحباً بك في واصل! 🚀</h2>
              <p className="text-secondary-600">
                نحن سعداء بانضمامك إلينا. خلال الخطوات القليلة القادمة، سنقوم بإعداد شركتك للعمل.
              </p>
              <div className="bg-primary-50 rounded-xl p-4 text-right">
                <p className="text-sm text-primary-800">
                  <strong>المستخدم:</strong> {user?.firstName} {user?.lastName} ({user?.email})
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Plan */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">اختر خطتك</h2>
              <div className="grid grid-cols-1 gap-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setFormData({ ...formData, plan: plan.id })}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      formData.plan === plan.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{plan.name}</p>
                        <p className="text-sm text-secondary-500">{plan.description}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-primary-600">
                          {plan.price === 0 ? 'مجاني' : `${plan.price} ر.س/شهر`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Company */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">معلومات الشركة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم الشركة *</label>
                  <input
                    className="input"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="مثال: مصنع ريتاج الزيوت"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم بالعربي</label>
                  <input
                    className="input"
                    value={formData.companyNameAr}
                    onChange={(e) => setFormData({ ...formData, companyNameAr: e.target.value })}
                    placeholder="مصنع ريتاج الزيوت"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم القانوني</label>
                  <input
                    className="input"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السجل التجاري (CR)</label>
                  <input
                    className="input"
                    value={formData.commercialReg}
                    onChange={(e) => setFormData({ ...formData, commercialReg: e.target.value })}
                    placeholder="1010450490"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الرقم الضريبي</label>
                  <input
                    className="input"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الجوال</label>
                  <input
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Sector */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center mb-4">اختر قطاع عملك</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setFormData({ ...formData, sector })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.sector === sector
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-secondary-200 hover:border-primary-300 text-secondary-700'
                    }`}
                  >
                    <BriefcaseIcon className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{sector}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Country & Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-center mb-4">الدولة والموقع</h2>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {countries.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => setFormData({ ...formData, country: country.code })}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${
                      formData.country === country.code
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <p className="font-bold">{country.name}</p>
                      <p className="text-sm text-secondary-500">العملة: {country.currency}</p>
                    </div>
                    {formData.country === country.code && (
                      <CheckCircleIcon className="h-6 w-6 text-primary-600" />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المدينة</label>
                  <input
                    className="input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="الرياض"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المنطقة</label>
                  <input
                    className="input"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">العنوان</label>
                <input
                  className="input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الرمز البريدي</label>
                <input
                  className="input"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>

              {/* Review Summary */}
              <div className="bg-secondary-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-secondary-900">مراجعة نهائية</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-secondary-500">الدولة</div>
                  <div className="font-medium text-left">{selectedCountry?.name}</div>
                  <div className="text-secondary-500">القطاع</div>
                  <div className="font-medium text-left">{selectedSector || '-'}</div>
                  <div className="text-secondary-500">الشركة</div>
                  <div className="font-medium text-left">{formData.companyName || '-'}</div>
                  <div className="text-secondary-500">المدينة</div>
                  <div className="font-medium text-left">{formData.city || '-'}</div>
                  <div className="text-secondary-500">CR</div>
                  <div className="font-medium text-left">{formData.commercialReg || '-'}</div>
                  <div className="text-secondary-500">الخطة</div>
                  <div className="font-medium text-left">{selectedPlan?.name}</div>
                  <div className="text-secondary-500">مالك الشركة</div>
                  <div className="font-medium text-left">{user?.firstName} {user?.lastName}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handlePrev}
              className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
            >
              <ArrowRightIcon className="h-5 w-5" />
              السابق
            </button>
          )}
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
            >
              التالي
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={createCompanyMutation.isPending}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createCompanyMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الإطلاق...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="h-5 w-5" />
                  إطلاق الشركة
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
