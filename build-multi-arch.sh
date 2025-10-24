#!/bin/bash

# Multi-architecture build script for Dalli Template
# Supports both ARM64 and AMD64 architectures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORMS="linux/amd64,linux/arm64"
PUSH=false
TAG="latest"
REGISTRY=""

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platforms PLATFORMS    Target platforms (default: linux/amd64,linux/arm64)"
    echo "  -t, --tag TAG                Image tag (default: latest)"
    echo "  -r, --registry REGISTRY      Docker registry URL"
    echo "  --push                       Push images to registry"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build for both platforms locally"
    echo "  $0 --platforms linux/amd64           # Build only for AMD64"
    echo "  $0 --platforms linux/arm64           # Build only for ARM64"
    echo "  $0 --push --registry myregistry.com  # Build and push to registry"
    echo "  $0 --tag v1.0.0 --push               # Build with specific tag and push"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if Docker buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    print_error "Docker buildx is not available. Please install Docker with buildx support."
    exit 1
fi

# Create buildx builder if it doesn't exist
BUILDER_NAME="dalli-template-builder"
if ! docker buildx inspect $BUILDER_NAME >/dev/null 2>&1; then
    print_info "Creating buildx builder: $BUILDER_NAME"
    docker buildx create --name $BUILDER_NAME --use
else
    print_info "Using existing buildx builder: $BUILDER_NAME"
    docker buildx use $BUILDER_NAME
fi

# Build and inspect the builder
print_info "Inspecting builder capabilities..."
docker buildx inspect --bootstrap

# Set image names
if [ -n "$REGISTRY" ]; then
    BACKEND_IMAGE="$REGISTRY/dalli-template-backend:$TAG"
    FRONTEND_IMAGE="$REGISTRY/dalli-template-frontend:$TAG"
else
    BACKEND_IMAGE="dalli-template-backend:$TAG"
    FRONTEND_IMAGE="dalli-template-frontend:$TAG"
fi

print_info "Building images for platforms: $PLATFORMS"
print_info "Backend image: $BACKEND_IMAGE"
print_info "Frontend image: $FRONTEND_IMAGE"

# Build backend
print_info "Building backend image..."
if [ "$PUSH" = true ]; then
    docker buildx build \
        --platform $PLATFORMS \
        --file backend/Dockerfile \
        --tag $BACKEND_IMAGE \
        --push \
        backend/
else
    docker buildx build \
        --platform $PLATFORMS \
        --file backend/Dockerfile \
        --tag $BACKEND_IMAGE \
        --load \
        backend/
fi

print_success "Backend image built successfully!"

# Build frontend
print_info "Building frontend image..."
if [ "$PUSH" = true ]; then
    docker buildx build \
        --platform $PLATFORMS \
        --file frontend/Dockerfile \
        --tag $FRONTEND_IMAGE \
        --push \
        frontend/
else
    docker buildx build \
        --platform $PLATFORMS \
        --file frontend/Dockerfile \
        --tag $FRONTEND_IMAGE \
        --load \
        frontend/
fi

print_success "Frontend image built successfully!"

# Show built images
print_info "Built images:"
docker images | grep dalli-template

if [ "$PUSH" = true ]; then
    print_success "Images pushed to registry successfully!"
else
    print_info "Images built locally. Use --push to push to registry."
fi

print_success "Multi-architecture build completed!"
