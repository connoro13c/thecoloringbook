export interface ChildAttributes {
  age: string;
  hair_style: string;
  headwear: string;
  eyewear: string;
  clothing: string;
  pose: string;
  main_object: string;
}

export function buildColoringPrompt(
  attrs: ChildAttributes,
  scene: string, // supplied by parent/kid
  difficulty = 3,
  style = "classic"
): string {
  return `
Create a black-and-white coloring-book illustration (simple line art).

Child description (keep recognizable):
• Age: ${attrs.age}
• Hairstyle: ${attrs.hair_style}
• Headwear: ${attrs.headwear}
• Eyewear: ${attrs.eyewear}
• Clothing: ${attrs.clothing}
• Pose: ${attrs.pose}
• Holding / interacting with: ${attrs.main_object}

Scene (imaginative setting supplied by user):
• ${scene}

Style rules:
• Pure black outlines on white, no shading or grayscale.
• Lines chunky and even, large open spaces for coloring.
• Remove photographic background; include only elements relevant
  to the scene.

${buildDifficultyPrompt(difficulty)}
${buildStylePrompt(style)}
`.trim();
}

function buildDifficultyPrompt(difficulty: number): string {
  const lineWeight = difficulty === 1 ? "extra-thick" :
                     difficulty === 5 ? "extra-thin"  : "medium";
  
  return `• Use ${lineWeight} outlines consistent across the image.`;
}

function buildStylePrompt(style: string): string {
  switch (style) {
    case "ghibli":
      return "• Add subtle whimsical Ghibli-style shapes (but stay line art).";
    case "bold":
      return "• Use very thick outlines and simplified forms.";
    default:
      return "• Keep traditional coloring book style with balanced detail.";
  }
}