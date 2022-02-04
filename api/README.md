Install wkhtmltopdf
-------------------------
sudo apt install virtualenv wkhtmltopdf 

Create python environment & Install pip requirements
-------------------------------------------------------
virtualenv -p python3.9 tambola_env
source tambola_env/bin/activate

pip install -r requirements.txt

Configure App and start server
--------------------------------------------------------
export FLASK_APP=app
flask run
