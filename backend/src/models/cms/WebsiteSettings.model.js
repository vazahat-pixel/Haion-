import mongoose from 'mongoose';
import { imageFieldSchema } from './shared.cms.schema.js';

const linkSchema = {
  label: { type: String, default: '' },
  url: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
};

const websiteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Haion' },
    tagline: { type: String, default: '' },
    logo: { type: imageFieldSchema, default: () => ({}) },
    favicon: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    contact: {
      email: { type: String, default: 'ev@haion.co.in' },
      phone: { type: String, default: '02269622645' },
      whatsapp: { type: String, default: '' },
      address: { type: String, default: '' },
      mapEmbedUrl: { type: String, default: '' },
    },
    socialLinks: [
      {
        platform: { type: String, default: '' },
        url: { type: String, default: '#' },
        icon: { type: String, default: '' },
        isVisible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    theme: {
      primaryColor: { type: String, default: '#e88d01' },
      secondaryColor: { type: String, default: '#ab7e2c' },
      accentColor: { type: String, default: '#ffd233' },
      backgroundColor: { type: String, default: '#030303' },
      textColor: { type: String, default: '#e4e4e7' },
      fontFamily: { type: String, default: 'Poppins' },
      headingFontFamily: { type: String, default: 'Poppins' },
      baseFontSize: { type: String, default: '16px' },
      borderRadius: { type: String, default: 'lg' },
      buttonStyle: { type: String, default: 'filled' },
    },
    navbar: {
      links: [linkSchema],
      ctaButton: {
        label: { type: String, default: 'Download App' },
        url: { type: String, default: '#download' },
        isVisible: { type: Boolean, default: true },
      },
      isSticky: { type: Boolean, default: true },
      showLogo: { type: Boolean, default: true },
    },
    footer: {
      copyrightText: { type: String, default: 'Copyright © 2009 - 2025 Haion. All Rights Reserved.' },
      columns: [
        {
          heading: { type: String, default: '' },
          links: [{ label: { type: String, default: '' }, url: { type: String, default: '' } }],
        },
      ],
      bottomLinks: [linkSchema],
      showSocialLinks: { type: Boolean, default: true },
    },
    seo: {
      metaTitle: { type: String, default: 'Haion — Premium Electronics E-Commerce Mobile App' },
      metaDescription: { type: String, default: '' },
      metaKeywords: [{ type: String }],
      ogImage: { type: imageFieldSchema, default: () => ({}) },
    },
    maintenanceMode: {
      isEnabled: { type: Boolean, default: false },
      message: { type: String, default: 'We are currently performing scheduled maintenance. Please check back soon.' },
    },
    analytics: {
      googleAnalyticsId: { type: String, default: '' },
      hotjarId: { type: String, default: '' },
    },
    appLinks: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    checkout: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    cart: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    leadPopup: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    profile: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    orderTracking: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    careers: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model('WebsiteSettings', websiteSettingsSchema);
