import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsSubnav } from '@/components/layout/SettingsSubnav';
import { CaReportsSharingForm } from '@/modules/settings/CaReportsSharingForm';
import { Button } from '@/components/ui/button';

export default function CaReportsSharingPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleCancel = () => {
    formRef.current?.reset();
    navigate('/admin/settings');
  };

  const handleSave = () => {
    formRef.current?.submit();
  };

  return (
    <SettingsSubnav
      title="CA Reports Sharing"
      subtitle="Automatically share reports to your CA every month"
      actions={(
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      )}
    >
      <CaReportsSharingForm
        ref={formRef}
        onDirtyChange={setIsDirty}
      />
    </SettingsSubnav>
  );
}
