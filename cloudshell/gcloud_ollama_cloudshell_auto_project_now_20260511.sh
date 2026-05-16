#!/usr/bin/env bash
set -euo pipefail

echo "PB_CLOUD_ONLY_OLLAMA_BOOT $(date -Is)"
echo "This installs Ollama only inside a Google Compute Engine VM, not on the local laptop."

PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
if [ -z "${PROJECT_ID}" ] || [ "${PROJECT_ID}" = "(unset)" ]; then
  PROJECT_ID="$(gcloud projects list --filter='lifecycleState:ACTIVE' --format='value(projectId)' | head -n 1 || true)"
  if [ -z "${PROJECT_ID}" ]; then
    echo "BLOCKED: no Google Cloud project visible in this Cloud Shell account."
    echo "Run: gcloud projects list"
    exit 2
  fi
  gcloud config set project "${PROJECT_ID}"
fi

VM_NAME="${VM_NAME:-pb-ollama-$(date +%m%d%H%M)}"
ZONE="${ZONE:-us-central1-c}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-4}"
DISK_SIZE="${DISK_SIZE:-100GB}"
MODEL="${MODEL:-llama3.2:3b}"

echo "PROJECT=${PROJECT_ID}"
echo "ZONE=${ZONE}"
echo "VM=${VM_NAME}"
echo "MACHINE_TYPE=${MACHINE_TYPE}"
echo "DISK_SIZE=${DISK_SIZE}"
echo "MODEL=${MODEL}"

gcloud services enable compute.googleapis.com --project "${PROJECT_ID}"

if gcloud compute instances describe "${VM_NAME}" --zone "${ZONE}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "VM_EXISTS=${VM_NAME}"
else
  gcloud compute instances create "${VM_NAME}" \
    --project "${PROJECT_ID}" \
    --zone "${ZONE}" \
    --machine-type "${MACHINE_TYPE}" \
    --image-family ubuntu-2204-lts \
    --image-project ubuntu-os-cloud \
    --boot-disk-size "${DISK_SIZE}" \
    --boot-disk-type pd-balanced \
    --tags ollama \
    --metadata=startup-script='#!/usr/bin/env bash
set -euxo pipefail
apt-get update
apt-get install -y curl ca-certificates jq htop git
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable ollama
systemctl restart ollama
sleep 8
ollama pull '"${MODEL}"'
ollama list
'
fi

echo "Waiting for startup script first pass..."
sleep 30

echo "VM_STATUS:"
gcloud compute instances describe "${VM_NAME}" --zone "${ZONE}" --project "${PROJECT_ID}" --format='table(name,status,machineType.basename(),networkInterfaces[0].accessConfigs[0].natIP)'

echo
echo "SSH:"
echo "gcloud compute ssh ${VM_NAME} --zone ${ZONE} --project ${PROJECT_ID}"
echo
echo "TEST INSIDE VM:"
echo "ollama run ${MODEL} 'reply with ProofBundle Ollama online'"
echo
echo "CREDIT SAFETY:"
echo "gcloud compute instances stop ${VM_NAME} --zone ${ZONE} --project ${PROJECT_ID}"
