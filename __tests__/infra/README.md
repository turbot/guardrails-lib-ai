# Test Infrastructure

OpenTofu scripts to provision Azure OpenAI resources for integration testing.

## Prerequisites

- [OpenTofu](https://opentofu.org/) CLI installed (`tofu`)
- Azure CLI logged in (`az login`)

## Azure OpenAI

Provisions an Azure OpenAI resource with model deployments.

```bash
cd azure-openai
tofu init
tofu apply -var="subscription_id=$(az account show --query id -o tsv)"

# Append credentials to .env file
tofu output -raw env_config >> ../../../.env
```

### Resources Created

- Resource Group: `guardrails-lib-ai-test-rg`
- Cognitive Account: `guardrails-lib-ai-openai` (OpenAI kind)
- Model Deployments: gpt-4o-mini, gpt-4o (configurable)

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `subscription_id` | (required) | Azure subscription ID |
| `tenant_id` | (from az login) | Azure tenant ID |
| `location` | `eastus` | Azure region |
| `models` | gpt-4o-mini, gpt-4o | Model deployments |

Override defaults:

```bash
tofu apply \
  -var="subscription_id=$(az account show --query id -o tsv)" \
  -var="location=westus2"
```

### Adding More Deployments

Edit `variables.tf` to add more model deployments:

```hcl
variable "models" {
  default = [
    { deployment = "gpt-4o-mini", model = "gpt-4o-mini", version = "2024-07-18" },
    { deployment = "gpt-4o", model = "gpt-4o", version = "2024-08-06" },
    { deployment = "gpt-4.1", model = "gpt-4.1", version = "2025-04-14" }
  ]
}
```

## Quick Setup

```bash
# Azure OpenAI
cd __tests__/infra/azure-openai
tofu init && tofu apply -var="subscription_id=$(az account show --query id -o tsv)" -auto-approve
tofu output -raw env_config >> ../../../.env

# Run integration tests
cd ../../..
npm run test:integration:azure-openai
```

## Cleanup

```bash
cd __tests__/infra/azure-openai
tofu destroy -var="subscription_id=$(az account show --query id -o tsv)"
```

## Troubleshooting

- **Subscription not enabled**: Request Azure OpenAI access at <https://aka.ms/oai/access>
- **Quota exceeded**: Reduce model capacity or request quota increase.
- **Model not available**: Some models may not be available in all regions. Check Azure OpenAI model availability.
- **Deployment not found in tests**: The test file has hardcoded deployment names. Deployments that don't exist are gracefully skipped.
