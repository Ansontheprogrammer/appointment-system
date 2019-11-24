const { exec } = require('child_process')
const request = require('request')

const startBarbershopScripts = [
    'startBarberSharp.js',
    'startFadesOfGray.js',
]
const urls = [
    `https://appointment-system.onrender.com/api/resetCronJobs`,
    `https://barbersharpappointmentsystem.onrender.com/api/resetCronJobs`
]

function resetCronJobs(){
    if(process.env.NODE_ENV === 'development'){
        const url = `http://localhost:80/api/resetCronJobs`
        request(url)
        console.log('Finished reset of cron jobs')
        process.exit()
    } else {
        urls.forEach(url => request(url));
        console.log('Finished reset of cron jobs')
        process.exit()
    }
}

function runScriptToSetData(command){
    exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error(err, 'error setting shop data');
          process.exit()
          return 
        }
        console.log('Submitting shop data')
    });
}

async function setBarberShopData() {
    let command;
    // if it's the dev env we want to just use one shop's info
    if(process.env.NODE_ENV === 'development'){
        command = `NODE_ENV=development node ${startBarbershopScripts[1]}`
        runScriptToSetData(command)
    } else {
        startBarbershopScripts.forEach(script => {
            command = `node ${script}`
            runScriptToSetData(command)
        })
    }
}

// run reset process
setBarberShopData()
.then(() => console.log('Successfully set shop data'))
.catch(err => console.error('Shop data was not successfully created', err))
.finally(() => resetCronJobs())
