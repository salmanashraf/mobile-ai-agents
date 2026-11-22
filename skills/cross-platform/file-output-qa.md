# Skill — /file-output-qa

**Platform:** Cross-Platform  
**Category:** Testing & Verification  
**Composable With:** /mobile-mcp-qa, /prd-verification, /perf-audit, /security-audit

---

## Purpose

Verify that a mobile app produced a valid, useful file without treating a successful tap flow or a smaller output as proof of quality.

## When to Use

- When an app compresses, converts, exports, scans, edits, records, or generates a file.
- When device QA must prove both the UI flow and the resulting artifact.
- When a release gate needs reproducible measurements for PDFs, images, audio, video, archives, or documents.

## Inputs

```text
COMMAND: /file-output-qa
TRANSFORMATION: <compress | convert | export | scan | edit | generate>
ARTIFACT_TYPE: <PDF | image | audio | video | archive | document | other>
FIXTURES:
<stable fixture ids, paths, hashes, categories, and privacy classification>
EXPECTED:
<required structural, content, size, metadata, and quality properties>
OUTPUTS:
<output paths or device export locations>
TOOLS:
<available parsers, renderers, comparators, media probes, device tools>
LIMITS:
<time, memory, size, quality, or tolerance thresholds>
```

## Skill Prompt

```text
Verify the files produced by the supplied mobile transformation flow.

1. Establish fixture identity before execution. Record a stable id, byte size, and SHA-256 hash. Use only public, synthetic, or explicitly approved fixtures. Never publish private document contents.
2. Run the transformation through the app or consume outputs from a separately evidenced device run. Record app version, commit, platform, device, mode/settings, elapsed time, and output path.
3. Validate every applicable dimension independently:
   - STRUCTURE: the output opens and its container is valid.
   - CONTENT: required pages, frames, tracks, entries, text, or other items remain.
   - SIZE: report input bytes, output bytes, and signed percentage change. A smaller file is not automatically a pass.
   - QUALITY: use a declared visual/audio/content method and tolerance. If no suitable comparator exists, mark quality BLOCKED or require named human review.
   - METADATA: verify required preservation or removal explicitly.
   - SAFETY: check unexpected network use, temporary-file leakage, unsafe paths, sensitive logs, and permission scope when evidence is available.
4. Exercise relevant edge fixtures: empty, corrupt, encrypted/unsupported, already optimized, unusually large, and cancellation/interruption. Use NOT_APPLICABLE only with a reason.
5. Never infer file quality from a screenshot of the success screen. Never infer success from exit code, file existence, or size reduction alone.
6. Every PASS and FAIL must cite a file measurement, parser result, render/comparison artifact, log, test output, or named review. Missing evidence is BLOCKED, not PASS.
7. Keep device-flow evidence separate from artifact evidence, then link both in the final report.

Output exactly:

FILE OUTPUT QA REPORT
=====================
Transformation:
Artifact Type:
App/Build:
Platform/Device:
Result: PASS | FAIL | BLOCKED

Fixture Results:
| Fixture | Mode | Structure | Content | Size | Quality | Metadata | Result |
|---|---|---|---|---|---|---|---|

Measurements:
| Fixture | Input Bytes | Output Bytes | Change | Duration | Evidence |
|---|---|---|---|---|---|

Edge Cases:
| Case | Expected | Observed | Evidence | Result |
|---|---|---|---|---|

Safety Findings:
| Check | Evidence | Result |
|---|---|---|

Blocked Checks:
- <missing tool, fixture, permission, or evidence, or "None">

Issues:
| Severity | Fixture | Issue | Evidence | Required Fix |
|---|---|---|---|---|

Recommended Next Action:
<one concrete action>
```

## Example

**Input:**

```text
COMMAND: /file-output-qa
TRANSFORMATION: compress
ARTIFACT_TYPE: PDF
FIXTURES:
- scan-01.pdf, sha256 6b7..., 12,000,000 bytes, synthetic scanned document
- text-01.pdf, sha256 913..., 240,000 bytes, public text-only document
EXPECTED:
- Both outputs open and keep their original page counts.
- Balanced mode should reduce image-heavy input without unreadable pages.
- Text-only input may remain unchanged when recompression would increase size.
OUTPUTS:
- scan-01-balanced.pdf
- text-01-balanced.pdf
TOOLS:
- PDF parser, page renderer, SHA-256, byte measurement
LIMITS:
- No page loss; rendered text must remain readable; no output larger than input is accepted as a saving.
```

**Output:**

```text
FILE OUTPUT QA REPORT
=====================
Transformation: compress
Artifact Type: PDF
App/Build: PDF Compressor 1.0.11
Platform/Device: Android / Pixel 7 API 35
Result: FAIL

Fixture Results:
| Fixture | Mode | Structure | Content | Size | Quality | Metadata | Result |
|---|---|---|---|---|---|---|---|
| scan-01 | Balanced | PASS | PASS | PASS | FAIL | PASS | FAIL |
| text-01 | Balanced | PASS | PASS | PASS | PASS | PASS | PASS |

Measurements:
| Fixture | Input Bytes | Output Bytes | Change | Duration | Evidence |
|---|---|---|---|---|---|
| scan-01 | 12000000 | 3100000 | -74.17% | 8.4s | parser + render diff |
| text-01 | 240000 | 240000 | 0.00% | 0.6s | original retained log |

Edge Cases:
| Case | Expected | Observed | Evidence | Result |
|---|---|---|---|---|
| Already optimized | Keep original | Original retained | app log | PASS |

Safety Findings:
| Check | Evidence | Result |
|---|---|---|
| Temporary file cleanup | No residue after restart | BLOCKED: storage inspection unavailable | BLOCKED |

Blocked Checks:
- Temporary-file inspection needs app-owned storage access.

Issues:
| Severity | Fixture | Issue | Evidence | Required Fix |
|---|---|---|---|---|
| CRITICAL | scan-01 | Page 3 text is unreadable | rendered page comparison | Preserve higher render resolution |

Recommended Next Action:
Increase Balanced scan resolution and rerun scan-01 before release.
```

## Composition Example

```text
1. Run /mobile-mcp-qa to prove selection, progress, cancellation, result, save, and share behavior.
2. Run /file-output-qa on the exported files.
3. Use device-proof-report to link UI evidence and artifact evidence.
4. Run /prd-verification before declaring the feature complete.
```

## Notes

- This skill does not operate the device; pair it with `/mobile-mcp-qa`.
- Quality metrics depend on artifact type and declared tooling. Do not invent a universal threshold.
- Hashes establish fixture identity; they do not prove output quality.

