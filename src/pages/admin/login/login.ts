import * as express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.send(`
    <form method="POST">
      <input type="text" name="username" placeholder="Username" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  `);
});

router.post("/", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1326") {
    // Replace with real authentication
    req.session.isAdmin = true;
    const redirectUrl =
      typeof req.query.redirect === "string" ? req.query.redirect : "/admin";
    return res.redirect(redirectUrl);
  }
  res.send(`Invalid credentials. <a href="/login">Try again</a>.`);
});

export default router;
