import {create} from 'apisauce';

const BASE_URL = 'http://localhost:3000/';

export const Api = create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});
