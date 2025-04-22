import requests
from bs4 import BeautifulSoup
import csv

# Corrected URL
url = 'https://wwww.septa.org/procurement/bids/?bid_category=quotes&bid_status=open'

# Set headers to mimic a browser
headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/123.0.0.0 Safari/537.36"
}

# Send GET request
response = requests.get(url, headers=headers)

# Check if the request was successful
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    # Find the ul with id 'filterList' and class 'dynamic-list bid-list'
    container = soup.find('ul', id='filterList')
    
    if container:
        # Find all li elements within the container
        listings = container.find_all('li')

        # Open a CSV file to write the data
        with open('septa_open_quotes.csv', 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Bid Number', 'Title', 'Link']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for listing in listings:
                # Extract bid number, title, and link
                bid_number_tag = listing.find('span', class_='bid-number')
                bid_number = bid_number_tag.get_text(strip=True) if bid_number_tag else ''
                title_tag = listing.find('a')
                title = title_tag.get_text(strip=True) if title_tag else ''
                link = title_tag['href'] if title_tag and title_tag.has_attr('href') else ''

                writer.writerow({'Bid Number': bid_number, 'Title': title, 'Link': link})
    else:
        print("The specified ul with id 'filterList' and class 'dynamic-list bid-list' was not found.")
else:
    print(f"Failed to retrieve the page. Status code: {response.status_code}")
    
    

    
    
    
    

# Define input and output file paths
csv_file_path = 'septa_open_quotes.csv'
json_file_path = 'septa_open_quotes.json'

# Initialize a list to hold the data
data = []

# Read the CSV file and convert each row into a dictionary
with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for row in csv_reader:
        data.append(row)

# Write the list of dictionaries to a JSON file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=4)
