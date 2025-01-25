from flask import Flask, jsonify
from datetime import datetime
import json as JSON
import requests
import google.generativeai as genai
from dotenv import load_dotenv
import os

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
    datestr = ''
    dateobj = None
    potential_amt_words = ["Amount", "Total", "Amount:", "Total:", "AMOUNT", "TOTAL", "AMOUNT:", "TOTAL:", "Amt", "AMT", "Amt:", "AMT:"]

    # go through each word of each line
    for j in range(len(receipt_lines)):
        for i in range(len(receipt_lines[j]["Words"])):
            #print(j,receipt_lines[j]["Words"][i]["WordText"])

            # looking for potential totals
            if receipt_lines[j]["Words"][i]["WordText"] in potential_amt_words and amt_height == None:
                amt_height = receipt_lines[j]["Words"][i]["Top"]
            # looking for strs that meet date format (clunky method bc didnt want to require regex package)
            elif len(receipt_lines[j]["Words"][i]["WordText"]) > 5:
                if receipt_lines[j]["Words"][i]["WordText"][2] == "/" and receipt_lines[j]["Words"][i]["WordText"][5] == "/" and len(receipt_lines[j]["Words"][i]["WordText"]) >= 9:
                    datestr = receipt_lines[j]["Words"][i]["WordText"]
                    dateobj = datetime.strptime(datestr, '%m/%d/%Y')
                elif receipt_lines[j]["Words"][i]["WordText"][2] == "-" and receipt_lines[j]["Words"][i]["WordText"][5] == "-" and len(receipt_lines[j]["Words"][i]["WordText"]) >= 9:
                    datestr = receipt_lines[j]["Words"][i]["WordText"]
                    dateobj = datetime.strptime(datestr, '%m-%d-%Y')
                elif receipt_lines[j]["Words"][i]["WordText"][2] == "/" and receipt_lines[j]["Words"][i]["WordText"][5] == "/":
                    datestr = receipt_lines[j]["Words"][i]["WordText"]
                    dateobj = datetime.strptime(datestr, '%m/%d/%y')
                elif receipt_lines[j]["Words"][i]["WordText"][2] == "-" and receipt_lines[j]["Words"][i]["WordText"][5] == "-":
                    datestr = receipt_lines[j]["Words"][i]["WordText"]
                    dateobj = datetime.strptime(datestr, '%m-%d-%y')
            
            # tracking heights of all words to compare with height of total
            top_lists.append([receipt_lines[j]["Words"][i]["Top"], receipt_lines[j]["Words"][i]["WordText"]])

    for i in range(len(top_lists)):
        if abs(top_lists[i][0] - amt_height) - abs(best_height[0] - amt_height) < 0 and top_lists[i][1] not in potential_amt_words:
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
test_url = ocr_space_url(url='https://makereceipt.com/images/restaurant-bar-receipt-sample.jpg')
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

