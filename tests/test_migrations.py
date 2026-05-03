from __future__ import annotations

from app.migrations import MigrationRecord, apply_migrations, migration_status


def test_migration_runner_applies_and_records_versions_idempotently():
    if MigrationRecord.schema_exists():
        MigrationRecord.truncate()

    before = migration_status()
    first = apply_migrations()
    second = apply_migrations()
    after = migration_status()

    assert [row["applied"] for row in before] == [False, False, False, False]
    assert first == ["0001", "0002", "0003", "0004"]
    assert second == []
    assert [row["applied"] for row in after] == [True, True, True, True]
    assert MigrationRecord.objects.count() == 4
