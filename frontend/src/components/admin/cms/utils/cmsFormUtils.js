/** @typedef {'text'|'textarea'|'richtext'|'image'|'imageurl'|'color'|'number'|'switch'|'select'|'repeater'|'group'|'keyvalue'|'stringlist'|'tags'} FieldType */

/**
 * @typedef {Object} FieldSchema
 * @property {string} key
 * @property {FieldType} type
 * @property {string} label
 * @property {string} [placeholder]
 * @property {string} [helpText]
 * @property {{ value: string, label: string }[]} [options]
 * @property {FieldSchema[]} [fields]
 * @property {Record<string, unknown>} [defaultItem]
 * @property {boolean} [fullWidth]
 */

export function formatLabel(key) {
  if (!key) return 'Field';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\./g, ' › ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function getNestedValue(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const result = { ...obj };
  let cur = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] ?? {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}

export function updateFieldValue(data, key, value) {
  if (!key.includes('.')) return { ...data, [key]: value };
  return setNestedValue(data ?? {}, key, value);
}

function isImageObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val) && 'url' in val;
}

function isColorString(val) {
  return typeof val === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(val);
}

function isUrlOrPath(val) {
  return (
    typeof val === 'string' &&
    (val.startsWith('http') || val.startsWith('/') || val.startsWith('data:image'))
  );
}

/** Infer visual field schemas from arbitrary data — never falls back to JSON UI */
export function inferFieldsFromObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).map(([key, value]) => inferFieldFromValue(key, value));
}

export function inferFieldFromValue(key, value) {
  const label = formatLabel(key);

  if (value === null || value === undefined) {
    return { key, type: 'text', label };
  }
  if (typeof value === 'boolean') {
    return { key, type: 'switch', label };
  }
  if (typeof value === 'number') {
    return { key, type: 'number', label };
  }
  if (typeof value === 'string') {
    if (isColorString(value)) return { key, type: 'color', label };
    if (isUrlOrPath(value) && /\.(webp|png|jpg|jpeg|gif|svg|avif)(\?|$)/i.test(value)) {
      return { key, type: 'imageurl', label };
    }
    if (value.length > 150 || value.includes('\n')) {
      return { key, type: 'richtext', label };
    }
    return { key, type: 'text', label };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { key, type: 'repeater', label, fields: [], defaultItem: {} };
    }
    const sample = value[0];
    if (typeof sample === 'string') {
      return { key, type: 'stringlist', label };
    }
    return {
      key,
      type: 'repeater',
      label,
      fields: inferFieldsFromObject(sample),
      defaultItem: createEmptyFromFields(inferFieldsFromObject(sample)),
    };
  }
  if (isImageObject(value)) {
    return { key, type: 'image', label };
  }
  if (typeof value === 'object') {
    const allPrimitive = Object.values(value).every(
      (v) => v == null || typeof v !== 'object' || isImageObject(v)
    );
    if (allPrimitive && Object.keys(value).length > 2 && !isImageObject(value)) {
      const hasOnlyStrings = Object.values(value).every((v) => typeof v === 'string');
      if (hasOnlyStrings) return { key, type: 'keyvalue', label };
    }
    return {
      key,
      type: 'group',
      label,
      fields: inferFieldsFromObject(value),
    };
  }
  return { key, type: 'text', label };
}

export function createEmptyFromFields(fields = []) {
  const item = {};
  for (const field of fields) {
    if (field.type === 'repeater') item[field.key] = [];
    else if (field.type === 'group') item[field.key] = createEmptyFromFields(field.fields);
    else if (field.type === 'switch') item[field.key] = false;
    else if (field.type === 'number') item[field.key] = 0;
    else if (field.type === 'image') item[field.key] = { url: '', alt: '', publicId: '' };
    else if (field.type === 'keyvalue' || field.type === 'stringlist' || field.type === 'tags') item[field.key] = {};
    else item[field.key] = '';
  }
  return item;
}

export function resolveSchema(explicitSchema, data) {
  if (explicitSchema?.length) return explicitSchema;
  return inferFieldsFromObject(data ?? {});
}
