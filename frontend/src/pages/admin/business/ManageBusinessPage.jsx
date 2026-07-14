import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessProfileLayout } from '@/components/layout/BusinessProfileLayout';
import { ManageBusinessForm } from '@/modules/business-settings/ManageBusinessForm';
import { Button } from '@/components/ui/button';

export default function ManageBusinessPage() {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);

  return (
    <BusinessProfileLayout
      title="Business Settings"
      subtitle="Edit your company settings and information"
      actions={(
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>Cancel</Button>
          <Button type="submit" form="manage-business-form" disabled={!isDirty}>Save Changes</Button>
        </div>
      )}
    >
      <ManageBusinessForm onDirtyChange={setIsDirty} />
    </BusinessProfileLayout>
  );
}
