function prms(num) {
    return new Promise((resolve, reject) => {
        if (num == 1) {
            resolve('hey')
        } else {
            reject('error')
        }
    })
}

prms(1)
    .then((value) => {
        console.log(value);
    })
    .catch((err) => {
    console.log(err);
    })

module.exports = prms