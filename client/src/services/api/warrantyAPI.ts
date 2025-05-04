import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';
import { Warranty } from '../../models/warranty/warranty';
import { GeneralApiProblem, getGeneralApiProblem } from './api';

export type GetWarrantiesResult = 
  | { kind: 'ok'; warranties: Warranty[] }
  | GeneralApiProblem;

export type GetWarrantyResult = 
  | { kind: 'ok'; warranty: Warranty }
  | GeneralApiProblem;

export type CreateWarrantyResult = 
  | { kind: 'ok'; warranty: Warranty }
  | GeneralApiProblem;

export type UpdateWarrantyResult =  
  | { kind: 'ok'; warranty: Warranty }
  | GeneralApiProblem;

export type DeleteWarrantyResult = 
  | { kind: 'ok' }
  | GeneralApiProblem;

  export const WarrantyApiService = {
    async getWarranties(): Promise<GetWarrantiesResult> {
      try {
        const url = `${ApiEndpoint.WARRANTY}`;
        console.log('Calling API:', url);
  
        const response = await Api.get(url);
  
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
  
        if (!response.ok) {
          const problem = getGeneralApiProblem(response);
          console.error('API Problem:', problem);
          if (problem) return problem;
        }
  
        const warranties = response.data?.data || [];
        console.log('Parsed warranties:', warranties);
        return { kind: 'ok', warranties };
      } catch (error: any) {
        console.error('Error in getWarranties:', error.message);
        console.error('Error stack:', error.stack);
        return { kind: 'bad-data' };
      }
    },
  };
 