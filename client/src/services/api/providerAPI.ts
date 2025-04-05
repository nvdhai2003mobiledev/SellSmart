import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';
import { Provider } from '../../models/provider/provider';
import { GeneralApiProblem, getGeneralApiProblem } from './api';

export type GetProvidersResult = 
  | { kind: 'ok'; providers: Provider[] }
  | GeneralApiProblem;

export type GetProviderResult = 
  | { kind: 'ok'; provider: Provider }
  | GeneralApiProblem;

export type CreateProviderResult = 
  | { kind: 'ok'; provider: Provider }
  | GeneralApiProblem;

export type UpdateProviderResult = 
  | { kind: 'ok'; provider: Provider }
  | GeneralApiProblem;

export type DeleteProviderResult = 
  | { kind: 'ok' }
  | GeneralApiProblem;

export const ProviderApiService = {
  async getProviders(): Promise<GetProvidersResult> {
    try {
      const response = await Api.get(ApiEndpoint.PROVIDERS);
      
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        if (problem) return problem;
      }

      const providers = response.data?.data || [];
      return { kind: 'ok', providers };
    } catch (error: any) {
      return { kind: 'bad-data' };
    }
  },

  async getProviderById(id: string): Promise<GetProviderResult> {
    try {
      const response = await Api.get(`${ApiEndpoint.PROVIDERS}/${id}`);
      
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        if (problem) return problem;
      }

      const provider = response.data?.data;
      return { kind: 'ok', provider };
    } catch (error: any) {
      return { kind: 'bad-data' };
    }
  },

  async createProvider(data: Omit<Provider, '_id'>): Promise<CreateProviderResult> {
    try {
      const response = await Api.post(ApiEndpoint.PROVIDERS, data);
      
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        if (problem) return problem;
      }

      const provider = response.data?.data;
      return { kind: 'ok', provider };
    } catch (error: any) {
      return { kind: 'bad-data' };
    }
  },

  async updateProvider(id: string, data: Partial<Provider>): Promise<UpdateProviderResult> {
    try {
      const response = await Api.put(`${ApiEndpoint.PROVIDERS}/${id}`, data);
      
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        if (problem) return problem;
      }

      const provider = response.data?.data;
      return { kind: 'ok', provider };
    } catch (error: any) {
      return { kind: 'bad-data' };
    }
  },

  async deleteProvider(id: string): Promise<DeleteProviderResult> {
    try {
      const response = await Api.delete(`${ApiEndpoint.PROVIDERS}/${id}`);
      
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        if (problem) return problem;
      }

      return { kind: 'ok' };
    } catch (error: any) {
      return { kind: 'bad-data' };
    }
  },

  async searchProvidersByPhone(phone: string): Promise<GetProvidersResult> {
    try {
      const response = await Api.get(`${ApiEndpoint.PROVIDERS}/search/phone?phone=${phone}`);
      
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        if (problem) return problem;
      }

      const providers = response.data?.data || [];
      return { kind: 'ok', providers };
    } catch (error: any) {
      return { kind: 'bad-data' };
    }
  }
}; 