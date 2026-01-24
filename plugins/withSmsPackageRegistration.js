/**
 * Expo Config Plugin to add SmsReceiverPackage to MainApplication
 * 
 * This modifies the MainApplication.kt to include our custom SMS package
 */

const { withMainApplication } = require('@expo/config-plugins');

function withSmsPackageRegistration(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const packageName = config.android?.package || 'com.budgetone.app';

    // Add import statement if not present
    const importStatement = `import ${packageName}.SmsReceiverPackage`;
    if (!contents.includes(importStatement)) {
      // Find the package imports section and add our import
      const importRegex = /(import com\.facebook\.react\.)/;
      if (importRegex.test(contents)) {
        contents = contents.replace(
          importRegex,
          `${importStatement}\n$1`
        );
      }
    }

    // Add package to getPackages() method
    // Look for the packages list and add our package
    if (!contents.includes('SmsReceiverPackage()')) {
      // For Kotlin MainApplication
      const packagesRegex = /(override fun getPackages\(\): List<ReactPackage> \{[\s\S]*?return PackageList\(this\)\.packages\.apply \{)/;
      if (packagesRegex.test(contents)) {
        contents = contents.replace(
          packagesRegex,
          `$1\n            add(SmsReceiverPackage())`
        );
      } else {
        // Alternative pattern for different MainApplication structures
        const altPackagesRegex = /(packages\.apply \{)/;
        if (altPackagesRegex.test(contents)) {
          contents = contents.replace(
            altPackagesRegex,
            `$1\n            add(SmsReceiverPackage())`
          );
        }
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withSmsPackageRegistration;
