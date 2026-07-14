import mongoose from 'mongoose';

export const imageFieldSchema = {
  url: { type: String, default: '' },
  alt: { type: String, default: '' },
  publicId: { type: String, default: '' },
};

export const cmsBaseFields = {
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
};

export const cmsCollectionTypes = [
  'hero-slides',
  'statistics',
  'features',
  'categories',
  'app-experience-steps',
  'advantage-cards',
  'products',
  'why-choose-items',
  'how-it-steps',
  'testimonials',
  'faqs',
  'services',
  'pricing-plans',
  'team-members',
  'partners',
  'portfolio-items',
  'gallery-items',
  'blog-posts',
];

export function createCmsCollectionSchema(extraFields = {}) {
  return new mongoose.Schema(
    {
      ...cmsBaseFields,
      ...extraFields,
    },
    { timestamps: true }
  );
}
