import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import FirewallEngine from './FirewallEngine';

const BACKGROUND_FETCH_TASK = 'hatch-wall-background-task';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('🔄 Background task running...');
    
    // Sync policies
    await FirewallEngine.syncPolicies();
    
    // Send heartbeat
    await FirewallEngine.sendHeartbeat();
    
    console.log('✅ Background task completed');
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundService {
  async register() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes (minimum allowed)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      console.log('✅ Background service registered');
      return { success: true };
    } catch (error) {
      console.error('❌ Background service registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async unregister() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('🛑 Background service unregistered');
      return { success: true };
    } catch (error) {
      console.error('❌ Background service unregistration error:', error);
      return { success: false, error: error.message };
    }
  }

  async getStatus() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_FETCH_TASK
      );
      
      return {
        status: this.getStatusText(status),
        isRegistered,
      };
    } catch (error) {
      console.error('❌ Background service status error:', error);
      return {
        status: 'unknown',
        isRegistered: false,
      };
    }
  }

  getStatusText(status) {
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'restricted';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'denied';
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'available';
      default:
        return 'unknown';
    }
  }
}

export default new BackgroundService();
