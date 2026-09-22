"""
Unit tests for scheduler daemon module.
"""

import unittest

from backend.scripts.scheduler import run_scheduled_ingestion


class TestScheduler(unittest.TestCase):

    def test_run_scheduled_ingestion_mock(self):
        # Test running a single scheduled iteration with mock provider
        try:
            run_scheduled_ingestion(provider="mock", source="manual")
            success = True
        except Exception as err:
            success = False
            print(f"Scheduler test error: {err}")

        self.assertTrue(success)


if __name__ == "__main__":
    unittest.main()
