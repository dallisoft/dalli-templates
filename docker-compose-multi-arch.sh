#!/bin/bash

# Docker Compose multi-architecture build and run script
# Supports both ARM64 and AMD64 architectures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ACTION="up"
PLATFORMS="linux/amd64,linux/arm64"
DETACHED=true

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
    echo "Usage: $0 [ACTION] [OPTIONS]"
    echo ""
    echo "Actions:"
    echo "  build     Build multi-arch images"
    echo "  up        Start services (default)"
    echo "  down      Stop and remove services"
    echo "  restart   Restart services"
    echo "  logs      Show service logs"
    echo "  ps        Show service status"
    echo ""
    echo "Options:"
    echo "  -p, --platforms PLATFORMS    Target platforms (default: linux/amd64,linux/arm64)"
    echo "  -d, --detached               Run in detached mode (default: true)"
    echo "  -f, --follow                 Follow logs (for logs action)"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build                     # Build multi-arch images"
    echo "  $0 up                        # Start services"
    echo "  $0 up --platforms linux/amd64 # Start only AMD64 services"
    echo "  $0 logs --follow             # Follow logs"
    echo "  $0 down                      # Stop services"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        build|up|down|restart|logs|ps)
            ACTION="$1"
            shift
            ;;
        -p|--platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        -d|--detached)
            DETACHED=true
            shift
            ;;
        -f|--follow)
            FOLLOW_LOGS=true
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

# Function to build multi-arch images
build_images() {
    print_info "Building multi-architecture images for platforms: $PLATFORMS"
    
    # Set environment variables for buildx
    export DOCKER_BUILDKIT=1
    export BUILDX_NO_DEFAULT_ATTESTATIONS=1
    
    # Build with docker-compose
    docker-compose build --parallel
    
    print_success "Multi-architecture images built successfully!"
}

# Function to start services
start_services() {
    print_info "Starting services for platforms: $PLATFORMS"
    
    if [ "$DETACHED" = true ]; then
        docker-compose up -d
    else
        docker-compose up
    fi
    
    print_success "Services started successfully!"
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    docker-compose down
    print_success "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    docker-compose restart
    print_success "Services restarted successfully!"
}

# Function to show logs
show_logs() {
    if [ "$FOLLOW_LOGS" = true ]; then
        docker-compose logs -f
    else
        docker-compose logs
    fi
}

# Function to show service status
show_status() {
    docker-compose ps
}

# Main execution
case $ACTION in
    build)
        build_images
        ;;
    up)
        build_images
        start_services
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    ps)
        show_status
        ;;
    *)
        print_error "Unknown action: $ACTION"
        show_usage
        exit 1
        ;;
esac
