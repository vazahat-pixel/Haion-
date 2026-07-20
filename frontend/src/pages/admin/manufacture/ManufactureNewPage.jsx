import { PageShell } from '@/components/layout/PageShell';
import { ManufactureForm } from '@/modules/manufacture';

export default function ManufactureNewPage() {
  return (
    <PageShell
      title="Make Product"
      subtitle="Pick purchased materials from warehouse stock and assemble a finished good"
    >
      <ManufactureForm />
    </PageShell>
  );
}
