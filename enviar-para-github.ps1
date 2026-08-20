# =============================================================================
# NITO LIVE - envia o projeto para o GitHub
#
# COMO USAR (PowerShell), dentro da pasta NITO-LIVE:
#   powershell -ExecutionPolicy Bypass -File .\enviar-para-github.ps1
#
# Este script roda os comandos do git um por um, na ordem certa,
# sem risco de as linhas colarem umas nas outras.
# =============================================================================

$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

Write-Host ''
Write-Host '  NITO LIVE - enviando para o GitHub'
Write-Host ''

# --- Git instalado? ---
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host '  O Git nao esta instalado nesta maquina.' -ForegroundColor Red
    Write-Host '  Baixe em: https://git-scm.com/download/win'
    exit 1
}

# --- Situacao atual ---
Write-Host '  [1/4] Conferindo a situacao...'
$branch = (git rev-parse --abbrev-ref HEAD 2>&1)
Write-Host ('        branch atual: ' + $branch)

$remotos = (git remote 2>&1)
if ($remotos -notcontains 'origin') {
    Write-Host '        origin nao configurado. Configurando...'
    git remote add origin https://github.com/odiegoalves/nito-live.git 2>&1 | Out-Null
}
$urlRemota = (git remote get-url origin 2>&1)
Write-Host ('        destino: ' + $urlRemota)

# --- Garantir que a branch se chama main ---
Write-Host '  [2/4] Ajustando o nome da branch...'
if ($branch -ne 'main') {
    git branch -M main 2>&1 | Out-Null
    Write-Host '        renomeada para main'
} else {
    Write-Host '        ja se chama main'
}

# --- Ha algo para commitar? ---
Write-Host '  [3/4] Conferindo se ha mudancas pendentes...'
$pendentes = (git status --porcelain 2>&1)
if ($pendentes) {
    Write-Host '        ha arquivos novos ou alterados. Commitando...'
    git add . 2>&1 | Out-Null
    git commit -m "NITO LIVE comunidade - ajustes" 2>&1 | Out-Null
    Write-Host '        commit feito'
} else {
    Write-Host '        nada pendente, tudo ja commitado'
}

# --- ENVIAR ---
Write-Host '  [4/4] Enviando... (pode pedir login do GitHub e demorar ate 2 minutos)'
Write-Host ''

git push -u origin main 2>&1 | ForEach-Object { Write-Host ('        ' + $_) }

Write-Host ''

# --- Confirmar de verdade ---
$confirmado = (git ls-remote --heads origin main 2>&1)

if ($confirmado -match 'refs/heads/main') {
    Write-Host '  SUCESSO. O codigo esta no GitHub.' -ForegroundColor Green
    Write-Host '  Confira em: https://github.com/odiegoalves/nito-live' -ForegroundColor Green
} else {
    Write-Host '  O envio NAO se confirmou.' -ForegroundColor Red
    Write-Host '  Copie TODAS as linhas acima e mande para o chat.' -ForegroundColor Red
    Write-Host ''
    Write-Host '  Causas mais comuns:' -ForegroundColor Yellow
    Write-Host '    - a janela de login do GitHub foi fechada'
    Write-Host '    - o repositorio nito-live ainda nao existe na conta odiegoalves'
    Write-Host '    - a conta logada no Git nao e a dona do repositorio'
}

Write-Host ''
