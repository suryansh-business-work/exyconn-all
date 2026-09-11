const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Signs the release APK and AAB with the upload keystore CI decodes from its secrets.
 *
 * The generated project signs `release` with the debug keystore, which would ship a build no
 * later build could install over and the Play Console would refuse. This points `release` at
 * a keystore named by the environment instead — and deliberately gives it NO fallback: a
 * release built without the four variables fails Gradle's own signing validation, rather than
 * quietly producing a debug-signed file that looks like a release.
 *
 * Env (set by .github/workflows/tracker-release.yml from repository secrets):
 *   EXYCONN_UPLOAD_STORE_FILE, EXYCONN_UPLOAD_STORE_PASSWORD,
 *   EXYCONN_UPLOAD_KEY_ALIAS, EXYCONN_UPLOAD_KEY_PASSWORD
 */
const RELEASE_SIGNING = `
        release {
            def exyconnStore = System.getenv('EXYCONN_UPLOAD_STORE_FILE')
            if (exyconnStore) {
                storeFile file(exyconnStore)
                storePassword System.getenv('EXYCONN_UPLOAD_STORE_PASSWORD')
                keyAlias System.getenv('EXYCONN_UPLOAD_KEY_ALIAS')
                keyPassword System.getenv('EXYCONN_UPLOAD_KEY_PASSWORD')
            }
        }`;

const SIGNING_BLOCK = 'signingConfigs {';
const RELEASE_BUILD_TYPE = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;

function applyReleaseSigning(gradle) {
  if (gradle.includes("System.getenv('EXYCONN_UPLOAD_STORE_FILE')")) {
    return gradle;
  }
  if (!gradle.includes(SIGNING_BLOCK) || !RELEASE_BUILD_TYPE.test(gradle)) {
    throw new Error(
      'with-android-release-signing: app/build.gradle no longer has the signingConfigs / release blocks this plugin edits. Update the plugin for the new template.',
    );
  }
  return gradle
    .replace(SIGNING_BLOCK, `${SIGNING_BLOCK}${RELEASE_SIGNING}`)
    .replace(RELEASE_BUILD_TYPE, '$1signingConfig signingConfigs.release');
}

module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = applyReleaseSigning(mod.modResults.contents);
    return mod;
  });
