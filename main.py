from flask import Flask, jsonify
from datetime import datetime
import json as JSON
import requests
import google.generativeai as genai
from dotenv import load_dotenv
import os
from dateutil import parser
import re

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

def ocr_space_file(filename, overlay=True, api_key=os.getenv('OCR_KEY'), language='eng'):
    """ OCR.space API request with local file.
        Python3.5 - not tested on 2.7
    :param filename: Your file path & name.
    :param overlay: Is OCR.space overlay required in your response.
                    Defaults to False.
    :param api_key: OCR.space API key.
                    Defaults to 'helloworld'.
    :param language: Language code to be used in OCR.
                    List of available language codes can be found on https://ocr.space/OCRAPI
                    Defaults to 'en'.
    :return: Result in JSON format.
    """

    payload = {'isOverlayRequired': overlay,
               'apikey': api_key,
               'language': language,
               }
    with open(filename, 'rb') as f:
        r = requests.post('https://api.ocr.space/parse/image',
                          files={filename: f},
                          data=payload,
                          )
    return r.content.decode()


def ocr_space_url(url, overlay=True, api_key=os.getenv('OCR_KEY'), language='eng'):
    """ OCR.space API request with remote file.
        Python3.5 - not tested on 2.7
    :param url: Image url.
    :param overlay: Is OCR.space overlay required in your response.
                    Defaults to False.
    :param api_key: OCR.space API key.
                    Defaults to 'helloworld'.
    :param language: Language code to be used in OCR.
                    List of available language codes can be found on https://ocr.space/OCRAPI
                    Defaults to 'en'.
    :return: Result in JSON format.
    """

    payload = {'url': url,
               'isOverlayRequired': overlay,
               'apikey': api_key,
               'language': language,
               }
    r = requests.post('https://api.ocr.space/parse/image',
                      data=payload,
                      )
    return r.content.decode()

'''Gets the date and total amount from the receipt'''
def get_date_and_amnt(receipt_lines):
    top_lists = []
    amt_height = None
    best_height = [1000000, ""]
    DATE_PATTERNS = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # Matches dates like 12/31/2020, 31-12-2020
        r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',    # Matches dates like 2020/12/31, 2020-12-31
        r'\b\d{1,2} \w{3,9} \d{2,4}\b',        # Matches dates like 31 Dec 2020, 12 Oct 21
        r'\b\w{3,9} \d{1,2}, \d{4}\b',         # Matches dates like December 31, 2020
        r'\b\d{1,2} \w{3,9} \d{4}\b'           # Matches dates like 31 December 2020
    ]
    dateobj = None
    POTENTIAL_AMT_WORDS = ["Amount", "Total", "Amount:", "Total:", "AMOUNT", "TOTAL", "AMOUNT:", "TOTAL:", "Amt", "AMT", "Amt:", "AMT:", "Balance", "BALANCE", "Balance:", "BALANCE:"]

    # go through each word of each line
    for j in range(len(receipt_lines)):
        for i in range(len(receipt_lines[j]["Words"])):
            #print(j,receipt_lines[j]["Words"][i]["WordText"])

            # looking for potential totals
            if receipt_lines[j]["Words"][i]["WordText"] in POTENTIAL_AMT_WORDS and amt_height == None:
                amt_height = receipt_lines[j]["Words"][i]["Top"]
            for pattern in DATE_PATTERNS:
                if re.match(pattern, receipt_lines[j]["Words"][i]["WordText"]):
                    try:
                        dateobj = parser.parse(receipt_lines[j]["Words"][i]["WordText"])
                        print(f"Parsed date: {receipt_lines[j]["Words"][i]["WordText"]} -> {dateobj}")
                    except (ValueError, OverflowError, receipt_lines[j]["Words"][i]["WordText"]) as e:
                        print(f"Error parsing date: {e}")
            # looking for strs that meet date format (clunky method bc didnt want to require regex package)
            
            # tracking heights of all words to compare with height of total
            top_lists.append([receipt_lines[j]["Words"][i]["Top"], receipt_lines[j]["Words"][i]["WordText"]])

    for i in range(len(top_lists)):
        if abs(top_lists[i][0] - amt_height) - abs(best_height[0] - amt_height) < 0 and not re.search(r'[a-zA-Z]', top_lists[i][1]):
            best_height = top_lists[i]

    return {"date": dateobj.strftime('%m/%d/%Y'), "total": best_height[1]}

'''Gets the type of expense from the receipt'''
def get_type_genai(receipt_lines):
    genai.configure(api_key=os.getenv('GENAI_KEY'))
    model = genai.GenerativeModel("gemini-1.5-flash")
    types_list = ["food", "entertainment", "clothing", "transportation", "other"]
    response = model.generate_content("Respond in one word. Here is a list of expense categories" + str(types_list) + ". The following string is the text of a receipt. Give the expense category that best fits the items purchased by this receipt. "  + str(receipt_lines))
    #print(response.text)
    return {"type": response.text.rstrip("\n")}

'''
Takes a url for a receipt image and returns a dictionary with the date and total, using above funcs
'''
def get_data_frm_url(url) :
    receipt = JSON.loads(url)

    # dict of lines in receipt(parses lines within columns, so ex. "Gin & Tonic ... $10.50" would probably be two different, not consecutive lines for "Gin & Tonic" and "$10.50")
    lines = receipt['ParsedResults'][0]["TextOverlay"]["Lines"]
    return get_date_and_amnt(lines) | (get_type_genai(lines))

    

#https://ocr.space/Content/Images/receipt-ocr-original.jpg
#https://makereceipt.com/images/restaurant-bar-receipt-sample.jpg
#https://i.postimg.cc/jSrPyWJC/60c4199364474569561cba359d486e6c69ae8cba.jpg
test_url = ocr_space_url(url='https://i.postimg.cc/jSrPyWJC/60c4199364474569561cba359d486e6c69ae8cba.jpg')
print(get_data_frm_url(test_url))

receipt_list = []

@app.route('/api/data', methods=['GET'])
def get_data():
    return receipt_list

@app.route('/api/photo', methods=['POST'])
def photo():
    receipt_list.append(get_data_frm_url())

if __name__ == '__main__':
    app.run(debug=True)

