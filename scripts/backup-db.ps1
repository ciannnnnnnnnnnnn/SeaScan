# SeaScan weekly database backup (Windows PowerShell)
# ---------------------------------------------------
# Saves the SeaScan tables (schema + data) to backups\seascan-YYYY-MM-DD.sql
# and keeps the last 8 weeks. See DEPLOYMENT.md, "Weekly backup".
#
# Needs: PostgreSQL client tools 15+ (pg_dump) - https://www.postgresql.org/download/windows/
#        (only "Command Line Tools" are needed in the installer).
# Set the connection string once per session or as a user environment variable:
#   $env:SEASCAN_DB_URL = "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
# (Supabase Dashboard > Connect > Session pooler). Never commit this value.

$ErrorActionPreference = 'Stop'

if (-not $env:SEASCAN_DB_URL) {
    Write-Error 'Set SEASCAN_DB_URL first (see the comment at the top of this script).'
}
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Error 'pg_dump was not found. Install the PostgreSQL command line tools and reopen PowerShell.'
}

$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir ("seascan-{0}.sql" -f (Get-Date -Format 'yyyy-MM-dd'))

# public = SeaScan tables. Accounts (auth) and photo files (storage) are
# managed by Supabase; see DEPLOYMENT.md for how to export those.
& pg_dump --dbname="$env:SEASCAN_DB_URL" --schema=public --no-owner --no-privileges --file="$file"
if ($LASTEXITCODE -ne 0) { Write-Error "pg_dump failed with exit code $LASTEXITCODE" }

Write-Host "Backup written: $file"

# Keep the 8 most recent backups.
Get-ChildItem $dir -Filter 'seascan-*.sql' | Sort-Object Name -Descending | Select-Object -Skip 8 | Remove-Item
