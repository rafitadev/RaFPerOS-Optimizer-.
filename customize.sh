#!/system/bin/sh
MODDIR=${MODPATH:-$(dirname "$0")}
ui_print "- Installing RaFPerOS Extreme Optimizer"
ui_print "- Default profile: Performance (all tweaks disabled until user consent)"
mkdir -p "$MODDIR/state" "$MODDIR/logs" "$MODDIR/backups"
[ -f "$MODDIR/state/profile" ] || echo performance > "$MODDIR/state/profile"
[ -f "$MODDIR/state/toggles.conf" ] || cp "$MODDIR/common/default_toggles.conf" "$MODDIR/state/toggles.conf" 2>/dev/null
chmod -R 0755 "$MODDIR"
ui_print "- Done. Configure from KernelSU WebUI."
