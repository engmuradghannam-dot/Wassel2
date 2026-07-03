// MuradERP CRM Page (Leads + Opportunities)
import { useState, FormEvent } from 'react';
import { PlusIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { useLeads, useOpportunities } from '../../hooks/useCRM';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Lead, Opportunity } from '../../types';
import { formatCurrency } from '../../utils/currency';

const leadStatusLabel: Record<string, string> = {
  NEW: 'جديد', CONTACTED: 'تم التواصل', QUALIFIED: 'مؤهّل',
  PROPOSAL: 'عرض سعر', CONVERTED: 'محوّل لعميل', LOST: 'خسارة',
};

const stageLabel: Record<string, string> = {
  PROSPECTING: 'استكشاف', QUALIFICATION: 'تأهيل', NEEDS_ANALYSIS: 'تحليل الاحتياج',
  VALUE_PROPOSITION: 'عرض القيمة', ID_DECISION_MAKERS: 'تحديد متخذ القرار',
  PERCEPTION_ANALYSIS: 'تحليل الإدراك', PROPOSAL: 'عرض سعر', NEGOTIATION: 'تفاوض',
  CLOSED_WON: 'فوز', CLOSED_LOST: 'خسارة',
};

const emptyLeadForm = { leadName: '', companyName: '', email: '', phone: '', source: '' };
const emptyOppForm = { opportunityName: '', expectedAmount: 0, probability: 20, expectedCloseDate: '' };

export const CRMPage = () => {
  const { selectedCompany } = useAuthStore();
  const [tab, setTab] = useState<'leads' | 'opportunities'>('leads');

  const { leads, isLoading: leadsLoading, createLead, updateLeadStatus, convertLead, isSaving: leadSaving } = useLeads();
  const { opportunities, isLoading: oppLoading, createOpportunity, updateOpportunityStage, isSaving: oppSaving } = useOpportunities();

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<any>(emptyLeadForm);

  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [oppForm, setOppForm] = useState<any>(emptyOppForm);

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createLead(leadForm);
    setLeadForm(emptyLeadForm);
    setIsLeadModalOpen(false);
  };

  const handleOppSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createOpportunity({
      ...oppForm,
      expectedAmount: Number(oppForm.expectedAmount),
      probability: Number(oppForm.probability),
      expectedCloseDate: new Date(oppForm.expectedCloseDate).toISOString(),
    });
    setOppForm(emptyOppForm);
    setIsOppModalOpen(false);
  };

  const handleConvert = async (lead: Lead) => {
    if (confirm(`تحويل "${lead.leadName}" إلى عميل فعلي؟`)) {
      await convertLead(lead.id);
    }
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center text-secondary-500">
        الرجاء اختيار شركة أولًا من الأعلى لعرض إدارة العملاء المحتملين
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المبيعات (CRM)</h1>
      </div>

      <div className="flex gap-2 border-b border-secondary-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'leads' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`}
          onClick={() => setTab('leads')}
        >
          العملاء المحتملون
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'opportunities' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`}
          onClick={() => setTab('opportunities')}
        >
          الفرص البيعية
        </button>
      </div>

      {tab === 'leads' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsLeadModalOpen(true)}>
              <PlusIcon className="h-5 w-5 ml-1" />
              عميل محتمل جديد
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">الاسم</th>
                  <th className="table-header-cell">الشركة</th>
                  <th className="table-header-cell">الجوال</th>
                  <th className="table-header-cell">الحالة</th>
                  <th className="table-header-cell">إجراءات</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {leadsLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
                {!leadsLoading && leads.length === 0 && (
                  <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد عملاء محتملون بعد</td></tr>
                )}
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="table-cell font-medium">{lead.leadName}</td>
                    <td className="table-cell">{lead.companyName || '-'}</td>
                    <td className="table-cell">{lead.phone || '-'}</td>
                    <td className="table-cell">
                      <select
                        className="input py-1 text-xs"
                        value={lead.status}
                        disabled={lead.status === 'CONVERTED'}
                        onChange={(e) => updateLeadStatus({ id: lead.id, status: e.target.value })}
                      >
                        {Object.entries(leadStatusLabel).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      {lead.status !== 'CONVERTED' && (
                        <button onClick={() => handleConvert(lead)} className="text-success-600 hover:text-success-800" title="تحويل لعميل">
                          <ArrowRightCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsOppModalOpen(true)}>
              <PlusIcon className="h-5 w-5 ml-1" />
              فرصة بيعية جديدة
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">الفرصة</th>
                  <th className="table-header-cell">القيمة المتوقعة</th>
                  <th className="table-header-cell">الاحتمالية</th>
                  <th className="table-header-cell">تاريخ الإغلاق المتوقع</th>
                  <th className="table-header-cell">المرحلة</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {oppLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
                {!oppLoading && opportunities.length === 0 && (
                  <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد فرص بيعية بعد</td></tr>
                )}
                {opportunities.map((opp: Opportunity) => (
                  <tr key={opp.id}>
                    <td className="table-cell font-medium">{opp.opportunityName}</td>
                    <td className="table-cell">{formatCurrency(opp.expectedAmount, selectedCompany.currency)}</td>
                    <td className="table-cell">{opp.probability}%</td>
                    <td className="table-cell">{new Date(opp.expectedCloseDate).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">
                      <select
                        className="input py-1 text-xs"
                        value={opp.stage}
                        onChange={(e) => updateOpportunityStage({ id: opp.id, stage: e.target.value })}
                      >
                        {Object.entries(stageLabel).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} title="عميل محتمل جديد">
        <form onSubmit={handleLeadSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم *</label>
            <input required className="input" value={leadForm.leadName} onChange={(e) => setLeadForm({ ...leadForm, leadName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">اسم الشركة</label>
            <input className="input" value={leadForm.companyName} onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الجوال</label>
              <input className="input" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input type="email" className="input" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">مصدر العميل</label>
            <input className="input" placeholder="مثال: موقع إلكتروني، إحالة، معرض..." value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsLeadModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={leadSaving} className="btn-primary">{leadSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isOppModalOpen} onClose={() => setIsOppModalOpen(false)} title="فرصة بيعية جديدة">
        <form onSubmit={handleOppSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الفرصة *</label>
            <input required className="input" value={oppForm.opportunityName} onChange={(e) => setOppForm({ ...oppForm, opportunityName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">القيمة المتوقعة *</label>
              <input required type="number" min={0} step="0.01" className="input" value={oppForm.expectedAmount} onChange={(e) => setOppForm({ ...oppForm, expectedAmount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الاحتمالية %</label>
              <input type="number" min={0} max={100} className="input" value={oppForm.probability} onChange={(e) => setOppForm({ ...oppForm, probability: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ الإغلاق المتوقع *</label>
            <input required type="date" className="input" value={oppForm.expectedCloseDate} onChange={(e) => setOppForm({ ...oppForm, expectedCloseDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsOppModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={oppSaving} className="btn-primary">{oppSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
