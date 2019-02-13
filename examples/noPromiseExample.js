function prms(num) {
    const a = new Promise(function (resolve, reject) {
        if (num == 1) {
            resolve('hey')
        } else {
            reject('error')
        }
    })

    return a
}

prms(1)
    .then((value) => {
        console.log(value);
    })
    .catch((err) => {
    console.log(err);
    })

async function bla() {
    try {
        console.log(await prms(0));
    } catch (err) {
        console.error(err);
    } 
}
bla()

module.exports = prms