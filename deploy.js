const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deploy() {
    console.log('🚀 Starting deployment process...');

    // Check if .env file exists, if not create it
    if (!fs.existsSync('.env')) {
        console.log('📝 Setting up environment variables...');
        
        const supabaseUrl = await question('Enter your Supabase URL: ');
        const supabaseKey = await question('Enter your Supabase Anon Key: ');
        const openpipeKey = await question('Enter your OpenPipe API Key: ');

        const envContent = `SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}
OPENPIPE_API_KEY=${openpipeKey}`;

        fs.writeFileSync('.env', envContent);
        console.log('✅ Environment variables saved to .env file');
    }

    try {
        // Install dependencies
        console.log('📦 Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });

        // Initialize Netlify if not already done
        console.log('🔧 Setting up Netlify...');
        try {
            execSync('netlify status', { stdio: 'inherit' });
        } catch {
            console.log('🔄 First time deployment, initializing Netlify...');
            execSync('netlify login', { stdio: 'inherit' });
            execSync('netlify init', { stdio: 'inherit' });
        }

        // Set up environment variables in Netlify
        console.log('🔒 Setting up environment variables in Netlify...');
        const envVars = fs.readFileSync('.env', 'utf8').split('\n');
        for (const envVar of envVars) {
            const [key, value] = envVar.split('=');
            if (key && value) {
                execSync(`netlify env:set ${key} "${value}"`, { stdio: 'inherit' });
            }
        }

        // Build the project
        console.log('🛠️ Building the project...');
        execSync('npm run build', { stdio: 'inherit' });

        // Deploy to Netlify
        console.log('🚀 Deploying to Netlify...');
        execSync('netlify deploy --prod', { stdio: 'inherit' });

        console.log('✅ Deployment completed successfully!');
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

deploy(); 