FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv/ecommerce-api

RUN addgroup --system app && adduser --system --ingroup app app

COPY requirements.txt pyproject.toml ./
RUN python -m pip install --upgrade pip && \
    python -m pip install -r requirements.txt

COPY app ./app
COPY main.py ./

RUN mkdir -p /data && chown -R app:app /srv/ecommerce-api /data

USER app

ENV CUSTOMER_DATABASE=/data/ecommerce.db \
    APP_NAME="Ecommerce API" \
    APP_VERSION=1.0.0 \
    API_PREFIX=/api/v1

EXPOSE 8000

CMD ["sh", "-c", "python -m app.migrations upgrade && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
