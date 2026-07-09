import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import {
  PaperAirplaneIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const ChatPage = () => {
  const { user } = useAuth();
  const { chats, chatsLoading, createChat, sendMessage, deleteChat, getMessages, isCreating, isSending } = useChat();
  const { users } = useUsers();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesData, isLoading: messagesLoading } = getMessages(selectedChatId || '');
  const messages = messagesData?.data || [];

  const selectedChat = chats.find((c: any) => c.id === selectedChatId);
  const otherParticipant = selectedChat?.participants?.find(
    (p: any) => p.userId !== user?.id
  )?.user;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;
    sendMessage({ chatId: selectedChatId, content: newMessage.trim() });
    setNewMessage('');
  };

  const handleCreateChat = (participantId: string) => {
    createChat(participantId, {
      onSuccess: (response: any) => {
        if (response?.data?.id) {
          setSelectedChatId(response.data.id);
          setShowNewChat(false);
        }
      },
    });
  };

  const filteredUsers = (users || []).filter((u: any) => 
    u.id !== user?.id && 
    (u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getLastMessage = (chat: any) => {
    return chat.messages?.[0];
  };

  const getUnreadCount = (chat: any) => {
    return chat.messages?.filter((m: any) => m.senderId !== user?.id && !m.isRead).length || 0;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4" dir="rtl">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white rounded-2xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-secondary-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">المحادثات</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-primary text-sm px-3 py-1.5"
            >
              + محادثة جديدة
            </button>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-9 text-sm"
            />
          </div>
        </div>

        {chatsLoading ? (
          <div className="flex-1 flex items-center justify-center text-secondary-500">
            جاري التحميل...
          </div>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-500 p-4">
            <ChatBubbleLeftIcon className="h-12 w-12 mb-2 text-secondary-300" />
            <p>لا توجد محادثات</p>
            <button onClick={() => setShowNewChat(true)} className="text-primary-600 mt-2 text-sm">
              ابدأ محادثة جديدة
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((chat: any) => {
              const other = chat.participants?.find((p: any) => p.userId !== user?.id)?.user;
              const lastMsg = getLastMessage(chat);
              const unread = getUnreadCount(chat);

              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center gap-3 ${
                    selectedChatId === chat.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-secondary-50 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {other?.avatar ? (
                      <img src={other.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-primary-600 font-bold text-sm">
                        {other?.firstName?.[0] || other?.email?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {other?.firstName} {other?.lastName}
                      </p>
                      {lastMsg && (
                        <span className="text-xs text-secondary-400">
                          {new Date(lastMsg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-secondary-900' : 'text-secondary-500'}`}>
                        {lastMsg ? (
                          <>
                            {lastMsg.senderId === user?.id ? 'أنت: ' : ''}
                            {lastMsg.content}
                          </>
                        ) : (
                          'لا توجد رسائل'
                        )}
                      </p>
                      {unread > 0 && (
                        <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm flex flex-col">
        {selectedChat && otherParticipant ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  {otherParticipant?.avatar ? (
                    <img src={otherParticipant.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-primary-600 font-bold">
                      {otherParticipant?.firstName?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold">
                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                  </p>
                  <p className="text-xs text-secondary-500">{otherParticipant?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('متأكد تبي تحذف المحادثة؟')) {
                    deleteChat(selectedChatId!);
                    setSelectedChatId(null);
                  }
                }}
                className="text-danger-500 hover:text-danger-700 p-2"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="text-center text-secondary-500">جاري تحميل الرسائل...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-secondary-500 mt-8">
                  <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-2 text-secondary-300" />
                  <p>ابدأ المحادثة الآن</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMine
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-secondary-100 text-secondary-900 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-start' : 'justify-end'}`}>
                          <span className={`text-xs ${isMine ? 'text-primary-200' : 'text-secondary-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && msg.isRead && (
                            <CheckIcon className="h-3 w-3 text-primary-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-secondary-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  className="input flex-1"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="btn-primary px-4 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-500">
            <ChatBubbleLeftIcon className="h-16 w-16 mb-4 text-secondary-300" />
            <p className="text-lg">اختر محادثة لبدء التواصل</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">محادثة جديدة</h2>
              <button onClick={() => setShowNewChat(false)} className="text-secondary-500 hover:text-secondary-700">
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  placeholder="ابحث عن مستخدم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pr-9"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-secondary-500 py-4">لا يوجد مستخدمين</p>
                ) : (
                  filteredUsers.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => handleCreateChat(u.id)}
                      disabled={isCreating}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 transition-colors text-right"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-primary-600 font-bold text-sm">
                            {u.firstName?.[0] || u.email?.[0] || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-secondary-500">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
