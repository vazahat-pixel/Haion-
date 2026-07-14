import { useState } from 'react';
import { BusinessProfileLayout } from '@/components/layout/BusinessProfileLayout';
import { PrintSettingsForm } from '@/modules/business-settings/PrintSettingsForm';
import { Button } from '@/components/ui/button';

export default function PrintSettingsPage() {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <BusinessProfileLayout
      title="Print Settings"
      subtitle="Configure printer type, paper size and print options"
      actions={<Button type="submit" form="print-settings-form" disabled={!isDirty}>Save Changes</Button>}
    >
      <PrintSettingsForm onDirtyChange={setIsDirty} />
    </BusinessProfileLayout>
  );
}
