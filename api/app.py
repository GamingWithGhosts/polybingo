from flask import Flask, jsonify, request
from ticket import tambola_ticket
from ipfs import optimized_ticket, flat_ticket, ipfsmgmt, optimized_ticket, create_metadata, create_ticket_image
from flask import Flask
from celeryconfig import make_celery
#from ipfs import ipfsmgmt, optimized_ticket, create_metadata, create_ticket_image

# creating a Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

app.config.update(
    CELERY_BROKER_URL='redis://localhost:6379',
    CELERY_RESULT_BACKEND='redis://localhost:6379'
)
celery = make_celery(app)

@app.route('/api/v1/ticket', methods = ['GET'])
def home():
    if(request.method == 'GET'):
        args = request.args
        game_id = args['game_id']
        ticket_id = args['ticket_id']

        ticket = tambola_ticket(1)
        o_ticket = optimized_ticket(ticket)
        f_ticket = flat_ticket(o_ticket)
        save_ticket.delay(ticket, game_id, ticket_id)
        return jsonify({'ticket': f_ticket})


@celery.task()
def save_ticket(ticket, game_id, ticket_id):
    create_ticket_image(ticket)
    o_ticket = optimized_ticket(ticket)
    metadata = create_metadata(o_ticket, game_id)
    ipfs = ipfsmgmt(game_id, ticket_id, metadata)
    ipfs.add()
    ipfs.publish()
  

# driver function
if __name__ == '__main__':
  
    app.run(debug = True)