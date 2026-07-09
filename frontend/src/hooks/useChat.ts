import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { chatApi } from '../services/api';

export const useChat = () => {
  const queryClient = useQueryClient();

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getAll(),
  });

  const createChatMutation = useMutation({
    mutationFn: (participantId: string) => chatApi.create(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في إنشاء المحادثة');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      chatApi.sendMessage(chatId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في إرسال الرسالة');
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => chatApi.delete(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('تم حذف المحادثة');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في حذف المحادثة');
    },
  });

  const getMessages = (chatId: string) => {
    return useQuery({
      queryKey: ['messages', chatId],
      queryFn: () => chatApi.getMessages(chatId),
      enabled: !!chatId,
      refetchInterval: 3000, // Poll every 3 seconds for real-time feel
    });
  };

  return {
    chats: chats?.data || [],
    chatsLoading,
    createChat: createChatMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    deleteChat: deleteChatMutation.mutate,
    getMessages,
    isCreating: createChatMutation.isPending,
    isSending: sendMessageMutation.isPending,
  };
};
