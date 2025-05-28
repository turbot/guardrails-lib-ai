# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-03-19

### Added
- Initial release of MultiModelAI
- Support for multiple AI providers:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
  - Deepseek
  - Mistral
  - Groq
  - Together AI
  - Cohere
  - Fireworks
  - DeepInfra
  - Cerebras
  - Perplexity
- Built-in streaming support
- Comprehensive error handling using @turbot/errors
- Structured logging using @turbot/log
- Environment variable configuration
- Fallback mechanism for providers
- Lambda function support
- TypeScript support

### Security
- API keys are handled through environment variables
- Sensitive information is redacted in logs
- Input validation for configuration parameters

### Documentation
- Comprehensive README with usage examples
- Error handling documentation
- Logging documentation
- Lambda integration guide
- API documentation

## [Unreleased]

### Added
- None yet

### Changed
- None yet

### Deprecated
- None yet

### Removed
- None yet

### Fixed
- None yet

### Security
- None yet

## Versioning

This project uses semantic versioning. For the versions available, see the [tags on this repository](https://github.com/yourusername/multimodel-ai/tags).

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md with new version and changes
3. Create a new git tag
4. Push changes and tag to repository
5. Create a new release on GitHub

## Contributing

When making changes, please follow these guidelines:

1. Update the CHANGELOG.md with your changes
2. Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
3. Use [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for version numbers
4. Add entries under the [Unreleased] section
5. Group changes under the appropriate categories:
   - Added: for new features
   - Changed: for changes in existing functionality
   - Deprecated: for soon-to-be removed features
   - Removed: for now removed features
   - Fixed: for any bug fixes
   - Security: for security vulnerability fixes