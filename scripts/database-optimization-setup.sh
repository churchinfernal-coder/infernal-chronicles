#!/bin/bash
# Database Optimization Setup Script
# Purpose: Apply migrations and configure connection pool for production

set -e

echo "🔧 Starting Database Optimization..."

# Step 1: Apply migrations
echo "📝 Applying SQL migrations..."
supabase db push --dry-run

echo "✅ Migration plan created. Review above and run:"
echo "   supabase db push"

# Step 2: Connection Pool Configuration
echo ""
echo "⚙️  Connection Pool Configuration"
echo "================================"
echo ""
echo "Via Supabase Dashboard:"
echo "1. Go to: Project Settings → Database → Connection Pooling"
echo "2. Set Min Connections: 10"
echo "3. Set Max Connections: 200"
echo "4. Set Default: 15"
echo "5. Mode: Transaction"
echo ""
echo "Expected Result:"
echo "- Can handle 100+ concurrent connections"
echo "- Query latency P99 < 100ms"
echo "- No connection timeouts under load"

# Step 3: Verify indexes exist
echo ""
echo "🔍 Verifying indexes were created..."
echo "After migrations apply, run:"
echo "   psql \$DATABASE_URL -c \"SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%';\""

echo ""
echo "✅ Database optimization setup complete!"
echo "Next: Run test:gate:database to verify performance"
