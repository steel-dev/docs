// scripts/generate-reference-docs.ts

import fs from "node:fs/promises";
import path from "node:path";
import { ReferenceMarkdownGenerator } from "../lib/markdown-generator";
import { generateWithSampleData } from "./generateWithSampleData";

// Configuration
const INPUT_JSON_PATH = process.argv[2] || "./typedoc-output.json";
export const OUTPUT_DIR = "./content/docs/resources";
const OUTPUT_FILENAME = "steel-browser.mdx";

async function generateReferenceDocs() {
  try {
    console.log("📚 Starting reference documentation generation...\n");

    // Read the TypeDoc JSON file
    console.log(`📖 Reading TypeDoc JSON from: ${INPUT_JSON_PATH}`);
    const jsonContent = await fs.readFile(INPUT_JSON_PATH, "utf-8");
    const typeDocData = JSON.parse(jsonContent);

    console.log(`✅ Loaded ${typeDocData.name} v${typeDocData.version}`);
    console.log(`   Total exports: ${typeDocData.exports?.length || 0}`);

    // Generate the markdown
    console.log("\n🔨 Generating markdown...");
    const generator = new ReferenceMarkdownGenerator(typeDocData);
    const markdown = generator.generateFullDocument();

    // Ensure output directory exists
    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILENAME);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Write the markdown file
    console.log(`\n💾 Writing markdown to: ${outputPath}`);
    await fs.writeFile(outputPath, markdown, "utf-8");

    // Calculate some stats
    const lines = markdown.split("\n").length;
    const size = Buffer.byteLength(markdown, "utf-8");

    console.log(`\n✨ Generation complete!`);
    console.log(`   Lines: ${lines.toLocaleString()}`);
    console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
    console.log(
      `\n📄 View your documentation at: /docs/reference/${OUTPUT_FILENAME.replace(".mdx", "")}`,
    );
  } catch (error) {
    console.error("\n❌ Error generating documentation:", error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  // Check if --sample flag is passed
  // if (process.argv.includes("--sample")) {
  //   generateWithSampleData().catch(console.error);
  // } else {
  //   generateReferenceDocs().catch(console.error);
  // }
}

export { generateReferenceDocs, generateWithSampleData };
