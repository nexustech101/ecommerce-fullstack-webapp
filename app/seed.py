from __future__ import annotations

from app.core.lifecycle import dispose_engines, initialize_schemas
from app.services.seed import seed_sample_catalog


def main() -> None:
    initialize_schemas()
    result = seed_sample_catalog()
    print(result)
    dispose_engines()


if __name__ == "__main__":
    main()
