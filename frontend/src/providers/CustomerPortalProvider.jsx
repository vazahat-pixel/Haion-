import { PortalConfigContext, usePortalConfigQuery } from '@/hooks/useCustomerPortalConfig';

export function CustomerPortalProvider({ children, initialConfig }) {
  const value = usePortalConfigQuery(initialConfig);

  return (
    <PortalConfigContext.Provider value={value}>
      <div
        className="customer-app min-h-screen"
        style={{ '--portal-primary': value.primaryColor }}
      >
        {children}
      </div>
    </PortalConfigContext.Provider>
  );
}
