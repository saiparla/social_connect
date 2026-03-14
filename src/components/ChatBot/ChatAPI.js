import { api } from '../../context/AuthContext';

const ChatAPI = {
  fetchLeads:          () => api.get('/api/v1/leads').then(r => r.data.leads || []).catch(() => []),
  fetchCampaigns:      () => api.get('/api/v1/campaigns').then(r => r.data.campaigns || []).catch(() => []),
  fetchChannels:       () => api.get('/api/v1/channels').then(r => r.data.channels || []).catch(() => []),
  fetchAnalytics:      () => api.get('/api/v1/analytics').then(r => r.data.analytics || []).catch(() => []),
  fetchDashboardStats: () => api.get('/api/v1/dashboard/stats').then(r => r.data.stats || {}).catch(() => ({})),
  getUserPermissions:  () => api.get('/api/v1/verify-token').then(r => r.data?.data?.permissions || {}).catch(() => ({})),
  createLead:      (data) => api.post('/api/v1/leads', data).then(r => r.data),
  createCampaign:  (data) => api.post('/api/v1/campaigns', data).then(r => r.data),
};

export default ChatAPI;
