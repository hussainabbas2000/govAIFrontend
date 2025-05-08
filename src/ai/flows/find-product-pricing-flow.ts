
'use server';
/**
 * @fileOverview An AI agent that finds pricing information for a list of products
 * by using a web search tool.
 *
 * - findProductPricing - A function that takes a list of product names and quantity details,
 *                        and returns pricing information, website links, and vendor contacts.
 * - FindProductPricingInput - The input type for the findProductPricing function.
 * - FindProductPricingOutput - The return type for the findProductPricing function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { productSearchTool } from '@/ai/tools/product-search-tool'; // Import the tool

const ProductPricingInputSchema = z.object({
  productList: z.array(z.string()).describe('A list of product/service names.'),
  quantityDetails: z.string().describe('A string containing details about quantities for the products, potentially mixed.'),
});
export type FindProductPricingInput = z.infer<typeof ProductPricingInputSchema>;

const PricedItemSchema = z.object({
  name: z.string().describe('The product name from the input list.'),
  identifiedQuantity: z.string().describe('The specific quantity identified for this product from quantityDetails (e.g., "500 units", "200 sticks", or "Not numerically specified").'),
  rate: z.number().describe('Best per-item price (numeric). Set to 0 if not applicable or found.'),
  websiteLink: z.string().optional().describe('A plausible URL where this item can be purchased at this rate. Should be a direct product link if possible.'),
  vendorContactInfo: z.string().optional().describe('Plausible contact information for the vendor (e.g., email, phone, or main website contact page).'),
  subtotal: z.number().describe('Calculated subtotal (rate * numeric part of identifiedQuantity). Set to 0 if quantity is not numeric or rate is 0.'),
});

const ProductPricingOutputSchema = z.object({
  pricedItems: z.array(PricedItemSchema).describe('An array of items with their pricing information.'),
  totalAmount: z.number().describe('The sum of all subtotals.'),
});
export type FindProductPricingOutput = z.infer<typeof ProductPricingOutputSchema>;

export async function findProductPricing(input: FindProductPricingInput): Promise<FindProductPricingOutput> {
  return findProductPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findProductPricingPrompt',
  tools: [productSearchTool], // Make the tool available to the LLM
  input: {schema: ProductPricingInputSchema},
  output: {schema: ProductPricingOutputSchema},
  prompt: `You are an expert AI assistant specializing in procurement and supply chain analysis.
Your task is to process a list of product names and a detailed string describing their quantities to populate the 'pricedItems' array.

Product List:
{{#each productList}}
- {{{this}}}
{{/each}}

Quantity Details: "{{{quantityDetails}}}"

For each product in the 'productList':
1.  Determine its specific 'identifiedQuantity' by carefully parsing the 'quantityDetails' string. Also, extract the numerical part of this quantity.
    - Example: If 'productList' contains "SATA 2 HDD" and 'quantityDetails' says "500 SATA 2 HDD units...", then 'identifiedQuantity' is "500 units" and numerical quantity is 500.
    - If a product is not explicitly quantified, 'identifiedQuantity' should be "Not numerically specified" and numerical quantity is 0.

2.  Use the 'productSearchTool' with the product name and its numerical quantity (if > 0, otherwise pass 1).
    The tool will return up to 3-5 potential online purchasing options, sorted by price.

3.  From the tool's search results (the array of options):
    a.  Analyze each option provided by the tool.
    b.  Select the **single best option** that has the lowest 'extractedPrice' (this will be your 'rate') and seems most likely to fulfill the 'identifiedQuantity'. Look for clues in the tool's 'title', 'snippet', or 'quantityContext'. Prioritize sources that explicitly mention bulk, wholesale, or seem like B2B suppliers if the quantity is large.
    c.  The 'link' from the tool's selected result should be your 'websiteLink'. Ensure it's a direct product page if possible.
    d.  Extract or infer 'vendorContactInfo' from the tool's selected result (e.g., 'sourceName' could be a starting point, or look for contact details in snippets). If a direct contact isn't obvious, the main website of the source is acceptable.

4.  Calculate the 'subtotal' (rate * numerical quantity). If numerical quantity is 0 or rate is 0, subtotal is 0.

5.  If the 'productSearchTool' returns no suitable results (e.g., empty array, or items with "No relevant product listings found" or "SERP_API_KEY not configured" in snippet), or if you cannot confidently select an option, set 'rate' to 0, 'subtotal' to 0, 'websiteLink' to "N/A", and 'vendorContactInfo' to "N/A" for that product. Log why a suitable option could not be found if possible.

Finally, calculate the 'totalAmount' by summing all 'subtotals'.

Return the complete information in the specified JSON format for ProductPricingOutputSchema.
Be thorough and ensure all fields in PricedItemSchema are populated accurately based on your analysis of the tool's output for the *selected best option*.
`,
});

const findProductPricingFlow = ai.defineFlow(
  {
    name: 'findProductPricingFlow',
    inputSchema: ProductPricingInputSchema,
    outputSchema: ProductPricingOutputSchema,
  },
  async (input) => {
    console.log("findProductPricingFlow: Input received:", JSON.stringify(input, null, 2));
    const {output} = await prompt(input); // The LLM will use the tool internally
    
    if (!output || !output.pricedItems) {
        console.error("AI failed to generate pricing output or pricedItems is missing. Input was:", JSON.stringify(input, null, 2));
        // Construct a default error response matching the schema
        const errorPricedItems = input.productList.map(productName => ({
            name: productName,
            identifiedQuantity: "Error in processing",
            rate: 0,
            websiteLink: "N/A",
            vendorContactInfo: "N/A",
            subtotal: 0,
        }));
        return {
            pricedItems: errorPricedItems,
            totalAmount: 0,
        };
    }
    
    console.log("findProductPricingFlow: Raw AI output:", JSON.stringify(output, null, 2));

    // Ensure subtotals and totalAmount are correctly calculated as a final check,
    // although the LLM should handle this based on the prompt.
    let calculatedTotalAmount = 0;
    const processedItems = output.pricedItems.map(item => {
        let numericQuantity = 0;
        // Robustly extract numeric quantity
        const quantityMatch = String(item.identifiedQuantity || "").match(/(\d+(\.\d+)?)/);
        if (quantityMatch && quantityMatch[1]) {
            numericQuantity = parseFloat(quantityMatch[1]);
        }

        let subtotal = 0;
        // Ensure rate is a number, default to 0 if not
        const rate = typeof item.rate === 'number' ? item.rate : 0;

        if (numericQuantity > 0 && rate > 0) {
            subtotal = numericQuantity * rate;
        }
        
        // If LLM didn't set rate to 0 for non-numeric qty or zero rate, ensure consistency
        const finalRate = (numericQuantity > 0 && rate > 0) ? rate : 0;
        const finalSubtotal = (numericQuantity > 0 && finalRate > 0) ? numericQuantity * finalRate : 0;

        if (item.subtotal !== finalSubtotal) {
            console.warn(`Subtotal mismatch for ${item.name}. LLM: ${item.subtotal}, Calculated: ${finalSubtotal}. Using calculated.`);
        }
        calculatedTotalAmount += finalSubtotal;
        return { 
            ...item, 
            rate: finalRate, // Use the potentially corrected rate
            subtotal: finalSubtotal // Use the potentially corrected subtotal
        };
    });
    
    if (output.totalAmount !== calculatedTotalAmount) {
        console.warn(`Total amount mismatch. LLM: ${output.totalAmount}, Calculated: ${calculatedTotalAmount}. Using calculated.`);
    }
    
    const finalOutput = {
        pricedItems: processedItems,
        totalAmount: calculatedTotalAmount,
    };
    console.log("findProductPricingFlow: Processed output:", JSON.stringify(finalOutput, null, 2));
    return finalOutput;
  }
);
