import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const HEADER_FILE = "MTIFunctionArgumentsEncoder.h";
const PATCH_MARKER = "MTI_DEPRECATION_SUPPRESS_PATCH";

function findHeaders(rootDir) {
  if (!existsSync(rootDir)) {
    return [];
  }

  const result = spawnSync(
    "find",
    [rootDir, "-path", `*/SourcePackages/checkouts/MetalPetal/*/${HEADER_FILE}`, "-type", "f"],
    {
      encoding: "utf8"
    }
  );

  if (result.status !== 0) {
    return [];
  }

  const files = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Keep only the known MetalPetal header locations.
  return files.filter(
    (file) =>
      file.endsWith(`/Frameworks/MetalPetal/${HEADER_FILE}`) ||
      file.endsWith(`/Sources/MetalPetalObjectiveC/include/${HEADER_FILE}`)
  );
}

function patchHeader(filePath) {
  const source = readFileSync(filePath, "utf8");
  if (source.includes(PATCH_MARKER)) {
    return false;
  }

  const beginToken = "NS_ASSUME_NONNULL_BEGIN";
  const endToken = "NS_ASSUME_NONNULL_END";
  if (!source.includes(beginToken) || !source.includes(endToken)) {
    return false;
  }

  const patched = source
    .replace(
      beginToken,
      `${beginToken}

// ${PATCH_MARKER}
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"`
    )
    .replace(
      endToken,
      `#pragma clang diagnostic pop
${endToken}`
    );

  if (patched === source) {
    return false;
  }

  chmodSync(filePath, 0o644);
  writeFileSync(filePath, patched, "utf8");
  return true;
}

function main() {
  const projectRoot = process.cwd();
  const searchRoots = [
    join(homedir(), "Library/Developer/Xcode/DerivedData"),
    join(projectRoot, "ios")
  ];

  const headers = [...new Set(searchRoots.flatMap(findHeaders))];
  if (headers.length === 0) {
    console.log("MetalPetal patch: no MTIFunctionArgumentsEncoder.h found.");
    return;
  }

  const patchedFiles = headers.filter(patchHeader);
  if (patchedFiles.length === 0) {
    console.log(`MetalPetal patch: already patched (${headers.length} file(s) checked).`);
    return;
  }

  console.log(`MetalPetal patch: patched ${patchedFiles.length} file(s).`);
  for (const file of patchedFiles) {
    console.log(`- ${file}`);
  }
}

main();
