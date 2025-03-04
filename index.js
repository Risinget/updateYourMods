const axios = require("axios");
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { mods, versionMc, loader, byVersion} = require("./mods.json");
let api_key = process.env.CURSEFORGE_API_KEY;


const getGameVersionId = async (version) => {
  try {
    const response = await axios.get(`https://api.curseforge.com/v1/minecraft/version`);
    let gameVersion = response.data.data.filter((v) => v.versionString === version);
    
    return gameVersion[0].gameVersionId;
  } catch (error) {
    return { error: error.message };
  }
};


const getFileByVersion = async (mod, version) => {
  try {
    let url = `https://www.curseforge.com/api/v1/mods/${mod.id}/files?pageIndex=0&pageSize=1&sort=dateCreated&sortDescending=true&gameVersionId=${version}&gameFlavorId=4&removeAlphas=false`;
    console.log(url);
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      },
    });
    
    return response.data.data[0];
  } catch (error) {
    return { error: error.message };
  }
}

const getFilesModrinth = async (mod) => {
  try {
    const response = await axios.get(`https://api.modrinth.com/v2/project/${mod}/version`);
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

const getFilesCurseforge = async (mod) => {
  try {
    const response = await axios.get(`https://api.curseforge.com/v1/mods/${mod}/files`,
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

// Función para descargar el archivo
async function downloadFile(url, fileName) {
  try {
    const encodedUrl = url.replace("+", "%2B");
    const response = await axios.get(encodedUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      },
    });

    // Crear un archivo en el sistema de archivos y guardar los datos
    let folderName = `mods/${versionMc}`;

    // Guardar el archivo con el nombre obtenido
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName, { recursive: true });
    }
    const savePath = path.join(folderName, fileName);
    fs.writeFileSync(savePath, response.data);
    console.log(`File saved as ${fileName}`);
  } catch (error) {
    try {
      const originalUrl = url;
      const encodedUrl = originalUrl.replace("+", "%2B");
      const lastUrl = encodedUrl.replace("media", "mediafilez");
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
        },
      });

      // Crear un archivo en el sistema de archivos y guardar los datos
      let folderName = `mods/${versionMc}`;

      // Guardar el archivo con el nombre obtenido
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const savePath = path.join(folderName, fileName);
      fs.writeFileSync(savePath, response.data);
      console.log(`File saved as ${fileName}`);
    } catch (error) {
      console.log(error);
      
    }

  }
}

async function downloadUrl(mod, versionMc, url) {

  if (url) {
    console.log(url);
  } else {
    console.log(
      `No version found ${versionMc} for: ${mod.name} URL: ${mod.pageUrl}`
    );
    const logMessage = `No version ${versionMc} found for: ${mod.name} URL: ${
      mod.pageUrl || "Unknown URL"
    }\n`;
    fs.appendFileSync("error_log.txt", logMessage);

    return;
  }

  
  let folderName = `mods/${versionMc}`;
  console.log(`Downloading ${mod.name} from ${url}`);

  const filename = path.basename(url);
  const savePath = path.join(folderName, filename);

  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  // Guardar el archivo con el nombre obtenido
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
  }

  fs.writeFileSync(savePath, response.data);
  console.log(`File saved as ${filename}`);
}

const main = async () => {
  const gameVersionId = await getGameVersionId(versionMc);
  const curseforgeMods = mods.curseforge;
  const modrinthMods = mods.modrinth;

  // esto asegura la integridad del archivo
  // es decir que funcione correctamente cuando es true para usar el filtrador de version de curseforge
  if (byVersion) {
    for (let mod of curseforgeMods) {
      const fileByVersion = await getFileByVersion(mod, gameVersionId);

      if (fileByVersion && fileByVersion.error) {
        console.log(`Error: ${fileByVersion.error} for ${mod.name}`);
        return;
      }

      // Extraer los datos relevantes del JSON
      if (!fileByVersion) {
        console.log(`No file found for ${mod.name}`);
        console.log(`No version found ${versionMc} for: ${mod.name} URL: ${mod.pageUrl}`);
        const logMessage = `No version ${versionMc} found for: ${mod.name} URL: ${mod.pageUrl || "Unknown URL"}\n`;
        fs.appendFileSync("error_log.txt", logMessage);
        continue;
      }

      // Extraer los datos relevantes del JSON
      const fileId = fileByVersion.id;
      const fileName = fileByVersion.fileName;

      // Construir la URL de descarga
      const url = `https://media.forgecdn.net/files/${Math.floor(
        fileId / 1000
      )}/${fileId % 1000}/${fileName}`;

      console.log(url);

      await downloadFile(url, fileName);
    }
  } else {
    // usando api de curseforge con api key
    for (let mod of curseforgeMods) {
      let files = await getFilesCurseforge(mod.id);
      if (files && files.error) {
        console.log(`Error: ${files.error} for ${mod.name}`);
        return;
      }

      let versions = [];
      for (let index in files.data) {
        let file = files.data[index];
        if (file.gameVersions.includes(versionMc) &&file.gameVersions.includes(loader)) {
          versions.push(file.downloadUrl);
        }
      }
      let url = versions[0]
      await downloadUrl(mod, versionMc, url);
    }
  }

  for (let mod of modrinthMods) {
    const files = await getFilesModrinth(mod.id);
    
    if (files && files.error) {
      console.log(`Error: ${files.error} for ${mod.name}`);
      return;
    }

    if(!files){
      console.log(`No file found for ${mod.name}`);
      console.log(`No version found ${versionMc} for: ${mod.name} URL: ${mod.pageUrl}`);
      const logMessage = `No version ${versionMc} found for: ${mod.name} URL: ${mod.pageUrl || "Unknown URL"}\n`;
      fs.appendFileSync("error_log.txt", logMessage);
      continue;
    }
    let versions = [];
    for (let index in files) {
      let file = files[index];
      if (file.game_versions.includes(versionMc) && file.loaders.includes(loader.toLowerCase())) {
        versions.push(file.files[0].url);
      }
    }
    let url = versions[0]
    await downloadUrl(mod, versionMc, url);
  }
};

// Llamar la función para descargar el archivo
main();
