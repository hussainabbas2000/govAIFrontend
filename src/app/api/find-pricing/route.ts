import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { productQuantities } = await req.json();

    if (!productQuantities || typeof productQuantities !== 'object') {
      return NextResponse.json({ error: 'Invalid productQuantities provided' }, { status: 400 });
    }

    const productQuantitiesJsonString = JSON.stringify(productQuantities);

    // Execute the Python script
    // Ensure your environment has Python installed and the openai library is installed for the script
    // Also ensure the OPENAI_API_KEY environment variable is set where this process runs
    const command = `python python/find_pricing.py '${productQuantitiesJsonString}'`;

    console.log(`Executing command: ${command}`);

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
      // Depending on your script's behavior, you might want to return an error
      // if stderr contains actual errors, not just warnings or info.
      // For now, we'll still attempt to parse stdout.
    }

    console.log(`Python script stdout: ${stdout}`);

    // The Python script's main function prints the results in a formatted way.
    // We need to modify the Python script to print *only* the JSON result to stdout
    // for easier parsing here.
    //
    // **ASSUMPTION:** The python script has been modified to print ONLY the
    // JSON result from the find_bulk_prices function to stdout.
    // For example, changing the main function to:
    // if __name__ == "__main__":
    //     import sys
    //     product_quantities = json.loads(sys.argv[1])
    //     results = find_bulk_prices(product_quantities)
    //     print(json.dumps(results))
    //
    // If the script hasn't been modified, parsing stdout reliably might be complex.

    try {
      // Find the JSON string in the output using a regex
      const jsonMatch = stdout.match(/\{.*?\}/s); // Adjust regex based on actual python output format

      if (!jsonMatch || !jsonMatch[0]) {
           console.error("Could not find JSON output in Python script stdout.");
           console.error("Raw stdout:", stdout);
           return NextResponse.json({ error: 'Failed to parse JSON from Python script output' }, { status: 500 });
      }

      const pricingResults = JSON.parse(jsonMatch[0]);
      return NextResponse.json(pricingResults);

    } catch (jsonError) {
      console.error('Error parsing JSON from python script:', jsonError);
      console.error('Raw stdout that failed to parse:', stdout);
      return NextResponse.json({ error: 'Failed to parse pricing results from script' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error executing python script:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing information' }, { status: 500 });
  }
}