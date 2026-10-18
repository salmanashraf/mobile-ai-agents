"""Original adapter for the optional Minitap SDK; no upstream code is bundled."""

import asyncio
import importlib.metadata
import json
import os
import sys

SDK_VERSION = "4.0.0"


def probe():
    if sys.version_info < (3, 12):
        return {"status": "blocked", "reason": "python-3.12-required"}
    try:
        version = importlib.metadata.version("minitap-mobile-use")
    except importlib.metadata.PackageNotFoundError:
        return {"status": "blocked", "reason": "sdk-not-installed"}
    if version != SDK_VERSION:
        return {"status": "blocked", "reason": "sdk-version-mismatch"}
    return {"status": "ready", "sdkVersion": version}


async def automate(payload, sdk=None):
    # SDK injection is used only by offline contract tests, never by the CLI.
    if sdk is None:
        from minitap.mobile_use.config import LLMConfig
        from minitap.mobile_use.context import DevicePlatform
        from minitap.mobile_use.sdk import Agent
        from minitap.mobile_use.sdk.builders.agent_config_builder import AgentConfigBuilder
        from minitap.mobile_use.sdk.types.task import AgentProfile
        sdk = (LLMConfig, DevicePlatform, Agent, AgentConfigBuilder, AgentProfile)
    LLMConfig, DevicePlatform, Agent, AgentConfigBuilder, AgentProfile = sdk
    # Full explicit JSON config: never fall back to upstream's interactive defaults.
    llm = LLMConfig.model_validate(payload["modelConfig"])
    llm.validate_providers()
    profile = AgentProfile(name="mobile-ai-agents", llm_config=llm)
    config = (
        AgentConfigBuilder()
        .with_default_profile(profile)
        .for_device(DevicePlatform(payload["platform"]), payload["device"])
        .build()
    )
    agent = Agent(config=config)
    try:
        await agent.init(server_restart_attempts=1, retry_count=1, retry_wait_seconds=1)
        request = (
            agent.new_task(payload["goal"])
            .with_locked_app_package(payload["appId"])
            .with_max_steps(payload["maxSteps"])
            .with_trace_recording(enabled=False)
            .without_llm_output_saving()
            .without_thoughts_output_saving()
            .build()
        )
        result = await agent.run_task(request=request)
        if result is None:
            return {"status": "failed", "reason": "sdk-returned-no-result"}
        # Never serialize model output or promote it to independently verified success.
        return {"status": "executed-unverified", "reason": "independent-device-proof-required"}
    finally:
        await agent.clean()


def main():
    os.environ["MOBILE_USE_TELEMETRY_ENABLED"] = "false"
    os.environ["DOTENV_DISABLED"] = "1"
    os.environ.pop("EVENTS_OUTPUT_PATH", None)
    os.environ.pop("RESULTS_OUTPUT_PATH", None)
    if len(sys.argv) > 1 and sys.argv[1] == "--probe":
        print(json.dumps(probe()))
        return
    result = probe()
    if result["status"] == "ready":
        try:
            payload = json.load(sys.stdin)
            result = asyncio.run(automate(payload))
        except BaseException:
            result = {"status": "failed", "reason": "sdk-error-details-suppressed"}
    with os.fdopen(3, "w") as protocol:
        json.dump(result, protocol)


if __name__ == "__main__":
    main()
