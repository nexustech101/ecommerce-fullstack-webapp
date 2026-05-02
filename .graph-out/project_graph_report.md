# Graph Report - C:\Users\charl\Documents\Python\ecommerce-backend-example  (2026-05-02)

## Corpus Check
- Corpus is ~2,599 words - fits in a single context window. You may not need a graph.

## Summary
- 219 nodes - 410 edges - 25 communities detected
- Extraction: 83% EXTRACTED - 17% INFERRED - 0% AMBIGUOUS - INFERRED: 68 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `<module>` - 23 edges
2. `<module>` - 23 edges
3. `require_model(model_cls: type[BaseModel], model_id: int) -> BaseModel` - 22 edges
4. `<module>` - 19 edges
5. `utc_now() -> str` - 18 edges
6. `require_model()` - 18 edges
7. `<module>` - 16 edges
8. `utc_now()` - 14 edges
9. `<module>` - 12 edges
10. `<module>` - 12 edges

## Surprising Connections (you probably didn't know these)
- `list_products()` --calls--> `to_product_out()`  [INFERRED]
  app/api/v1/routes/catalog.py -> app/services/mappers.py
- `list_customers()` --calls--> `to_customer_out()`  [INFERRED]
  app/api/v1/routes/customers.py -> app/services/mappers.py
- `delete_customer()` --calls--> `require_model()`  [INFERRED]
  app/api/v1/routes/customers.py -> app/services/common.py
- `checkout()` --calls--> `require_model()`  [INFERRED]
  app/api/v1/routes/orders.py -> app/services/common.py
- `checkout()` --calls--> `utc_now()`  [INFERRED]
  app/api/v1/routes/orders.py -> app/services/common.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (38): attach_product_category(), attach_product_tag(), create_category(), create_product(), create_review(), create_tag(), get_product(), list_categories() (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (35): BaseModel, to_order_item_out(), to_order_out(), to_order_payment_out(), Address, Category, Customer, Order (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (36): <module>, attach_product_category(product_id: int, category_id: int), attach_product_tag(product_id: int, tag_id: int), create_category(payload: CategoryCreate), create_product(payload: ProductCreate), create_review(payload: ReviewCreate), create_tag(payload: TagCreate), get_product(product_id: int) (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (25): <module>, <module>, AddressCreate, AddressOut, AddressUpdate, CategoryCreate, CategoryOut, CheckoutCreate (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (14): <module>, <module>, register_exception_handlers(app: FastAPI) -> None, handle_duplicate(_request, _exc: DuplicateKeyError), handle_not_found(_request, exc: RecordNotFoundError), handle_query_error(_request, exc: InvalidQueryError), handle_registry_error(_request, exc: RegistryError), handle_unique(_request, _exc: UniqueConstraintError) (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (11): <module>, <module>, <module>, health_check() -> dict[str, bool], <module>, checkout(payload: CheckoutCreate), get_order(order_id: int), list_orders(customer_id: int | None = Query(None, ge=1), limit: int = Query(20, ge=1, le=200), offset: int = Query(0, ge=0)) (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.26
Nodes (14): <module>, <module>, Address, Category, Customer, Order, OrderItem, OrderPayment (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (5): register_exception_handlers(), dispose_engines(), initialize_schemas(), create_app(), lifespan()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (3): BaseSettings, get_settings(), Settings

### Community 9 - "Community 9"
Cohesion: 0.83
Nodes (4): <module>, Settings, _as_sqlite_url(value: str, base_dir: Path) -> str, get_settings() -> Settings

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (1): <module>

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (1): <module>

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): <module>

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (1): <module>

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
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

## Knowledge Gaps
- **12 isolated node(s):** `<module>`, `<module>`, `<module>`, `health_check() -> dict[str, bool]`, `<module>` (+7 more)
  These have <=1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `health.py`, `health_check()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `<module>`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `main.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `api.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `require_model()` connect `Community 0` to `Community 1`-**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `<module>`, `<module>`, `<module>` to the rest of the system-**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules-**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules-**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules-**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._