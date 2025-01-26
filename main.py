from flask import Flask, request, jsonify
from datetime import datetime
import json as JSON
import requests
import google.generativeai as genai
from dotenv import load_dotenv
import os
from dateutil import parser
import re
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin._auth_utils import EmailAlreadyExistsError
from firebase_config import firebase_config

cred = credentials.Certificate('serviceAccountKey.json')
firebase_app = firebase_admin.initialize_app(cred, {
    'projectId': firebase_config['projectId'],
    'storageBucket': firebase_config['storageBucket']
})

# Initialize Firestore
db = firestore.client()

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
def get_data_frm_json(url) :
    receipt = JSON.loads(url)
    print(receipt)
    # dict of lines in receipt(parses lines within columns, so ex. "Gin & Tonic ... $10.50" would probably be two different, not consecutive lines for "Gin & Tonic" and "$10.50")
    lines = receipt['ParsedResults'][0]["TextOverlay"]["Lines"]
    return get_date_and_amnt(lines) | (get_type_genai(lines))

#https://ocr.space/Content/Images/receipt-ocr-original.jpg
#https://makereceipt.com/images/restaurant-bar-receipt-sample.jpg
#https://i.postimg.cc/jSrPyWJC/60c4199364474569561cba359d486e6c69ae8cba.jpg

receipt_list = []

@app.route('/api/data', methods=['GET'])
def get_data():
    return receipt_list

@app.route('/api/photo', methods=['POST'])
def photo():
    photo = request.data.decode('utf-8')
    test_json = ocr_space_url(url=photo)
    receipt_list.append(get_data_frm_json(test_json))
    print(receipt_list)
    return jsonify({"status": "success", "received_url": photo, "receipt_data": test_json})

@app.route('/api/user-data', methods=['POST'])
def user_data():
    try:
        id_token = request.json['idToken']
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        doc_ref = db.collection('users').document(uid)
        doc = doc_ref.get()
        if doc.exists:
            return jsonify({"status": "success", "data": doc.to_dict()})
        else:
            return jsonify({"status": "error", "message": "No such document"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/save-receipt', methods=['POST'])
def save_receipt():
    try:
        id_token = request.json['idToken']
        photo_url = request.json['photoUrl']
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        test_json = ocr_space_url(url=photo_url)
        parsed_data = get_data_frm_json(test_json)

        doc_ref = db.collection('users').document(uid)

        doc = doc_ref.get()
        if not doc.exists or 'receipts' not in doc.to_dict():
            print("Initializing 'receipts' field as an empty array.")
            doc_ref.set({'receipts': []}, merge=True)
        
        try:
            doc_ref.update({
                "receipts": firestore.ArrayUnion([parsed_data])
            })
            return jsonify({"status": "success", "data": parsed_data})
        except Exception as firestore_error:
            print(f"Error updating Firestore: {firestore_error}")
            return jsonify({"status": "error", "message": str(firestore_error)}), 500

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/delete-receipt', methods=['POST'])
def delete_receipt():
    try:
        id_token = request.json['idToken']
        receipt = request.json['receipt']
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        doc_ref = db.collection('users').document(uid)
        doc_ref.update({
            "receipts": firestore.ArrayRemove([receipt])
        })
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, threaded=True)

