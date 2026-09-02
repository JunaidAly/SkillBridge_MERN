import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Ensure env vars are loaded even if this module is imported before server.js calls dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const environment = process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;

const paddle = new Paddle(process.env.PADDLE_API_KEY, { environment });

export default paddle;
