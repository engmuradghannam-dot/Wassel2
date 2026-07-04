// MuradERP CRM Page (Leads + Opportunities)
import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { useLeads, useOpportunities } from '../../hooks/useCRM';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Lead, Opportunity } from '../../types';
import { formatCurrency } from '../../utils/currency';

const emptyLeadForm = { leadName: '', companyName: '', email: '', phone: '', source: '' };
const emptyOppForm = { opportunityName: '', expectedAmount: 0, probability: 20, expectedCloseDate: '' };

export const CRMPage = () => {
  const { t, i18n } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'opportunities' ? 'opportunities' : 'leads';
  const [tab, setTabState] = useState<'leads' | 'opportunities'>(initialTab);
  const setTab = (t: 'leads' | 'opportunities') => {
    setTabState(t);
    setSearchParams({ tab: t });
  };

  const { leads, isLoading: leadsLoading, createLead, updateLeadStatus, convertLead, isSaving: leadSaving } = useLeads();
  const { opportunities, isLoading: oppLoading, createOpportunity, updateOpportunityStage, isSaving: oppSaving } = useOpportunities();

  const leadStatusLabel: Record<string, string> = {
    NEW: t('crm.statusNew'), CONTACTED: t('crm.statusContacted'), QUALIFIED: t('crm.statusQualified'),
    PROPOSAL: t('crm.statusProposal'), CONVERTED: t('crm.statusConverted'), LOST: t('crm.statusLost'),
  };

  const stageLabel: Record<string, string> = {
    PROSPECTING: t('crm.stageProspecting'), QUALIFICATION: t('crm.stageQualification'),
    NEEDS_ANALYSIS: t('crm.stageNeedsAnalysis'), VALUE_PROPOSITION: t('crm.stageValueProposition'),
    ID_DECISION_MAKERS: t('crm.stageIdDecisionMakers'), PERCEPTION_ANALYSIS: t('crm.stagePerceptionAnalysis'),
    PROPOSAL: t('crm.stageProposal'), NEGOTIATION: t('crm.stageNegotiation'),
    CLOSED_WON: t('crm.stageClosedWon'), CLOSED_LOST: t('crm.stageClosedLost'),
  };

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
    if (confirm(t('crm.convertConfirm', { name: lead.leadName }))) {
      await convertLead(lead.id);
    }
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center text-secondary-500">
        {t('common.selectCompany')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('crm.title')}</h1>
      </div>

      <div className="flex gap-2 border-b border-secondary-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'leads' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`}
          onClick={() => setTab('leads')}
        >
          {t('crm.tabLeads')}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'opportunities' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`}
          onClick={() => setTab('opportunities')}
        >
          {t('crm.tabOpportunities')}
        </button>
      </div>

      {tab === 'leads' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsLeadModalOpen(true)}>
              <PlusIcon className="h-5 w-5 ml-1" />
              {t('crm.newLead')}
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">{t('crm.colName')}</th>
                  <th className="table-header-cell">{t('crm.colCompany')}</th>
                  <th className="table-header-cell">{t('crm.colPhone')}</th>
                  <th className="table-header-cell">{t('crm.colStatus')}</th>
                  <th className="table-header-cell">{t('crm.colActions')}</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {leadsLoading && <tr><td className="table-cell" colSpan={5}>{t('common.loading')}</td></tr>}
                {!leadsLoading && leads.length === 0 && (
                  <tr><td className="table-cell text-secondary-500" colSpan={5}>{t('crm.noLeads')}</td></tr>
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
                        <button onClick={() => handleConvert(lead)} className="text-success-600 hover:text-success-800" title={t('crm.convertAction')}>
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
              {t('crm.newOpportunity')}
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">{t('crm.colOpportunity')}</th>
                  <th className="table-header-cell">{t('crm.colExpectedAmount')}</th>
                  <th className="table-header-cell">{t('crm.colProbability')}</th>
                  <th className="table-header-cell">{t('crm.colExpectedClose')}</th>
                  <th className="table-header-cell">{t('crm.colStage')}</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {oppLoading && <tr><td className="table-cell" colSpan={5}>{t('common.loading')}</td></tr>}
                {!oppLoading && opportunities.length === 0 && (
                  <tr><td className="table-cell text-secondary-500" colSpan={5}>{t('crm.noOpportunities')}</td></tr>
                )}
                {opportunities.map((opp: Opportunity) => (
                  <tr key={opp.id}>
                    <td className="table-cell font-medium">{opp.opportunityName}</td>
                    <td className="table-cell">{formatCurrency(opp.expectedAmount, selectedCompany.currency)}</td>
                    <td className="table-cell">{opp.probability}%</td>
                    <td className="table-cell">{new Date(opp.expectedCloseDate).toLocaleDateString(i18n.language)}</td>
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

      <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} title={t('crm.newLead')}>
        <form onSubmit={handleLeadSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('crm.fieldLeadName')} *</label>
            <input required className="input" value={leadForm.leadName} onChange={(e) => setLeadForm({ ...leadForm, leadName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('crm.fieldCompanyName')}</label>
            <input className="input" value={leadForm.companyName} onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('crm.fieldPhone')}</label>
              <input className="input" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('crm.fieldEmail')}</label>
              <input type="email" className="input" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('crm.fieldSource')}</label>
            <input className="input" placeholder={t('crm.sourcePlaceholder')} value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsLeadModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" disabled={leadSaving} className="btn-primary">{leadSaving ? t('common.saving') : t('common.save')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isOppModalOpen} onClose={() => setIsOppModalOpen(false)} title={t('crm.newOpportunity')}>
        <form onSubmit={handleOppSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('crm.fieldOppName')} *</label>
            <input required className="input" value={oppForm.opportunityName} onChange={(e) => setOppForm({ ...oppForm, opportunityName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('crm.fieldExpectedAmount')} *</label>
              <input required type="number" min={0} step="0.01" className="input" value={oppForm.expectedAmount} onChange={(e) => setOppForm({ ...oppForm, expectedAmount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('crm.fieldProbability')}</label>
              <input type="number" min={0} max={100} className="input" value={oppForm.probability} onChange={(e) => setOppForm({ ...oppForm, probability: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('crm.fieldExpectedCloseDate')} *</label>
            <input required type="date" className="input" value={oppForm.expectedCloseDate} onChange={(e) => setOppForm({ ...oppForm, expectedCloseDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsOppModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" disabled={oppSaving} className="btn-primary">{oppSaving ? t('common.saving') : t('common.save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
