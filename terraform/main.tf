terraform {
  required_version = ">= 1.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "supabase" {
  access_token = var.supabase_access_token
}

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "supabase_access_token" {
  description = "Supabase access token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "coloring-book-app"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Vercel Project
resource "vercel_project" "coloring_book" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "your-username/coloring-book-app"
  }

  environment = [
    {
      key    = "SUPABASE_URL"
      value  = supabase_project.main.url
      target = ["production", "preview", "development"]
    },
    {
      key    = "SUPABASE_ANON_KEY"
      value  = supabase_project.main.anon_key
      target = ["production", "preview", "development"]
    }
  ]
}

# Supabase Project
resource "supabase_project" "main" {
  organization_id = var.supabase_org_id
  name           = var.project_name
  database_password = var.database_password
  region         = "us-west-1"
}

variable "supabase_org_id" {
  description = "Supabase organization ID"
  type        = string
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

output "vercel_project_id" {
  value = vercel_project.coloring_book.id
}

output "supabase_project_url" {
  value = supabase_project.main.url
}