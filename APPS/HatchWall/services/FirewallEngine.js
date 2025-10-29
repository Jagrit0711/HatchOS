import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import { API_BASE_URL, FIREWALL_CONFIG, VIOLATION_TYPES } from '../config/firewall.config';
import AIDetectionService from './AIDetectionService';

class FirewallEngine {
  constructor() {
    this.isRunning = false;
    this.blocklist = [...FIREWALL_CONFIG.DEFAULT_BLOCKLIST];
    this.allowlist = [...FIREWALL_CONFIG.DEFAULT_ALLOWLIST];
    this.deviceId = null;
    this.userId = null;
    this.policyCheckInterval = null;
    this.heartbeatInterval = null;
  }

  async initialize() {
    try {
      console.log('🔥 Initializing Firewall Engine...');
      
      // Get user ID
      this.userId = await SecureStore.getItemAsync('userId');
      
      // Register device if not already registered
      await this.registerDevice();
      
      // Sync policies from server
      await this.syncPolicies();
      
      // Initialize AI detection
      await AIDetectionService.initialize();
      
      // Start monitoring
      this.startMonitoring();
      
      this.isRunning = true;
      console.log('✅ Firewall Engine initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Firewall initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  async registerDevice() {
    try {
      const deviceId = await SecureStore.getItemAsync('deviceId');
      
      if (deviceId) {
        this.deviceId = deviceId;
        console.log('📱 Using existing device ID:', deviceId);
        return;
      }

      // Get device info
      const ipAddress = await Network.getIpAddressAsync();
      const networkState = await Network.getNetworkStateAsync();

      const response = await axios.post(`${API_BASE_URL}/firewall/register-device`, {
        userId: this.userId,
        deviceInfo: {
          ipAddress,
          networkType: networkState.type,
          isConnected: networkState.isConnected,
        },
      });

      if (response.data.deviceId) {
        this.deviceId = response.data.deviceId;
        await SecureStore.setItemAsync('deviceId', this.deviceId);
        console.log('✅ Device registered:', this.deviceId);
      }
    } catch (error) {
      console.error('❌ Device registration error:', error);
    }
  }

  async syncPolicies() {
    try {
      if (!this.deviceId) return;

      const response = await axios.get(
        `${API_BASE_URL}/firewall/policies/${this.deviceId}`
      );

      if (response.data.policies) {
        const { blocklist, allowlist } = response.data.policies;
        
        if (blocklist) {
          this.blocklist = blocklist;
        }
        
        if (allowlist) {
          this.allowlist = allowlist;
        }
        
        console.log('✅ Policies synced:', {
          blocklist: this.blocklist.length,
          allowlist: this.allowlist.length,
        });
      }
    } catch (error) {
      console.error('❌ Policy sync error:', error);
      // Use default policies if sync fails
    }
  }

  startMonitoring() {
    // Sync policies periodically
    this.policyCheckInterval = setInterval(() => {
      this.syncPolicies();
    }, FIREWALL_CONFIG.POLICY_SYNC_INTERVAL);

    // Send heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, FIREWALL_CONFIG.HEARTBEAT_INTERVAL);

    console.log('📡 Monitoring started');
  }

  stopMonitoring() {
    if (this.policyCheckInterval) {
      clearInterval(this.policyCheckInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.isRunning = false;
    console.log('🛑 Monitoring stopped');
  }

  async sendHeartbeat() {
    try {
      if (!this.deviceId) return;

      const networkState = await Network.getNetworkStateAsync();
      
      await axios.post(`${API_BASE_URL}/firewall/heartbeat`, {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
        isOnline: networkState.isConnected,
        engineStatus: this.isRunning ? 'active' : 'inactive',
      });
    } catch (error) {
      console.error('❌ Heartbeat error:', error);
    }
  }

  async analyzeUrl(url) {
    try {
      // Extract domain from URL
      const domain = this.extractDomain(url);
      
      // Check allowlist first
      if (this.isAllowed(domain)) {
        return {
          allowed: true,
          reason: 'Domain is on allowlist',
        };
      }
      
      // Check blocklist
      if (this.isBlocked(domain)) {
        await this.reportViolation(VIOLATION_TYPES.BLOCKED_DOMAIN, {
          url,
          domain,
          reason: 'Domain is on blocklist',
        });
        
        return {
          allowed: false,
          reason: 'Domain is blocked',
        };
      }
      
      // AI-powered analysis
      const aiResult = await AIDetectionService.analyzeUrl(url);
      
      if (!aiResult.safe) {
        await this.reportViolation(VIOLATION_TYPES.SUSPICIOUS_BEHAVIOR, {
          url,
          domain,
          reason: aiResult.reason,
          aiConfidence: aiResult.confidence,
        });
        
        return {
          allowed: false,
          reason: aiResult.reason,
        };
      }
      
      return {
        allowed: true,
        reason: 'URL passed all checks',
      };
    } catch (error) {
      console.error('❌ URL analysis error:', error);
      // Default to allowing on error to avoid false positives
      return {
        allowed: true,
        reason: 'Error during analysis',
      };
    }
  }

  extractDomain(url) {
    try {
      // Remove protocol
      let domain = url.replace(/^https?:\/\//, '');
      
      // Remove path
      domain = domain.split('/')[0];
      
      // Remove www
      domain = domain.replace(/^www\./, '');
      
      return domain.toLowerCase();
    } catch (error) {
      return url;
    }
  }

  isAllowed(domain) {
    return this.allowlist.some(allowed => 
      domain.includes(allowed) || allowed.includes(domain)
    );
  }

  isBlocked(domain) {
    return this.blocklist.some(blocked => 
      domain.includes(blocked) || blocked.includes(domain)
    );
  }

  async reportViolation(type, details) {
    try {
      await axios.post(`${API_BASE_URL}/firewall/violations`, {
        deviceId: this.deviceId,
        userId: this.userId,
        type,
        details,
        timestamp: new Date().toISOString(),
      });
      
      console.log('⚠️ Violation reported:', type);
    } catch (error) {
      console.error('❌ Violation reporting error:', error);
    }
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      deviceId: this.deviceId,
      blocklistSize: this.blocklist.length,
      allowlistSize: this.allowlist.length,
    };
  }
}

export default new FirewallEngine();

// Initialize on import
export const initializeFirewallEngine = async () => {
  const isAuthenticated = await SecureStore.getItemAsync('authToken');
  
  if (isAuthenticated) {
    await FirewallEngine.initialize();
  }
};
