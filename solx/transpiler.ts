import * as fs from "fs";
import * as path from "path";

interface ProcessedContent {
  solidity: string;
  typescript: string;
}

function processSolidityFile(inputPath: string): void {
  const content = fs.readFileSync(inputPath, "utf-8");
  const { solidity, typescript } = extractTypeScriptBlock(content);

  const outputDir = path.join(process.cwd(), "out", "solx");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputSolPath = path.join(
    outputDir,
    path.basename(inputPath).replace(".solx", ".sol")
  );
  const outputTsPath = path.join(outputDir, "example.ts");

  fs.writeFileSync(outputSolPath, solidity);
  fs.writeFileSync(outputTsPath, typescript);

  /*console.log(`Processed ${inputPath}`);
  console.log(`Generated ${outputSolPath}`);
  console.log(`Generated ${outputTsPath}`);*/
}

function extractTypeScriptBlock(content: string): ProcessedContent {
  const tsBlockRegex =
    /\/\/ @typescript-start\s*\((.*?)\)([\s\S]*?)\/\/ @typescript-end\s*\((.*?)\)/;
  const match = tsBlockRegex.exec(content);

  if (!match) {
    throw new Error("No TypeScript block found in the Solidity file.");
  }

  const [fullMatch, inputVars, tsCode, outputVars] = match;
  const inputVarList = inputVars
    ? inputVars.split(",").map((v) => v.trim())
    : [];
  const outputVarList = outputVars
    ? outputVars.split(",").map((v) => v.trim())
    : [];

  const allOutputVars = [...new Set([...outputVarList, ...inputVarList])];
  const newOutputVars = outputVarList.filter((v) => !inputVarList.includes(v));
  const existingOutputVars = allOutputVars.filter(
    (v) => !newOutputVars.includes(v)
  );
  const hasConsoleLog = tsCode.includes("console.log");

  let solidity = content.replace(
    fullMatch,
    `
    string[] memory cmd = new string[](${inputVarList.length > 0 ? "3" : "2"});
    cmd[0] = "bun";
    cmd[1] = "./out/solx/example.ts";
    ${
      inputVarList.length > 0
        ? `cmd[2] = vm.toString(abi.encode(${inputVarList
            .map((v) => v.split(" ")[1])
            .join(", ")}));`
        : ""
    }
    ${
      allOutputVars.length > 0 || hasConsoleLog
        ? "bytes memory solx_decoded = vm.ffi(cmd);"
        : "vm.ffi(cmd);"
    }
    ${
      allOutputVars.length > 0 || hasConsoleLog
        ? `
    (${newOutputVars
      .map((v) => {
        const [type, name] = v.split(" ");
        return `${addMemoryKeyword(type)} ${name}`;
      })
      .join(", ")}${
            existingOutputVars.length > 0
              ? (newOutputVars.length > 0 ? ", " : "") +
                existingOutputVars
                  .map((v, i) => {
                    const [type, name] = v.split(" ");
                    return `${addMemoryKeyword(type)} solx_temp_${i}`;
                  })
                  .join(", ")
              : ""
          }${allOutputVars.length > 0 && hasConsoleLog ? ", " : ""}${
            hasConsoleLog ? "string memory solx_logs" : ""
          }) = abi.decode(solx_decoded, (${allOutputVars
            .map((v) => v.split(" ")[0])
            .join(", ")}${hasConsoleLog ? ", string" : ""}));
    ${existingOutputVars
      .map((v, i) => `${v.split(" ")[1]} = solx_temp_${i};`)
      .join("\n    ")}`
        : ""
    }
    ${hasConsoleLog ? "console.log(solx_logs);" : ""}
  `
  );

  let typescript = `
import { ethers } from "ethers";

${
  hasConsoleLog
    ? `
let solx_logs = "";
let isFirstLog = true;
const originalConsoleLog = console.log;
console.log = (...args) => {
    if (isFirstLog) {
        solx_logs += args.join(' ');
        isFirstLog = false;
    } else {
        solx_logs += "\\n  " + args.join(' ');
    }
};
`
    : ""
}

const inputData = Bun.argv[2];

${
  inputVarList.length > 0
    ? `
if (!inputData) {
    console.error("No input data provided");
    process.exit(1);
}
`
    : ""
}

async function main() {
    try {
        const abi = new ethers.AbiCoder();
        ${
          inputVarList.length > 0
            ? `
        // Decode input based on the types specified in the Solidity FFI call
        let [${inputVarList
          .map((v) => v.split(" ")[1])
          .join(", ")}] = abi.decode([${inputVarList
                .map((v) => `"${v.split(" ")[0]}"`)
                .join(", ")}], inputData);
        `
            : ""
        }

        // User's TypeScript code
        ${tsCode}

        ${
          hasConsoleLog
            ? `
        // Restore original console.log
        console.log = originalConsoleLog;
        `
            : ""
        }

        ${
          allOutputVars.length > 0 || hasConsoleLog
            ? `
        // Encode output including logs and all input variables
        const encodedOutput = abi.encode(
            [...${JSON.stringify(allOutputVars.map((v) => v.split(" ")[0]))}${
                hasConsoleLog ? ', "string"' : ""
              }],
            [${allOutputVars.map((v) => v.split(" ")[1]).join(", ")}${
                hasConsoleLog ? ", solx_logs" : ""
              }]
        );

        console.log(encodedOutput);
        `
            : ""
        }
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}

main();
`;

  return { solidity, typescript };
}

function addMemoryKeyword(type: string): string {
  // Always add 'memory' for array types
  if (type.includes("[]")) {
    return `${type} memory`;
  }

  // For non-array types, add 'memory' if it's not a value type
  if (
    !/^(uint\d*|int\d*|bool|address|bytes([1-9]|[12][0-9]|3[0-2]))(\[\])?$/.test(
      type
    )
  ) {
    return `${type} memory`;
  }

  return type;
}

// Main execution
const inputFilePath = path.join(process.cwd(), "test", "Example.solx");
processSolidityFile(inputFilePath);
