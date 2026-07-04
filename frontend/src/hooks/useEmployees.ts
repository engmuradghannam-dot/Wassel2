import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { employeeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Employee } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useEmployees = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => employeeApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employees', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Employee>) => employeeApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إضافة الموظف'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة الموظف')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Employee> }) => employeeApi.update(id, payload),
    onSuccess: () => { toast.success('تم تحديث بيانات الموظف'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => { toast.success('تم حذف الموظف'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الحذف')),
  });

  return {
    employees: (data?.data as Employee[]) || [],
    isLoading,
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    deleteEmployee: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
