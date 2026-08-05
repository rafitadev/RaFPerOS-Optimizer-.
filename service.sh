#!/system/bin/sh
MODDIR=${0%/*}
(
  sleep 25
  if [ -f "$MODDIR/state/toggles.conf" ] && grep -q '^APPLY_ON_BOOT=1$' "$MODDIR/state/toggles.conf"; then
    "$MODDIR/common/rafperctl" apply boot
    "$MODDIR/common/rafperctl" daemon >/dev/null 2>&1 &
  else
    mkdir -p "$MODDIR/logs"
    echo "$(date '+%F %T') [INFO] boot auto-apply disabled; waiting for WebUI consent" >> "$MODDIR/logs/optimizer.log"
  fi
) &
