// app.js (CommonJS)
(async () => {
  try {
    // Dynamically import the ES module version of your server
    await import("./dist/server.js");
  } catch (err) {
    console.error("Error starting the app:", err);
  }
})();
