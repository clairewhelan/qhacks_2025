from flask import Flask, jsonify
from datetime import datetime
import json as JSON
import requests


def ocr_space_file(filename, overlay=True, api_key='K82843374088957', language='eng'):
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


def ocr_space_url(url, overlay=True, api_key='K82843374088957', language='eng'):
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

# Use examples:
top_lists = []
amt_height = None
best_height = [1000000, ""]
datestr = ''
dateobj = None
test_url = ocr_space_url(url='https://makereceipt.com/images/restaurant-bar-receipt-sample.jpg')
receipt = JSON.loads(test_url)
for j in range(len(receipt['ParsedResults'][0]["TextOverlay"]["Lines"])):
    for i in range(len(receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"])):
        if receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"] in ["Amount", "Total", "Amount:", "Total:"] and amt_height == None:
            amt_height = receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["Top"]
        elif len(receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]) > 5:
            if receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][2] == "/" and receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][5] == "/" and len(receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]) >= 9:
                datestr = receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]
                dateobj = datetime.strptime(datestr, '%m/%d/%Y')
            elif receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][2] == "-" and receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][5] == "-" and len(receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]) >= 9:
                datestr = receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]
                dateobj = datetime.strptime(datestr, '%m-%d-%Y')
            elif receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][2] == "/" and receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][5] == "/":
                datestr = receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]
                dateobj = datetime.strptime(datestr, '%m/%d/%y')
            elif receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][2] == "-" and receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"][5] == "-":
                datestr = receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]
                dateobj = datetime.strptime(datestr, '%m-%d-%y')
        top_lists.append([receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["Top"], receipt['ParsedResults'][0]["TextOverlay"]["Lines"][j]["Words"][i]["WordText"]])

for i in range(len(top_lists)):
    if abs(top_lists[i][0] - amt_height) - abs(best_height[0] - amt_height) < 0 and top_lists[i][1] != "Amount":
        best_height = top_lists[i]

print(datestr)
print(best_height)

app = Flask(__name__)

@app.route('/api/data', methods=['GET'])
def get_data():
    return receipt

if __name__ == '__main__':
    app.run(debug=True)