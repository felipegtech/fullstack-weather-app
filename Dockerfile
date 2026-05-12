FROM python:3.14
WORKDIR /app
COPY main.py pyproject.toml ./
RUN pip install uv
RUN uv sync
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
