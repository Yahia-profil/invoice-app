import axios from 'axios';

const API_URL = 'http://localhost:3001';

const jsonService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getArticles = async () => {
  try {
    const response = await jsonService.get('/articles');
    return response.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await jsonService.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createArticle = async (article: any) => {
  const response = await jsonService.post('/articles', article);
  return response.data;
};

export const updateArticle = async (id: number, article: any) => {
  const response = await jsonService.put(`/articles/${id}`, article);
  return response.data;
};

export const deleteArticle = async (id: number) => {
  const response = await jsonService.delete(`/articles/${id}`);
  return response.data;
};

export const createCategory = async (category: any) => {
  const response = await jsonService.post('/categories', category);
  return response.data;
};

export const updateCategory = async (id: number, category: any) => {
  const response = await jsonService.put(`/categories/${id}`, category);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  const response = await jsonService.delete(`/categories/${id}`);
  return response.data;
};

export default jsonService;
