# Use multi-arch base image
FROM --platform=$BUILDPLATFORM python:3.11-slim

# Set build arguments for multi-arch support
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Install system dependencies with architecture-specific packages
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for multi-arch support
ENV TARGETPLATFORM=${TARGETPLATFORM}
ENV TARGETOS=${TARGETOS}
ENV TARGETARCH=${TARGETARCH}

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make init script executable
RUN chmod +x init_db.py

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Waiting for database to be ready..."\n\
while ! pg_isready -h postgres -p 5432 -U admin; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 1\n\
done\n\
echo "Database is ready!"\n\
\n\
echo "Initializing database..."\n\
python init_db.py\n\
\n\
echo "Starting FastAPI server..."\n\
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4\n\
' > start.sh && chmod +x start.sh

# Run the startup script
CMD ["./start.sh"]
