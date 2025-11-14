// Error logger para debug
export const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${context}: ${error?.message || error}`;
  console.error(message);
  if (error?.stack) {
    console.error('Stack:', error.stack);
  }
  
  // Você pode adicionar aqui envio para servidor de logs se necessário
  return message;
};

export const setupGlobalErrorHandler = () => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    // Log adicional se necessário
  };
  
  if (global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
    
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError(error, isFatal ? 'FATAL' : 'NON-FATAL');
      
      // Não propagar erro fatal para evitar crash
      if (!isFatal && typeof originalHandler === 'function') {
        originalHandler(error, isFatal);
      }
    });
  }
};
