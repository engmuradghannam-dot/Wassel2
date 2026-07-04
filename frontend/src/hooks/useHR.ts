import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { attendanceApi, leaveApi, payrollApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useAttendance = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', companyId],
    queryFn: () => attendanceApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => attendanceApi.create(payload),
    onSuccess: () => { toast.success('تم تسجيل الحضور'); queryClient.invalidateQueries({ queryKey: ['attendance', companyId] }); },
    onError: (error) => toast.error(extractError(error, 'تعذر التسجيل')),
  });

  return { records: (data?.data as any[]) || [], isLoading, createAttendance: createMutation.mutateAsync, isSaving: createMutation.isPending };
};

export const useLeaves = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', companyId],
    queryFn: () => leaveApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leaves', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => leaveApi.create(payload),
    onSuccess: () => { toast.success('تم تقديم طلب الإجازة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر التقديم')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leaveApi.updateStatus(id, status),
    onSuccess: () => { toast.success('تم تحديث حالة الإجازة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  return {
    leaves: (data?.data as any[]) || [], isLoading,
    createLeave: createMutation.mutateAsync, updateLeaveStatus: updateStatusMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};

export const usePayrolls = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['payrolls', companyId],
    queryFn: () => payrollApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payrolls', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => payrollApi.create(payload),
    onSuccess: () => { toast.success('تم إنشاء كشف الراتب'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإنشاء')),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => payrollApi.markPaid(id),
    onSuccess: () => { toast.success('تم تسجيل الصرف'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  return {
    payrolls: (data?.data as any[]) || [], isLoading,
    createPayroll: createMutation.mutateAsync, markPaid: markPaidMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
