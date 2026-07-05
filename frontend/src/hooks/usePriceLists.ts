import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { priceListApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const usePriceLists = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['priceLists', companyId],
    queryFn: () => priceListApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['priceLists', companyId] });

  const createPriceList = useMutation({
    mutationFn: (payload: any) => priceListApi.create(payload),
    onSuccess: () => { toast.success('Price list created'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to create price list')),
  });

  const addItem = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => priceListApi.addItem(id, payload),
    onSuccess: () => { toast.success('Item price added'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to add item price')),
  });

  const deletePriceList = useMutation({
    mutationFn: (id: string) => priceListApi.delete(id),
    onSuccess: () => { toast.success('Price list deleted'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to delete price list')),
  });

  return {
    priceLists: data?.data || [],
    isLoading,
    createPriceList: createPriceList.mutateAsync,
    addItem: addItem.mutateAsync,
    deletePriceList: deletePriceList.mutateAsync,
  };
};

export const usePriceListDetail = (id?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['priceList', id],
    queryFn: () => priceListApi.getById(id!),
    enabled: !!id,
  });
  return { priceList: data?.data, isLoading };
};
