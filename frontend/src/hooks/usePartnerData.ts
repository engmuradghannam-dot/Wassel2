// Combined hook for Contact Persons, Bank Details, and Partner Functions
// attached to a Customer or Supplier record.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { contactApi, bankDetailApi, partnerFunctionApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const usePartnerData = (partyType: 'customerId' | 'supplierId', partyId?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;
  const params = partyId ? { [partyType]: partyId } : undefined;

  const contacts = useQuery({
    queryKey: ['contacts', companyId, partyId],
    queryFn: () => contactApi.getAll(params),
    enabled: !!companyId && !!partyId,
  });

  const bankDetails = useQuery({
    queryKey: ['bankDetails', companyId, partyId],
    queryFn: () => bankDetailApi.getAll(params),
    enabled: !!companyId && !!partyId,
  });

  const partnerFunctions = useQuery({
    queryKey: ['partnerFunctions', companyId, partyId],
    queryFn: () => partnerFunctionApi.getAll(params),
    enabled: !!companyId && !!partyId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts', companyId, partyId] });
    queryClient.invalidateQueries({ queryKey: ['bankDetails', companyId, partyId] });
    queryClient.invalidateQueries({ queryKey: ['partnerFunctions', companyId, partyId] });
  };

  const createContact = useMutation({
    mutationFn: (payload: any) => contactApi.create({ ...payload, [partyType]: partyId }),
    onSuccess: () => { toast.success('Contact added'); invalidateAll(); },
    onError: (e) => toast.error(extractError(e, 'Failed to add contact')),
  });
  const deleteContact = useMutation({
    mutationFn: (id: string) => contactApi.delete(id),
    onSuccess: () => { toast.success('Contact removed'); invalidateAll(); },
    onError: (e) => toast.error(extractError(e, 'Failed to remove contact')),
  });

  const createBankDetail = useMutation({
    mutationFn: (payload: any) => bankDetailApi.create({ ...payload, [partyType]: partyId }),
    onSuccess: () => { toast.success('Bank detail added'); invalidateAll(); },
    onError: (e) => toast.error(extractError(e, 'Failed to add bank detail')),
  });
  const deleteBankDetail = useMutation({
    mutationFn: (id: string) => bankDetailApi.delete(id),
    onSuccess: () => { toast.success('Bank detail removed'); invalidateAll(); },
    onError: (e) => toast.error(extractError(e, 'Failed to remove bank detail')),
  });

  const createPartnerFunction = useMutation({
    mutationFn: (payload: any) => partnerFunctionApi.create({ ...payload, [partyType]: partyId }),
    onSuccess: () => { toast.success('Address added'); invalidateAll(); },
    onError: (e) => toast.error(extractError(e, 'Failed to add address')),
  });
  const deletePartnerFunction = useMutation({
    mutationFn: (id: string) => partnerFunctionApi.delete(id),
    onSuccess: () => { toast.success('Address removed'); invalidateAll(); },
    onError: (e) => toast.error(extractError(e, 'Failed to remove address')),
  });

  return {
    contacts: contacts.data?.data || [],
    bankDetails: bankDetails.data?.data || [],
    partnerFunctions: partnerFunctions.data?.data || [],
    isLoading: contacts.isLoading || bankDetails.isLoading || partnerFunctions.isLoading,
    createContact: createContact.mutateAsync,
    deleteContact: deleteContact.mutateAsync,
    createBankDetail: createBankDetail.mutateAsync,
    deleteBankDetail: deleteBankDetail.mutateAsync,
    createPartnerFunction: createPartnerFunction.mutateAsync,
    deletePartnerFunction: deletePartnerFunction.mutateAsync,
  };
};
