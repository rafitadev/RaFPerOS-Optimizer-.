#!/system/bin/sh
MODDIR=${0%/*}
mkdir -p "$MODDIR/state" "$MODDIR/logs" "$MODDIR/backups"
[ -f "$MODDIR/state/profile" ] || echo performance > "$MODDIR/state/profile"
[ -f "$MODDIR/state/toggles.conf" ] || cp "$MODDIR/common/default_toggles.conf" "$MODDIR/state/toggles.conf" 2>/dev/null
