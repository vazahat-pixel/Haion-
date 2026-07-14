import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import * as cms from '../../services/cms.service.js';

export const getSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await cms.getOrCreateSettings() });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await cms.updateSettings(req.body, req.user._id);
  return sendSuccess(res, { data, message: 'Website settings updated' });
});

export const updateTheme = asyncHandler(async (req, res) => {
  const data = await cms.updateSettings({ theme: req.body }, req.user._id);
  return sendSuccess(res, { data: data.theme, message: 'Theme updated' });
});

export const updateNavbar = asyncHandler(async (req, res) => {
  const data = await cms.updateSettings({ navbar: req.body }, req.user._id);
  return sendSuccess(res, { data: data.navbar, message: 'Navbar updated' });
});

export const updateFooter = asyncHandler(async (req, res) => {
  const data = await cms.updateSettings({ footer: req.body }, req.user._id);
  return sendSuccess(res, { data: data.footer, message: 'Footer updated' });
});

export const updateSeoDefaults = asyncHandler(async (req, res) => {
  const data = await cms.updateSettings({ seo: req.body }, req.user._id);
  return sendSuccess(res, { data: data.seo, message: 'SEO defaults updated' });
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const data = await cms.updateSettings({ maintenanceMode: req.body }, req.user._id);
  return sendSuccess(res, { data: data.maintenanceMode, message: 'Maintenance mode updated' });
});

export const listSections = asyncHandler(async (req, res) => {
  const data = await cms.getSectionsForPage(req.params.page);
  return sendSuccess(res, { data });
});

export const getSection = asyncHandler(async (req, res) => {
  const data = await cms.getSection(req.params.page, req.params.sectionKey);
  return sendSuccess(res, { data });
});

export const upsertSection = asyncHandler(async (req, res) => {
  const data = await cms.upsertSection(req.params.page, req.params.sectionKey, req.body, req.user._id);
  return sendSuccess(res, { data, message: 'Section saved' });
});

export const toggleSection = asyncHandler(async (req, res) => {
  const data = await cms.toggleSection(req.params.page, req.params.sectionKey, req.user._id);
  return sendSuccess(res, { data, message: 'Section visibility updated' });
});

export const reorderSections = asyncHandler(async (req, res) => {
  const data = await cms.reorderSections(req.body.items, req.user._id);
  return sendSuccess(res, { data, message: 'Sections reordered' });
});

export const listCollection = asyncHandler(async (req, res) => {
  const data = await cms.listCollection(req.params.collection);
  return sendSuccess(res, { data });
});

export const getCollectionItem = asyncHandler(async (req, res) => {
  const data = await cms.getCollectionItem(req.params.collection, req.params.id);
  return sendSuccess(res, { data });
});

export const createCollectionItem = asyncHandler(async (req, res) => {
  const data = await cms.createCollectionItem(req.params.collection, req.body, req.user._id);
  return sendCreated(res, { data, message: 'Item created' });
});

export const updateCollectionItem = asyncHandler(async (req, res) => {
  const patch = { ...req.body };
  if (patch.data) {
    const existing = await cms.getCollectionItem(req.params.collection, req.params.id);
    patch.data = { ...(existing?.data ?? {}), ...patch.data };
  }
  const data = await cms.updateCollectionItem(req.params.collection, req.params.id, patch, req.user._id);
  return sendSuccess(res, { data, message: 'Item updated' });
});

export const deleteCollectionItem = asyncHandler(async (req, res) => {
  const data = await cms.deleteCollectionItem(req.params.collection, req.params.id);
  return sendSuccess(res, { data, message: 'Item deleted' });
});

export const toggleCollectionItem = asyncHandler(async (req, res) => {
  const data = await cms.toggleCollectionItem(req.params.collection, req.params.id, req.user._id);
  return sendSuccess(res, { data, message: 'Item visibility updated' });
});

export const reorderCollection = asyncHandler(async (req, res) => {
  const data = await cms.reorderCollection(req.params.collection, req.body.items, req.user._id);
  return sendSuccess(res, { data, message: 'Collection reordered' });
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  return sendSuccess(res, {
    data: { url, publicId: req.file.filename, alt: '' },
    message: 'Image uploaded',
  });
});

export const deleteUpload = asyncHandler(async (req, res) => {
  await cms.deleteUploadedFile(req.params.publicId);
  return sendSuccess(res, { message: 'Image deleted' });
});

export const syncFromSeed = asyncHandler(async (_req, res) => {
  const fillEmpty = _req.body?.fillEmpty !== false;
  const result = await cms.syncCmsFromSeed({ fillEmpty });
  return sendSuccess(res, { data: result, message: 'Website content synced from seed data' });
});
