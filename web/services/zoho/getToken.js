import axios from 'axios';
import { redisClient } from '../cache/redis.js';

const ZOHO_TOKEN_KEY = 'zoho:access_token';

export async function getZohoAccessToken() {
  let accessToken = await redisClient.get(ZOHO_TOKEN_KEY);
  if (accessToken) {
    return accessToken;
  }

  // Fetch new token from Zoho
  const params = new URLSearchParams();
  params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
  params.append('client_id', process.env.ZOHO_CLIENT_ID);
  params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');
  const url = "https://accounts.zoho.in/oauth/v2/token";
  const response = await axios.post(url, params);

  accessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
console.log('newtoken',accessToken)
  // Cache the token in Redis (expires 60s before actual expiry)
  await redisClient.set(ZOHO_TOKEN_KEY,accessToken, 'EX', expiresIn - 60);

  return accessToken;
}