// This file runs before any other code to patch potential errors

// Monkey-patch the global error handler to suppress DETECT_SCREEN_CAPTURE errors
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    const errorString = (error && error.message) || String(error);
    
    // Suppress screen capture permission errors
    if (errorString.includes('DETECT_SCREEN_CAPTURE') ||
        errorString.includes('registerScreenCaptureObserver') ||
        errorString.includes('Permission Denial')) {
      console.log('[SUPPRESSED] Screen capture permission error');
      return;
    }
    
    // Call original handler for other errors
    if (originalHandler) {
      originalHandler(error, isFatal);
    } else {
      console.error(error);
    }
  });
}

// Suppress console errors for screen capture
const originalConsoleError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && 
      (firstArg.includes('DETECT_SCREEN_CAPTURE') || 
       firstArg.includes('registerScreenCaptureObserver'))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.log('[Polyfill] Error suppression initialized');
