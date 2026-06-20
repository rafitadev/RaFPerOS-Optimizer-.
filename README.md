# RaFPerOS Extreme Optimizer

Módulo KernelSU para **fluidez absoluta, latência mínima e performance real** em One UI 8.5, HyperOS 1/2/3/4, AOSP e ROMs derivadas. A regra principal é consentimento explícito: **todos os tweaks vêm desligados por padrão** e nada é aplicado automaticamente no primeiro boot.

## 1. Arquitetura ideal

```text
KernelSU lifecycle
  ├─ customize.sh      -> cria state/logs/backups, perfil Performance, toggles todos OFF
  ├─ post-fs-data.sh   -> prepara diretórios sem tocar em tuning
  ├─ service.sh        -> NÃO aplica nada, exceto se APPLY_ON_BOOT=1 for ativado pelo usuário
  └─ uninstall.sh      -> chama reset reversível

Core
  └─ common/rafperctl
      ├─ parser de perfil
      ├─ matriz de suporte por endpoint
      ├─ toggles individuais por tweak
      ├─ escrita segura com backup do primeiro valor
      ├─ apply incremental somente do que está ON
      ├─ reset total e reset por seção
      └─ logs para WebUI

KSU WebUI
  └─ webroot/
      ├─ dashboard de estado
      ├─ seletor Ultra Smooth / Performance / Balanced / Battery
      ├─ seções CPU, Memória, Renderização, GPU, I/O, Input, Avançado e Experience Enhancers
      ├─ avisos para opções agressivas
      ├─ aplicar, boost, reset total e restaurar seção
      └─ logs quase em tempo real
```

## 2. Arquivos do projeto

- `module.prop`: metadados KernelSU.
- `customize.sh`: instalação segura; cria estado e copia toggles padrão todos desligados.
- `post-fs-data.sh`: inicialização de diretórios sem tuning.
- `service.sh`: aplica no boot apenas se o usuário ativar `APPLY_ON_BOOT=1`.
- `uninstall.sh`: restaura valores via `rafperctl reset uninstall`.
- `common/default_toggles.conf`: todos os ajustes `0` por padrão.
- `common/profiles.conf`: presets inertes até o usuário ativar toggles e pressionar Aplicar.
- `common/rafperctl`: núcleo de detecção/aplicação/reset/log.
- `webroot/`: KSU WebUI.

## 3. Divisão por camadas

1. **Consentimento**: toggles OFF e perfil não aplica sozinho.
2. **Detecção**: `support_one` verifica endpoints reais por tweak.
3. **Fallback**: endpoint inexistente gera `SKIP`, não erro fatal.
4. **Backup**: antes da primeira escrita, o valor original vai para `backups/`.
5. **Aplicação incremental**: `apply` executa apenas toggles ON.
6. **Reset**: `reset` restaura tudo; `reset-section` desliga toggles da seção e restaura valores salvos.
7. **Observabilidade**: WebUI mostra suporte, estado, riscos e logs.

## 4. Features e matriz de suporte

| Seção | Toggle | Endpoint real | Impacto esperado | Default |
| --- | --- | --- | --- | --- |
| CPU | `CPU_GOV` | `policy*/scaling_governor` | ramp-up mais rápido | OFF |
| CPU | `CPU_SCHEDUTIL` | `schedutil/*`, `interactive/*` | bursts curtos mais responsivos | OFF |
| CPU | `CPU_ANTI_OSC` | `schedutil/down_rate_limit_us` | reduz sobe/desce de frequência | OFF |
| CPU | `CPU_SOFT_FREQ_LOCK` | `scaling_min_freq` com timeout | clocks estáveis temporários | OFF/manual |
| Scheduler | `CPU_UCLAMP`, `CPU_CPUSET`, `CPU_STUNE` | `/dev/cpu.uclamp`, `/dev/cpuset`, `/dev/stune` | prioridade foreground/top-app | OFF |
| Memória | `MEMORY_VM`, `MEMORY_DIRTY`, `MEMORY_ZRAM` | `/proc/sys/vm/*`, `/sys/block/zram*` | menos reclaim/writeback jank | OFF |
| Memória | `MEMORY_LMKD`, `MEMORY_EXTREME` | lowmemorykiller, `cmd device_config` | melhor retenção de apps; extreme manual | OFF |
| Render | `RENDER_HWUI`, `RENDER_SF` | `debug.hwui.*`, `debug.renderengine.*`, `debug.sf.*` | hints reais de pipeline gráfico | OFF |
| Render | `RENDER_ADVANCED` | `debug.sf.disable_*`, `debug.composition.type` | override avançado e arriscado | OFF/manual |
| Render | `RENDER_ANIMATIONS` | `settings global *_animation_scale` | animações mais rápidas/smooth | OFF |
| GPU | `GPU_GOV`, `GPU_BOOST` | KGSL/devfreq/Mali endpoints | menor ramp-up em UI/jogos | OFF |
| I/O | `IO_SCHED`, `IO_LATENCY` | `/sys/block/*/queue/*` | menor latência percebida | OFF |
| Input | `INPUT_TOUCH`, `INPUT_FINGERPRINT` | cpu_boost/cpu_input_boost | touch/unlock boost curto | OFF |
| Avançado | `ADV_BACKGROUND`, `ADV_THERMAL`, `APPLY_ON_BOOT` | ActivityManager, thermal_message | cache/thermal seguro/boot opt-in | OFF |
| Experience | `EXP_STEREO`, `EXP_AUDIO_BASS`, `EXP_AUDIO_VOICE`, `EXP_AUDIO_NORMALIZE`, `EXP_AUDIO_LIMITER`, `EXP_AUDIO_GAMING` | `tinymix` + controles reais do codec/DSP | estéreo, bass, diálogo, limiter e baixa latência de áudio quando suportados | OFF/manual |
| Experience | `EXP_SMOOTHNESS`, `EXP_VISUAL_CONSISTENCY`, `EXP_ANIMATION_BURST` | SurfaceFlinger/HWUI props, scheduler/input reais | menos micro-judder e transições mais vivas | OFF |
| Experience | `EXP_TOUCH_RESPONSE`, `EXP_FOREGROUND_PRIORITY`, `EXP_SESSION_BOOST`, `EXP_APP_LAUNCH` | cpu_boost, cpuset, uclamp, stune, cpufreq | resposta rápida, app launch e foreground favorecido | OFF/manual |
| Extras | `EXP_HAPTIC`, `EXP_BRIGHTNESS_RESPONSE`, `EXP_NETWORK_LATENCY`, `EXP_GAME_SESSION` | vibrator sysfs, backlight safe endpoints, TCP sysctls, GPU/CPU endpoints | haptic, display response, rede interativa e game session | OFF/manual |

