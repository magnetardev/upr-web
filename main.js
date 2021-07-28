export async function randomize(rom, settings) {
  // Mount ROM & get the output path.
  const filePath = await mountFile(rom);
  const [first, ...rest] = filePath.split(".");
  const outPath = `/files/${first.split("/").pop()}-randomized.${rest.join(
    "."
  )}`;

  // Load the jar file
  cheerpjRunJar("dist/randomizer.jar", "--noupdate");

  // Instantiate the randomizer.
  const [settingsInst, romHandlerInst] = await Promise.all([
    instantiateSettings(settings),
    instantiateROMHandler(rom, filePath),
  ]);
  const randomizer = await instantiateRandomizer(settingsInst, romHandlerInst);

  // TODO: This fails. Need too figure out how to get the proper override off of the instance.
  await cjCall(randomizer, "randomize", cjStringJavaToJs(outPath));

  // TODO: Get the file at outPath and return it.
  console.log(outPath, settingsInst, romHandlerInst);
}

async function instantiateRandomizer(settings, romHandler) {
  return await cjNew("com.dabomstew.pkrandom.Randomizer", settings, romHandler);
}

async function instantiateSettings(settings) {
  const javaSettingsRef = await cjNew("com.dabomstew.pkrandom.Settings");
  // TODO: Parse the settings and set the proper values.
  await Promise.all([
    cjCall(javaSettingsRef, "setChangeImpossibleEvolutions", false),
  ]);
  return javaSettingsRef;
}

async function instantiateROMHandler(rom, filePath) {
  const random = await cjNew("java.util.Random");
  // TODO: Parse the ROM and determine which generation it is.
  // I'm testing with silver, so I'm just using gen 2 for now.
  const romHandler = await cjNew(
    "com.dabomstew.pkrandom.romhandlers.Gen2RomHandler",
    random
  );
  await cjCall(romHandler, "loadROM", cjStringJsToJava(filePath));
  return romHandler;
}

async function mountFile(file) {
  const filepath = "/str/" + file.name;
  const bytes = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
  cheerpjAddStringFile(filepath, bytes);
  return filepath;
}
