export default function handler(req, res) {
  if (
    req.method !== "POST" &&
    req.method !== "GET"
  ) {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  res.setHeader("Set-Cookie", [
    [
      "clutch_session=",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      "Max-Age=0"
    ].join("; "),

    [
      "clutch_oauth_state=",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      "Max-Age=0"
    ].join("; ")
  ]);

  if (req.method === "GET") {
    return res.redirect("/");
  }

  return res.status(200).json({
    success: true
  });
}
