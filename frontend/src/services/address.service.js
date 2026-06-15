import client from './api/client';
import { endpoints } from './api/endpoints';

export const addressService = {
  lookupPincode: async (pin) => {
    const res = await client.get(endpoints.address.pincode(pin));
    return res.normalized.data;
  },
  getStates: async () => {
    const res = await client.get(endpoints.address.states);
    return res.normalized.data;
  },
};
