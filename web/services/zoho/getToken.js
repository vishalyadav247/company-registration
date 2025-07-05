import axios from 'axios';

export async function getZohoAccessToken() {
  const params = new URLSearchParams();
  params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
  params.append('client_id', process.env.ZOHO_CLIENT_ID);
  params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');
  const url = "https://accounts.zoho.in/oauth/v2/token";
  const response = await axios.post(url, params);
  return response.data.access_token;
}

