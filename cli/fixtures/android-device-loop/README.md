# Android device loop: find and fix a real UI defect

Product request: **Let me save a daily habit. Empty names must show an error.**

This tiny Android app intentionally accepts an empty habit. It has no network,
accounts, production data, or external libraries. Use it to demonstrate the
Mobile Harness planning → implementation → review → device verification loop.

## Prerequisites

Install JDK 17+, Android SDK platform 35, build-tools 35.0.0, platform-tools,
and connect an authorized Android device or start an emulator (API 26+).
Set `ANDROID_SDK_ROOT` to the SDK folder. macOS also needs the standard `zip`
utility. Set `DEMO_ANDROID_PLATFORM` / `DEMO_BUILD_TOOLS` to use other installed versions.

## Run the example

From this directory:

```bash
bash build.sh
adb -s YOUR_DEVICE install -r build/demo.apk
adb -s YOUR_DEVICE shell am start -n dev.mobileai.demo/.MainActivity
```

Use `adb devices` to find `YOUR_DEVICE`. Keep the serial explicit so a test
never silently runs on the wrong connected device.

## Give your coding agent this request

```text
Use Mobile Harness on cli/fixtures/android-device-loop.
The habit app must reject empty and whitespace-only names.
First reproduce the bug on the selected Android device and capture evidence.
Fix MainActivity.java, rebuild, then verify empty, whitespace-only, and valid
names on that same device. Save screenshots and a Device Proof Report.
Do not report PASS from a source review or build alone.
```

Before the fix, tapping Save habit with an empty input incorrectly shows
`Habit saved:`. The corrected behavior is `Enter a habit name` and no success
message. A valid input such as `Walk daily` must show `Habit saved: Walk daily`.

The expected fix is a blank-name guard before the success assignment. The
fixture deliberately ships with the defect so users can reproduce the loop.
The command `mobile-test` prepares the AI test request; the connected coding
agent and Mobile MCP perform the device interactions.
