export async function GET() {
  console.log("[route] Health check endpoint hit.");
  return Response.json({
    status: "ok",
    message: "Your coding application is healthy 🚀",
  });
}