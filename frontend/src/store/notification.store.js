import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },

  add: (notification) => {
    const notifications = [notification, ...get().notifications];
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  },

  markRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  },

  markAllRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications, unreadCount: 0 });
  },

  dismiss: (id) => {
    const notifications = get().notifications.filter((n) => n.id !== id);
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  },

  toggleOpen: () => set({ isOpen: !get().isOpen }),

  setOpen: (isOpen) => set({ isOpen }),

  syncFromServer: (data) => {
    set({
      notifications: data.notifications || [],
      unreadCount: data.unreadCount ?? 0,
    });
  },
}));
