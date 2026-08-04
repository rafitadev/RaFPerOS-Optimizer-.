#!/system/bin/sh
MODDIR=${0%/*}
[ -x "$MODDIR/common/rafperctl" ] && "$MODDIR/common/rafperctl" reset uninstall || true
