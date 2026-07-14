import { useState } from 'react';
import { BusinessProfileLayout } from '@/components/layout/BusinessProfileLayout';
import { InvoiceSettingsForm } from '@/modules/business-settings/InvoiceSettingsForm';
import { Button } from '@/components/ui/button';

export default function InvoiceSettingsPage() {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <BusinessProfileLayout
      title="Invoice Settings"
      subtitle="Customize invoice layout — preview updates live from your saved settings"
      actions={<Button type="submit" form="invoice-settings-form" disabled={!isDirty}>Save Changes</Button>}
    >
      <InvoiceSettingsForm onDirtyChange={setIsDirty} />
    </BusinessProfileLayout>
  );
}
