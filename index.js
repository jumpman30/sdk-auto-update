#!/usr/bin/env node

const fs = require('fs');
const exec = require('child_process').exec;
const util = require('util');
const execPromisified = util.promisify(exec);

async function checkForUpdate(packageName) {
    console.log(`Checking if ${packageName} is outdated...`);

    // `yarn outdated` command exits with code 1 if it finds outdated packages,
    //which is treated like an error in NodeJs
    try {
        const response = await execPromisified(`yarn outdated ${packageName}`);
        console.log(response);
    } catch (error) {
        if (error.code === 1) {
            console.log(`${packageName} is outdated`);
            return true;
        } else {
            console.log('Error running yarn outdated');
            return false;
        }
    }
    return false;
}

async function updatePackage(packageName) {
    try {
        console.log(`${packageName} is outdated, updating...`);
        const {stdout: updateOut} = await execPromisified(`yarn upgrade ${packageName}@latest`);
        console.log(updateOut);
    } catch (error) {
        console.error(`Error while updating ${packageName}: ${error}`);
    }
}


fs.readFile('./package.json', async (err, data) => {
    const sdkKey = process.argv[2];

    if (err) {
        console.error(`Error reading package.json: ${err}`);
        return;
    }

    const packageData = JSON.parse(data);
    const dependencies = Object.keys(packageData.dependencies || {}).filter((name) => name.includes(sdkKey));

    let outdatedPackages = [];
    for (const dependency of dependencies) {
        await checkForUpdate(dependency) ? outdatedPackages.push(dependency) : undefined;
    }

    Promise.all(outdatedPackages.map(updatePackage)).then(() => {
        exec(`yarn install`);
        console.log('Finished updating all packages.');
    });

});
