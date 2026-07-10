import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { industryApi } from '../services/api';

export const useIndustry = () => {
  const queryClient = useQueryClient();

  // ─── Industry Catalog ───
  const { data: industries, isLoading: industriesLoading } = useQuery({
    queryKey: ['industries'],
    queryFn: () => industryApi.getIndustries(),
  });

  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: () => industryApi.getEntities(),
  });

  const getIndustry = (id: string) => {
    return useQuery({
      queryKey: ['industry', id],
      queryFn: () => industryApi.getIndustry(id),
      enabled: !!id,
    });
  };

  const getIndustryControls = (industryId: string) => {
    return useQuery({
      queryKey: ['industry-controls', industryId],
      queryFn: () => industryApi.getIndustryControls(industryId),
      enabled: !!industryId,
    });
  };

  // ─── PMO Projects ───
  const { data: pmoProjects, isLoading: pmoProjectsLoading } = useQuery({
    queryKey: ['pmo-projects'],
    queryFn: () => industryApi.getPMOProjects(),
  });

  const getPMOProject = (id: string) => {
    return useQuery({
      queryKey: ['pmo-project', id],
      queryFn: () => industryApi.getPMOProject(id),
      enabled: !!id,
    });
  };

  const createPMOProjectMutation = useMutation({
    mutationFn: (data: any) => industryApi.createPMOProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmo-projects'] });
      toast.success('تم إنشاء المشروع بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في إنشاء المشروع');
    },
  });

  const updatePMOProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => industryApi.updatePMOProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmo-projects'] });
      toast.success('تم تحديث المشروع');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في تحديث المشروع');
    },
  });

  const deletePMOProjectMutation = useMutation({
    mutationFn: (id: string) => industryApi.deletePMOProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmo-projects'] });
      toast.success('تم حذف المشروع');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في حذف المشروع');
    },
  });

  // ─── PMO Sub-modules ───
  const addMilestoneMutation = useMutation({
    mutationFn: (data: any) => industryApi.addMilestone(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pmo-project', variables.projectId] });
      toast.success('تم إضافة المعالم');
    },
  });

  const addRiskMutation = useMutation({
    mutationFn: (data: any) => industryApi.addRisk(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pmo-project', variables.projectId] });
      toast.success('تم إضافة المخاطر');
    },
  });

  const addIssueMutation = useMutation({
    mutationFn: (data: any) => industryApi.addIssue(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pmo-project', variables.projectId] });
      toast.success('تم إضافة المشكلة');
    },
  });

  const addBudgetItemMutation = useMutation({
    mutationFn: (data: any) => industryApi.addBudgetItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pmo-project', variables.projectId] });
      toast.success('تم إضافة بند الميزانية');
    },
  });

  const addStakeholderMutation = useMutation({
    mutationFn: (data: any) => industryApi.addStakeholder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pmo-project', variables.projectId] });
      toast.success('تم إضافة صاحب المصلحة');
    },
  });

  return {
    // Industry Catalog
    industries: industries?.data || [],
    industriesLoading,
    entities: entities?.data || [],
    entitiesLoading,
    getIndustry,
    getIndustryControls,

    // PMO Projects
    pmoProjects: pmoProjects?.data || [],
    pmoProjectsLoading,
    getPMOProject,
    createPMOProject: createPMOProjectMutation.mutate,
    updatePMOProject: updatePMOProjectMutation.mutate,
    deletePMOProject: deletePMOProjectMutation.mutate,
    isCreating: createPMOProjectMutation.isPending,
    isUpdating: updatePMOProjectMutation.isPending,
    isDeleting: deletePMOProjectMutation.isPending,

    // PMO Sub-modules
    addMilestone: addMilestoneMutation.mutate,
    addRisk: addRiskMutation.mutate,
    addIssue: addIssueMutation.mutate,
    addBudgetItem: addBudgetItemMutation.mutate,
    addStakeholder: addStakeholderMutation.mutate,
  };
};
