#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container_name="coach-supabase-test-$$"
trap 'docker rm -f "$container_name" >/dev/null 2>&1 || true' EXIT
docker run --detach --name "$container_name" --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=coach_test postgres:15-alpine >/dev/null
for attempt in {1..30}; do
  if docker exec "$container_name" pg_isready -U postgres -d coach_test >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 30 ]]; then echo 'PostgreSQL de teste não iniciou.' >&2; exit 1; fi
  sleep 1
done
for sql_file in supabase/tests/bootstrap.sql supabase/migrations/202610210001_supabase_only.sql supabase/tests/workspace.sql; do
  docker exec -i "$container_name" psql -U postgres -d coach_test -v ON_ERROR_STOP=1 < "$sql_file"
done
# Reapplying the migration must not overwrite the confirmed changes.
docker exec -i "$container_name" psql -U postgres -d coach_test -v ON_ERROR_STOP=1 < supabase/migrations/202610210001_supabase_only.sql
docker exec "$container_name" psql -U postgres -d coach_test -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF (SELECT version FROM public.user_workspaces WHERE user_id = '00000000-0000-4000-8000-000000000001') <> 1 THEN RAISE EXCEPTION 'Migração repetida alterou os dados'; END IF; END \$\$;"
echo 'Testes SQL: migração, RLS, conflitos, idempotência e listas vazias aprovados.'
