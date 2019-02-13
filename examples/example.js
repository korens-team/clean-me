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

  function split_IntoFIRstAndLast_Name(lala) {
    lala = lala.split(" ");
  }
  
  let FullName = "ofirelarat";
  splitIntoFirstAndLastName(name);
  console.log(name); 


  if (fsm.state === "fetching" && isEmpty(listNode)) {
    console.log("bla");
  }