function abc() {
    return 'bla'
}

function abd() {
    
}

function prms(num) {
    const pr = new Promise(function (resolve, reject) {
        const ab = abc()
        if (num == 1) {
            resolve('hey')
        } else {
            reject('error')
        }
    })

    return pr
}

function prmsNew(num) {
    const pr = new Promise(function (resolve, reject) {
        const ab = abc()
        abd()
        if (num == 1) {
            resolve('hey')
        } else {
            reject('error')
        }
    })

    return pr
}

prms(1)
    .then((value) => {
        console.log(value);
    })

async function bla() {
    try {
        console.log(await prms(1));
    } catch (err) {
        console.error(err);
    } 
}
bla()

module.exports = prms