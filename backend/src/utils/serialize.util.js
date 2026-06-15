/** Map MongoDB lean documents to API-friendly shape (id instead of _id). */
export function toPublicDoc(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(toPublicDoc);

  const { _id, __v, ...rest } = doc;
  return { id: String(_id ?? doc.id), ...rest };
}
