// ✅ route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI('AIzaSyAodJwWyQea8zNzs7t2deGgxlNaXriNCv4');




function parseGeminiBulletTextToJson(input: string): any {
  const lines = input.split("- ").filter(Boolean); // split on hyphen bullets
  const result: any = {};

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase().replace(/\s+/g, "_");
    const value = rest.join(":").trim();

    switch (key) {
      case "product_or_service_name":
      case "delivery_date":
      case "delivery_location":
        result[key] = value;
        break;

      case "quantity":
        result[key] = parseInt(value);
        break;

      case "any_other_useful_procurement_info":
        result["procurement_info"] = parseProcurementInfo(value);
        break;

      default:
        result[key] = value;
        break;
    }
  }

  return result;
}

function parseProcurementInfo(info: string): any {
  const out: any = {};

  const nsnMatch = info.match(/NSN\s+(\d+)/i);
  if (nsnMatch) out.nsn = nsnMatch[1];

  const approvedMatch = info.match(/Approved sources are ([^,]+)/i);
  if (approvedMatch) {
    out.approved_sources = approvedMatch[1]
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (info.includes("RFQ")) out.type_of_solicitation = "RFQ";

  const quoteMatch = info.match(/Quotes.+?\./i);
  if (quoteMatch) out.submission_method = quoteMatch[0].trim();

  return out;
}


export async function POST(req: Request) {
  const data =await req.json()
  const description  = data.description.description;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    `Parse the following government contract description and extract, don't include extra lines just give the required info:
    - Product or service name
    - Quantity
    - Delivery Date
    - Delivery Location
    - Any other useful procurement info\n\n`,
    description,
  ]);

  const text = await result.response.text();  
  const parsed = parseGeminiBulletTextToJson(text);
  console.log(parsed)
  try {
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ parsedText: text }, { status: 200 });
  }
}
