import { api } from './api.services';

export const getAllUtilities = async () => {
  try {
    const items = await api.get('/utlities');
    return items;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const createUtilities = async (payload) => {
  try {
    console.log(payload);
    const UpdateItem = await api.post('/utlities', payload);
    return UpdateItem;
  } catch (error) {
    return error;
  }
};
