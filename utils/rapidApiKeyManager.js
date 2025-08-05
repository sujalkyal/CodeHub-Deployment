const API_LIMIT = 40; // per key

// Initialize all your keys here
const apiKeys = [
  { key: process.env.RAPID_API_KEY_1, usage: 0 },
  { key: process.env.RAPID_API_KEY_2, usage: 0 },
  { key: process.env.RAPID_API_KEY_3, usage: 0 },
  { key: process.env.RAPID_API_KEY_4, usage: 0 },
  { key: process.env.RAPID_API_KEY_5, usage: 0 },
  { key: process.env.RAPID_API_KEY_6, usage: 0 },
  { key: process.env.RAPID_API_KEY_7, usage: 0 }
];

// Get the next available API key that hasn't reached the limit
function getAvailableApiKey() {
  const availableKey = apiKeys.find(entry => entry.usage < API_LIMIT);

  if (!availableKey) {
    throw new Error("All RapidAPI keys have exceeded their usage limits.");
  }

  availableKey.usage += 1;
  return {
    key: availableKey.key
  };
}

module.exports = { getAvailableApiKey };
