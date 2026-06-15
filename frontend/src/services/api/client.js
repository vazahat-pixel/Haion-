import axios from 'axios';
import { env } from '@/config/env';
import { appConfig } from '@/config/app.config';
import { setupInterceptors } from './interceptors';

const client = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: appConfig.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

setupInterceptors(client);

export default client;

export function uploadFile(url, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
}
