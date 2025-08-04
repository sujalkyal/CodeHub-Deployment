type ApiKeyEntry = {
  key: string;
  host: string;
  usage: number;
};

const API_LIMIT = 40; // per key

// Initialize all your keys here
const apiKeys: ApiKeyEntry[] = [
  { key: process.env.RAPID_API_KEY_1!, host: process.env.RAPID_API_HOST!, usage: 0 },
  { key: process.env.RAPID_API_KEY_2!, host: process.env.RAPID_API_HOST!, usage: 0 },
  { key: process.env.RAPID_API_KEY_3!, host: process.env.RAPID_API_HOST!, usage: 0 },
  { key: process.env.RAPID_API_KEY_4!, host: process.env.RAPID_API_HOST!, usage: 0 },
  { key: process.env.RAPID_API_KEY_5!, host: process.env.RAPID_API_HOST!, usage: 0 }
];

// Get the next available API key that hasn't reached the limit
export function getAvailableApiKey() {
  const availableKey = apiKeys.find((entry) => entry.usage < API_LIMIT);

  if (!availableKey) {
    throw new Error("All RapidAPI keys have exceeded their usage limits.");
  }

  availableKey.usage += 1;
  return {
    key: availableKey.key,
    host: availableKey.host,
  };
}
