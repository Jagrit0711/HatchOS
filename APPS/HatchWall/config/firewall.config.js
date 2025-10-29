// API Configuration
export const API_BASE_URL = 'http://192.168.29.164:5000/api';

// Firewall Configuration
export const FIREWALL_CONFIG = {
  // Check interval in milliseconds
  POLICY_SYNC_INTERVAL: 300000, // 5 minutes
  HEARTBEAT_INTERVAL: 60000, // 1 minute
  
  // Categories
  BLOCKED_CATEGORIES: [
    'adult',
    'gambling',
    'malware',
    'phishing',
    'social_media',
    'games',
    'streaming'
  ],
  
  // Default blocked domains
  DEFAULT_BLOCKLIST: [
    // Social Media
    'facebook.com',
    'instagram.com',
    'tiktok.com',
    'snapchat.com',
    'twitter.com',
    'x.com',
    
    // Gaming
    'steam.com',
    'roblox.com',
    'minecraft.net',
    'epicgames.com',
    
    // Streaming
    'netflix.com',
    'youtube.com',
    'twitch.tv',
    'hulu.com',
    
    // Gambling
    'bet365.com',
    'pokerstars.com',
  ],
  
  // Allowed educational domains
  DEFAULT_ALLOWLIST: [
    'google.com',
    'wikipedia.org',
    'khanacademy.org',
    'coursera.org',
    'edx.org',
    'stackoverflow.com',
    'github.com',
    'classroom.google.com',
  ],
};

// AI Model Configuration
export const AI_CONFIG = {
  // TensorFlow model settings
  MODEL_PATH: './models/url_classifier',
  CONFIDENCE_THRESHOLD: 0.7,
  
  // Behavioral analysis
  SUSPICIOUS_PATTERNS: [
    /(?:hack|crack|keygen|torrent|pirate)/i,
    /(?:xxx|porn|adult|sex)/i,
    /(?:bet|casino|poker|lottery)/i,
  ],
};

// Violation Types
export const VIOLATION_TYPES = {
  BLOCKED_DOMAIN: 'blocked_domain',
  BLOCKED_APP: 'blocked_app',
  SUSPICIOUS_BEHAVIOR: 'suspicious_behavior',
  MALWARE_DETECTED: 'malware_detected',
  PHISHING_ATTEMPT: 'phishing_attempt',
};
