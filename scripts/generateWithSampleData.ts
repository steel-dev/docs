import { ReferenceMarkdownGenerator } from "@/lib/markdown-generator";
import fs from "node:fs/promises";
import path from "path";
import { OUTPUT_DIR } from "./generate-reference-docs";

// For testing with sample data
export async function generateWithSampleData() {
  const sampleData = {
    name: "@stacks/transactions",
    version: "7.1.0",
    exports: [
      {
        name: "Address",
        kind: "Namespace",
        description:
          "The Address namespace provides utilities for working with Stacks addresses.",
        source: {
          fileName: "packages/transactions/src/namespaces/address.ts",
          line: 1,
          url: "https://github.com/hirosystems/stacks.js/blob/c8267f2/packages/transactions/src/namespaces/address.ts#L1",
        },
      },
      {
        name: "AddressRepr",
        kind: "Type alias",
        description: "Type representation for Stacks addresses",
        source: {
          fileName: "packages/transactions/src/namespaces/address.ts",
          line: 8,
          url: "https://github.com/hirosystems/stacks.js/blob/c8267f2/packages/transactions/src/namespaces/address.ts#L8",
        },
      },
      {
        name: "fromPrivateKey",
        kind: "Function",
        source: {
          fileName: "packages/transactions/src/namespaces/address.ts",
          line: 90,
          url: "https://github.com/hirosystems/stacks.js/blob/c8267f2/packages/transactions/src/namespaces/address.ts#L90",
        },
        signatures: [
          {
            parameters: [
              {
                name: "privateKey",
                type: "PrivateKey",
                description: "The private key to convert.",
                optional: false,
              },
              {
                name: "network",
                type: 'StacksNetwork | "mainnet" | "testnet" | "devnet" | "mocknet"',
                optional: true,
              },
            ],
            examples: [
              {
                code: "```ts\nimport { Address } from '@stacks/transactions';\n\nconst address = Address.fromPrivateKey('73a2f291df5a8ce3ceb668a25ac7af45639513af7596d710ddf59f64f484fd2801');\n// 'SP10J81WVGVB3M4PHQN4Q4G0R8586TBJH948RESDR'\n\nconst address = Address.fromPrivateKey('73a2f291df5a8ce3ceb668a25ac7af45639513af7596d710ddf59f64f484fd2801', 'testnet');\n// 'ST10J81WVGVB3M4PHQN4Q4G0R8586TBJH94CGRESQ'\n```",
              },
            ],
            description:
              "Convert a private key to a single-sig C32 Stacks address.",
            returns: {
              type: "string",
              description: "The address string.",
            },
          },
        ],
      },
    ],
  };

  console.log("📚 Using sample data for testing...\n");

  // Generate the markdown
  const generator = new ReferenceMarkdownGenerator(sampleData);
  const markdown = generator.generateFullDocument();

  // Write to a test file
  const outputPath = path.join(OUTPUT_DIR, "test-sample.mdx");
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(outputPath, markdown, "utf-8");

  console.log(`✅ Sample documentation generated at: ${outputPath}`);
  console.log(`\n📄 View at: /docs/reference/test-sample`);
}
