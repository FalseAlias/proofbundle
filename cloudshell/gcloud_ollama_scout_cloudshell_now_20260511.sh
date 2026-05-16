#!/usr/bin/env bash
set -euo pipefail

echo "PB_CLOUD_ONLY_OLLAMA_SCOUT_BOOT $(date -Is)"
echo "Target: Ollama Llama 4 Scout only: ollama run llama4:scout"
echo "Local laptop rule: no local Ollama install or run."

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

ZONE="${ZONE:-us-central1-c}"
OLD_VM="${OLD_VM:-pb-ollama-05111532}"
VM_NAME="${VM_NAME:-pb-ollama-scout-$(date +%m%d%H%M)}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-highmem-16}"
DISK_SIZE="${DISK_SIZE:-250GB}"
MODEL="${MODEL:-llama4:scout}"

echo "PROJECT=${PROJECT_ID}"
echo "ZONE=${ZONE}"
echo "OLD_VM_TO_STOP_IF_EXISTS=${OLD_VM}"
echo "SCOUT_VM=${VM_NAME}"
echo "MACHINE_TYPE=${MACHINE_TYPE}"
echo "DISK_SIZE=${DISK_SIZE}"
echo "MODEL=${MODEL}"

gcloud services enable compute.googleapis.com --project "${PROJECT_ID}"

if gcloud compute instances describe "${OLD_VM}" --zone "${ZONE}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Stopping wrong small VM ${OLD_VM} to protect credits..."
  gcloud compute instances stop "${OLD_VM}" --zone "${ZONE}" --project "${PROJECT_ID}" --quiet || true
fi

if gcloud compute instances describe "${VM_NAME}" --zone "${ZONE}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "SCOUT_VM_EXISTS=${VM_NAME}"
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
apt-get install -y curl ca-certificates jq htop git tmux
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable ollama
systemctl restart ollama
sleep 8
ollama pull llama4:scout
ollama list
'
fi

echo "Waiting for VM boot/startup script..."
sleep 30

echo "SCOUT_VM_STATUS:"
gcloud compute instances describe "${VM_NAME}" --zone "${ZONE}" --project "${PROJECT_ID}" --format='table(name,status,machineType.basename(),networkInterfaces[0].accessConfigs[0].natIP)'

echo
echo "TALK TO SCOUT:"
echo "gcloud compute ssh ${VM_NAME} --zone ${ZONE} --project ${PROJECT_ID} --command \"ollama run ${MODEL}\""
echo
echo "INTERACTIVE SSH:"
echo "gcloud compute ssh ${VM_NAME} --zone ${ZONE} --project ${PROJECT_ID}"
echo "then run: ollama run ${MODEL}"
echo
echo "CREDIT SAFETY WHEN DONE:"
echo "gcloud compute instances stop ${VM_NAME} --zone ${ZONE} --project ${PROJECT_ID}"
