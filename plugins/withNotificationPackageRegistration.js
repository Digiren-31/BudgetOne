/**
 * Expo Config Plugin to register NotificationListenerPackage with MainApplication
 */

const { withMainApplication } = require('@expo/config-plugins');

module.exports = function withNotificationPackageRegistration(config) {
  return withMainApplication(config, async (config) => {
    const mainApplication = config.modResults;
    const packageName = config.android?.package || 'com.chillar.app';
    
    // Add import for NotificationListenerPackage
    const importStatement = `import ${packageName}.NotificationListenerPackage`;
    
    if (!mainApplication.contents.includes(importStatement)) {
      // Find the package imports section and add our import
      const importRegex = /(import\s+com\.facebook\.react\..*)/;
      const match = mainApplication.contents.match(importRegex);
      
      if (match) {
        mainApplication.contents = mainApplication.contents.replace(
          match[0],
          `${match[0]}\n${importStatement}`
        );
      }
    }
    
    // Add NotificationListenerPackage to getPackages()
    const packageRegistration = 'add(NotificationListenerPackage())';
    
    if (!mainApplication.contents.includes(packageRegistration)) {
      // Look for add(SmsReceiverPackage()) and add after it
      const smsPackageRegex = /(add\(SmsReceiverPackage\(\)\))/;
      const smsMatch = mainApplication.contents.match(smsPackageRegex);
      
      if (smsMatch) {
        mainApplication.contents = mainApplication.contents.replace(
          smsMatch[0],
          `${smsMatch[0]}\n            ${packageRegistration}`
        );
      } else {
        // Alternative: Look for packages.apply block
        const applyBlockRegex = /(PackageList\([^)]*\)\.packages\.apply\s*\{)/;
        const applyMatch = mainApplication.contents.match(applyBlockRegex);
        
        if (applyMatch) {
          mainApplication.contents = mainApplication.contents.replace(
            applyMatch[0],
            `${applyMatch[0]}\n            ${packageRegistration}`
          );
        }
      }
    }
    
    return config;
  });
};
