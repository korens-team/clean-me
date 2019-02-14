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


  function promiser(){
      return new Promise(function(res, reject){});
  }

  promiser.then(function(value){
      console.log(value);
  })