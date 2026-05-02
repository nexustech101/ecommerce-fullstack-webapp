# Graph Report - C:\Users\charl\Documents\Python\ecommerce-backend-example  (2026-05-02)

## Corpus Check
- Corpus is ~8,547 words - fits in a single context window. You may not need a graph.

## Summary
- 413 nodes - 735 edges - 53 communities detected
- Extraction: 85% EXTRACTED - 15% INFERRED - 0% AMBIGUOUS - INFERRED: 108 edges (avg confidence: 0.77)
- Token cost: 0 input - 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community|Community 0]]
- [[_COMMUNITY_Community|Community 1]]
- [[_COMMUNITY_Community|Community 2]]
- [[_COMMUNITY_Community|Community 3]]
- [[_COMMUNITY_Community|Community 4]]
- [[_COMMUNITY_Community|Community 5]]
- [[_COMMUNITY_Community|Community 6]]
- [[_COMMUNITY_Community|Community 7]]
- [[_COMMUNITY_Community|Community 8]]
- [[_COMMUNITY_Community|Community 9]]
- [[_COMMUNITY_Community|Community 10]]
- [[_COMMUNITY_Community|Community 11]]
- [[_COMMUNITY_Community|Community 12]]
- [[_COMMUNITY_Community|Community 13]]
- [[_COMMUNITY_Community|Community 14]]
- [[_COMMUNITY_Community|Community 15]]
- [[_COMMUNITY_Community|Community 16]]
- [[_COMMUNITY_Community|Community 17]]
- [[_COMMUNITY_Community|Community 18]]
- [[_COMMUNITY_Community|Community 19]]
- [[_COMMUNITY_Community|Community 20]]
- [[_COMMUNITY_Community|Community 21]]
- [[_COMMUNITY_Community|Community 22]]
- [[_COMMUNITY_Community|Community 23]]
- [[_COMMUNITY_Community|Community 24]]
- [[_COMMUNITY_Community|Community 25]]
- [[_COMMUNITY_Community|Community 26]]
- [[_COMMUNITY_Community|Community 27]]
- [[_COMMUNITY_Community|Community 28]]
- [[_COMMUNITY_Community|Community 29]]
- [[_COMMUNITY_Community|Community 30]]
- [[_COMMUNITY_Community|Community 31]]
- [[_COMMUNITY_Community|Community 32]]
- [[_COMMUNITY_Community|Community 33]]
- [[_COMMUNITY_Community|Community 34]]
- [[_COMMUNITY_Community|Community 35]]
- [[_COMMUNITY_Community|Community 36]]
- [[_COMMUNITY_Community|Community 37]]
- [[_COMMUNITY_Community|Community 38]]
- [[_COMMUNITY_Community|Community 39]]
- [[_COMMUNITY_Community|Community 40]]
- [[_COMMUNITY_Community|Community 41]]
- [[_COMMUNITY_Community|Community 42]]
- [[_COMMUNITY_Community|Community 43]]
- [[_COMMUNITY_Community|Community 44]]
- [[_COMMUNITY_Community|Community 45]]
- [[_COMMUNITY_Community|Community 46]]
- [[_COMMUNITY_Community|Community 47]]
- [[_COMMUNITY_Community|Community 48]]
- [[_COMMUNITY_Community|Community 49]]
- [[_COMMUNITY_Community|Community 50]]
- [[_COMMUNITY_Community|Community 51]]
- [[_COMMUNITY_Community|Community 52]]

## God Nodes (most connected - your core abstractions)
1. `utc_now() -> str` - 35 edges
2. `<module>` - 33 edges
3. `<module>` - 33 edges
4. `require_model(model_cls: type[BaseModel], model_id: int) -> BaseModel` - 27 edges
5. `utc_now()` - 26 edges
6. `require_model()` - 22 edges
7. `<module>` - 19 edges
8. `<module>` - 18 edges
9. `<module>` - 16 edges
10. `<module>` - 16 edges

## Surprising Connections (you probably didn't know these)
- `test_order_checkout_routes_and_compensation_edges()` --calls--> `utc_now()`  [INFERRED]
  tests/test_api_routes.py -> app/services/common.py
- `test_registers_db_model_query_and_collision_edges()` --calls--> `utc_now()`  [INFERRED]
  tests/test_api_routes.py -> app/services/common.py
- `test_billing_config_and_plan_routes()` --calls--> `utc_now()`  [INFERRED]
  tests/test_billing.py -> app/services/common.py
- `test_portal_session_route_uses_registered_or_explicit_stripe_customer()` --calls--> `utc_now()`  [INFERRED]
  tests/test_billing.py -> app/services/common.py
