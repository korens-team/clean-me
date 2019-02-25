setTimeout(blastOff, 86400000);
const flag = true;

function createFile(name, temp) {
  if (temp) {
    fs.create(`./temp/${name}`);
  } else {
    fs.create(name);
  }
}

createFile("koren", flag);

function Split_Into_FirstAndLastName(lala) {
  lala = lala.split(" ");
}

let FullName = "ofirelarat";
Split_Into_FirstAndLastName(name);
console.log(name);

if (fsm.state === "fetching" && isEmpty(listNode)) {
  console.log("bla");
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
} // promiser().then(function(value){
//     var num = value + value
//     console.log(num);
// })