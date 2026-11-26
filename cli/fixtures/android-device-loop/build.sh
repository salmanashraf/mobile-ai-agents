#!/usr/bin/env bash
set -euo pipefail
fixture_dir="$(cd "$(dirname "$0")" && pwd)"
sdk_dir="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [[ -z "$sdk_dir" ]]; then
  echo 'Set ANDROID_SDK_ROOT to your Android SDK folder.' >&2
  exit 1
fi
platform="${DEMO_ANDROID_PLATFORM:-android-35}"
build_version="${DEMO_BUILD_TOOLS:-35.0.0}"
tools_dir="$sdk_dir/build-tools/$build_version"
android_jar="$sdk_dir/platforms/$platform/android.jar"
for tool in aapt d8 zipalign apksigner; do
  test -x "$tools_dir/$tool" || { echo "Missing Android build tool: $tool ($build_version)" >&2; exit 1; }
done
test -f "$android_jar" || { echo "Install SDK platform $platform." >&2; exit 1; }
out="$fixture_dir/build"
mkdir -p "$out/classes" "$out/dex"
javac -source 8 -target 8 -bootclasspath "$android_jar" -d "$out/classes" "$fixture_dir/MainActivity.java"
"$tools_dir/d8" --lib "$android_jar" --output "$out/dex" "$out/classes/dev/mobileai/demo/"*.class
"$tools_dir/aapt" package -f -M "$fixture_dir/AndroidManifest.xml" -I "$android_jar" -F "$out/unsigned.apk"
(cd "$out/dex" && zip -q "$out/unsigned.apk" classes.dex)
"$tools_dir/zipalign" -f 4 "$out/unsigned.apk" "$out/aligned.apk"
if [[ ! -f "$out/demo.keystore" ]]; then
  keytool -genkeypair -keystore "$out/demo.keystore" -storepass android -keypass android -alias demo -keyalg RSA -validity 3650 -dname 'CN=Public Demo' >/dev/null 2>&1
fi
"$tools_dir/apksigner" sign --ks "$out/demo.keystore" --ks-pass pass:android --out "$out/demo.apk" "$out/aligned.apk"
echo "Built $out/demo.apk (public demo key, never use for production)."