- `test_order_checkout_routes_and_compensation_edges(client, sample_data)` --calls--> `utc_now() -> str`  [EXTRACTED]
  tests/test_api_routes.py -> app/services/common.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (54): BaseModel, handleSubmit(), Address, BillingCheckoutSession, Category, Customer, CustomerSubscription, Order (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (48): <module>, <module>, attach_product_category(product_id: int, category_id: int), attach_product_tag(product_id: int, tag_id: int), create_category(payload: CategoryCreate), create_product(payload: ProductCreate), create_review(payload: ReviewCreate), create_tag(payload: TagCreate) (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (38): attach_product_category(), attach_product_tag(), create_category(), create_product(), create_review(), create_tag(), get_product(), list_categories() (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (37): <module>, <module>, AddressCreate, AddressOut, AddressUpdate, BillingConfigOut, BillingLineItem, CategoryCreate (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (24): <module>, billing_config(), create_billing_checkout_session(payload: CreateCheckoutSession), create_billing_portal_session(payload: PortalSessionCreate), get_checkout_session(session_id: str), list_customer_subscriptions(customer_id: int), list_subscription_plans(), stripe_webhook(request: Request) (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (22): billing_config(), build_payment_line_items(), build_subscription_line_items(), create_billing_checkout_session(), create_billing_portal_session(), create_checkout_session(), create_portal_session(), epoch_to_iso() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (18): <module>, <module>, Address, BillingCheckoutSession, Category, Customer, CustomerSubscription, Order (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (15): <module>, patch_stripe(monkeypatch), test_billing_config_and_plan_routes(client, sample_data), test_checkout_completed_webhook_is_idempotent(client, sample_data, monkeypatch), test_checkout_requires_customer_or_guest(client, sample_data), test_guest_payment_checkout_session_returns_client_secret(client, sample_data, monkeypatch), test_insufficient_stock_fails_cleanly(client, sample_data, monkeypatch), test_portal_session_route_uses_registered_or_explicit_stripe_customer(client, sample_data, monkeypatch) (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (13): <module>, register_exception_handlers(app: FastAPI) -> None, handle_duplicate(_request, _exc: DuplicateKeyError), handle_not_found(_request, exc: RecordNotFoundError), handle_query_error(_request, exc: InvalidQueryError), handle_registry_error(_request, exc: RegistryError), handle_unique(_request, _exc: UniqueConstraintError), <module> (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (13): <module>, <module>, <module>, Migration, MigrationRecord, _is_applied(version: str) -> bool, apply_migrations() -> list[str], create_registered_schemas() -> None (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.23
Nodes (7): patch_stripe(), test_billing_config_and_plan_routes(), test_checkout_completed_webhook_is_idempotent(), test_guest_payment_checkout_session_returns_client_secret(), test_insufficient_stock_fails_cleanly(), test_portal_session_route_uses_registered_or_explicit_stripe_customer(), test_registered_customer_payment_checkout_session_returns_client_secret()

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (11): <module>, test_address_routes_default_toggle_and_ownership_validation(client, sample_data), test_admin_schema_routes_truncate_in_dependency_order(client, sample_data), test_category_tag_links_and_review_routes(client, sample_data), test_customer_crud_and_validation_edges(client), test_health_route(client), test_order_checkout_routes_and_compensation_edges(client, sample_data), test_payment_method_routes_and_missing_customer(client, sample_data) (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (2): test_order_checkout_routes_and_compensation_edges(), test_registers_db_model_query_and_collision_edges()

### Community 13 - "Community 13"
Cohesion: 0.36
Nodes (5): apply_migrations(), _is_applied(), main(), migration_status(), test_migration_runner_applies_and_records_versions_idempotently()

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (5): register_exception_handlers(), dispose_engines(), initialize_schemas(), create_app(), lifespan()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (3): BaseSettings, get_settings(), Settings

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (1): <module>

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (4): <module>, Settings, _as_sqlite_url(value: str, base_dir: Path) -> str, get_settings() -> Settings

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (1): ApiError

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): <module>

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): <module>

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): <module>

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): <module>

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): <module>

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **31 isolated node(s):** `<module>`, `<module>`, `<module>`, `health_check() -> dict[str, bool]`, `<module>` (+26 more)
  These have <=1 connection - possible missing edges or undocumented components.
- **Thin community `Community 21`** (2 nodes): `health.py`, `health_check()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `Layout.tsx`, `Layout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `ProductCard.tsx`, `ProductCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `openPortal()`, `BillingPortalPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `EmbeddedCheckoutPage.tsx`, `EmbeddedCheckoutPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `CartContext.tsx`, `CartProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `main.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `api.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `format.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `ProductCard.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `CheckoutReturnPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `ProductsPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `__main__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `utc_now() -> str` connect `Community 1` to `Community 9`, `Community 11`, `Community 4`, `Community 7`-**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `utc_now()` connect `Community 2` to `Community 13`, `Community 10`, `Community 12`, `Community 5`-**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `<module>` connect `Community 7` to `Community 1`, `Community 4`-**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `<module>`, `<module>`, `<module>` to the rest of the system-**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules-**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules-**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules-**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._