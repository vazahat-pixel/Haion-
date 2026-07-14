import cmsPublicClient from './api/cmsPublicClient';
import client from './api/client';

export const cmsPublicService = {
  getSettings: async () => (await cmsPublicClient.get('/cms/settings')).normalized.data,
  getPage: async (page) => (await cmsPublicClient.get(`/cms/page/${page}`)).normalized.data,
  getPageSeo: async (page) => (await cmsPublicClient.get(`/cms/page/${page}/seo`)).normalized.data,
  getCollection: async (collection) => (await cmsPublicClient.get(`/cms/${collection}`)).normalized.data,
};

export const cmsAdminService = {
  getSettings: async () => (await client.get('/admin/cms/settings')).normalized.data,
  updateSettings: async (data) => (await client.put('/admin/cms/settings', data)).normalized.data,
  updateTheme: async (data) => (await client.put('/admin/cms/settings/theme', data)).normalized.data,
  updateNavbar: async (data) => (await client.put('/admin/cms/settings/navbar', data)).normalized.data,
  updateFooter: async (data) => (await client.put('/admin/cms/settings/footer', data)).normalized.data,
  updateSeo: async (data) => (await client.put('/admin/cms/settings/seo', data)).normalized.data,
  updateMaintenance: async (data) => (await client.put('/admin/cms/settings/maintenance', data)).normalized.data,
  getSections: async (page) => (await client.get(`/admin/cms/sections/${page}`)).normalized.data,
  upsertSection: async (page, sectionKey, data) =>
    (await client.put(`/admin/cms/sections/${page}/${sectionKey}`, data)).normalized.data,
  toggleSection: async (page, sectionKey) =>
    (await client.patch(`/admin/cms/sections/${page}/${sectionKey}/toggle`)).normalized.data,
  reorderSections: async (items) => (await client.put('/admin/cms/sections/reorder', { items })).normalized.data,
  listCollection: async (collection) => (await client.get(`/admin/cms/${collection}`)).normalized.data,
  createCollectionItem: async (collection, payload) =>
    (await client.post(`/admin/cms/${collection}`, payload)).normalized.data,
  updateCollectionItem: async (collection, id, data) =>
    (await client.put(`/admin/cms/${collection}/${id}`, data)).normalized.data,
  deleteCollectionItem: async (collection, id) =>
    (await client.delete(`/admin/cms/${collection}/${id}`)).normalized.data,
  toggleCollectionItem: async (collection, id) =>
    (await client.patch(`/admin/cms/${collection}/${id}/toggle`)).normalized.data,
  syncFromSeed: async (fillEmpty = true) =>
    (await client.post('/admin/cms/sync', { fillEmpty })).normalized.data,
  uploadImage: async (file) => {
    const form = new FormData();
    form.append('file', file);
    return (await client.post('/admin/cms/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).normalized.data;
  },
};
