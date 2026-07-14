import { useEffect, useState } from 'react';
import { CmsFieldRenderer } from './CmsFieldRenderer';
import { getSectionSchema } from './schemas/sectionSchemas';
import { getCollectionSchema } from './schemas/collectionSchemas';
import { resolveSchema } from './utils/cmsFormUtils';

export function CmsVisualForm({ type, keyName, data, onChange }) {
  const [formData, setFormData] = useState(data ?? {});

  useEffect(() => {
    setFormData(data ?? {});
  }, [data, keyName, type]);

  const explicitSchema =
    type === 'section' ? getSectionSchema(keyName) : type === 'collection' ? getCollectionSchema(keyName) : null;

  const schema = resolveSchema(explicitSchema, formData);

  const handleChange = (updated) => {
    setFormData(updated);
    onChange?.(updated);
  };

  return (
    <CmsFieldRenderer schema={schema} data={formData} onChange={handleChange} />
  );
}
