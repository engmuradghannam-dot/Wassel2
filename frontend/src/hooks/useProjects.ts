import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectApi, taskApi, timesheetApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useProjects = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => projectApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => projectApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء المشروع'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإنشاء')),
  });

  return { projects: (data?.data as any[]) || [], isLoading, createProject: createMutation.mutateAsync, isSaving: createMutation.isPending };
};

export const useTasks = (projectId?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', companyId, projectId],
    queryFn: () => taskApi.getAll({ companyId, projectId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => taskApi.create(payload),
    onSuccess: () => { toast.success('تمت إضافة المهمة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإنشاء')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => taskApi.updateStatus(id, status),
    onSuccess: () => { toast.success('تم تحديث المهمة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  return {
    tasks: (data?.data as any[]) || [], isLoading,
    createTask: createMutation.mutateAsync, updateTaskStatus: updateStatusMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};

export const useTimesheets = (projectId?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['timesheets', companyId, projectId],
    queryFn: () => timesheetApi.getAll({ companyId, projectId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => timesheetApi.create(payload),
    onSuccess: () => { toast.success('تم تسجيل الوقت'); queryClient.invalidateQueries({ queryKey: ['timesheets', companyId] }); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإنشاء')),
  });

  return { timesheets: (data?.data as any[]) || [], isLoading, createTimesheet: createMutation.mutateAsync, isSaving: createMutation.isPending };
};
