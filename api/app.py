from flask import Flask, jsonify, request
from ticket import tambola_ticket
from ipfs import image_to_data_url, create_ticket_image, create_metadata, optimized_ticket, upload_to_ipfs

# creating a Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

@app.route('/api/v1/ticket', methods = ['GET'])
def home():
    if(request.method == 'GET'):
        args = request.args
        game_id = args['game_id']

        ticket = tambola_ticket(1)
        create_ticket_image(ticket)
        o_ticket = optimized_ticket(ticket)
        metadata = create_metadata(o_ticket, game_id)
        res = upload_to_ipfs(metadata)
        ipfs_hash_url = 'https://ipfs.io/ipfs/' + str(res.json()['value']['cid'])
        return jsonify({'message': 'success', 'ticket': o_ticket, 'ipfs_url': ipfs_hash_url})
  
  
# driver function
if __name__ == '__main__':
  
    app.run(debug = True)