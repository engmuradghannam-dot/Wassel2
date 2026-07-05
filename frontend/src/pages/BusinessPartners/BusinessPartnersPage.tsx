import { useState, FormEvent } from 'react';
import {
  UserGroupIcon, CreditCardIcon, MapPinIcon, PlusIcon, TrashIcon,
  IdentificationIcon, CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { useCustomers } from '../../hooks/useCustomers';
import { useSuppliers } from '../../hooks/useSuppliers';
import { usePartnerData } from '../../hooks/usePartnerData';
import { Modal } from '../../components/common/Modal';

type PartyType = 'customerId' | 'supplierId';
type Tab = 'contacts' | 'bank' | 'addresses';

const partnerFunctionTypes = ['SOLD_TO', 'BILL_TO', 'SHIP_TO', 'PAYER', 'ORDERING_ADDRESS', 'INVOICE_FROM', 'REMIT_TO'];

const emptyContact = { firstName: '', lastName: '', designation: '', email: '', phone: '', isPrimary: false };
const emptyBank = { accountName: '', bankName: '', iban: '', swiftCode: '', accountNumber: '', isPrimary: false };
const emptyAddress = { type: 'SHIP_TO', name: '', address: '', city: '', country: 'SA', phone: '', isDefault: false };

export const BusinessPartnersPage = () => {
  const [partyType, setPartyType] = useState<PartyType>('customerId');
  const [partyId, setPartyId] = useState<string>('');
  const [tab, setTab] = useState<Tab>('contacts');
  const [modalOpen, setModalOpen] = useState(false);

  const { customers } = useCustomers();
  const { suppliers } = useSuppliers();
  const parties = partyType === 'customerId' ? customers : suppliers;

  const {
    contacts, bankDetails, partnerFunctions, isLoading,
    createContact, deleteContact,
    createBankDetail, deleteBankDetail,
    createPartnerFunction, deletePartnerFunction,
  } = usePartnerData(partyType, partyId || undefined);

  const [contactForm, setContactForm] = useState(emptyContact);
  const [bankForm, setBankForm] = useState(emptyBank);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const handleAddContact = async (e: FormEvent) => {
    e.preventDefault();
    await createContact(contactForm);
    setContactForm(emptyContact);
    setModalOpen(false);
  };

  const handleAddBank = async (e: FormEvent) => {
    e.preventDefault();
    await createBankDetail(bankForm);
    setBankForm(emptyBank);
    setModalOpen(false);
  };

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault();
    await createPartnerFunction(addressForm);
    setAddressForm(emptyAddress);
    setModalOpen(false);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'contacts', label: 'Contact Persons', icon: UserGroupIcon },
    { key: 'bank', label: 'Bank Details', icon: CreditCardIcon },
    { key: 'addresses', label: 'Partner Functions', icon: MapPinIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Business Partners</h1>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Party Type</label>
            <select
              value={partyType}
              onChange={(e) => { setPartyType(e.target.value as PartyType); setPartyId(''); }}
              className="form-input"
            >
              <option value="customerId">Customer</option>
              <option value="supplierId">Supplier</option>
            </select>
          </div>
          <div>
            <label className="form-label">{partyType === 'customerId' ? 'Customer' : 'Supplier'}</label>
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="form-input">
              <option value="">Select...</option>
              {parties.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!partyId ? (
        <div className="card text-center py-12">
          <IdentificationIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">Select a customer or supplier to manage their details</h2>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center gap-2 border-b border-secondary-200 mb-4">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="flex justify-end mb-4">
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Add
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              {tab === 'contacts' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Designation</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Phone</th>
                        <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {contacts.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-secondary-500">No contacts yet</td></tr>
                      )}
                      {contacts.map((c: any) => (
                        <tr key={c.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 text-sm font-medium">
                            {c.firstName} {c.lastName} {c.isPrimary && <CheckBadgeIcon className="inline w-4 h-4 text-success-600 ms-1" />}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{c.designation}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{c.email}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{c.phone}</td>
                          <td className="px-4 py-3 text-end">
                            <button onClick={() => deleteContact(c.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'bank' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Account Name</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Bank</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">IBAN</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">SWIFT</th>
                        <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {bankDetails.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-secondary-500">No bank details yet</td></tr>
                      )}
                      {bankDetails.map((b: any) => (
                        <tr key={b.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 text-sm font-medium">
                            {b.accountName} {b.isPrimary && <CheckBadgeIcon className="inline w-4 h-4 text-success-600 ms-1" />}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{b.bankName}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600 font-mono">{b.iban}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600 font-mono">{b.swiftCode}</td>
                          <td className="px-4 py-3 text-end">
                            <button onClick={() => deleteBankDetail(b.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'addresses' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">City</th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Phone</th>
                        <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {partnerFunctions.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-secondary-500">No addresses yet</td></tr>
                      )}
                      {partnerFunctions.map((p: any) => (
                        <tr key={p.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">{p.type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {p.name} {p.isDefault && <CheckBadgeIcon className="inline w-4 h-4 text-success-600 ms-1" />}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{p.city}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{p.phone}</td>
                          <td className="px-4 py-3 text-end">
                            <button onClick={() => deletePartnerFunction(p.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={
        tab === 'contacts' ? 'Add Contact Person' : tab === 'bank' ? 'Add Bank Detail' : 'Add Partner Address'
      }>
        {tab === 'contacts' && (
          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name</label>
                <input className="form-input" required value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input className="form-input" required value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input className="form-input" value={contactForm.designation} onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={contactForm.isPrimary} onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })} />
              Primary contact
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}

        {tab === 'bank' && (
          <form onSubmit={handleAddBank} className="space-y-4">
            <div>
              <label className="form-label">Account Name</label>
              <input className="form-input" required value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Bank Name</label>
              <input className="form-input" required value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">IBAN</label>
                <input className="form-input font-mono" placeholder="SA0380000000608010167519" value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="form-label">SWIFT / BIC</label>
                <input className="form-input font-mono" placeholder="RJHISARI" value={bankForm.swiftCode} onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div>
              <label className="form-label">Account Number</label>
              <input className="form-input" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bankForm.isPrimary} onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })} />
              Primary account
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}

        {tab === 'addresses' && (
          <form onSubmit={handleAddAddress} className="space-y-4">
            <div>
              <label className="form-label">Function Type</label>
              <select className="form-input" value={addressForm.type} onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}>
                {partnerFunctionTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Name</label>
              <input className="form-input" required value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={2} value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">City</label>
                <input className="form-input" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
              Set as default for this type
            </label>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
