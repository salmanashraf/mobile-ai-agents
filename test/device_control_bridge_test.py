"""Offline adapter contract tests, deliberately not a live mobile-use run."""
import asyncio
import importlib.util
from pathlib import Path
import unittest
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location("bridge", Path(__file__).parents[1] / "cli/bridges/mobile_use.py")
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


class BridgeContract(unittest.TestCase):
    def test_dotenv_loading_disabled_for_legacy_dependency(self):
        module = SimpleNamespace(load_dotenv=lambda: True, main=SimpleNamespace(load_dotenv=lambda: True))
        bridge.disable_dotenv(module)
        self.assertFalse(module.load_dotenv())
        self.assertFalse(module.main.load_dotenv())

    def exercise(self, outcome="result", platform="android"):
        calls = {}

        class LLM:
            @classmethod
            def model_validate(cls, config):
                calls["config"] = config
                return cls()

            def validate_providers(self):
                calls["providers_validated"] = True

        class Profile:
            def __init__(self, **kwargs):
                calls["profile"] = kwargs["name"]

        class Builder:
            def with_default_profile(self, profile): return self
            def for_device(self, platform, device):
                calls["device"] = (platform, device)
                return self
            def build(self): return "config"

        class Task:
            def with_locked_app_package(self, app): calls["app"] = app; return self
            def with_max_steps(self, count): calls["steps"] = count; return self
            def with_trace_recording(self, enabled): calls["trace"] = enabled; return self
            def without_llm_output_saving(self): calls["output_disabled"] = True; return self
            def without_thoughts_output_saving(self): calls["thoughts_disabled"] = True; return self
            def build(self): return "request"

        class Agent:
            def __init__(self, config): calls["agent_config"] = config
            async def init(self, **kwargs):
                calls["init"] = kwargs
                if outcome == "init-error": raise RuntimeError("secret")
            def new_task(self, goal): calls["goal"] = goal; return Task()
            async def run_task(self, request):
                if outcome == "run-error": raise RuntimeError("secret")
                if outcome == "cancel": raise asyncio.CancelledError()
                return None if outcome == "empty" else {"private": "secret"}
            async def clean(self): calls["cleaned"] = True

        task = {"platform": platform, "device": "test-device", "appId": "com.example.demo", "maxSteps": 7, "goal": "Inspect test app", "modelConfig": {"test": True}}
        try:
            result = asyncio.run(bridge.automate(task, (LLM, str, Agent, Builder, Profile)))
        except BaseException:
            self.assertTrue(calls["cleaned"])
            raise
        return result, calls

    def test_mapped_device_app_bounds_and_no_false_verified_status(self):
        for platform in ["android", "ios"]:
            result, calls = self.exercise(platform=platform)
            self.assertEqual(result["status"], "executed-unverified")
            self.assertNotIn("secret", str(result))
            self.assertEqual(calls["device"], (platform, "test-device"))
            self.assertEqual(calls["app"], "com.example.demo")
            self.assertEqual(calls["steps"], 7)
            self.assertFalse(calls["trace"])
            self.assertTrue(calls["output_disabled"] and calls["thoughts_disabled"] and calls["cleaned"])

    def test_empty_result_is_failure(self):
        self.assertEqual(self.exercise("empty")[0]["status"], "failed")

    def test_cleanup_after_init_failure_task_failure_and_cancellation(self):
        for outcome in ["init-error", "run-error"]:
            with self.assertRaises(RuntimeError): self.exercise(outcome)
        with self.assertRaises(asyncio.CancelledError): self.exercise("cancel")


if __name__ == "__main__":
    unittest.main()
