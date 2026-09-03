#!/usr/bin/env bash
# =============================================================================
# Exyconn — take the MQTT broker off the public internet. Run ON the server (root).
#
#   scp -r deploy root@148.135.136.107:/opt/exyconn-deploy
#   ssh root@148.135.136.107 'bash /opt/exyconn-deploy/close-mqtt-ports.sh'
#
# Every exyconn domain resolves to this one host, so 1883 (plaintext MQTT) and
# 8883 (MQTT over TLS, certificate CN=iot.exyconn.com) answered on all of them.
# The broker does require credentials — an anonymous CONNECT is refused with
# CONNACK 0x05 — but 1883 carries those credentials and all telemetry in clear
# text, which is the reason this exists.
#
# The broker keeps listening locally: anything on this box that reaches it over
# 127.0.0.1 (the Infinity Home backend does) is unaffected. Physical devices
# connecting from outside are cut off — re-home them before running this.
#
# SAFETY: touches ONLY these two ports. It never changes ufw's default policy and
# never stops another stack's services — this box also hosts duncit and Infinity
# Home. Idempotent: safe to re-run.
# =============================================================================
set -euo pipefail

PORTS=(1883 8883)

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root."
  exit 1
fi

echo "==> 1/4  What is listening on ${PORTS[*]}"
for port in "${PORTS[@]}"; do
  ss -ltnp "sport = :${port}" | tail -n +2 || true
done

echo "==> 2/4  Checking whether Docker publishes these ports"
# A container started with -p 1883:1883 is reachable through Docker's own nat
# rules, which sit in front of ufw — the firewall cannot close it and the port has
# to be unpublished (or bound to 127.0.0.1) in that stack instead.
PUBLISHED=()
if command -v docker >/dev/null; then
  for port in "${PORTS[@]}"; do
    hits="$(docker ps --format '{{.Names}} {{.Ports}}' | grep -E "(^|[^0-9:])${port}->" || true)"
    if [ -n "${hits}" ]; then
      PUBLISHED+=("${port}  ${hits}")
      echo "    ${port} is published by Docker: ${hits}"
    else
      echo "    ${port} is not published by Docker"
    fi
  done
else
  echo "    docker not installed here"
fi

echo "==> 3/4  Closing the ports in ufw"
if ! command -v ufw >/dev/null; then
  echo "::error:: ufw is not installed, so this script cannot manage the firewall."
  echo "          The host is already default-deny through some other means — find it"
  echo "          (iptables-save / nft list ruleset) and drop the 1883 and 8883 rules there."
  exit 1
fi
for port in "${PORTS[@]}"; do
  # Delete the ALLOW rules (v4 and v6) before adding the DENY, so rule order can't
  # leave the port open. Bounded, because a delete that does not take must not spin.
  for _ in 1 2 3; do
    ufw status | grep -qE "^${port}/tcp" || break
    ufw --force delete allow "${port}/tcp" || break
  done
  ufw deny "${port}/tcp" comment 'exyconn: MQTT is not public'
done
ufw reload

echo "==> 4/4  Result"
ufw status | grep -E "^(1883|8883)/tcp" || echo "    no MQTT rules in ufw"
for port in "${PORTS[@]}"; do
  ss -ltnp "sport = :${port}" | tail -n +2 || true
done

if [ ${#PUBLISHED[@]} -gt 0 ]; then
  echo "::error:: Docker still publishes: ${PUBLISHED[*]}"
  echo "          ufw cannot block a published port. Bind the broker to 127.0.0.1"
  echo "          in the Infinity Home stack (ports: '127.0.0.1:1883:1883', or drop the"
  echo "          mapping entirely) and re-deploy it, then re-run this script."
  exit 1
fi
echo "==> Done. 1883 and 8883 are closed at the firewall; nginx, duncit and the"
echo "    Infinity Home web app on 443 are untouched."
