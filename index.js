const axios = require("axios");
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { mods, versionMc, loader} = require("./mods.json");
let api_key = process.env.CURSEFORGE_API_KEY;

const getFilesModrinth = async (mod) => {
  try {
    const response = await axios.get(`https://api.modrinth.com/v2/project/${mod}/version`);
    return response.data;
  } catch (error) {
    return { error: error.message };
  }

}

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

  for(let mod of mods)
  {
    if(mod.mondrith == true){

    }

    if (mod.curseforge == true) {

    }

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
