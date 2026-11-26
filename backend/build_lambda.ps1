# Builds dist\docubrain-api.zip for AWS Lambda (Python 3.12, x86_64).
# Run from the backend folder:  .\build_lambda.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Remove-Item -Recurse -Force build, dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force build, dist | Out-Null

# Linux wheels that match the Lambda runtime, not your Windows machine.
# pip prints warnings to stderr; judge success by its exit code only.
$ErrorActionPreference = "Continue"
python -m pip install -r requirements.txt --target build `
    --platform manylinux2014_x86_64 --implementation cp --python-version 3.12 `
    --only-binary=:all: --upgrade --quiet --disable-pip-version-check 2>&1 | Out-Null
$pipExit = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($pipExit -ne 0) { throw "pip install failed (exit code $pipExit)" }

Copy-Item -Recurse src build\src
Get-ChildItem build -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force

# Python's zip keeps forward-slash paths, which Lambda (Linux) needs.
python -c "import shutil; shutil.make_archive('dist/docubrain-api', 'zip', 'build')"
if ($LASTEXITCODE -ne 0) { throw "zip failed" }

$size = [math]::Round((Get-Item dist\docubrain-api.zip).Length / 1MB, 1)
Write-Host "Built dist\docubrain-api.zip ($size MB)"
