import { api } from './api.services';

export const getPeriodo = async () => {
  try {
    const items = await api.get('/libs');
    return items.data.periodo;
  } catch (error) {
    console.log(error);
    return error;
  }
};
