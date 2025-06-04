import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runScripts() {
  console.log('Running donation update scripts...');
  
  try {
    // Run the first script to update amounts
    console.log('Running update-donations.ts...');
    const { stdout: stdout1, stderr: stderr1 } = await execAsync('npx tsx scripts/update-donations.ts');
    console.log(stdout1);
    if (stderr1) console.error(stderr1);
    
    // Run the second script to update project IDs
    console.log('Running update-project-ids.ts...');
    const { stdout: stdout2, stderr: stderr2 } = await execAsync('npx tsx scripts/update-project-ids.ts');
    console.log(stdout2);
    if (stderr2) console.error(stderr2);
    
    console.log('All updates completed successfully');
  } catch (error) {
    console.error('Error running update scripts:', error);
  }
}

// Run the scripts
runScripts()
  .then(() => {
    console.log('All scripts executed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
