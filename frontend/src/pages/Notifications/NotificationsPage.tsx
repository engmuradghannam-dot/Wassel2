import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';
import { BellIcon, CheckIcon, TrashIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL': return <EnvelopeOpenIcon className="w-5 h-5 text-warning-500" />;
      case 'SYSTEM': return <BellIcon className="w-5 h-5 text-info-500" />;
      default: return <BellIcon className="w-5 h-5 text-secondary-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-secondary-900">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-danger-100 text-danger-700 rounded-full">
              {unreadCount} {t('notifications.unread')}
            </span>
          )}
        </div>
        <button
          onClick={() => markAllAsRead()}
          className="btn-secondary flex items-center gap-2"
        >
          <CheckIcon className="w-4 h-4" />
          {t('notifications.markAllAsRead')}
        </button>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <h3 className="text-lg font-medium text-secondary-600">{t('notifications.empty')}</h3>
            <p className="text-secondary-400">{t('notifications.emptyDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-secondary-50 transition-colors ${
                  !notification.read ? 'bg-primary-50/50' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!notification.read ? 'text-secondary-900' : 'text-secondary-600'}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-secondary-500 mt-1">{notification.message}</p>
                  <p className="text-xs text-secondary-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={t('notifications.markAsRead')}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title={t('common.delete')}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
