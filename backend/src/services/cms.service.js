import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebsiteSettings from '../models/cms/WebsiteSettings.model.js';
import PageSection from '../models/cms/PageSection.model.js';
import CmsCollection from '../models/cms/CmsCollection.model.js';
import { cmsCollectionTypes } from '../models/cms/shared.cms.schema.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { invalidateCache } from '../middleware/cmsCache.middleware.js';
import { getCmsSeedPayload } from '../data/cmsSeedData.js';
import { getPageContentSections, getPageContentCollections } from '../data/pageContentSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

export function assertValidCollection(collection) {
  if (!cmsCollectionTypes.includes(collection)) {
    const err = new Error(`Invalid collection: ${collection}`);
    err.statusCode = 400;
    throw err;
  }
}

export async function getOrCreateSettings() {
  let doc = await WebsiteSettings.findOne().lean();
  if (!doc) {
    const seed = getCmsSeedPayload().settings;
    doc = (await WebsiteSettings.create(seed)).toObject();
  }
  return toPublicDoc(doc);
}

export async function updateSettings(patch, userId) {
  const doc = await WebsiteSettings.findOneAndUpdate(
    {},
    { $set: patch },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  invalidateCache('cms:');
  return toPublicDoc(doc);
}

export async function getSectionsForPage(page, { visibleOnly = false } = {}) {
  const filter = { page };
  if (visibleOnly) filter.isVisible = true;
  const docs = await PageSection.find(filter).sort({ order: 1 }).lean();
  return docs.map(toPublicDoc);
}

export async function getSection(page, sectionKey) {
  const doc = await PageSection.findOne({ page, sectionKey }).lean();
  return toPublicDoc(doc);
}

export async function upsertSection(page, sectionKey, payload, userId) {
  const doc = await PageSection.findOneAndUpdate(
    { page, sectionKey },
    {
      $set: {
        ...payload,
        page,
        sectionKey,
        updatedBy: userId,
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  invalidateCache('cms:');
  return toPublicDoc(doc);
}

export async function toggleSection(page, sectionKey, userId) {
  const existing = await PageSection.findOne({ page, sectionKey });
  if (!existing) {
    const err = new Error('Section not found');
    err.statusCode = 404;
    throw err;
  }
  existing.isVisible = !existing.isVisible;
  existing.updatedBy = userId;
  await existing.save();
  invalidateCache('cms:');
  return toPublicDoc(existing.toObject());
}

export async function reorderSections(items, userId) {
  const ops = items.map(({ page, sectionKey, order }) =>
    PageSection.updateOne({ page, sectionKey }, { $set: { order, updatedBy: userId } })
  );
  await Promise.all(ops);
  invalidateCache('cms:');
  return { updated: items.length };
}

export async function listCollection(collection, { visibleOnly = false } = {}) {
  assertValidCollection(collection);
  const filter = { collection };
  if (visibleOnly) filter.isVisible = true;
  const docs = await CmsCollection.find(filter).sort({ order: 1 }).lean();
  let results = docs.map(toPublicDoc);
  if (visibleOnly && collection === 'products') {
    results = results.filter((row) => {
      const status = row.data?.status ?? 'active';
      return status === 'active';
    });
  }
  return results;
}

export async function getCollectionItem(collection, id) {
  assertValidCollection(collection);
  const doc = await CmsCollection.findOne({ _id: id, collection }).lean();
  return toPublicDoc(doc);
}

export async function createCollectionItem(collection, body, userId) {
  assertValidCollection(collection);
  const data = body?.data ?? body;
  let order = body?.order;
  if (order === undefined || order === null) {
    const maxOrder = await CmsCollection.findOne({ collection }).sort({ order: -1 }).select('order').lean();
    order = (maxOrder?.order ?? -1) + 1;
  }
  const doc = await CmsCollection.create({
    collection,
    data,
    order,
    isVisible: body?.isVisible !== false,
    updatedBy: userId,
  });
  invalidateCache('cms:');
  return toPublicDoc(doc.toObject());
}

export async function updateCollectionItem(collection, id, patch, userId) {
  assertValidCollection(collection);
  const doc = await CmsCollection.findOneAndUpdate(
    { _id: id, collection },
    { $set: { ...patch, updatedBy: userId } },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
  invalidateCache('cms:');
  return toPublicDoc(doc);
}

export async function deleteCollectionItem(collection, id) {
  assertValidCollection(collection);
  const doc = await CmsCollection.findOneAndDelete({ _id: id, collection }).lean();
  if (!doc) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
  invalidateCache('cms:');
  return toPublicDoc(doc);
}

export async function toggleCollectionItem(collection, id, userId) {
  assertValidCollection(collection);
  const existing = await CmsCollection.findOne({ _id: id, collection });
  if (!existing) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
  existing.isVisible = !existing.isVisible;
  existing.updatedBy = userId;
  await existing.save();
  invalidateCache('cms:');
  return toPublicDoc(existing.toObject());
}

export async function reorderCollection(collection, items, userId) {
  assertValidCollection(collection);
  const ops = items.map(({ id, order }) =>
    CmsCollection.updateOne({ _id: id, collection }, { $set: { order, updatedBy: userId } })
  );
  await Promise.all(ops);
  invalidateCache('cms:');
  return { updated: items.length };
}

export async function deleteUploadedFile(publicId) {
  if (!publicId) return;
  const filename = path.basename(publicId);
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export async function seedCmsIfEmpty() {
  return syncCmsFromSeed({ fillEmpty: true });
}

/** Sync all website content from seed files — creates missing sections/collections and optionally fills empty content */
export async function syncCmsFromSeed({ fillEmpty = true } = {}) {
  const settingsCount = await WebsiteSettings.countDocuments();
  const sectionCount = await PageSection.countDocuments();
  const collectionCount = await CmsCollection.countDocuments();

  const payload = getCmsSeedPayload();
  const extraSections = getPageContentSections();
  const extraCollections = getPageContentCollections();
  const allSections = [...payload.sections, ...extraSections];
  const allCollections = [...payload.collections, ...extraCollections];

  if (!settingsCount) await WebsiteSettings.create(payload.settings);
  if (!sectionCount) await PageSection.insertMany(allSections);
  if (!collectionCount) await CmsCollection.insertMany(allCollections);

  await syncMissingSections(allSections, { fillEmpty });
  await syncMissingCollections(allCollections);
  invalidateCache('cms:');

  return {
    seeded: !settingsCount || !sectionCount || !collectionCount,
    sectionsTotal: allSections.length,
    collectionsTotal: allCollections.length,
  };
}

export async function syncMissingCollections(seedCollections = []) {
  for (const item of seedCollections) {
    const query = { collection: item.collection };
    if (item.data?.id) query['data.id'] = item.data.id;
    else if (item.data?.name) query['data.name'] = item.data.name;
    const exists = await CmsCollection.findOne(query);
    if (!exists) await CmsCollection.create(item);
  }
}

function isContentEmpty(content) {
  if (!content || typeof content !== 'object') return true;
  return Object.keys(content).length === 0;
}

export async function syncMissingSections(seedSections = [], { fillEmpty = false } = {}) {
  let created = 0;
  let updated = 0;
  for (const section of seedSections) {
    const exists = await PageSection.findOne({ page: section.page, sectionKey: section.sectionKey });
    if (!exists) {
      await PageSection.create(section);
      created++;
    } else if (fillEmpty && isContentEmpty(exists.content) && !isContentEmpty(section.content)) {
      exists.content = section.content;
      exists.sectionLabel = exists.sectionLabel || section.sectionLabel;
      exists.order = exists.order ?? section.order;
      await exists.save();
      updated++;
    }
  }
  return { created, updated };
}

export async function getPublicPageBundle(page) {
  const [settings, sections] = await Promise.all([
    getOrCreateSettings(),
    getSectionsForPage(page, { visibleOnly: true }),
  ]);
  const collections = {};
  await Promise.all(
    cmsCollectionTypes.map(async (key) => {
      collections[key] = await listCollection(key, { visibleOnly: true });
    })
  );
  return { settings, sections, collections };
}

export async function getPageSeo(page) {
  const sections = await PageSection.find({ page, isVisible: true })
    .select('sectionKey seo sectionLabel')
    .sort({ order: 1 })
    .lean();
  const settings = await getOrCreateSettings();
  return {
    page,
    defaults: settings.seo,
    sections: sections.map(toPublicDoc),
  };
}
