import { type NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "invoice.json");

async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readDataFromFile() {
  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(DATA_FILE_PATH, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.log("[v0] File not found or error reading, using default data");
    return { products: [], invoices: [], contacts: [] };
  }
}

async function writeDataToFile(data: any) {
  try {
    await ensureDataDirectory();
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    console.log("[v0] Data successfully written to file:", DATA_FILE_PATH);
    return true;
  } catch (error) {
    console.error("[v0] Error writing to file:", error);
    return false;
  }
}

export async function GET() {
  try {
    console.log("[v0] GET request received");
    const data = await readDataFromFile();
    console.log("[v0] Returning data from file:", {
      products: data.products?.length || 0,
      invoices: data.invoices?.length || 0,
      contacts: data.contacts?.length || 0,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error in GET request:", error);
    const defaultData = { products: [], invoices: [], contacts: [] };
    return NextResponse.json(defaultData);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST request received");
    const data = await request.json();
    console.log("[v0] Request data parsed:", {
      products: data.products?.length || 0,
      invoices: data.invoices?.length || 0,
      contacts: data.contacts?.length || 0,
    });

    const newData = {
      products: data.products || [],
      invoices: data.invoices || [],
      contacts: data.contacts || [],
    };

    const success = await writeDataToFile(newData);

    if (success) {
      console.log("[v0] Data stored successfully");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to write to file" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[v0] Error in POST request:", error);
    return NextResponse.json({ success: false, error: "" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    console.log("[v0] PUT request received - exporting data");
    const data = await readDataFromFile();
    const jsonData = JSON.stringify(data, null, 2);

    return new NextResponse(jsonData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="invoice-data.json"',
      },
    });
  } catch (error) {
    console.error("[v0] Error exporting data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export data" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    console.log("[v0] DELETE request received - clearing data");
    const defaultData = { products: [], invoices: [], contacts: [] };
    const success = await writeDataToFile(defaultData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Data cleared successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to clear data" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[v0] Error clearing data:", error);
    return NextResponse.json({ success: false, error: "" }, { status: 500 });
  }
}
