import { initializePaddle } from '@paddle/paddle-js';

let paddleInstancePromise = null;
const eventListeners = new Set();

// Returns the singleton Paddle.js instance, initializing it on first call only.
export function getPaddleInstance() {
  if (!paddleInstancePromise) {
    paddleInstancePromise = initializePaddle({
      environment: import.meta.env.VITE_PADDLE_ENV,
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      eventCallback: (event) => {
        eventListeners.forEach((listener) => listener(event));
      },
    });
  }
  return paddleInstancePromise;
}

// Paddle.js only supports one global eventCallback (set at init time), so
// components subscribe here instead of passing their own callback to Checkout.open().
export function onPaddleEvent(listener) {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}
