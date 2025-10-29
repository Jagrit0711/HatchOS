import { AI_CONFIG } from '../config/firewall.config';

class AIDetectionService {
  constructor() {
    this.isInitialized = false;
    this.model = null;
  }

  async initialize() {
    try {
      console.log('🤖 Initializing AI Detection Service...');
      
      // In a production app, you would load a TensorFlow.js model here
      // For now, we'll use heuristic-based detection
      
      this.isInitialized = true;
      console.log('✅ AI Detection Service initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ AI initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeUrl(url) {
    try {
      // Heuristic-based URL analysis
      const urlLower = url.toLowerCase();
      
      // Check for suspicious patterns
      for (const pattern of AI_CONFIG.SUSPICIOUS_PATTERNS) {
        if (pattern.test(url)) {
          return {
            safe: false,
            reason: `Suspicious pattern detected: ${pattern.source}`,
            confidence: 0.9,
            category: this.categorizeByPattern(pattern),
          };
        }
      }
      
      // Check for known phishing indicators
      if (this.isPhishingAttempt(url)) {
        return {
          safe: false,
          reason: 'Potential phishing attempt detected',
          confidence: 0.85,
          category: 'phishing',
        };
      }
      
      // Check for malware indicators
      if (this.isMalwareUrl(url)) {
        return {
          safe: false,
          reason: 'Potential malware detected',
          confidence: 0.8,
          category: 'malware',
        };
      }
      
      // Behavioral analysis - check URL structure
      const behaviorScore = this.analyzeBehavior(url);
      
      if (behaviorScore < 0.3) {
        return {
          safe: false,
          reason: 'Suspicious URL structure detected',
          confidence: behaviorScore,
          category: 'suspicious',
        };
      }
      
      return {
        safe: true,
        reason: 'URL appears safe',
        confidence: behaviorScore,
        category: 'safe',
      };
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      return {
        safe: true,
        reason: 'Error during analysis',
        confidence: 0,
      };
    }
  }

  isPhishingAttempt(url) {
    // Check for common phishing indicators
    const phishingIndicators = [
      /paypal.*verify/i,
      /account.*suspend/i,
      /secure.*update/i,
      /confirm.*identity/i,
      /unusual.*activity/i,
      /\.tk$|\.ml$|\.ga$|\.cf$/i, // Free TLDs often used for phishing
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses instead of domains
    ];
    
    return phishingIndicators.some(indicator => indicator.test(url));
  }

  isMalwareUrl(url) {
    // Check for malware indicators
    const malwareIndicators = [
      /\.exe$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /download.*crack/i,
      /keygen/i,
      /activator/i,
    ];
    
    return malwareIndicators.some(indicator => indicator.test(url));
  }

  analyzeBehavior(url) {
    let score = 1.0;
    
    // Penalize very long URLs
    if (url.length > 200) score -= 0.3;
    
    // Penalize excessive subdomains
    const subdomainCount = (url.match(/\./g) || []).length;
    if (subdomainCount > 4) score -= 0.2;
    
    // Penalize URLs with many special characters
    const specialCharCount = (url.match(/[^a-zA-Z0-9.-\/]/g) || []).length;
    if (specialCharCount > 5) score -= 0.2;
    
    // Penalize URLs using @ symbol (often used in phishing)
    if (url.includes('@')) score -= 0.4;
    
    // Penalize URLs with suspicious keywords
    const suspiciousKeywords = ['login', 'verify', 'update', 'secure', 'account'];
    const keywordMatches = suspiciousKeywords.filter(keyword => 
      url.toLowerCase().includes(keyword)
    );
    score -= keywordMatches.length * 0.1;
    
    return Math.max(0, score);
  }

  categorizeByPattern(pattern) {
    const patternString = pattern.source.toLowerCase();
    
    if (patternString.includes('hack') || patternString.includes('crack')) {
      return 'malware';
    }
    
    if (patternString.includes('xxx') || patternString.includes('porn')) {
      return 'adult';
    }
    
    if (patternString.includes('bet') || patternString.includes('casino')) {
      return 'gambling';
    }
    
    return 'suspicious';
  }

  async categorizeWebsite(url, content = null) {
    // This would use a ML model to categorize websites
    // For now, return basic heuristic-based categorization
    
    const urlLower = url.toLowerCase();
    
    const categories = {
      educational: ['edu', 'academy', 'learn', 'course', 'tutorial'],
      social: ['facebook', 'instagram', 'twitter', 'tiktok', 'snapchat'],
      gaming: ['game', 'play', 'steam', 'roblox', 'minecraft'],
      streaming: ['netflix', 'youtube', 'twitch', 'hulu', 'video'],
      news: ['news', 'cnn', 'bbc', 'nytimes'],
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => urlLower.includes(keyword))) {
        return {
          category,
          confidence: 0.8,
        };
      }
    }
    
    return {
      category: 'uncategorized',
      confidence: 0.5,
    };
  }
}

export default new AIDetectionService();
