import api from '../services/api';

export const getAvatarUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob')) return path;

  const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
  return new URL(path, `${apiOrigin}/`).toString();
};