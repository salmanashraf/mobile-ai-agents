#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: run-ios-simulator.sh NEW_OUTPUT_DIRECTORY" >&2
  exit 2
fi

output_dir="$1"
if [[ -e "$output_dir" ]]; then
  echo "Output directory already exists: $output_dir" >&2
  exit 2
fi
mkdir -m 700 "$output_dir"

fixture_dir="$(cd "$(dirname "$0")" && pwd)"
repo_dir="$(cd "$fixture_dir/../../.." && pwd)"
work_dir="$(mktemp -d /tmp/mobile-parity-ios.XXXXXX)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then kill "$server_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT

node "$fixture_dir/server.js" "$work_dir" >"$work_dir/server.log" 2>&1 &
server_pid="$!"
for _ in {1..100}; do [[ -f "$work_dir/server-url.txt" ]] && break; sleep 0.05; done
if [[ ! -f "$work_dir/server-url.txt" ]]; then echo "Fixture server did not start" >&2; exit 1; fi
base_url="$(<"$work_dir/server-url.txt")"

node "$repo_dir/cli/index.js" network capture --url "$base_url" --flow "$fixture_dir/flow.json" --out "$output_dir/web-capture" --channel chrome
node "$repo_dir/cli/index.js" network contract --capture "$output_dir/web-capture/capture.json" --out "$output_dir/contract"

app_dir="$work_dir/MobileParityFixture.app"
mkdir "$app_dir"
cp "$fixture_dir/Info.plist" "$app_dir/Info.plist"
sdk_path="$(xcrun --sdk iphonesimulator --show-sdk-path)"
architecture="$(uname -m)"
xcrun --sdk iphonesimulator swiftc -parse-as-library -target "${architecture}-apple-ios17.0-simulator" -sdk "$sdk_path" "$fixture_dir/ParityFixtureApp.swift" -o "$app_dir/MobileParityFixture"
codesign --force --sign - "$app_dir" >/dev/null
xcrun simctl install booted "$app_dir"
SIMCTL_CHILD_PARITY_BASE_URL="$base_url" xcrun simctl launch --terminate-running-process booted com.mobileaiagents.parityfixture >"$work_dir/launch.log"

container="$(xcrun simctl get_app_container booted com.mobileaiagents.parityfixture data)"
for _ in {1..200}; do [[ -f "$container/Documents/mobile-evidence.json" ]] && break; sleep 0.1; done
if [[ ! -f "$container/Documents/mobile-evidence.json" ]]; then echo "Simulator evidence was not produced" >&2; exit 1; fi
cp "$container/Documents/mobile-evidence.json" "$output_dir/mobile-evidence.json"
xcrun simctl io booted screenshot "$output_dir/ios-ui.png" >/dev/null
node "$repo_dir/cli/index.js" network verify --contract "$output_dir/contract/contract.json" --mobile "$output_dir/mobile-evidence.json" --out "$output_dir/parity"
echo "iOS simulator parity artifacts: $output_dir"
