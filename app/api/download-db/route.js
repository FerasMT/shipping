// app/api/download-db/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Retrieve the DATABASE_URL environment variable.
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || !dbUrl.startsWith("file:")) {
      return NextResponse.json(
        { error: "DATABASE_URL is not set properly" },
        { status: 500 }
      );
    }

    // Remove the "file:" prefix and trim any whitespace.
    const relativePath = dbUrl.replace("file:", "").trim();
    
    // Resolve the absolute path relative to the project root.
    const absolutePath = path.resolve(process.cwd(), relativePath);
    
    // Log the resolved absolute path for debugging.
    console.log("Resolved absolute path to DB file:", absolutePath);

    // Check if the file exists.
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { error: "Database file not found", path: absolutePath },
        { status: 404 }
      );
    }

    // Create a readable stream from the file.
    const fileStream = fs.createReadStream(absolutePath);

    // Return the file as a download with appropriate headers.
    return new NextResponse(fileStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="dev.db"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
