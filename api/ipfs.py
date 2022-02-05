import base64, os, json, imgkit, ipfshttpclient
from tabulate import tabulate
from prettytable import PrettyTable, ALL
from functools import reduce
from hashlib import sha256

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

def flat_ticket(o_ticket):
    flattend_ticket = reduce(lambda x, y: x+y, o_ticket)
    print(f'flat ticket {flattend_ticket}')
    return flattend_ticket

def create_metadata(f_ticket, game_id):
    flattend_ticket = reduce(lambda x, y: x+y, f_ticket)
    ticket_hash = sha256(bytes(flattend_ticket)).hexdigest()
    metadata = { "name": ticket_hash, \
        "description": 'Game # ' + str(game_id), \
        "image": image_to_data_url('ticket.png')
    }
    return metadata

class ipfsmgmt():
    def __init__(self, game_id, ticket_id, metadata):
        self._client = ipfshttpclient.connect(session=True)
        baseDir = 'tickets'
        IsbaseDir = os.path.exists(baseDir)
        metadata = metadata
        if not IsbaseDir:
            os.makedirs('tickets')
        gameDir = os.path.join(baseDir, str(game_id))
        IsgameDir = os.path.exists(gameDir)
        ticket_file = str(ticket_id) + '.json'
        if not IsgameDir:
            print('---------creating gamedir')
            os.makedirs(gameDir)
        f = open(os.path.join(gameDir, ticket_file), "x")
        f.write(json.dumps(metadata))
        f.close()

    def add(self):
        self.ipfs_hash = self._client.add('tickets', recursive=True)[-1]['Hash']
        print(f'IPFS Hash: {self.ipfs_hash}')
        return self.ipfs_hash
    
    def publish(self):
        self.ipns_name = self._client.name.publish('/ipfs/' + str(self.ipfs_hash))
        print(f'IPNS Name: {self.ipns_name}')
        return self.ipns_name['Name']

    def close(self):  # Call this when your done
        self._client.close()
