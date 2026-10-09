"""Behavioral regressions for portable Figma harvesting and verification."""
import copy
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib

TOOLS = Path(__file__).resolve().parents[1] / 'tools' / 'figma-spec'
sys.path.insert(0, str(TOOLS))
import yaml_io
from validate_spec import validate


def png(path):
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', 1, 1, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b'\x00\xff\xff\xff\xff')) + chunk(b'IEND', b''))


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.spec = self.root / 'spec'
        for folder in ('components', 'pages', 'screenshots'):
            (self.spec / folder).mkdir(parents=True, exist_ok=True)
        self.node = {'id': '1:2', 'name': 'Submit', 'type': 'FRAME', 'width': 100.123456,
                     'height': 48, 'radius': 0, 'children': [{'id': '1:3', 'name': 'Label', 'type': 'TEXT',
                     'x': 12, 'y': 8, 'text': {'characters': 'Continue', 'fontSize': 16}}]}
        self.raw = {'nodes': [self.node], 'missing': [], 'dumpedAt': '2026-10-08T12:00:00Z', 'maxDepth': 5}
        self.dump = self.root / 'raw.json'
        self.write_raw()
        self.run_tool('dump_to_yaml.py', self.dump, self.spec / 'components', '--page', 'Checkout', '--block', 'C1')
        self.component = self.spec / 'components/submit--1-2.yml'
        png(self.spec / 'screenshots/submit--1-2.png')
        self.run_tool('crosscheck.py', self.spec, self.dump, '--write')
        doc = yaml_io.load(self.component)
        doc['verification']['screenshot_capture'] = 'pass'
        yaml_io.dump(doc, self.component)
        yaml_io.dump({'schema_version': 1, 'figma': {'file_key': 'fixture'}, 'coverage': 'complete',
                     'pages': [{'file': 'pages/checkout.yml'}]}, self.spec / 'index.yml')
        yaml_io.dump({'sections': [{'blocks': [{'code': 'C1', 'node_id': '1:2'}]}]}, self.spec / 'pages/checkout.yml')
        yaml_io.dump({'acceptance_criteria': [{'id': 'C1-AC1', 'block': 'C1', 'text': 'Continue',
                     'source': 'verbatim', 'source_node_id': '1:3', 'source_text': 'Continue',
                     'verify_by': 'native-ui-test', 'components': ['components/submit--1-2.yml']}]}, self.spec / 'acceptance_criteria.yml')
        yaml_io.dump({'questions': []}, self.spec / 'questions.yml')

    def write_raw(self):
        self.dump.write_text(json.dumps(self.raw))

    def run_tool(self, name, *args, expected=0):
        result = subprocess.run([sys.executable, str(TOOLS / name), *map(str, args)], capture_output=True, text=True)
        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
        return result

    def test_roundtrip_ambiguous_yaml_and_exact_values(self):
        values = {'id': '1:2', 'color': '#FFFFFF', 'date': '2026-10-08', 'true': 'true', 'off': 'off', 'copy': 'yes\nno', 'precision': 100.123456}
        p = self.root / 'strings.yml'
        yaml_io.dump(values, p)
        self.assertEqual(yaml_io.load(p), values)
        self.assertEqual(yaml_io.load(self.component)['frame']['width'], self.node['width'])
        self.assertEqual(validate(self.spec, strict=True), ([], []))

    def test_crosscheck_rejects_missing_and_zero_checked(self):
        self.raw['nodes'] = []
        self.write_raw()
        self.run_tool('crosscheck.py', self.spec, self.dump, '--write', expected=1)
        self.assertEqual(yaml_io.load(self.component)['verification']['values_crosscheck'], 'unverified')
        empty = self.root / 'empty'
        empty.mkdir()
        self.run_tool('crosscheck.py', empty, self.dump, expected=1)

    def test_crosscheck_detects_nested_position_changes(self):
        self.node['children'][0]['x'] = 16
        self.write_raw()
        result = self.run_tool('crosscheck.py', self.spec, self.dump, expected=1)
        self.assertIn('children[0].x', result.stdout)

    def test_crosscheck_detects_small_numeric_and_boolean_changes(self):
        self.node['radius'] = 0.005
        self.write_raw()
        self.run_tool('crosscheck.py', self.spec, self.dump, expected=1)
        from crosscheck import diff
        mismatches = []
        diff(True, 1, 'visible', mismatches)
        self.assertTrue(mismatches)

    def test_crosscheck_detects_frame_tampering(self):
        doc = yaml_io.load(self.component)
        doc['frame']['width'] = 200
        yaml_io.dump(doc, self.component)
        self.run_tool('crosscheck.py', self.spec, self.dump, expected=1)

    def test_refresh_invalidates_implementation_evidence(self):
        doc = yaml_io.load(self.component)
        doc['implementation'] = {'status': 'done', 'files': ['ui.kt'], 'screenshot_match': True}
        yaml_io.dump(doc, self.component)
        self.node['radius'] = 12
        self.write_raw()
        self.run_tool('dump_to_yaml.py', self.dump, self.spec / 'components')
        impl = yaml_io.load(self.component)['implementation']
        self.assertEqual(impl['status'], 'needs-reverification')
        self.assertIsNone(impl['screenshot_match'])
        self.assertEqual(impl['files'], ['ui.kt'])

    def test_strict_rejects_truncated_or_unknown_evidence(self):
        doc = yaml_io.load(self.component)
        doc['design']['childCount'] = 3
        doc['verification']['values_crosscheck'] = 'pending'
        yaml_io.dump(doc, self.component)
        errors, warnings = validate(self.spec, strict=True)
        self.assertFalse(errors)
        self.assertTrue(any('truncated' in w for w in warnings))
        self.run_tool('validate_spec.py', self.spec, '--strict', expected=1)

    def test_validator_rejects_bad_refs_and_duplicate_ac(self):
        doc = yaml_io.load(self.spec / 'acceptance_criteria.yml')
        doc['acceptance_criteria'].append(copy.deepcopy(doc['acceptance_criteria'][0]))
        doc['acceptance_criteria'][0]['components'] = ['components/missing.yml']
        yaml_io.dump(doc, self.spec / 'acceptance_criteria.yml')
        errors, _ = validate(self.spec)
        self.assertTrue(any('duplicate' in e for e in errors))
        self.assertTrue(any('unresolved component' in e for e in errors))
        index = yaml_io.load(self.spec / 'index.yml')
        index['pages'] = [{'file': '../outside.yml'}]
        yaml_io.dump(index, self.spec / 'index.yml')
        errors, _ = validate(self.spec)
        self.assertTrue(any('escapes' in e for e in errors))

    def test_blocking_questions_and_incomplete_scope_fail_strict(self):
        yaml_io.dump({'questions': [{'id': 'Q1', 'blocking': True, 'status': 'open'}]}, self.spec / 'questions.yml')
        self.run_tool('validate_spec.py', self.spec, '--strict', expected=1)
        yaml_io.dump({'questions': []}, self.spec / 'questions.yml')
        index = yaml_io.load(self.spec / 'index.yml')
        index['coverage'] = 'partial'
        yaml_io.dump(index, self.spec / 'index.yml')
        self.run_tool('validate_spec.py', self.spec, '--strict', expected=1)

    @unittest.skipUnless(importlib.util.find_spec('PIL') and importlib.util.find_spec('numpy'), 'Pillow/numpy unavailable')
    def test_image_checks_reject_implicit_resize_and_alpha_changes(self):
        from PIL import Image
        ref, candidate = self.root / 'ref.png', self.root / 'candidate.png'
        Image.new('RGBA', (10, 10), (255, 0, 0, 255)).save(ref)
        Image.new('RGBA', (20, 20), (255, 0, 0, 255)).save(candidate)
        self.run_tool('compare_screens.py', ref, candidate, expected=2)
        self.run_tool('compare_screens.py', ref, candidate, '--resize')
        Image.new('RGBA', (10, 10), (255, 0, 0, 0)).save(candidate)
        self.run_tool('compare_screens.py', ref, candidate, expected=1)
        self.run_tool('compare_screens.py', ref, ref, '--tolerance', '256', expected=2)


if __name__ == '__main__':
    unittest.main(verbosity=2)
