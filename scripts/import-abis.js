// import-abis.js
// Script to copy ABIs from Hydra build to the frontend

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../../artifacts/contracts');
const frontendAbisDir = path.join(__dirname, '../src/contracts/abis');

function copyAbis(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.readdirSync(srcDir).forEach(file => {
    const fullPath = path.join(srcDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      copyAbis(fullPath, path.join(destDir, file));
    } else if (file.endsWith('.json')) {
      const abiJson = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      if (abiJson.abi) {
        fs.writeFileSync(path.join(destDir, file), JSON.stringify(abiJson.abi, null, 2));
      }
    }
  });
}

copyAbis(buildDir, frontendAbisDir);
console.log('Contract ABIs imported to frontend.');