## 5. Perfis

- **Ultra Smooth**: valores agressivos para animações, bursts curtos, scheduler e retenção.
- **Performance**: padrão selecionado, mas inerte até Aplicar; foco em uso diário rápido.
- **Balanced**: reduz agressividade mantendo fluidez.
- **Battery**: valores mais conservadores.

## 6. Scripts de boot/apply/reset

- `service.sh` aguarda 25 segundos e só chama `apply boot` se `APPLY_ON_BOOT=1` estiver ativo.
- `rafperctl apply manual` aplica somente toggles ligados.
- `rafperctl reset manual` restaura valores originais salvos.
- `rafperctl reset-section cpu|memory|render|gpu|io|input|advanced` desliga toggles da seção e chama restore.

## 7. Compatibilidade

- **One UI 8.5 / Samsung**: tende a expor cpufreq, uclamp/cpuset e LMKD moderno; GPU/thermal variam por Exynos/Snapdragon e vendor kernel.
- **HyperOS 1/2/3/4 / Xiaomi**: muitos devices expõem KGSL, cpufreq, thermal_message e SurfaceFlinger debug props; o módulo só aplica endpoints detectados.
- **AOSP/derivadas**: cpuset/uclamp, VM, I/O e settings costumam funcionar; schedtune e lowmemorykiller clássico podem não existir em Android moderno.
- **Kernels custom**: suporte é determinado em runtime; sem hardcode por modelo.


## 8. Experience Enhancers

A seção **Experience Enhancers** concentra opções manuais para sensação geral do sistema:

- **Stereo Enhancer**: usa `tinymix` e só aplica se encontrar controles reais de stereo/widen/spatial no codec/DSP.
- **Audio Enhancements**: bass, voz/diálogo, normalização, limiter e gaming audio dependem de controles reais do mixer; sem suporte, gera `SKIP`.
- **Smoothness Boost**: aplica hints de frame pacing/render quando `setprop` está disponível.
- **Touch Response**: usa endpoints reais de input boost/cpu boost.
- **Animation Burst**: reforça scheduler/input durante transições, recents, launcher e shade.
- **Game Session Mode**: modo separado para jogos, aplicando boost CPU/GPU/scheduler somente quando o usuário ativa.
- **Foreground Priority**: favorece UI/foreground por cpuset/uclamp/stune quando expostos.
- **Visual Consistency**: prefere consistência de frame pacing sobre pico bruto via SurfaceFlinger/HWUI hints.
- **Haptic / Brightness / Network**: aplicados apenas quando há sysfs/sysctl seguro correspondente.

Todas essas opções permanecem OFF por padrão, exibem suporte detectado na WebUI e mostram aviso de risco quando agressivas.


## Correção do fluxo WebUI → backend

A WebUI agora usa uma ponte de execução real para o backend: primeiro tenta importar `exec` da API JavaScript do KernelSU (`kernelsu`), depois tenta fallbacks compatíveis (`window.ksu.exec` e `window.KSU.exec`). Cada toggle executa `rafperctl toggle <KEY> <0|1> apply`, ou seja: salva o estado persistente em `state/toggles.conf`, aplica imediatamente, atualiza o dashboard e mostra a saída da última ação. Opções sem suporte detectado ficam desabilitadas na UI, e falhas de aplicação aparecem nos logs como `SKIP`/`ERROR`.

Fluxo validado:

1. WebUI chama `rafperctl status` para ler estado real salvo.
2. Toggle chama `rafperctl toggle KEY VALUE apply`.
3. Backend grava `state/toggles.conf`.
4. Backend executa `apply_all` somente para toggles ON.
5. UI recarrega `status` e `logs`, exibindo o resultado real.
6. `reset`/`reset-section` restauram backups e desligam toggles da seção.

## 9. Uso CLI

```sh
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl status
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl support
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl profile ultra_smooth
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl toggle CPU_GOV 1
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl apply manual
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl reset-section cpu
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl reset-section experience
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl reset manual
/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl logs 260
```

## 10. Empacotar

```sh
zip -r RaFPerOS-Extreme-Optimizer.zip module.prop customize.sh post-fs-data.sh service.sh uninstall.sh common webroot README.md
```
