# OUTPUT 3 — STORE MAP

> All Zustand stores: name, responsibility, state shape, actions, persistence strategy.

## Store Architecture Principles

1. **Single responsibility** per store
2. **No cross-store imports** — coordination via hooks (`useAuth`, `usePermission`, etc.)
3. **Immer middleware** for nested state mutations
4. **Actions co-located** with state in the same store object
5. **Selectors** exported for derived state to prevent unnecessary re-renders

---

## Store 1: `auth.store.js`

**Responsibility:** User identity, access token (in-memory), panel assignment, auth lifecycle.

### State Shape

```javascript
{
  user: null | {
    id: string,
    name: string,
    email: string,
    avatar: string | null,
    role: string,           // from ROLES constant
    permissions: string[],  // raw from API
    dealerId: string | null,
    warehouseId: string | null,
  },
  accessToken: string | null,   // IN-MEMORY ONLY — never localStorage
  panel: 'admin' | 'dealer' | 'employee' | 'service' | 'customer' | null,
  isAuthenticated: boolean,
  isInitializing: boolean,      // true until first /auth/refresh completes
  loginError: string | null,
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `login` | `(credentials: { email, password }) => Promise<void>` | POST `/auth/login`, set token + user, compute panel |
| `logout` | `() => Promise<void>` | POST `/auth/logout`, clear all auth state |
| `refreshToken` | `() => Promise<boolean>` | POST `/auth/refresh` (cookie-based), restore session |
| `setUser` | `(user) => void` | Update user object (e.g., avatar change) |
| `setAccessToken` | `(token) => void` | Set in-memory token (used by interceptor) |
| `clearAuth` | `() => void` | Reset to initial unauthenticated state |
| `setInitializing` | `(bool) => void` | Control boot-time loading state |

### Persistence

| Field | Strategy |
|-------|----------|
| `accessToken` | Memory only (JS variable) |
| `user` | Restored via `/auth/refresh` on boot |
| `panel` | Computed from `user.role` on login/refresh |
| Refresh token | `httpOnly` cookie (backend-managed) |

### Selectors

```javascript
export const selectUser = (state) => state.user;
export const selectRole = (state) => state.user?.role;
export const selectIsAuthenticated = (state) => state.isAuthenticated;
export const selectIsInitializing = (state) => state.isInitializing;
export const selectAccessToken = (state) => state.accessToken;
export const selectPanel = (state) => state.panel;
```

---

## Store 2: `session.store.js`

**Responsibility:** Session metadata, idle detection, tab visibility, last path preservation.

### State Shape

```javascript
{
  lastActivity: number | null,       // timestamp
  isIdle: boolean,
  isTabVisible: boolean,
  lastPath: string | null,           // saved before session expiry redirect
  savedEmail: string | null,         // pre-fill on session-expired re-login
  sessionStartTime: number | null,
  idleTimeoutMs: 1800000,            // 30 minutes default
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `recordActivity` | `() => void` | Update `lastActivity` timestamp |
| `setIdle` | `(bool) => void` | Mark session as idle |
| `setTabVisible` | `(bool) => void` | Track document visibility |
| `saveLastPath` | `(path: string) => void` | Save current path before redirect |
| `saveEmail` | `(email: string) => void` | Save email for re-login pre-fill |
| `clearSessionMeta` | `() => void` | Reset on logout |
| `getIdleDuration` | `() => number` | Ms since last activity |

### Persistence

| Field | Strategy |
|-------|----------|
| `lastPath` | `sessionStorage` (survives refresh, cleared on tab close) |
| `savedEmail` | `sessionStorage` |
| All other fields | Memory only |

---

## Store 3: `permission.store.js`

**Responsibility:** Flattened permission set for O(1) permission checks.

### State Shape

```javascript
{
  permissions: Set<string>,   // e.g. Set(['billing.create', 'inventory.read'])
  role: string | null,
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setPermissions` | `(permissions: string[], role: string) => void` | Populate from auth on login |
| `clearPermissions` | `() => void` | Reset on logout |
| `hasPermission` | `(key: string) => boolean` | Single permission check |
| `hasAnyPermission` | `(keys: string[]) => boolean` | OR check |
| `hasAllPermissions` | `(keys: string[]) => boolean` | AND check |

### Persistence

Memory only. Rebuilt from `auth.store.user.permissions` on every login/refresh.

### Initialization Hook

```javascript
// hooks/usePermission.js — syncs auth → permission store
useEffect(() => {
  if (user?.permissions) {
    setPermissions(user.permissions, user.role);
  } else {
    clearPermissions();
  }
}, [user]);
```

---

## Store 4: `sidebar.store.js`

**Responsibility:** Sidebar collapse, mobile drawer, active item, pinned nav items.

### State Shape

```javascript
{
  isCollapsed: boolean,          // desktop collapsed (64px)
  isMobileOpen: boolean,         // mobile drawer open
  activeItem: string | null,     // current nav item id
  pinnedItems: string[],         // pinned nav item ids
  hoverItem: string | null,      // for tooltip on collapsed
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `toggleCollapse` | `() => void` | Toggle desktop collapse |
| `setCollapsed` | `(bool) => void` | Explicit collapse state |
| `toggleMobile` | `() => void` | Toggle mobile drawer |
| `setMobileOpen` | `(bool) => void` | Explicit mobile state |
| `setActiveItem` | `(itemId: string) => void` | Set active nav item |
| `pin` | `(itemId: string) => void` | Add to pinned items |
| `unpin` | `(itemId: string) => void` | Remove from pinned |
| `setHoverItem` | `(itemId: string | null) => void` | Collapsed hover state |

### Persistence

| Field | Strategy |
|-------|----------|
| `isCollapsed` | `localStorage` key: `erp:sidebar:collapsed` |
| `pinnedItems` | `localStorage` key: `erp:sidebar:pinned` |
| `isMobileOpen`, `activeItem`, `hoverItem` | Memory only |

---

## Store 5: `modal.store.js`

**Responsibility:** Global modal/dialog stack manager.

### State Shape

```javascript
{
  stack: Array<{
    id: string,
    component: React.ComponentType,
    props: object,
    options: {
      closable: boolean,
      size: 'sm' | 'md' | 'lg' | 'xl' | 'full',
      onClose: function | null,
    }
  }>,
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `open` | `(component, props?, options?) => string` | Push modal, returns id |
| `close` | `(id: string) => void` | Remove specific modal |
| `closeTop` | `() => void` | Pop top modal |
| `closeAll` | `() => void` | Clear entire stack |
| `updateProps` | `(id, props) => void` | Update modal props in-place |

### Persistence

Memory only. Modals never survive navigation.

---

## Store 6: `notification.store.js`

**Responsibility:** In-app notification center state.

### State Shape

```javascript
{
  notifications: Array<{
    id: string,
    type: 'info' | 'success' | 'warning' | 'danger',
    title: string,
    description: string,
    read: boolean,
    priority: 'normal' | 'high',
    link: string | null,        // navigation target on click
    createdAt: string,          // ISO timestamp
    module: string,             // source module
  }>,
  unreadCount: number,
  isOpen: boolean,              // notification panel open state
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setNotifications` | `(notifications[]) => void` | Bulk set from API |
| `add` | `(notification) => void` | Add single (real-time/push) |
| `markRead` | `(id: string) => void` | Mark single as read |
| `markAllRead` | `() => void` | Mark all as read |
| `dismiss` | `(id: string) => void` | Remove from list |
| `toggleOpen` | `() => void` | Toggle panel |
| `setOpen` | `(bool) => void` | Explicit panel state |
| `syncFromServer` | `(data) => void` | Merge server state |

### Persistence

Memory only. Server is source of truth. `unreadCount` synced via TanStack Query.

---

## Store 7: `theme.store.js`

**Responsibility:** Light/dark/system theme preference.

### State Shape

```javascript
{
  theme: 'light' | 'dark' | 'system',
  resolvedTheme: 'light' | 'dark',   // computed from system preference
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setTheme` | `(theme) => void` | Set preference, apply to DOM |
| `toggleTheme` | `() => void` | Toggle light ↔ dark |
| `resolveSystemTheme` | `() => void` | Read `prefers-color-scheme` |

### Persistence

| Field | Strategy |
|-------|----------|
| `theme` | `localStorage` key: `erp:theme` |

### DOM Application

```javascript
// On setTheme:
document.documentElement.setAttribute('data-theme', resolvedTheme);
```

---

## Store 8: `commandPalette.store.js`

**Responsibility:** Command palette open state, search query, recent commands.

### State Shape

```javascript
{
  isOpen: boolean,
  query: string,
  recentCommands: Array<{
    id: string,
    label: string,
    action: string,     // route path or action key
    timestamp: number,
  }>,
  activeIndex: number,  // keyboard navigation index
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `open` | `() => void` | Open palette |
| `close` | `() => void` | Close and reset query |
| `toggle` | `() => void` | Toggle open state |
| `setQuery` | `(query: string) => void` | Update search query |
| `setActiveIndex` | `(index: number) => void` | Keyboard nav |
| `addRecent` | `(command) => void` | Add to recent (max 10) |
| `clearRecent` | `() => void` | Clear history |

### Persistence

| Field | Strategy |
|-------|----------|
| `recentCommands` | `localStorage` key: `erp:command-palette:recent` (max 10) |
| `isOpen`, `query`, `activeIndex` | Memory only |

---

## Store 9: `filters.store.js`

**Responsibility:** Active filter state per module, synced with URL query params.

### State Shape

```javascript
{
  filters: {
    inventory: {
      status: string | null,
      category: string | null,
      warehouseId: string | null,
      dateRange: { from: string, to: string } | null,
      search: string,
      page: number,
      perPage: number,
      sort: string,
      order: 'asc' | 'desc',
    },
    billing: { /* same pattern */ },
    complaints: { /* same pattern */ },
    dispatch: { /* same pattern */ },
    dealers: { /* same pattern */ },
    employees: { /* same pattern */ },
    grn: { /* same pattern */ },
    warranty: { /* same pattern */ },
    spares: { /* same pattern */ },
    returns: { /* same pattern */ },
    audit: { /* same pattern */ },
  },
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setFilter` | `(module, key, value) => void` | Set single filter + sync URL |
| `setFilters` | `(module, filtersObj) => void` | Bulk set + sync URL |
| `clearFilters` | `(module) => void` | Reset module filters |
| `clearFilter` | `(module, key) => void` | Reset single filter |
| `syncFromURL` | `(module, searchParams) => void` | Hydrate from URL on mount |
| `toSearchParams` | `(module) => URLSearchParams` | Serialize for API/URL |

### Persistence

URL query params (not localStorage). Filters survive refresh and are shareable via URL.

### URL Sync Pattern

```
/admin/inventory?status=active&category=electronics&page=2&sort=updatedAt&order=desc
```

---

## Store 10: `draft.store.js`

**Responsibility:** Auto-saved form drafts with TTL.

### State Shape

```javascript
{
  drafts: {
    [formId: string]: {
      data: object,
      savedAt: number,      // timestamp
      expiresAt: number,    // savedAt + 24h
    }
  },
}
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `saveDraft` | `(formId, data) => void` | Save with 24h TTL |
| `loadDraft` | `(formId) => object | null` | Load if not expired |
| `clearDraft` | `(formId) => void` | Remove specific draft |
| `clearExpired` | `() => void` | Purge expired drafts |
| `hasDraft` | `(formId) => boolean` | Check existence + validity |

### Persistence

| Field | Strategy |
|-------|----------|
| `drafts` | `localStorage` key: `erp:drafts` with TTL enforcement on read |

### Form IDs Convention

```
billing-new
billing-edit-{billId}
complaint-new
complaint-edit-{ticketId}
dealer-onboarding
grn-new-{warehouseId}
dispatch-new
employee-new
```

---

## Store Index (`store/index.js`)

```javascript
export { useAuthStore } from './auth.store';
export { useSessionStore } from './session.store';
export { usePermissionStore } from './permission.store';
export { useSidebarStore } from './sidebar.store';
export { useModalStore } from './modal.store';
export { useNotificationStore } from './notification.store';
export { useThemeStore } from './theme.store';
export { useCommandPaletteStore } from './commandPalette.store';
export { useFiltersStore } from './filters.store';
export { useDraftStore } from './draft.store';
```

---

## Cross-Store Coordination (via Hooks)

| Hook | Stores Coordinated | Purpose |
|------|-------------------|---------|
| `useAuth` | auth, session, permission | Login/logout lifecycle |
| `usePermission` | permission, auth | Permission checks in components |
| `usePanel` | auth | Current panel context |
| `useSidebar` | sidebar | Sidebar state + responsive behavior |
| `useAutoSave` | draft | Form draft auto-save |
| `useFilters` | filters | Module filter state + URL sync |
| `useConfirmDialog` | modal | Confirmation dialog helper |

### Rule: No Store Imports Another Store

```javascript
// ❌ FORBIDDEN
import { useAuthStore } from './auth.store';
// inside permission.store.js

// ✅ CORRECT — coordination in hook
// hooks/useAuth.js
const login = async (credentials) => {
  await authStore.login(credentials);
  permissionStore.setPermissions(user.permissions, user.role);
  sessionStore.clearSessionMeta();
};
```

---

## Persistence Summary Table

| Store | localStorage | sessionStorage | URL | Memory | Cookie |
|-------|-------------|----------------|-----|--------|--------|
| auth | — | — | — | token | refresh (httpOnly) |
| session | — | lastPath, email | — | rest | — |
| permission | — | — | — | all | — |
| sidebar | collapsed, pinned | — | — | rest | — |
| modal | — | — | — | all | — |
| notification | — | — | — | all | — |
| theme | preference | — | — | resolved | — |
| commandPalette | recent | — | — | rest | — |
| filters | — | — | all | — | — |
| draft | drafts (TTL) | — | — | — | — |
