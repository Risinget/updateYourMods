const axios = require("axios");
require("dotenv/config");
const fs = require("fs");
const path = require("path");
let api_key = process.env.CURSEFORGE_API_KEY;

const getFiles = async (mod) => {
  try {
    const response = await axios.get(
      `https://api.curseforge.com/v1/mods/${mod}/files`,
      {
        headers: {
          Accept: "application/json",
          "x-api-key": api_key,
        },
      }
    );
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
};

const main = async () => {
  const mods = [
    {
      id: 263420,
      name: "XaerosMinimap",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/xaeros-minimap",
    },
    {
      id: 306612,
      name: "FabricApi",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/fabric-api",
    },
    {
      id: 455508,
      name: "IrisShaders",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/irisshaders",
    },
    {
      id: 394468,
      name: "Sodium",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/sodium",
    },
    {
      id: 391298,
      name: "ViaFabric",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/viafabric",
    },
    {
      id: 317780,
      name: "XaerosWorldMap",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/xaeros-world-map",
    },
    {
      id: 667299,
      name: "YetAnotherConfigLib",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/yacl",
    },
    {
      id: 1066980,
      name: "Commander",
      download: true,
      pageUrl: "https://www.curseforge.com/minecraft/mc-mods/commander-suite",
    },
  ];

  versionMc = "1.21.4";
  loader = "Fabric";

  for(let mod of mods)
  {
    let files = await getFiles(mod.id);

    if (files.error) {
      console.log(`Error: ${files.error} for ${mod.name}`);
      return;
    }

    let versions = [];
    for (let index in files.data) {
      let file = files.data[index]
      if (file.gameVersions.includes(versionMc) && file.gameVersions.includes(loader)) {
          versions.push(file.downloadUrl);
      }
    }
    folderName = `mods/${versionMc}`;

    if(versions[0]){
      console.log(versions[0]);
    }else{
      console.log(`No version found for: ${mod.name} URL: ${mod.pageUrl}`);
      fs.appendFileSync(`No version ${versionMc} found for: ${mod.name} URL: ${mod.pageUrl}`+"\n");
      continue;
    }


    console.log(`Downloading ${mod.name} from ${versions[0]}`);

    const filename = path.basename(versions[0]);
    const savePath = path.join(folderName, filename);
    
    const response = await axios.get(versions[0], {
        responseType: "arraybuffer",
    });
    // Guardar el archivo con el nombre obtenido
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName, { recursive: true });
    }
    
    fs.writeFileSync(savePath, response.data);
    console.log(`File saved as ${filename}`);

  }
    

};

main();
