import base64
from tabulate import tabulate
from prettytable import PrettyTable, ALL
import imgkit
from functools import reduce
from hashlib import sha256
import requests

API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGE0NTFDOGYzNEE5OThkNGEzQWRBOGM2YzU1M2ZGQjk2NTJhMjIzNmEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY0MzkwNjk2OTA0NiwibmFtZSI6InIyd2ViMyJ9.RKcLYO6ycY2rfh5PSNZ4LNi8qr2Nu3eKCFUMZVysraw'

def create_ticket_image(ticket):
    tbl = tabulate(ticket, tablefmt="html")
    pt = PrettyTable()
    for row in ticket:
        pt.add_row(row)
    imgkit.from_string(pt.get_html_string(format=True, header=False, hrules=ALL), 'ticket.png', options={"xvfb": "", "width": 400})


def image_to_data_url(filename):
    ext = filename.split('.')[-1]
    prefix = f'data:image/{ext};base64,'
    with open(filename, 'rb') as f:
        img = f.read()
    return prefix + base64.b64encode(img).decode('utf-8')


def optimized_ticket(ticket):
    otkt = []
    for tkt in ticket:
        otkt.append(list(filter(lambda num: num != '', tkt)))
    print(f'O_Ticket {otkt}')
    return otkt


def create_metadata(o_ticket, game_id):
    flattend_ticket = reduce(lambda x, y: x+y, o_ticket)
    ticket_hash = sha256(bytes(flattend_ticket)).hexdigest()
    metadata = { "name": ticket_hash, \
        "description": 'Game # ' + str(game_id), \
        "image": image_to_data_url('ticket.png')
    }
    return metadata


def upload_to_ipfs(metadata):
    url = 'https://api.nft.storage/upload'
    bearer = 'Bearer ' + API_KEY
    headers = {'Authorization': bearer }
    response = requests.post(url, headers=headers, json=metadata)
    return response
