export const getAuthHeaders = () => {
  const token = sessionStorage.getItem('jwt');
  return { Authorization: `Bearer ${token}` };
};