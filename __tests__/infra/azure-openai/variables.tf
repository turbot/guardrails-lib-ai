variable "subscription_id" {
  description = "Azure subscription ID (run: az account show --query id -o tsv)"
  type        = string
}

variable "tenant_id" {
  description = "Azure tenant ID (from 'az account show')"
  type        = string
  default     = null # Uses default from az login if not specified
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "models" {
  description = "Model deployments to create (matching test file AZURE_OPENAI_DEPLOYMENTS)"
  type = list(object({
    deployment = string
    model      = string
    version    = string
  }))
  default = [
    # GPT-4o family - supports temperature
    { deployment = "gpt-4o", model = "gpt-4o", version = "2024-11-20" },
    { deployment = "gpt-4o-mini", model = "gpt-4o-mini", version = "2024-07-18" },

    # GPT-4.1 family - supports temperature
    { deployment = "gpt-4.1-mini", model = "gpt-4.1-mini", version = "2025-04-14" }

    # Note: gpt-4.1 removed to reduce rate limiting issues
    # Note: gpt-4.1-nano doesn't support Standard SKU deployment
    # Note: GPT-5 models are not yet available in Azure OpenAI
    # These will be gracefully skipped in tests
  ]
}
