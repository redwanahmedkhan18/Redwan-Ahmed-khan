COPY backend/pyproject.toml ./

ENV PIP_DEFAULT_TIMEOUT=300
ENV PIP_RETRIES=10

RUN pip install --no-cache-dir .
