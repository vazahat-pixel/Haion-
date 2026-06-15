export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Welcome back!',
  LOGIN_FAILED: 'Invalid email or password.',
  LOGOUT_SUCCESS: 'You have been logged out.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Generic errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',

  // Empty states
  EMPTY_INVENTORY: {
    title: 'No inventory items',
    description: 'Get started by adding your first product to the catalog.',
    action: 'Add Product',
  },
  EMPTY_BILLING: {
    title: 'No bills yet',
    description: 'Create your first bill to start tracking revenue.',
    action: 'Create Bill',
  },
  EMPTY_COMPLAINTS: {
    title: 'No complaints',
    description: 'All clear! No open complaints at the moment.',
    action: 'New Complaint',
  },
  EMPTY_ORDERS: {
    title: 'No orders',
    description: 'Your orders will appear here once placed.',
    action: null,
  },
  EMPTY_SEARCH: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
    action: 'Clear Filters',
  },
  EMPTY_TEAM: {
    title: 'No team members',
    description: 'Add team members to start collaborating.',
    action: 'Add Member',
  },

  // Mutations
  SAVE_SUCCESS: 'Changes saved successfully.',
  SAVE_FAILED: 'Failed to save changes.',
  DELETE_SUCCESS: 'Deleted successfully.',
  DELETE_FAILED: 'Failed to delete.',
  EXPORT_STARTED: 'Export started. You will be notified when ready.',
  EXPORT_FAILED: 'Export failed. Please try again.',

  // Offline
  OFFLINE_BANNER: "You're offline. Some features may be unavailable.",
};
