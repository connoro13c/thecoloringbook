# Test Mode Sample Images

This directory contains sample coloring page images used in test mode to bypass AI generation during development.

## Available Samples

- `sample-unicorn-coloring.svg` - Classic cartoon style with a child riding a unicorn
- `sample-forest-coloring.svg` - Ghibli style with a child exploring a magical forest
- `sample-mandala-coloring.svg` - Mandala/pattern style with intricate designs

## Usage

When test mode is enabled (via the toggle in development or `ENABLE_TEST_MODE=true`), the generation pipeline will randomly select one of these sample images instead of calling the OpenAI API.

This allows for rapid testing of:
- Payment flow
- Authentication
- Download functionality  
- UI components
- Database operations

Without the time and cost of AI image generation.
