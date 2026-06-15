import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message, options = {}) =>
    sonnerToast.success(message, { duration: 3000, ...options }),

  error: (message, options = {}) =>
    sonnerToast.error(message, { duration: 6000, ...options }),

  warning: (message, options = {}) =>
    sonnerToast.warning(message, { duration: 5000, ...options }),

  info: (message, options = {}) =>
    sonnerToast.info(message, { duration: 3000, ...options }),

  loading: (message, options = {}) =>
    sonnerToast.loading(message, { ...options }),

  dismiss: (id) => sonnerToast.dismiss(id),

  promise: (promise, messages) => sonnerToast.promise(promise, messages),
};
