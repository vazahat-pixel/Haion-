import { z } from 'zod';
import { cmsCollectionTypes } from '../models/cms/shared.cms.schema.js';

const hexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color');

export const updateSettingsSchema = z.object({
  siteName: z.string().max(120).optional(),
  tagline: z.string().max(240).optional(),
  logo: z.object({ url: z.string(), alt: z.string().optional(), publicId: z.string().optional() }).optional(),
  favicon: z.object({ url: z.string(), publicId: z.string().optional() }).optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().max(30).optional(),
      whatsapp: z.string().max(30).optional(),
      address: z.string().max(500).optional(),
      mapEmbedUrl: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
  socialLinks: z.array(z.any()).optional(),
  theme: z
    .object({
      primaryColor: hexColor.optional(),
      secondaryColor: hexColor.optional(),
      accentColor: hexColor.optional(),
      backgroundColor: hexColor.optional(),
      textColor: hexColor.optional(),
      fontFamily: z.string().max(80).optional(),
      headingFontFamily: z.string().max(80).optional(),
      baseFontSize: z.string().max(10).optional(),
      borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
      buttonStyle: z.enum(['filled', 'outlined', 'ghost']).optional(),
    })
    .optional(),
  navbar: z.any().optional(),
  footer: z.any().optional(),
  seo: z.any().optional(),
  maintenanceMode: z
    .object({
      isEnabled: z.boolean().optional(),
      message: z.string().max(2000).optional(),
    })
    .optional(),
  analytics: z.any().optional(),
});

export const upsertSectionSchema = z.object({
  sectionLabel: z.string().max(120).optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  content: z.record(z.any()).optional(),
  seo: z.any().optional(),
});

export const reorderSectionsSchema = z.object({
  items: z.array(
    z.object({
      page: z.string().min(1),
      sectionKey: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
});

export const collectionBodySchema = z.object({
  data: z.record(z.any()),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const reorderCollectionSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
});

export const collectionParamSchema = z.object({
  collection: z.enum(cmsCollectionTypes),
});
