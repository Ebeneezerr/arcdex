// import-contracts.js
// Script to copy ABIs and addresses from Hydra deployments to the frontend

const fs = require('fs');
const path = require('path');

const deploymentsDir = path.join(__dirname, '../../deployments');
const frontendContractsDir = path.join(__dirname, '../src/contracts');

if (!fs.existsSync(frontendContractsDir)) fs.mkdirSync(frontendContractsDir, { recursive: true });

const networks = fs.readdirSync(deploymentsDir).filter(f => {
  const stat = fs.statSync(path.join(deploymentsDir, f));
  return stat.isDirectory() && fs.existsSync(path.join(deploymentsDir, f, 'deployment.json'));
});

networks.forEach(network => {
  const deploymentPath = path.join(deploymentsDir, network, 'deployment.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
  const outDir = path.join(frontendContractsDir, network);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'addresses.json'), JSON.stringify(deployment.contracts, null, 2));
});

console.log('Contract addresses imported to frontend.');
