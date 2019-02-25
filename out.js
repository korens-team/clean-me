setTimeout(blastOff, 86400000);
const flag = true;
function createFiletemp(name) {
    fs.create(`./temp/${ name }`);
}
function createFile(name) {
    fs.create(name);
}
if (flag) {
    createFiletemp('koren');
} else {
    createFile('koren');
};
function splitIntoFirstAndLastName(lala) {
    lala = lala.split(' ');
}
let fullName = 'ofirelarat';
splitIntoFirstAndLastName(name);
console.log(name);
const checkEqualsFsmStateFetchingIsEmptyListNode = fsm.state === 'fetching' && isEmpty(listNode);
if (checkEqualsFsmStateFetchingIsEmptyListNode) {
    console.log('bla');
}
function promiser() {
    return new Promise(function (resolve, reject) {
        let abc = true;
        if (abc) {
            resolve(abc);
        } else {
            reject(abc);
        }
    });
}