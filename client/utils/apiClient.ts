import axios, { AxiosInstance } from 'axios';
import getConfig from './getConfig';

const ROOT_URL: string = getConfig('API_URL') ?? '';

/**
 * Configures and returns an Axios instance with the base API URL and credentials enabled
 */
function createClientInstance(): AxiosInstance {
  return axios.create({
    baseURL: ROOT_URL,
    withCredentials: true
  });
}

export default createClientInstance();
