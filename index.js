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

async function downloadUrl(mod, versions, versionMc) {
      folderName = `mods/${versionMc}`;

      console.log(versions);
      
      if (versions[0]) {
        console.log(versions[0]);
      } else {
        console.log(`No version found ${versionMc} for: ${mod.name} URL: ${mod.pageUrl}`);
        const logMessage = `No version ${versionMc} found for: ${mod.name} URL: ${mod.pageUrl || "Unknown URL"}\n`;
        fs.appendFileSync("error_log.txt", logMessage);

        return;
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

const main = async () => {

  const curseforgeMods = mods.curseforge;
  const modrinthMods = mods.modrinth;
  for (let mod of curseforgeMods) {
    let files = await getFilesCurseforge(mod.id);

    if (files.error) {
      console.log(`Error: ${files.error} for ${mod.name}`);
      return;
    }

    let versions = [];
    for (let index in files.data) {
      let file = files.data[index];
      if (
        file.gameVersions.includes(versionMc) &&
        file.gameVersions.includes(loader)
      ) {
        versions.push(file.downloadUrl);
      }
    }
    await downloadUrl(mod, versions, versionMc);
  }

  for(let mod of modrinthMods){
    const files = await getFilesModrinth(mod.id);
    if (files.error) {
      console.log(`Error: ${files.error} for ${mod.name}`);
      return;
    }
    let versions = [];
    for (let index in files) {
      let file = files[index];
      if (file.game_versions.includes(versionMc)) {
        versions.push(file.files[0].url);
      }
    }

    await downloadUrl(mod, versions, versionMc);

  }
};
main();
