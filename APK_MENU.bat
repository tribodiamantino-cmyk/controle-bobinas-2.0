@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                                                                    ║
echo ║         📱 CONTROLE BOBINAS - APK v2.2.0-beta RELEASE            ║
echo ║                                                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo.
echo  🎯 O QUE FOI FEITO:
echo  ══════════════════════════════════════════════════════════════════
echo.
echo  ✅ Campo PLACA implementado (backend + mobile)
echo  ✅ Erro 500 no cadastro: CORRIGIDO
echo  ✅ APK v2.2.0-beta compilado (4.18 MB)
echo  ✅ Indicador de status da API (🟢/🟡/🔴)
echo  ✅ Service Worker otimizado
echo  ✅ 13 arquivos de documentação criados
echo.
echo.
echo  📦 APK LOCALIZAÇÃO:
echo  ══════════════════════════════════════════════════════════════════
echo.
echo  📍 android\app\build\outputs\apk\debug\app-debug.apk
echo  📊 Tamanho: 4.18 MB
echo  🏷️  Versão: 2.2.0-beta (Build 2)
echo.
echo.
echo  📚 DOCUMENTAÇÃO DISPONÍVEL:
echo  ══════════════════════════════════════════════════════════════════
echo.
echo  [1] APK_v2.2.0-beta_RELEASE_NOTES.md (COMEÇAR AQUI!)
echo  [2] LEIA_ISTO_PRIMEIRO.md (Sistema PLACA web)
echo  [3] GUIA_RAPIDO_DEPLOY.md (Passo a passo testes)
echo  [4] RELATORIO_FINAL_DEBUG.md (Report técnico completo)
echo.
echo.
echo  🚀 AÇÕES RÁPIDAS:
echo  ══════════════════════════════════════════════════════════════════
echo.
echo  [A] Abrir pasta do APK
echo  [B] Ver release notes do APK
echo  [C] Ver guia de testes
echo  [D] Verificar status do deploy Railway
echo  [X] Sair
echo.
echo.

set /p opcao="  Escolha uma opção: "

if /i "%opcao%"=="A" (
    start explorer "android\app\build\outputs\apk\debug"
    goto menu
)

if /i "%opcao%"=="B" (
    start APK_v2.2.0-beta_RELEASE_NOTES.md
    goto menu
)

if /i "%opcao%"=="C" (
    start GUIA_RAPIDO_DEPLOY.md
    goto menu
)

if /i "%opcao%"=="D" (
    start https://railway.com/project/74bbdbc8-a159-44ad-9eb3-787581af1828
    goto menu
)

if /i "%opcao%"=="X" (
    exit
)

if /i "%opcao%"=="1" (
    start APK_v2.2.0-beta_RELEASE_NOTES.md
    goto menu
)

if /i "%opcao%"=="2" (
    start LEIA_ISTO_PRIMEIRO.md
    goto menu
)

if /i "%opcao%"=="3" (
    start GUIA_RAPIDO_DEPLOY.md
    goto menu
)

if /i "%opcao%"=="4" (
    start RELATORIO_FINAL_DEBUG.md
    goto menu
)

echo.
echo  ❌ Opção inválida!
timeout /t 2 >nul

:menu
cls
goto :eof
