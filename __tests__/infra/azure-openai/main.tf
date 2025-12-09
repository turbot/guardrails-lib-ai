terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
}

resource "azurerm_resource_group" "openai" {
  name     = "guardrails-lib-ai-test-rg"
  location = var.location
}

resource "azurerm_cognitive_account" "openai" {
  name                = "guardrails-lib-ai-openai"
  location            = azurerm_resource_group.openai.location
  resource_group_name = azurerm_resource_group.openai.name
  kind                = "OpenAI"
  sku_name            = "S0"

  tags = { Purpose = "Integration testing for guardrails-lib-ai" }
}

resource "azurerm_cognitive_deployment" "models" {
  for_each             = { for m in var.models : m.deployment => m }
  name                 = each.value.deployment
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = each.value.model
    version = each.value.version
  }

  sku {
    name     = "Standard"
    capacity = 1
  }
}
