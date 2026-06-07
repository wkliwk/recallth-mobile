/**
 * Expo config plugin: Recallth Widget
 *
 * Applied automatically by `npx expo prebuild` (or EAS Build).
 * No manual Xcode steps required.
 *
 * What it does:
 *   1. Copies native widget source files from native/ios/RecallthWidget/
 *      into ios/RecallthWidget/ (which is gitignored as a generated dir)
 *   2. Adds a WidgetKit extension target to the Xcode project
 *   3. Adds App Groups entitlement to the main app (for shared UserDefaults)
 *   4. Adds the native module source files (bridge to RN) to the main target
 *   5. Ensures the recallth:// URL scheme is in Info.plist
 *
 * @see https://docs.expo.dev/config-plugins/introduction/
 */

const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_GROUP = 'group.com.recallth.mobile';
const WIDGET_TARGET = 'RecallthWidget';

const WIDGET_SOURCE_DIR = path.join(__dirname, '../native/ios/RecallthWidget');

// ---------------------------------------------------------------------------
// Step 1: Copy native files from native/ios/ → ios/ during prebuild
// ---------------------------------------------------------------------------
const withCopyWidgetFiles = (config) =>
  withDangerousMod(config, [
    'ios',
    async (mod) => {
      const iosRoot = mod.modRequest.platformProjectRoot;
      const destDir = path.join(iosRoot, WIDGET_TARGET);

      fs.mkdirSync(destDir, { recursive: true });

      const files = fs.readdirSync(WIDGET_SOURCE_DIR);
      files.forEach((file) => {
        const src = path.join(WIDGET_SOURCE_DIR, file);
        const dest = path.join(destDir, file);
        fs.copyFileSync(src, dest);
      });

      return mod;
    },
  ]);

// ---------------------------------------------------------------------------
// Step 2: Add App Groups entitlement to the main app target
// ---------------------------------------------------------------------------
const withAppGroupEntitlements = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;
    const groups =
      entitlements['com.apple.security.application-groups'] ?? [];
    if (!groups.includes(APP_GROUP)) {
      entitlements['com.apple.security.application-groups'] = [
        ...groups,
        APP_GROUP,
      ];
    }
    return mod;
  });

// ---------------------------------------------------------------------------
// Step 3: Register the native module source files with the main Xcode target
// ---------------------------------------------------------------------------
const withNativeModuleFiles = (config) =>
  withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const iosRoot = mod.modRequest.platformProjectRoot;

    const moduleFiles = [
      path.join(iosRoot, WIDGET_TARGET, 'RecallthWidgetModule.swift'),
      path.join(iosRoot, WIDGET_TARGET, 'RecallthWidgetModule.m'),
    ];

    moduleFiles.forEach((filePath) => {
      const relativePath = path.relative(iosRoot, filePath);
      const refs = xcodeProject.pbxFileReferenceSection();
      const alreadyAdded = Object.values(refs).some(
        (f) => typeof f === 'object' && f.path === relativePath
      );
      if (alreadyAdded) return;

      xcodeProject.addSourceFile(
        relativePath,
        { target: xcodeProject.getFirstTarget().uuid },
        xcodeProject.getFirstTarget().uuid
      );
    });

    return mod;
  });

// ---------------------------------------------------------------------------
// Step 4: Add the Widget Extension target to the Xcode project
// ---------------------------------------------------------------------------
const withWidgetTarget = (config) =>
  withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const iosRoot = mod.modRequest.platformProjectRoot;
    const bundleId =
      config.ios?.bundleIdentifier ?? 'com.recallth.mobile';
    const widgetBundleId = `${bundleId}.widget`;

    const targets = xcodeProject.pbxNativeTargetSection();
    const alreadyExists = Object.values(targets).some(
      (t) => typeof t === 'object' && t.name === WIDGET_TARGET
    );
    if (alreadyExists) return mod;

    const swiftRelPath = path.relative(
      iosRoot,
      path.join(iosRoot, WIDGET_TARGET, 'RecallthWidgetExtension.swift')
    );
    const infoPlistRelPath = path.relative(
      iosRoot,
      path.join(iosRoot, WIDGET_TARGET, 'Info.plist')
    );

    xcodeProject.addTarget(
      WIDGET_TARGET,
      'app_extension',
      WIDGET_TARGET,
      widgetBundleId
    );

    const widgetTargetEntry = Object.values(
      xcodeProject.pbxNativeTargetSection()
    ).find((t) => typeof t === 'object' && t.name === WIDGET_TARGET);

    if (!widgetTargetEntry) return mod;

    xcodeProject.addSourceFile(
      swiftRelPath,
      { target: widgetTargetEntry.uuid },
      widgetTargetEntry.uuid
    );
    xcodeProject.addResourceFile(
      infoPlistRelPath,
      { target: widgetTargetEntry.uuid },
      widgetTargetEntry.uuid
    );
    xcodeProject.addFramework('WidgetKit.framework', {
      target: widgetTargetEntry.uuid,
    });
    xcodeProject.addFramework('SwiftUI.framework', {
      target: widgetTargetEntry.uuid,
    });

    const allConfigs = xcodeProject.pbxXCBuildConfigurationSection();
    const allLists = xcodeProject.pbxXCConfigurationListSection();

    const widgetConfigListUuid = widgetTargetEntry.buildConfigurationList;

    const widgetConfigList = allLists[widgetConfigListUuid];
    const widgetConfigUuids = (
      widgetConfigList?.buildConfigurations ?? []
    ).map((ref) => ref.value);

    widgetConfigUuids.forEach((uuid) => {
      const cfg = allConfigs[uuid];
      if (!cfg?.buildSettings) return;
      cfg.buildSettings.SWIFT_VERSION = '5.0';
      cfg.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
      cfg.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.0';
      cfg.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = widgetBundleId;
      cfg.buildSettings.PRODUCT_NAME = WIDGET_TARGET;
      cfg.buildSettings.INFOPLIST_FILE = `${WIDGET_TARGET}/Info.plist`;
      cfg.buildSettings.CODE_SIGN_ENTITLEMENTS = `${WIDGET_TARGET}/RecallthWidget.entitlements`;
    });

    return mod;
  });

// ---------------------------------------------------------------------------
// Step 5: Ensure recallth:// scheme in Info.plist (for widget deep link)
// ---------------------------------------------------------------------------
const withDeepLinkScheme = (config) =>
  withInfoPlist(config, (mod) => {
    const infoPlist = mod.modResults;
    const urlTypes = infoPlist.CFBundleURLTypes ?? [];
    const alreadySet = urlTypes.some((t) =>
      (t.CFBundleURLSchemes ?? []).includes('recallth')
    );
    if (!alreadySet) {
      infoPlist.CFBundleURLTypes = [
        ...urlTypes,
        {
          CFBundleURLName: 'com.recallth.mobile',
          CFBundleURLSchemes: ['recallth'],
        },
      ];
    }
    return mod;
  });

// ---------------------------------------------------------------------------
// Export: compose all modifications
// ---------------------------------------------------------------------------
module.exports = (config) => {
  config = withCopyWidgetFiles(config);
  config = withAppGroupEntitlements(config);
  config = withNativeModuleFiles(config);
  config = withWidgetTarget(config);
  config = withDeepLinkScheme(config);
  return config;
};
