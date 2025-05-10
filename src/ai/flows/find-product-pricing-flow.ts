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
  rate: z.number().describe('Best per-item price (unit_price, numeric). Set to 0 if not applicable or found.'),
  websiteLink: z.string().optional().describe('A plausible URL (product page or vendor site) where this item can be purchased at this rate. This is the "url" field.'),
  vendorContactInfo: z.string().optional().describe('Plausible contact information for the vendor (e.g., email, phone, contact page URL, or main website if specific contact is not found). This is the "contact_or_quote" field.'),
  subtotal: z.number().describe('Calculated subtotal (rate * numeric part of identifiedQuantity). Set to 0 if quantity is not numeric or rate is 0. This is the "total_cost" field.'),
});

const ProductPricingOutputSchema = z.object({
  pricedItems: z.array(PricedItemSchema).describe('An array of items with their pricing information, one entry per product from the input list.'),
  totalAmount: z.number().describe('The sum of all subtotals.'),
});
export type FindProductPricingOutput = z.infer<typeof ProductPricingOutputSchema>;

export async function findProductPricing(input: FindProductPricingInput): Promise<FindProductPricingOutput> {
  return findProductPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findProductPricingPrompt',
  tools: [productSearchTool], // Make the productSearchTool available to the LLM
  input: {schema: ProductPricingInputSchema},
  output: {schema: ProductPricingOutputSchema},
  prompt: `You are an expert AI research assistant specializing in procurement and supply chain analysis, with access to a web search tool.
Your task is to process a list of product names and a string describing their quantities.
For each product, you need to find the single best vendor offer based on the lowest unit price for the specified bulk quantity.

Product List:
{{#each productList}}
- {{{this}}}
{{/each}}

Quantity Details: "{{{quantityDetails}}}"

For each product in the 'productList':
1.  Determine its 'identifiedQuantity' and the numerical quantity by carefully parsing the 'quantityDetails' string.
    - Example: If 'productList' contains "SATA 2 HDD" and 'quantityDetails' says "500 SATA 2 HDD units...", then 'identifiedQuantity' is "500 units" and numerical quantity is 500.
    - If a product's quantity is not numerically specified in 'quantityDetails' (e.g., "Office Chairs"), use 1 as the numerical quantity for search purposes, and set 'identifiedQuantity' to "Not numerically specified".

2.  Use the 'productSearchTool' with the product name and its determined numerical quantity. The tool will return an array of web search results (each with 'sourceName', 'title', 'link', 'extractedPrice', 'snippet', 'quantityContext').

3.  From the array of search results provided by 'productSearchTool' for the current product:
    a.  Analyze all search results. Look for clues in 'title', 'snippet', 'quantityContext', and 'sourceName' to identify vendors that can supply the required numerical quantity.
    b.  Prioritize results that explicitly mention bulk, wholesale, B2B, or seem like official distributors/manufacturers if the quantity is large.
    c.  Identify the **single best offer** that has the lowest 'extractedPrice' (this will be your 'rate') and seems most likely to fulfill the 'identifiedQuantity'.
    d.  If multiple results have similar low prices, prefer the one with a more direct product link or clearer vendor information.

4.  Populate a 'PricedItemSchema' object for this single best option found for the current product:
    - 'name': The product name from the input 'productList'.
    - 'identifiedQuantity': As determined in step 1.
    - 'rate': The 'extractedPrice' from the selected best search result. If no price is found or applicable, set to 0.
    - 'websiteLink': The 'link' from the selected best search result. This should be a direct product page if possible, otherwise the vendor's site.
    - 'vendorContactInfo': Extract or infer this from the selected best search result. This could be the 'sourceName', a contact URL found in the 'snippet', or the main website URL. If no specific contact info is apparent, the 'sourceName' or the domain of the 'websiteLink' is acceptable.
    - 'subtotal': Calculate as (rate * numerical_quantity). If numerical_quantity is 0 or rate is 0, then subtotal is 0.

5.  If the 'productSearchTool' returns no relevant results (e.g., empty array, or items with "No relevant product listings found" or "SERP_API_KEY not configured" in snippet), or if you cannot confidently select a best option after analyzing the results, then for that product, set:
    - 'rate' to 0
    - 'subtotal' to 0
    - 'websiteLink' to "N/A"
    - 'vendorContactInfo' to "N/A"

After processing all products in 'productList', calculate the 'totalAmount' by summing all 'subtotals'.
Return the complete information in the specified JSON format according to 'ProductPricingOutputSchema'.
Ensure all fields in each 'PricedItemSchema' are populated accurately based on your analysis of the 'productSearchTool' output for the *selected single best option for each product*.
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
            identifiedQuantity: "Error in AI processing",
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

    // Post-process to ensure subtotals and totalAmount are correctly calculated
    let calculatedTotalAmount = 0;
    const processedItems = output.pricedItems.map(item => {
        let numericQuantity = 0;
        const quantityMatch = String(item.identifiedQuantity || "").match(/(\d+(\.\d+)?)/);
        if (quantityMatch && quantityMatch[1]) {
            numericQuantity = parseFloat(quantityMatch[1]);
        } else if (item.identifiedQuantity === "Not numerically specified") {
            // If LLM couldn't find a numeric quantity but we need one for subtotal,
            // it should ideally be 0 if not found, or 1 if it's a single item request without explicit number.
            // For calculation purposes, if rate is present, LLM might have assumed 1.
            // However, the prompt guides LLM to calculate subtotal as (rate * numerical_quantity).
            // If numerical_quantity is 0 (because it's "Not numerically specified" and no number found), subtotal should be 0.
            numericQuantity = 0; 
        }


        const rate = typeof item.rate === 'number' ? item.rate : 0;
        let subtotal = 0;
        if (numericQuantity > 0 && rate > 0) {
            subtotal = numericQuantity * rate;
        } else {
             // Ensure subtotal is 0 if quantity is not numeric or rate is 0
            subtotal = 0;
        }
        
        const finalRate = (numericQuantity > 0 && rate > 0) ? rate : 0;
        const finalSubtotal = subtotal; // Use the subtotal calculated above

        if (item.subtotal !== finalSubtotal) {
            console.warn(`Subtotal mismatch for ${item.name}. LLM: ${item.subtotal}, Calculated: ${finalSubtotal}. Using calculated.`);
        }
        calculatedTotalAmount += finalSubtotal;
        
        return { 
            ...item, 
            rate: finalRate, 
            subtotal: finalSubtotal 
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

